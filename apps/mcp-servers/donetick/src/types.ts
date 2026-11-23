/**
 * All TypeScript types of the server. Types of validated data are inferred from the zod schemas in validations.ts,
 * so a schema and its type cannot drift apart.
 */
import type { McpHttpHandler } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type {
  ChoreSchema,
  CompleteChoreInputSchema,
  ConfigSchema,
  CreateChoreInputSchema,
  ListChoresInputSchema,
  UpdateChoreInputSchema,
} from './validations.js'

// ---- Validated data (inferred from validations.ts) ----

export type DonetickConfig = z.infer<typeof ConfigSchema>
export type Chore = z.infer<typeof ChoreSchema>

export type ListChoresInput = z.infer<typeof ListChoresInputSchema>
export type CreateChoreInput = z.infer<typeof CreateChoreInputSchema>
export type UpdateChoreInput = z.infer<typeof UpdateChoreInputSchema>
export type CompleteChoreInput = z.infer<typeof CompleteChoreInputSchema>

/** Optional chore fields shared by create_chore and update_chore. */
export type ChoreFieldsInput = Omit<CreateChoreInput, 'name' | 'frequency_type'>

// ---- Donetick client ----

export type DonetickClient = {
  /** One eAPI call. Resolves with the parsed JSON body (`null` for an empty body) or throws `DonetickError`. */
  call: (method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown) => Promise<unknown>
}

/** An HTTP answer before parsing: status and body text. */
export type RawResponse = { status: number; text: string }

/** Retry timing of the client. Defaults in constants.ts; the test passes shorter values. */
export type RetryOptions = {
  delayMs: number
  maxWakeUpAttempts: number
}

// ---- HTTP routes ----

/** What route handlers need from the rest of the app. */
export type RouteContext = {
  mcpHandler: McpHttpHandler
}

// ---- Logging ----

export type LogEntry = Record<string, unknown>
