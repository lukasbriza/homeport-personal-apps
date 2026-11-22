/**
 * ssh_open: opens a session, a connection kept between calls that remembers the working directory.
 *
 * SSH: connect and keep the connection in the session store (`sessions.open` in session-store.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { OpenInput, ToolContext } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { getOpenInputSchema } from '../validations.js'

import { getAliases, getHostConfig } from './shared/hosts.js'

export const registerOpen = (server: McpServer, { hosts, sessions }: ToolContext) => {
  const handleOpen = ({ host }: OpenInput) =>
    runTool('ssh_open', { host }, async () => {
      const sessionId = await sessions.open(host, getHostConfig(hosts, host))
      return { text: `session_id: ${sessionId}`, audit: { session: sessionId } }
    })

  server.registerTool(
    'ssh_open',
    {
      title: 'Open an SSH session',
      description:
        'Opens a connection and returns a session_id for ssh_run. The session keeps the working directory ' +
        '(cd persists), not environment variables. It expires after 15 minutes idle; at most 5 sessions ' +
        'exist at once. Close it with ssh_close when done.',
      inputSchema: getOpenInputSchema(getAliases(hosts)),
      annotations: { openWorldHint: true },
    },
    handleOpen,
  )
}
