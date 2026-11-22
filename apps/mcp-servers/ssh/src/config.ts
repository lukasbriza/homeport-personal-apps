/**
 * Host list configuration.
 *
 * The server only connects to hosts listed in the SSH_HOSTS env var. This file parses and validates that JSON (schema
 * in validations.ts), so a typo fails at startup instead of on the first tool call.
 */
import type { Hosts } from './types.js'
import { HostsSchema } from './validations.js'

/** Parses and validates SSH_HOSTS. Throws a readable error when it is missing or invalid. */
export const parseHosts = (raw: string | undefined): Hosts => {
  if (!raw) throw new Error('SSH_HOSTS is not set')

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error('SSH_HOSTS is not valid JSON')
  }

  const parsed = HostsSchema.safeParse(json)
  if (parsed.success) return parsed.data

  // Report only the paths of invalid fields: zod messages can echo values, including private keys.
  const paths = parsed.error.issues.map((issue) => issue.path.join('.') || '(root)')
  throw new Error(`SSH_HOSTS is invalid at: ${paths.join(', ')}`)
}
