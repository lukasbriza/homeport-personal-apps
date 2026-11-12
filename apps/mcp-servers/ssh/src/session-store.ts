/**
 * Session store: keeps SSH connections open between tool calls (`ssh_open` / `ssh_run` / `ssh_close`).
 *
 * A session remembers its working directory, so a `cd` in one `ssh_run` call still applies in the
 * next one. Sessions live in this process's memory, so the server must run as a single replica.
 */
import { randomBytes } from 'node:crypto'

import type { Client } from 'ssh2'

import type { HostConfig } from './config.js'
import { connectToHost, runCommand, type RunOptions, type RunResult } from './ssh-client.js'

const IDLE_TIMEOUT_MS = 15 * 60_000 // a session unused for this long is closed
const CLEANUP_INTERVAL_MS = 60_000
const MAX_SESSIONS = 5

type Session = {
  hostAlias: string
  client: Client
  cwd: string | null // null until a command reports its directory (the user's home)
  lastUsedAt: number
}

export type SessionRunResult = RunResult & Pick<Session, 'hostAlias' | 'cwd'>

/** Wraps a value in single quotes for `sh`, escaping single quotes inside it. */
const quoteForShell = (value: string) => `'${value.replaceAll("'", String.raw`'\''`)}'`

/**
 * Every command runs in a new SSH channel, i.e. a fresh shell that forgets any earlier `cd`.
 * So we wrap the command into a script that:
 *   1. enters the remembered directory (exit code 98 if it no longer exists),
 *   2. runs the command,
 *   3. prints a marker line "<marker><exit code>:<directory>" telling us where the command ended up.
 * If the command calls `exit`, step 3 is skipped: the exit code still arrives over SSH and the
 * remembered directory stays as it was.
 */
const wrapCommand = (command: string, cwd: string | null, marker: string) => {
  const enterCwd = cwd ? `cd ${quoteForShell(cwd)} || exit 98\n` : ''
  const script = `(\n${enterCwd}${command}\n__rc=$?; printf '\\n${marker}%s:%s\\n' "$__rc" "$PWD"; exit $__rc\n)`
  return `sh -c ${quoteForShell(script)}`
}

/** Finds the marker line from `wrapCommand`, reads the new directory and removes the line from stdout. */
const extractMarker = (stdout: string, marker: string) => {
  const markerAt = stdout.lastIndexOf(`\n${marker}`)
  if (markerAt === -1) return { stdout, cwd: undefined }

  const markerLine = stdout.slice(markerAt + 1 + marker.length) // "<exit code>:<directory>"
  const match = /^(\d+):(.*)$/m.exec(markerLine)
  return { stdout: stdout.slice(0, markerAt), cwd: match?.[2] }
}

/** Creates the in-memory session store. Call `closeAll` on shutdown. */
export const createSessionStore = () => {
  const sessions = new Map<string, Session>() // session id -> session

  /** Closes one session. Returns false when it did not exist. */
  const close = (id: string): boolean => {
    const session = sessions.get(id)
    if (!session) return false
    session.client.end()
    sessions.delete(id)
    return true
  }

  const closeIdleSessions = () => {
    const now = Date.now()
    for (const [id, session] of sessions) {
      if (now - session.lastUsedAt > IDLE_TIMEOUT_MS) close(id)
    }
  }

  const cleanupTimer = setInterval(closeIdleSessions, CLEANUP_INTERVAL_MS)
  cleanupTimer.unref() // the timer alone must not keep the process alive

  /** Connects to the host and returns a new random session id. */
  const open = async (hostAlias: string, hostConfig: HostConfig): Promise<string> => {
    closeIdleSessions()
    if (sessions.size >= MAX_SESSIONS) {
      throw new Error(`session limit (${MAX_SESSIONS}) reached; call ssh_close on one you no longer need`)
    }

    const client = await connectToHost(hostConfig)
    const id = `ssh_${randomBytes(16).toString('base64url')}`
    // The connection can drop on its own (network, host reboot); forget the session then.
    client.on('close', () => sessions.delete(id))
    client.on('error', () => sessions.delete(id))
    sessions.set(id, { hostAlias, client, cwd: null, lastUsedAt: Date.now() })
    return id
  }

  /** Runs a command in the session's working directory and remembers where it ended up. */
  const run = async (id: string, command: string, options: RunOptions): Promise<SessionRunResult> => {
    closeIdleSessions()
    const session = sessions.get(id)
    if (!session) throw new Error(`session ${id} has expired or does not exist; call ssh_open again`)
    session.lastUsedAt = Date.now()

    // Random per call, so the command's own output cannot fake the marker line.
    const marker = `__MCP_${randomBytes(8).toString('hex')}__`
    const result = await runCommand(session.client, wrapCommand(command, session.cwd, marker), options)
    const { stdout, cwd } = extractMarker(result.stdout, marker)
    if (cwd) session.cwd = cwd
    session.lastUsedAt = Date.now()

    return { ...result, stdout, hostAlias: session.hostAlias, cwd: session.cwd }
  }

  /** Closes every session and stops the cleanup timer. */
  const closeAll = () => {
    for (const id of sessions.keys()) close(id)
    clearInterval(cleanupTimer)
  }

  return { open, run, close, closeAll }
}

export type SessionStore = ReturnType<typeof createSessionStore>
