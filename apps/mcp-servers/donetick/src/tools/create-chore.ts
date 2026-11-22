/**
 * create_chore: new chore. Answers with its summary, including the new id.
 *
 * Donetick: POST /eapi/v1/chore. The body is built by `toChoreChanges` (tools/shared/chores.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { CreateChoreInput, DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { CreateChoreInputSchema } from '../validations.js'

import { summarizeWriteResult, toChoreChanges } from './shared/chores.js'

export const registerCreateChore = (server: McpServer, client: DonetickClient) => {
  const handleCreateChore = (input: CreateChoreInput) =>
    runTool('create_chore', {}, async () => {
      const body = {
        ...toChoreChanges(input),
        frequencyType: input.frequency_type,
        frequency: 1,
        assignStrategy: 'keep_last_assigned',
        isActive: true,
      }
      return summarizeWriteResult(await client.call('POST', '/eapi/v1/chore', body))
    })

  server.registerTool(
    'create_chore',
    {
      title: 'Create a chore',
      description: 'Creates a chore and returns it with its new id. `frequency_type` defaults to a one-off chore.',
      inputSchema: CreateChoreInputSchema,
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    handleCreateChore,
  )
}
