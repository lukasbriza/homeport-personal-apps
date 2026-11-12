/**
 * MCP server: the tools an AI client can call.
 *
 *   ssh_list_hosts  which hosts exist
 *   ssh_exec        run one command (new connection every time, nothing is remembered)
 *   ssh_open        open a session (keeps the connection and the working directory)
 *   ssh_run         run a command inside a session
 *   ssh_close       close a session
 *
 * Every tool answers with plain text and writes one JSON audit line to stdout.
 */
import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Hosts } from './config.js'
import type { SessionStore } from './session-store.js'
import { runCommandOnce, type RunOptions, type RunResult } from './ssh-client.js'
import { logInfo } from './utils/log.js'
import { toErrorResult, toTextResult } from './utils/tool-result.js'

const MAX_OUTPUT_BYTES = 64 * 1024 // per stream (stdout, stderr)
const DEFAULT_TIMEOUT_S = 30
const MAX_TIMEOUT_S = 300
const MAX_COMMAND_LENGTH = 8000
const MAX_AUDIT_COMMAND_LENGTH = 500 // the audit log keeps only the start of a command

// ---- Tool inputs shared by several tools (`.describe()` text is shown to the AI client) ----

const commandInput = z.string().min(1).max(MAX_COMMAND_LENGTH)
const sessionIdInput = z.string()
const timeoutInput = z
  .number()
  .int()
  .min(1)
  .max(MAX_TIMEOUT_S)
  .default(DEFAULT_TIMEOUT_S)
  .describe(`Seconds before the command is cut off (max ${MAX_TIMEOUT_S}).`)

type ExecInput = { host: string; command: string; timeout_s: number }
type OpenInput = { host: string }
type RunInput = { session_id: string; command: string; timeout_s: number }
type CloseInput = { session_id: string }

// ---- SSH tool helpers (general helpers live in utils/) ----

const getRunOptions = (timeoutS: number): RunOptions => ({ timeoutMs: timeoutS * 1000, maxBytes: MAX_OUTPUT_BYTES })

/** Formats a command result for the AI client: status lines first, then stdout and stderr. */
const formatRunResult = (result: RunResult, extraLines: string[] = []): string => {
  const statusLines = [
    ...extraLines,
    `exit: ${result.exitCode ?? 'none'}${result.signal ? ` (signal ${result.signal})` : ''}`,
    ...(result.isTimedOut ? ['timed out: command was cut off'] : []),
    ...(result.isTruncated ? [`truncated: output limited to ${MAX_OUTPUT_BYTES} bytes per stream`] : []),
  ]
  return [...statusLines, '--- stdout ---', result.stdout, '--- stderr ---', result.stderr].join('\n')
}

const shortenCommand = (command: string) => command.slice(0, MAX_AUDIT_COMMAND_LENGTH)

/** Creates the MCP server with all SSH tools. The MCP handler (routes/mcp/post.ts) creates one per HTTP request. */
export const createMcpServer = (hosts: Hosts, sessions: SessionStore): McpServer => {
  const server = new McpServer({ name: 'mcp-ssh-server', version: '0.2.0' })
  const aliases = Object.keys(hosts).toSorted()
  const hostInput = z.string().describe(`Host alias. One of: ${aliases.join(', ')}.`)

  const getHostConfig = (alias: string) => {
    const hostConfig = hosts[alias]
    if (!hostConfig) throw new Error(`unknown host "${alias}"; known hosts: ${aliases.join(', ')}`)
    return hostConfig
  }

  // ---- Tool handlers ----

  const listHosts = () => {
    const lines = aliases.map((alias) => {
      const { username, host, port } = getHostConfig(alias)
      return `${alias}: ${username}@${host}:${port}`
    })
    return toTextResult(lines.join('\n'))
  }

  const execCommand = async ({ host, command, timeout_s }: ExecInput) => {
    const startedAt = Date.now()
    const audit = { tool: 'ssh_exec', host, command: shortenCommand(command) }
    try {
      const result = await runCommandOnce(getHostConfig(host), command, getRunOptions(timeout_s))
      logInfo({ ...audit, exit: result.exitCode, ms: Date.now() - startedAt })
      return toTextResult(formatRunResult(result))
    } catch (error) {
      logInfo({ ...audit, error: String(error), ms: Date.now() - startedAt })
      return toErrorResult('ssh_exec', error)
    }
  }

  const openSession = async ({ host }: OpenInput) => {
    try {
      const sessionId = await sessions.open(host, getHostConfig(host))
      logInfo({ tool: 'ssh_open', host, session: sessionId })
      return toTextResult(`session_id: ${sessionId}`)
    } catch (error) {
      logInfo({ tool: 'ssh_open', host, error: String(error) })
      return toErrorResult('ssh_open', error)
    }
  }

  const runInSession = async ({ session_id, command, timeout_s }: RunInput) => {
    const startedAt = Date.now()
    const audit = { tool: 'ssh_run', session: session_id, command: shortenCommand(command) }
    try {
      const result = await sessions.run(session_id, command, getRunOptions(timeout_s))
      logInfo({ ...audit, host: result.hostAlias, exit: result.exitCode, ms: Date.now() - startedAt })
      return toTextResult(formatRunResult(result, [`host: ${result.hostAlias}`, `cwd: ${result.cwd ?? '(home)'}`]))
    } catch (error) {
      logInfo({ ...audit, error: String(error) })
      return toErrorResult('ssh_run', error)
    }
  }

  const closeSession = ({ session_id }: CloseInput) => {
    const isClosed = sessions.close(session_id)
    logInfo({ tool: 'ssh_close', session: session_id, closed: isClosed })
    return toTextResult(isClosed ? 'closed' : `session ${session_id} does not exist (already closed or expired)`)
  }

  // ---- Tool registration: name, what the AI client sees (title, description, inputs), handler ----

  server.registerTool(
    'ssh_list_hosts',
    {
      title: 'List SSH hosts',
      description: 'Lists the host aliases this server can connect to, with address and user.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    listHosts,
  )

  server.registerTool(
    'ssh_exec',
    {
      title: 'Run one command over SSH',
      description:
        'Runs a single command on a host in a fresh connection and returns exit code, stdout and stderr. ' +
        "Runs in the remote user's default shell, starting in the home directory. " +
        'Nothing persists between calls; use ssh_open for a working directory that persists. ' +
        'No TTY: interactive programs (vim, top, sudo password prompts) do not work.',
      inputSchema: z.object({ host: hostInput, command: commandInput, timeout_s: timeoutInput }),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    execCommand,
  )

  server.registerTool(
    'ssh_open',
    {
      title: 'Open an SSH session',
      description:
        'Opens a connection and returns a session_id for ssh_run. The session keeps the working directory ' +
        '(cd persists), not environment variables. It expires after 15 minutes idle; at most 5 sessions ' +
        'exist at once. Close it with ssh_close when done.',
      inputSchema: z.object({ host: hostInput }),
      annotations: { openWorldHint: true },
    },
    openSession,
  )

  server.registerTool(
    'ssh_run',
    {
      title: 'Run a command in a session',
      description:
        'Runs a command in an open session, starting in the directory the previous command ended in. ' +
        'Returns exit code, stdout, stderr and the new working directory. No TTY.',
      inputSchema: z.object({ session_id: sessionIdInput, command: commandInput, timeout_s: timeoutInput }),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    runInSession,
  )

  server.registerTool(
    'ssh_close',
    {
      title: 'Close an SSH session',
      description: 'Closes a session opened with ssh_open.',
      inputSchema: z.object({ session_id: sessionIdInput }),
    },
    closeSession,
  )

  return server
}
