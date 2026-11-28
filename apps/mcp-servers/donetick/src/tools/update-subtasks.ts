/**
 * update_subtasks: adds, renames and deletes subtasks of a chore. Checking one off is complete_subtask.
 *
 * Donetick: GET /api/v1/chores/{id}, PUT /api/v1/chores/ with the whole chore and the new subtask list, then GET again
 * for the answer. Donetick compares the list with the stored one: ids it no longer finds are deleted, id 0 is new, a
 * changed name or order is updated. Existing subtasks keep their done state.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import { MAX_SUBTASKS } from '../constants.js'
import type { DonetickClient, SubTask, UpdateSubtasksInput } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { UpdateSubtasksInputSchema } from '../validations.js'

import { fetchFullChore, saveFullChore, summarizeChore } from './shared/chores.js'

/** The given subtasks plus every subtask nested under them, at any depth. */
const withNested = (subtasks: SubTask[], ids: number[]) => {
  const result = new Set(ids)
  let isGrowing = true
  while (isGrowing) {
    const before = result.size
    for (const subtask of subtasks) {
      if (subtask.parentId && result.has(subtask.parentId)) result.add(subtask.id)
    }
    isGrowing = result.size > before
  }
  return result
}

/** The new subtask list: removed ones out, renamed ones renamed, new ones (id 0) last; orders renumbered 0..n. */
const buildSubtasks = (current: SubTask[], input: UpdateSubtasksInput) => {
  const known = new Set(current.map((subtask) => subtask.id))
  // ids that must stay: renamed ones and parents of new ones
  const used = [
    ...(input.rename ?? []).map((item) => item.subtask_id),
    ...(input.add ?? []).flatMap((item) => (item.parent_id === undefined ? [] : [item.parent_id])),
  ]
  const unknown = [...(input.remove ?? []), ...used].find((id) => !known.has(id))
  if (unknown !== undefined) throw new Error(`chore ${input.chore_id} has no subtask ${unknown}`)

  const removed = withNested(current, input.remove ?? [])
  const conflict = used.find((id) => removed.has(id))
  if (conflict !== undefined) throw new Error(`subtask ${conflict} is being deleted, so it cannot be renamed or used`)

  const names = new Map((input.rename ?? []).map((item) => [item.subtask_id, item.name]))
  const kept = current
    .filter((subtask) => !removed.has(subtask.id))
    .toSorted((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0))
    .map((subtask) => ({ ...subtask, name: names.get(subtask.id) ?? subtask.name }))
  const added = (input.add ?? []).map((item) => ({ id: 0, name: item.name, parentId: item.parent_id ?? null }))

  const subtasks = [...kept, ...added].map((subtask, index) => ({ ...subtask, orderId: index }))
  if (subtasks.length > MAX_SUBTASKS) throw new Error(`a chore can have at most ${MAX_SUBTASKS} subtasks`)
  return { subtasks, removed: [...removed] }
}

export const registerUpdateSubtasks = (server: McpServer, client: DonetickClient) => {
  const handleUpdateSubtasks = (input: UpdateSubtasksInput) =>
    runTool('update_subtasks', { chore: input.chore_id }, async () => {
      if (!input.add?.length && !input.rename?.length && !input.remove?.length) {
        throw new Error('nothing to change: set add, rename or remove')
      }
      const current = await fetchFullChore(client, input.chore_id)
      const { subtasks, removed } = buildSubtasks(current.subTasks ?? [], input)
      await saveFullChore(client, current, { subTasks: subtasks })

      const saved = summarizeChore(await fetchFullChore(client, input.chore_id))
      return { choreId: input.chore_id, removed, subtasks: saved.subtasks ?? [] }
    })

  server.registerTool(
    'update_subtasks',
    {
      title: 'Add, rename or delete subtasks',
      description:
        'Changes the subtask list of a chore in one call: `add` new subtasks (optionally nested under an existing ' +
        'one), `rename` existing ones, `remove` ones (with everything nested under them). Subtask ids are in the ' +
        '`subtasks` of list_chores. To check a subtask off, use complete_subtask.',
      inputSchema: UpdateSubtasksInputSchema,
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    handleUpdateSubtasks,
  )
}
