/**
 * list_members: members of the Donetick circle. Their `userId` is the `assigned_to` of the write tools.
 *
 * Donetick: GET /eapi/v1/circle/members.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { DonetickClient } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { MemberListSchema } from '../validations.js'

export const registerListMembers = (server: McpServer, client: DonetickClient) => {
  const handleListMembers = () =>
    runTool('list_members', {}, async () => {
      const parsed = MemberListSchema.safeParse(await client.call('GET', '/eapi/v1/circle/members'))
      if (!parsed.success) throw new Error('unexpected answer: the member list has an unknown shape')
      return parsed.data.map(({ userId, username, displayName, role, isActive }) => ({
        userId,
        username,
        displayName: displayName ?? null,
        role: role ?? null,
        isActive: isActive ?? true,
      }))
    })

  server.registerTool(
    'list_members',
    {
      title: 'List circle members',
      description: 'Lists the members of the Donetick circle. Use their userId as `assigned_to`.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    handleListMembers,
  )
}
