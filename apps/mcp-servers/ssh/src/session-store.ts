/**
 * Session store: keeps SSH connections open between tool calls (`ssh_open` / `ssh_run` / `ssh_close`).
 *
 * A session remembers its working directory, so a `cd` in one `ssh_run` call still applies in the next one (how:
 * utils/shell.ts). Sessions live in this process's memory, so the server must run as a single replica.
 */
import { randomBytes } from 'node:crypto'

import { CLEANUP_INTERVAL_MS, IDLE_TIMEOUT_MS, MAX_SESSIONS } from './constants.js'
import { connectToHost, runCommand } from './ssh-client.js'
import type { HostConfig, RunOptions, Session, SessionRunResult } from './types.js'
import { extractMarker, wrapCommand } from './utils/shell.js'

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
