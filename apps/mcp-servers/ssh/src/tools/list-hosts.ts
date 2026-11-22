/**
 * ssh_list_hosts: the host aliases this server can connect to, with address and user.
 *
 * SSH: none, it only reads SSH_HOSTS.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { ToolContext } from '../types.js'
import { runTool } from '../utils/run-tool.js'

import { getAliases, getHostConfig } from './shared/hosts.js'

export const registerListHosts = (server: McpServer, { hosts }: ToolContext) => {
  const handleListHosts = () =>
    runTool('ssh_list_hosts', {}, () => {
      const lines = getAliases(hosts).map((alias) => {
        const { username, host, port } = getHostConfig(hosts, alias)
        return `${alias}: ${username}@${host}:${port}`
      })
      return { text: lines.join('\n') }
    })

  server.registerTool(
    'ssh_list_hosts',
    {
      title: 'List SSH hosts',
      description: 'Lists the host aliases this server can connect to, with address and user.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    handleListHosts,
  )
}
