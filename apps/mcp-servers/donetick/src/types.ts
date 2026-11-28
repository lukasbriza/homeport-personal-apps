/**
 * All TypeScript types of the server. Types of validated data are inferred from the zod schemas in validations.ts,
 * so a schema and its type cannot drift apart.
 */
import type { McpHttpHandler } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type {
  ChoreSchema,
  CompleteChoreInputSchema,
  CompleteSubtaskInputSchema,
  ConfigSchema,
  CreateChoreInputSchema,
  FullChoreResponseSchema,
  ListChoresInputSchema,
  UpdateChoreInputSchema,
  UpdateSubtasksInputSchema,
} from './validations.js'

// ---- Validated data (inferred from validations.ts) ----

export type DonetickConfig = z.infer<typeof ConfigSchema>
export type Chore = z.infer<typeof ChoreSchema>
/** A chore with every field, from Donetick's main API; the basis for an edit. */
export type FullChore = z.infer<typeof FullChoreResponseSchema>['res']
export type SubTask = NonNullable<Chore['subTasks']>[number]

export type ListChoresInput = z.infer<typeof ListChoresInputSchema>
export type CreateChoreInput = z.infer<typeof CreateChoreInputSchema>
export type UpdateChoreInput = z.infer<typeof UpdateChoreInputSchema>
export type CompleteChoreInput = z.infer<typeof CompleteChoreInputSchema>
export type CompleteSubtaskInput = z.infer<typeof CompleteSubtaskInputSchema>
export type UpdateSubtasksInput = z.infer<typeof UpdateSubtasksInputSchema>

/** Optional chore fields shared by create_chore and update_chore. */
export type ChoreFieldsInput = Omit<CreateChoreInput, 'name' | 'frequency_type' | 'subtasks'>

/** Changes to a chore in the field names of Donetick's main API. Labels and assignees go as ids only. */
export type ChoreChanges = Record<string, unknown> & {
  labelsV2?: { id: number }[]
  assignees?: { userId: number }[]
}

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
