/**
 * Chore code used by several tools:
 *   fetchChores          GET /eapi/v1/chore with subtasks: every chore, short fields (list_chores)
 *   fetchFullChore       GET /api/v1/chores/{id}: one chore with every field (the write tools)
 *   saveFullChore        PUT /api/v1/chores/: the whole chore with changes applied (update_chore, update_subtasks)
 *   summarizeChore       the short summary the AI client gets instead of the whole Donetick object
 *   summarizeWriteResult the same for the eAPI answer of a write call (complete_chore)
 *   toChoreChanges       tool input fields -> field names of Donetick's main API (create_chore, update_chore)
 *
 * Why the main API (/api/v1) for writes: the eAPI's create and update write only name, description and due date.
 * The main API accepts the same `secretkey` token, but its edit route replaces the whole chore and clears every field
 * left out, so an edit always starts from the full chore.
 */
import { MAX_DESCRIPTION_CHARS } from '../../constants.js'
import type { Chore, ChoreChanges, ChoreFieldsInput, DonetickClient, FullChore } from '../../types.js'
import { DonetickError } from '../../utils/errors.js'
import { ChoreListSchema, ChoreSchema, FullChoreResponseSchema } from '../../validations.js'

/** All chores of the circle, with their subtasks. The eAPI has no filters, so the tools filter the full list. */
export const fetchChores = async (client: DonetickClient) => {
  // Without the flag the eAPI leaves the subtasks out.
  const parsed = ChoreListSchema.safeParse(await client.call('GET', '/eapi/v1/chore?includeSubtasks=true'))
  if (!parsed.success) throw new Error('unexpected answer: the chore list has an unknown shape')
  return parsed.data
}

/** One chore with every field. Donetick answers an unknown or hidden chore with 500 or 403. */
export const fetchFullChore = async (client: DonetickClient, choreId: number): Promise<FullChore> => {
  let raw: unknown
  try {
    raw = await client.call('GET', `/api/v1/chores/${choreId}`)
  } catch (error) {
    if (error instanceof DonetickError && (error.status === 500 || error.status === 403)) {
      throw new Error(`chore ${choreId} does not exist or is not visible to this API token (${error.message})`)
    }
    throw error
  }
  const parsed = FullChoreResponseSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`unexpected answer: chore ${choreId} has an unknown shape`)
  return parsed.data.res
}

/**
 * Sends the whole chore back with `changes` applied. Everything not in `changes` goes back as Donetick returned it,
 * including `updatedAt`, so Donetick refuses the edit (403) when the chore changed in between.
 */
export const saveFullChore = async (client: DonetickClient, chore: FullChore, changes: ChoreChanges) => {
  // The edit route cannot keep a link to a Donetick "thing": it would silently drop it.
  if (chore.thingChore) {
    throw new Error(`chore ${chore.id} is linked to a Donetick thing; change it in Donetick itself`)
  }
  await client.call('PUT', '/api/v1/chores/', {
    ...chore,
    ...changes,
    // Donetick reads labels as ids only and fails on a missing list, so it is always sent.
    labelsV2: changes.labelsV2 ?? (chore.labelsV2 ?? []).map((label) => ({ id: label.id })),
    assignees: changes.assignees ?? chore.assignees ?? [],
  })
}

/** Description text without HTML tags (Donetick stores rich text), shortened. */
export const toPlainText = (html: string) => {
  const text = html
    .replaceAll(/<[^>]*>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
  return text.length > MAX_DESCRIPTION_CHARS ? `${text.slice(0, MAX_DESCRIPTION_CHARS)}…` : text
}

const describeSchedule = (chore: Chore) => {
  const { frequencyType, frequency } = chore
  if (!frequencyType || frequencyType === 'once') return 'once'
  if (frequencyType === 'interval') return `every ${frequency ?? 1} ${chore.frequencyMetadata?.unit ?? 'days'}`
  return frequency && frequency > 1 ? `${frequencyType} x${frequency}` : frequencyType
}

/** Subtasks in Donetick's order. `parentId` only for nested ones. */
const summarizeSubtasks = (chore: Chore) =>
  (chore.subTasks ?? [])
    .toSorted((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0))
    .map((subtask) => ({
      id: subtask.id,
      name: subtask.name,
      done: Boolean(subtask.completedAt),
      ...(subtask.parentId ? { parentId: subtask.parentId } : {}),
    }))

export const summarizeChore = (chore: Chore) => ({
  id: chore.id,
  name: chore.name,
  ...(chore.description ? { description: toPlainText(chore.description) } : {}),
  schedule: describeSchedule(chore),
  dueDate: chore.nextDueDate ?? null,
  priority: chore.priority ?? null,
  points: chore.points ?? null,
  // ids for `label_ids` of the write tools, names for people
  labels: (chore.labelsV2 ?? []).map(({ id, name }) => ({ id, name })),
  assignedTo: chore.assignedTo ?? null,
  isActive: chore.isActive ?? true,
  ...(chore.subTasks?.length ? { subtasks: summarizeSubtasks(chore) } : {}),
})

/** The eAPI answer to a write call: a chore summary when it looks like a chore, otherwise the raw JSON. */
export const summarizeWriteResult = (raw: unknown) => {
  const chore = ChoreSchema.safeParse(raw)
  return chore.success ? summarizeChore(chore.data) : raw
}

/** Donetick's main API wants a full timestamp; a date without time becomes the end of that day (UTC). */
const toDueTimestamp = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59Z` : new Date(value).toISOString()

/** The chore fields of create_chore and update_chore in the names of the main API. Only what the caller set. */
export const toChoreChanges = (input: ChoreFieldsInput & { name?: string | undefined }): ChoreChanges => ({
  ...(input.name === undefined ? {} : { name: input.name }),
  ...(input.description === undefined ? {} : { description: input.description }),
  ...(input.due_date === undefined ? {} : { nextDueDate: toDueTimestamp(input.due_date) }),
  ...(input.priority === undefined ? {} : { priority: input.priority }),
  ...(input.points === undefined ? {} : { points: input.points }),
  ...(input.assigned_to === undefined
    ? {}
    : { assignedTo: input.assigned_to, assignees: [{ userId: input.assigned_to }] }),
  ...(input.label_ids === undefined ? {} : { labelsV2: input.label_ids.map((id) => ({ id })) }),
})
