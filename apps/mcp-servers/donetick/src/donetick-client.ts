/**
 * HTTP client of the Donetick external API (eAPI). The low-level parts (send, parse) are in utils/http.ts.
 *
 * Retries, in the order they happen:
 *   1. Connection error (refused, reset): GET only, once. A POST or PUT may already have reached Donetick, so
 *      repeating it could create or complete a chore twice.
 *   2. Donetick asleep: in the cluster it is scaled to zero. The KEDA interceptor then answers at once with 503 and an
 *      HTML "starting" page, starts the pod and forwards nothing. The request never reached Donetick, so every method
 *      is repeated, every `delayMs`, at most `maxWakeUpAttempts` times (about a minute; the pod needs ~15 s).
 *   3. Gateway error from Donetick itself (502/503/504 with a JSON body): GET only, once.
 */
import { MAX_WAKE_UP_ATTEMPTS, RETRY_DELAY_MS, RETRYABLE_STATUS } from './constants.js'
import type { DonetickClient, DonetickConfig, RawResponse, RetryOptions } from './types.js'
import { DonetickError, getErrorMessage } from './utils/errors.js'
import { isRetryableError, isStartingUp, parseResponse, sendOnce } from './utils/http.js'
import { sleep } from './utils/sleep.js'

const DEFAULT_RETRY_OPTIONS: RetryOptions = { delayMs: RETRY_DELAY_MS, maxWakeUpAttempts: MAX_WAKE_UP_ATTEMPTS }

/** Any failure as a `DonetickError`, whose message is safe to show to the AI client. */
const toDonetickError = (error: unknown) =>
  error instanceof DonetickError ? error : new DonetickError(`request failed: ${getErrorMessage(error)}`)

export const createDonetickClient = (
  config: DonetickConfig,
  { delayMs, maxWakeUpAttempts }: RetryOptions = DEFAULT_RETRY_OPTIONS,
): DonetickClient => ({
  call: async (method, path, body) => {
    const payload = body === undefined ? undefined : JSON.stringify(body)
    const isGet = method === 'GET'

    /** One request. Retry 1: a GET gets one more try after a connection error. */
    const send = async (): Promise<RawResponse> => {
      try {
        return await sendOnce(config, method, path, payload)
      } catch (error) {
        if (!isGet || !isRetryableError(error)) throw toDonetickError(error)
        await sleep(delayMs)
        return sendOnce(config, method, path, payload).catch((retryError: unknown) => {
          throw toDonetickError(retryError)
        })
      }
    }

    /** Retry 2: repeats the request while the interceptor reports Donetick as starting up. */
    const waitUntilAwake = async (response: RawResponse, attempt = 1): Promise<RawResponse> => {
      if (!isStartingUp(response)) return response
      if (attempt >= maxWakeUpAttempts) {
        throw new DonetickError('Donetick is still starting up (it was scaled to zero); try again in a minute', 503)
      }
      await sleep(delayMs)
      return waitUntilAwake(await send(), attempt + 1)
    }

    let response = await waitUntilAwake(await send())

    // Retry 3: a gateway error from Donetick itself.
    if (isGet && RETRYABLE_STATUS.has(response.status)) {
      await sleep(delayMs)
      response = await send()
    }
    return parseResponse(response)
  },
})
