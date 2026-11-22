/**
 * Chore code used by several tools:
 *   fetchChores          GET /eapi/v1/chore, checked against ChoreListSchema (list_chores, update_chore)
 *   summarizeChore       the short summary the AI client gets instead of the whole eAPI object
 *   summarizeWriteResult the same for the answer of a write call (create, update, complete)
 *   toChoreChanges       tool input fields -> eAPI field names (create, update)
 */
import { MAX_DESCRIPTION_CHARS } from '../../constants.js'
import type { Chore, ChoreFieldsInput, DonetickClient } from '../../types.js'
import { ChoreListSchema, ChoreSchema } from '../../validations.js'

/** All chores of the circle. The eAPI has no filters, so the tools filter the full list. */
export const fetchChores = async (client: DonetickClient) => {
  const parsed = ChoreListSchema.safeParse(await client.call('GET', '/eapi/v1/chore'))
  if (!parsed.success) throw new Error('unexpected answer: the chore list has an unknown shape')
  return parsed.data
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

export const summarizeChore = (chore: Chore) => ({
  id: chore.id,
  name: chore.name,
  ...(chore.description ? { description: toPlainText(chore.description) } : {}),
  schedule: describeSchedule(chore),
  dueDate: chore.nextDueDate ?? null,
  priority: chore.priority ?? null,
  points: chore.points ?? null,
  labels: (chore.labelsV2 ?? []).map((label) => label.name),
  assignedTo: chore.assignedTo ?? null,
  isActive: chore.isActive ?? true,
})

/** The eAPI answer to a write call: a chore summary when it looks like a chore, otherwise the raw JSON. */
export const summarizeWriteResult = (raw: unknown) => {
  const chore = ChoreSchema.safeParse(raw)
  return chore.success ? summarizeChore(chore.data) : raw
}

/** The chore fields of create_chore and update_chore in the names the eAPI uses. Only what the caller set is included. */
export const toChoreChanges = (input: ChoreFieldsInput & { name?: string | undefined }) => ({
  ...(input.name === undefined ? {} : { name: input.name }),
  ...(input.description === undefined ? {} : { description: input.description }),
  ...(input.due_date === undefined ? {} : { dueDate: input.due_date, nextDueDate: input.due_date }),
  ...(input.priority === undefined ? {} : { priority: input.priority }),
  ...(input.points === undefined ? {} : { points: input.points }),
  ...(input.assigned_to === undefined
    ? {}
    : { assignedTo: input.assigned_to, assignees: [{ userId: input.assigned_to }] }),
  ...(input.label_ids === undefined ? {} : { labelsV2: input.label_ids.map((id) => ({ id })) }),
})
