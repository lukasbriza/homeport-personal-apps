/**
 * All zod schemas of the server (the types inferred from them are in types.ts):
 *   - env config (read once at startup, config.ts)
 *   - answers of the Donetick eAPI: loose, unknown fields stay, only what the tools read is checked
 *   - tool inputs: their `.describe()` texts are shown to the AI client
 */
import { z } from 'zod'

import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT, MAX_SUBTASKS } from './constants.js'

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

/** A checklist item of a chore. `completedAt` is set while it is checked off; `parentId` nests it under another. */
const SubTaskSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  orderId: z.number().nullish(),
  completedAt: z.string().nullish(),
  parentId: z.number().nullish(),
})

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
  // In GET /eapi/v1/chore only with ?includeSubtasks=true; always in GET /api/v1/chores/{id}.
  subTasks: z.array(SubTaskSchema).nullish(),
})

export const ChoreListSchema = z.array(ChoreSchema)

/**
 * A chore from Donetick's main API (GET /api/v1/chores/{id}, wrapped in `res`). Loose like the others, so every field
 * survives the round trip back to the edit route, which clears whatever is left out.
 */
const FullChoreSchema = z.looseObject({
  ...ChoreSchema.shape,
  updatedAt: z.string(), // sent back: Donetick refuses the edit when someone changed the chore since
  assignees: z.array(z.looseObject({ userId: z.number() })).nullish(),
  thingChore: z.unknown().nullish(), // a link to a Donetick "thing", which the edit route cannot keep
})

export const FullChoreResponseSchema = z.object({ res: FullChoreSchema })

/** Answer of POST /api/v1/chores/: only the new id. */
export const CreatedChoreResponseSchema = z.looseObject({ res: z.number() })

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

const subtaskNameInput = z.string().min(1).max(200)

/** Optional chore fields shared by create_chore and update_chore. */
const choreFields = {
  description: z.string().max(2000).optional(),
  due_date: dueDateInput
    .optional()
    .describe('Due date, e.g. 2026-12-24T18:00:00Z. A date without time means the end of that day (UTC).'),
  priority: z.number().int().min(1).max(4).optional().describe('Donetick priority number, 1 to 4.'),
  points: z.number().int().min(0).max(100).optional(),
  assigned_to: idInput.optional().describe('User id from list_members.'),
  label_ids: z
    .array(idInput)
    .max(20)
    .optional()
    .describe('Label ids, replacing the current ones; ids and names are in the `labels` of list_chores.'),
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
  assigned_to: idInput.optional().describe('User id from list_members. Without it the chore has no assignee.'),
  subtasks: z.array(subtaskNameInput).max(MAX_SUBTASKS).optional().describe('Subtask names, in this order.'),
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

export const CompleteSubtaskInputSchema = z.object({
  chore_id: idInput,
  subtask_id: idInput.describe('Subtask id from the `subtasks` of list_chores.'),
  done: z.boolean().default(true).describe('true checks the subtask off, false unchecks it.'),
})

export const UpdateSubtasksInputSchema = z.object({
  chore_id: idInput,
  add: z
    .array(
      z.object({
        name: subtaskNameInput,
        parent_id: idInput.optional().describe('Nest the new subtask under this existing subtask.'),
      }),
    )
    .max(MAX_SUBTASKS)
    .optional()
    .describe('New subtasks, added after the existing ones.'),
  rename: z
    .array(z.object({ subtask_id: idInput, name: subtaskNameInput }))
    .max(MAX_SUBTASKS)
    .optional(),
  remove: z
    .array(idInput)
    .max(MAX_SUBTASKS)
    .optional()
    .describe('Subtask ids to delete. Subtasks nested under them are deleted too.'),
})
