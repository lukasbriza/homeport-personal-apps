/**
 * update_chore: changes the given fields of a chore; `is_active: false` archives it.
 *
 * Donetick: GET /eapi/v1/chore, then PUT /eapi/v1/chore/{id}. The eAPI replaces the whole chore, so the current one
 * is read first and sent back with the changes applied.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { UpdateChoreInput, DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { UpdateChoreInputSchema } from '../validations.js'

import { fetchChores, summarizeWriteResult, toChoreChanges } from './shared/chores.js'

export const registerUpdateChore = (server: McpServer, client: DonetickClient) => {
  const handleUpdateChore = (input: UpdateChoreInput) =>
    runTool('update_chore', { chore: input.chore_id }, async () => {
      const changes = {
        ...toChoreChanges(input),
        ...(input.is_active === undefined ? {} : { isActive: input.is_active }),
      }
      if (Object.keys(changes).length === 0) throw new Error('nothing to change: set at least one field')

      const allChores = await fetchChores(client)
      const current = allChores.find((chore) => chore.id === input.chore_id)
      if (!current) throw new Error(`chore ${input.chore_id} does not exist`)
      const path = `/eapi/v1/chore/${input.chore_id}`
      return summarizeWriteResult(await client.call('PUT', path, { ...current, ...changes }))
    })

  server.registerTool(
    'update_chore',
    {
      title: 'Update a chore',
      description:
        'Changes fields of an existing chore; fields that are not given stay as they are. ' +
        'Use `is_active: false` to archive a chore. There is no delete tool.',
      inputSchema: UpdateChoreInputSchema,
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    handleUpdateChore,
  )
}
