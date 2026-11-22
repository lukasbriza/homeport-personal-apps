/**
 * complete_chore: marks a chore done, optionally with a note. A repeating chore moves to its next due date.
 *
 * Donetick: POST /eapi/v1/chore/{id}/complete, with `{ note }` as the body only when a note is given. Not
 * idempotent: calling it twice completes the chore twice, so the client never retries this POST.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { CompleteChoreInput, DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { CompleteChoreInputSchema } from '../validations.js'

import { summarizeWriteResult } from './shared/chores.js'

export const registerCompleteChore = (server: McpServer, client: DonetickClient) => {
  const handleCompleteChore = (input: CompleteChoreInput) =>
    runTool('complete_chore', { chore: input.chore_id }, async () => {
      const path = `/eapi/v1/chore/${input.chore_id}/complete`
      const raw = await client.call('POST', path, input.note === undefined ? undefined : { note: input.note })
      return raw === null ? { completed: input.chore_id } : summarizeWriteResult(raw)
    })

  server.registerTool(
    'complete_chore',
    {
      title: 'Complete a chore',
      description:
        'Marks a chore as done. A repeating chore moves to its next due date. Calling it twice completes it twice.',
      inputSchema: CompleteChoreInputSchema,
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    handleCompleteChore,
  )
}
