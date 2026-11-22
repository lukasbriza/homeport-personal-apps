/**
 * Connection settings of the Donetick instance.
 *
 * Read once at startup from env vars, so a typo fails the pod immediately instead of the first tool call.
 *   DONETICK_BASE_URL     base URL without a path; in the cluster the plain-HTTP Service
 *                         donetick-keda-proxy.donetick.svc.cluster.local:8080
 *   DONETICK_TOKEN        Donetick API token (eAPI), sent in the `secretkey` header
 *   DONETICK_HOST_HEADER  optional Host header: the KEDA interceptor in front of Donetick routes by it
 */
import type { DonetickConfig } from './types.js'
import { ConfigSchema } from './validations.js'

/** Parses and validates the env vars. Throws a readable error that never contains a value (the token is one). */
export const parseConfig = (env: NodeJS.ProcessEnv): DonetickConfig => {
  const parsed = ConfigSchema.safeParse({
    baseUrl: env.DONETICK_BASE_URL,
    token: env.DONETICK_TOKEN,
    // An empty value (e.g. an unset Infisical key) means no override, not an invalid header.
    hostHeader: env.DONETICK_HOST_HEADER === '' ? undefined : env.DONETICK_HOST_HEADER,
  })
  if (parsed.success) return parsed.data

  const names: Record<string, string> = {
    baseUrl: 'DONETICK_BASE_URL',
    token: 'DONETICK_TOKEN',
    hostHeader: 'DONETICK_HOST_HEADER',
  }
  const invalid = parsed.error.issues.map((issue) => names[String(issue.path[0])] ?? '(unknown)')
  throw new Error(`invalid or missing env vars: ${[...new Set(invalid)].join(', ')}`)
}
