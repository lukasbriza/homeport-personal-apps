/**
 * complete_subtask: checks a subtask of a chore off, or unchecks it. The chore itself stays as it is.
 *
 * Donetick: GET /api/v1/chores/{id} (Donetick answers 200 even for an unknown subtask, so it is looked up first), then
 * PUT /api/v1/chores/{id}/subtask. Both are in Donetick's main API, which accepts the same API token as the eAPI.
 * Completing a repeating chore unchecks all its subtasks.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { CompleteSubtaskInput, DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { CompleteSubtaskInputSchema } from '../validations.js'

import { fetchFullChore } from './shared/chores.js'

export const registerCompleteSubtask = (server: McpServer, client: DonetickClient) => {
  const handleCompleteSubtask = (input: CompleteSubtaskInput) =>
    runTool('complete_subtask', { chore: input.chore_id, subtask: input.subtask_id, done: input.done }, async () => {
      const chore = await fetchFullChore(client, input.chore_id)
      const subtask = chore.subTasks?.find((candidate) => candidate.id === input.subtask_id)
      if (!subtask) throw new Error(`chore ${input.chore_id} has no subtask ${input.subtask_id}`)

      await client.call('PUT', `/api/v1/chores/${input.chore_id}/subtask`, {
        id: input.subtask_id,
        choreId: input.chore_id,
        completedAt: input.done ? new Date().toISOString() : null,
      })
      return { choreId: input.chore_id, subtaskId: input.subtask_id, name: subtask.name, done: input.done }
    })

  server.registerTool(
    'complete_subtask',
    {
      title: 'Check off a subtask',
      description:
        'Checks a subtask of a chore off (done: true) or unchecks it (done: false); the chore itself is not ' +
        'completed. Subtask ids are in the `subtasks` of list_chores. Completing a repeating chore unchecks all ' +
        'its subtasks.',
      inputSchema: CompleteSubtaskInputSchema,
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handleCompleteSubtask,
  )
}
