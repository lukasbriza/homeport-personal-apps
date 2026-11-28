/**
 * create_chore: new chore, optionally with subtasks. Answers with its summary, including the new id.
 *
 * Donetick: POST /api/v1/chores/ (answers only the new id), then GET /api/v1/chores/{id} for the answer. The eAPI's
 * create would ignore everything but name, description and due date; see tools/shared/chores.ts.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { CreateChoreInput, DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { CreateChoreInputSchema, CreatedChoreResponseSchema } from '../validations.js'

import { fetchFullChore, summarizeChore, toChoreChanges } from './shared/chores.js'

export const registerCreateChore = (server: McpServer, client: DonetickClient) => {
  const handleCreateChore = (input: CreateChoreInput) =>
    runTool('create_chore', {}, async () => {
      const changes = toChoreChanges(input)
      const body = {
        ...changes,
        frequencyType: input.frequency_type,
        frequency: 1,
        assignStrategy: input.assigned_to === undefined ? 'no_assignee' : 'keep_last_assigned',
        isActive: true,
        labelsV2: changes.labelsV2 ?? [],
        // id 0 = new subtask
        ...(input.subtasks ? { subTasks: input.subtasks.map((name, index) => ({ id: 0, name, orderId: index })) } : {}),
      }
      const created = CreatedChoreResponseSchema.safeParse(await client.call('POST', '/api/v1/chores/', body))
      if (!created.success) throw new Error('unexpected answer: Donetick did not return the id of the new chore')
      return summarizeChore(await fetchFullChore(client, created.data.res))
    })

  server.registerTool(
    'create_chore',
    {
      title: 'Create a chore',
      description:
        'Creates a chore and returns it with its new id. `frequency_type` defaults to a one-off chore. ' +
        '`subtasks` adds a checklist; nested subtasks can be added afterwards with update_subtasks.',
      inputSchema: CreateChoreInputSchema,
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    handleCreateChore,
  )
}
