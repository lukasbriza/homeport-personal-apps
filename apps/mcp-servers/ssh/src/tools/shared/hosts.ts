/**
 * Host lookup used by several tools. A tool takes a host alias (a key of SSH_HOSTS), never an address.
 */
import type { Hosts } from '../../types.js'

/** Host aliases, sorted: the `host` input lists them and ssh_list_hosts prints them in this order. */
export const getAliases = (hosts: Hosts) => Object.keys(hosts).toSorted()

/** The config of a host alias. Throws a readable error for an unknown alias. */
export const getHostConfig = (hosts: Hosts, alias: string) => {
  const hostConfig = hosts[alias]
  if (!hostConfig) throw new Error(`unknown host "${alias}"; known hosts: ${getAliases(hosts).join(', ')}`)
  return hostConfig
}
