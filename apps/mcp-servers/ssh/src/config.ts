/**
 * Host list configuration.
 *
 * The server only connects to hosts listed in the SSH_HOSTS env var. This file parses and
 * validates that JSON, so a typo fails at startup instead of on the first tool call.
 */
import { z } from 'zod'

// One host the server may connect to.
const HostConfigSchema = z.object({
  host: z.string().min(1), // address or IP
  port: z.number().int().min(1).max(65_535).default(22),
  username: z.string().min(1),
  privateKey: z.string().min(1), // OpenSSH private key as text
  passphrase: z.string().optional(), // only when the private key is encrypted
  // Required: every connection checks the host key against it (protects against man-in-the-middle).
  hostKeySha256: z.string().regex(/^SHA256:[A-Za-z0-9+/]{43}$/), // output of `ssh-keygen -lf`
})

// Alias -> host, e.g. { "web": { host, username, ... } }. Tools take the alias as their `host` input.
const HostsSchema = z
  .record(z.string().regex(/^[a-z0-9][a-z0-9_-]{0,31}$/), HostConfigSchema)
  .refine((hosts) => Object.keys(hosts).length > 0, 'at least one host is required')

export type HostConfig = z.infer<typeof HostConfigSchema>
export type Hosts = z.infer<typeof HostsSchema>

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
