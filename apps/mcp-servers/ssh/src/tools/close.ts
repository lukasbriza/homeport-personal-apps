/**
 * ssh_close: closes a session opened with ssh_open.
 *
 * SSH: disconnect (`sessions.close` in session-store.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { CloseInput, ToolContext } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { CloseInputSchema } from '../validations.js'

export const registerClose = (server: McpServer, { sessions }: ToolContext) => {
  const handleClose = ({ session_id }: CloseInput) =>
    runTool('ssh_close', { session: session_id }, () => {
      const isClosed = sessions.close(session_id)
      const text = isClosed ? 'closed' : `session ${session_id} does not exist (already closed or expired)`
      return { text, audit: { closed: isClosed } }
    })

  server.registerTool(
    'ssh_close',
    {
      title: 'Close an SSH session',
      description: 'Closes a session opened with ssh_open.',
      inputSchema: CloseInputSchema,
    },
    handleClose,
  )
}
