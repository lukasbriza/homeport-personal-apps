/**
 * Low-level SSH client: connect to one host and run one command on it.
 *
 * Used in two ways:
 *   - `ssh_exec` tool: connect, run one command, disconnect (`runCommandOnce`),
 *   - session store: keep the connection open and run many commands (`connectToHost` + `runCommand`).
 */
import { createHash } from 'node:crypto'

import { Client } from 'ssh2'

import type { HostConfig } from './config.js'

const CONNECT_TIMEOUT_MS = 15_000
const KEEPALIVE_INTERVAL_MS = 20_000

/** Limits for one command. */
export type RunOptions = {
  timeoutMs: number // the command is stopped after this
  maxBytes: number // stdout and stderr are each cut off after this many bytes
}

/** What one command produced. */
export type RunResult = {
  stdout: string
  stderr: string
  exitCode: number | null // null when the command was stopped by a signal
  signal: string | null
  isTimedOut: boolean
  isTruncated: boolean // stdout or stderr hit `maxBytes`
}

/** Host key fingerprint in the format `ssh-keygen -lf` prints: "SHA256:" + base64 without padding. */
const getFingerprint = (hostKey: Buffer) =>
  `SHA256:${createHash('sha256').update(hostKey).digest('base64').replace(/=+$/, '')}`

/** Opens an authenticated connection. Fails when the host key does not match `hostKeySha256`. */
export const connectToHost = (hostConfig: HostConfig): Promise<Client> =>
  new Promise((resolve, reject) => {
    const client = new Client()

    const handleError = (error: Error) => {
      client.end()
      reject(error)
    }

    client
      .once('ready', () => {
        // Connected: from now on the caller handles the client's errors.
        client.removeListener('error', handleError)
        resolve(client)
      })
      .once('error', handleError)
      .connect({
        host: hostConfig.host,
        port: hostConfig.port,
        username: hostConfig.username,
        privateKey: hostConfig.privateKey,
        passphrase: hostConfig.passphrase,
        readyTimeout: CONNECT_TIMEOUT_MS,
        keepaliveInterval: KEEPALIVE_INTERVAL_MS,
        hostVerifier: (hostKey: Buffer) => getFingerprint(hostKey) === hostConfig.hostKeySha256,
      })
  })

/** Collects one output stream (stdout or stderr) up to `maxBytes`; anything beyond is dropped. */
const createOutputCollector = (maxBytes: number) => {
  const chunks: Buffer[] = []
  let size = 0
  let isTruncated = false

  const add = (data: Buffer) => {
    const room = maxBytes - size
    if (data.length > room) isTruncated = true
    if (room <= 0) return
    const kept = data.subarray(0, room)
    chunks.push(kept)
    size += kept.length
  }

  return {
    add,
    getText: () => Buffer.concat(chunks).toString('utf8'),
    isTruncated: () => isTruncated,
  }
}

/**
 * Runs one command on an open connection and waits until it ends.
 * A failing command is a normal result (see `exitCode`); this only rejects when SSH itself fails.
 */
export const runCommand = (client: Client, command: string, options: RunOptions): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    client.exec(command, (error, channel) => {
      if (error) {
        reject(error)
        return
      }

      const stdout = createOutputCollector(options.maxBytes)
      const stderr = createOutputCollector(options.maxBytes)
      let exitCode: number | null = null
      let signal: string | null = null
      let isTimedOut = false

      // Stop a command that runs too long; the 'close' handler below still resolves the result.
      const timeout = setTimeout(() => {
        isTimedOut = true
        channel.close()
      }, options.timeoutMs)

      channel.on('data', stdout.add)
      channel.stderr.on('data', stderr.add)
      channel.on('exit', (code: number | null, exitSignal?: string) => {
        exitCode = code
        signal = exitSignal ?? null
      })

      // 'close' always comes last: after a normal exit, a timeout or a dropped connection.
      channel.on('close', () => {
        clearTimeout(timeout)
        resolve({
          stdout: stdout.getText(),
          stderr: stderr.getText(),
          exitCode,
          signal,
          isTimedOut,
          isTruncated: stdout.isTruncated() || stderr.isTruncated(),
        })
      })
    })
  })

/** Connects, runs one command and disconnects. */
export const runCommandOnce = async (hostConfig: HostConfig, command: string, options: RunOptions) => {
  const client = await connectToHost(hostConfig)
  try {
    return await runCommand(client, command, options)
  } finally {
    client.end()
  }
}
