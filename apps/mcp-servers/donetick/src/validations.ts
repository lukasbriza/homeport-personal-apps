/**
 * All zod schemas of the server (the types inferred from them are in types.ts):
 *   - env config (read once at startup, config.ts)
 *   - answers of the Donetick eAPI: loose, unknown fields stay, only what the tools read is checked
 *   - tool inputs: their `.describe()` texts are shown to the AI client
 */
import { z } from 'zod'

import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from './constants.js'

// ---- Env config ----

export const ConfigSchema = z.object({
  baseUrl: z
    .url({ protocol: /^https?$/ })
    .refine((value) => {
      const url = new URL(value)
      return !url.username && !url.password && (url.pathname === '/' || url.pathname === '') && !url.search
    }, 'must be a plain origin: no credentials, path or query')
    .transform((value) => new URL(value).origin),
  token: z.string().min(1),
  hostHeader: z
    .string()
    .regex(/^[A-Za-z0-9.-]+(:\d{1,5})?$/)
    .optional(),
})

// ---- Donetick eAPI answers ----

const LabelSchema = z.looseObject({ id: z.number(), name: z.string() })

export const ChoreSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  description: z.string().nullish(),
  frequencyType: z.string().nullish(),
  frequency: z.number().nullish(),
  frequencyMetadata: z.looseObject({ unit: z.string().nullish() }).nullish(),
  nextDueDate: z.string().nullish(),
  priority: z.number().nullish(),
  points: z.number().nullish(),
  assignedTo: z.number().nullish(),
  isActive: z.boolean().nullish(),
  projectId: z.number().nullish(),
  labelsV2: z.array(LabelSchema).nullish(),
})

export const ChoreListSchema = z.array(ChoreSchema)

export const MemberSchema = z.looseObject({
  userId: z.number(),
  username: z.string(),
  displayName: z.string().nullish(),
  role: z.string().nullish(),
  isActive: z.boolean().nullish(),
})

export const MemberListSchema = z.array(MemberSchema)

// ---- Tool inputs ----

const dueDateInput = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be a date such as 2026-12-24 or 2026-12-24T18:00:00Z')

const idInput = z.number().int().positive()

/** Optional chore fields shared by create_chore and update_chore. */
const choreFields = {
  description: z.string().max(2000).optional(),
  due_date: dueDateInput.optional().describe('Due date, e.g. 2026-12-24 or 2026-12-24T18:00:00Z.'),
  priority: z.number().int().min(1).max(4).optional().describe('Donetick priority number, 1 to 4.'),
  points: z.number().int().min(0).max(100).optional(),
  assigned_to: idInput.optional().describe('User id from list_members.'),
  label_ids: z.array(idInput).max(20).optional().describe('Label ids; see the `labels` of list_chores for names.'),
}

export const ListChoresInputSchema = z.object({
  status: z.enum(['active', 'all']).default('active').describe('`active` hides archived chores.'),
  label: z.string().min(1).optional().describe('Only chores with this label (name, case-insensitive).'),
  search: z.string().min(1).optional().describe('Only chores whose name or description contains this text.'),
  due_before: dueDateInput
    .optional()
    .describe('Only chores due on or before this date. Chores with no due date are left out.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(DEFAULT_LIST_LIMIT)
    .describe(`Max chores returned (max ${MAX_LIST_LIMIT}).`),
})

export const CreateChoreInputSchema = z.object({
  name: z.string().min(1).max(200),
  frequency_type: z
    .enum(['once', 'daily', 'weekly', 'monthly', 'yearly'])
    .default('once')
    .describe('How often the chore repeats.'),
  ...choreFields,
})

export const UpdateChoreInputSchema = z.object({
  chore_id: idInput,
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional().describe('false archives the chore, true restores it.'),
  ...choreFields,
})

export const CompleteChoreInputSchema = z.object({
  chore_id: idInput,
  note: z.string().max(1000).optional().describe('Optional note saved with the completion.'),
})
