/**
 * All zod schemas of the server (the types inferred from them are in types.ts):
 *   - SSH_HOSTS, the hosts the server may connect to (read once at startup, config.ts)
 *   - tool inputs: their `.describe()` texts are shown to the AI client
 */
import { z } from 'zod'

import { DEFAULT_TIMEOUT_S, MAX_COMMAND_LENGTH, MAX_TIMEOUT_S } from './constants.js'

// ---- SSH_HOSTS ----

/** One host the server may connect to. */
export const HostConfigSchema = z.object({
  host: z.string().min(1), // address or IP
  port: z.number().int().min(1).max(65_535).default(22),
  username: z.string().min(1),
  privateKey: z.string().min(1), // OpenSSH private key as text
  passphrase: z.string().optional(), // only when the private key is encrypted
  // Required: every connection checks the host key against it (protects against man-in-the-middle).
  hostKeySha256: z.string().regex(/^SHA256:[A-Za-z0-9+/]{43}$/), // output of `ssh-keygen -lf`
})

/** Alias -> host, e.g. { "web": { host, username, ... } }. Tools take the alias as their `host` input. */
export const HostsSchema = z
  .record(z.string().regex(/^[a-z0-9][a-z0-9_-]{0,31}$/), HostConfigSchema)
  .refine((hosts) => Object.keys(hosts).length > 0, 'at least one host is required')

// ---- Tool inputs ----

const commandInput = z.string().min(1).max(MAX_COMMAND_LENGTH)
const sessionIdInput = z.string()
const timeoutInput = z
  .number()
  .int()
  .min(1)
  .max(MAX_TIMEOUT_S)
  .default(DEFAULT_TIMEOUT_S)
  .describe(`Seconds before the command is cut off (max ${MAX_TIMEOUT_S}).`)

/** The `host` input lists the configured aliases in its description, so it is built from them at runtime. */
const getHostInput = (aliases: string[]) => z.string().describe(`Host alias. One of: ${aliases.join(', ')}.`)

export const getExecInputSchema = (aliases: string[]) =>
  z.object({ host: getHostInput(aliases), command: commandInput, timeout_s: timeoutInput })

export const getOpenInputSchema = (aliases: string[]) => z.object({ host: getHostInput(aliases) })

export const RunInputSchema = z.object({ session_id: sessionIdInput, command: commandInput, timeout_s: timeoutInput })

export const CloseInputSchema = z.object({ session_id: sessionIdInput })
