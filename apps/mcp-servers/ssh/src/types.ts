/**
 * All TypeScript types of the server. Types of validated data are inferred from the zod schemas in validations.ts,
 * so a schema and its type cannot drift apart.
 */
import type { McpHttpHandler } from '@modelcontextprotocol/server'
import type { Client } from 'ssh2'
import type { z } from 'zod'

import type { createSessionStore } from './session-store.js'
import type {
  CloseInputSchema,
  getExecInputSchema,
  getOpenInputSchema,
  HostConfigSchema,
  HostsSchema,
  RunInputSchema,
} from './validations.js'

// ---- Validated data (inferred from validations.ts) ----

export type HostConfig = z.infer<typeof HostConfigSchema>
export type Hosts = z.infer<typeof HostsSchema>

export type ExecInput = z.infer<ReturnType<typeof getExecInputSchema>>
export type OpenInput = z.infer<ReturnType<typeof getOpenInputSchema>>
export type RunInput = z.infer<typeof RunInputSchema>
export type CloseInput = z.infer<typeof CloseInputSchema>

// ---- SSH commands ----

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

// ---- Sessions ----

/** An open SSH connection kept between tool calls. */
export type Session = {
  hostAlias: string
  client: Client
  cwd: string | null // null until a command reports its directory (the user's home)
  lastUsedAt: number
}

export type SessionRunResult = RunResult & Pick<Session, 'hostAlias' | 'cwd'>

export type SessionStore = ReturnType<typeof createSessionStore>

// ---- Tools ----

/** What every tool handler needs: the configured hosts and the shared session store. */
export type ToolContext = {
  hosts: Hosts
  sessions: SessionStore
}

/** What a tool body returns to `runTool`: the answer text and extra fields for the audit line. */
export type ToolOutput = {
  text: string
  audit?: LogEntry
}

// ---- HTTP routes ----

/** What route handlers need from the rest of the app. */
export type RouteContext = {
  mcpHandler: McpHttpHandler
}

// ---- Logging ----

export type LogEntry = Record<string, unknown>
