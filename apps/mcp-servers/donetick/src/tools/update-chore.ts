/**
 * update_chore: changes the given fields of a chore; `is_active: false` archives it. Subtasks: update_subtasks.
 *
 * Donetick: GET /api/v1/chores/{id}, PUT /api/v1/chores/ (the whole chore with the changes applied: the edit route
 * clears every field left out), then GET again for the answer. See tools/shared/chores.ts for why the main API.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { DonetickClient, UpdateChoreInput } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { UpdateChoreInputSchema } from '../validations.js'

import { fetchFullChore, saveFullChore, summarizeChore, toChoreChanges } from './shared/chores.js'

export const registerUpdateChore = (server: McpServer, client: DonetickClient) => {
  const handleUpdateChore = (input: UpdateChoreInput) =>
    runTool('update_chore', { chore: input.chore_id }, async () => {
      const changes = {
        ...toChoreChanges(input),
        ...(input.is_active === undefined ? {} : { isActive: input.is_active }),
      }
      if (Object.keys(changes).length === 0) throw new Error('nothing to change: set at least one field')

      const current = await fetchFullChore(client, input.chore_id)
      await saveFullChore(client, current, changes)
      return summarizeChore(await fetchFullChore(client, input.chore_id))
    })

  server.registerTool(
    'update_chore',
    {
      title: 'Update a chore',
      description:
        'Changes fields of an existing chore; fields that are not given stay as they are. `label_ids` replaces ' +
        'all labels. Use `is_active: false` to archive a chore. Subtasks are changed with update_subtasks. ' +
        'There is no delete tool.',
      inputSchema: UpdateChoreInputSchema,
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    handleUpdateChore,
  )
}
