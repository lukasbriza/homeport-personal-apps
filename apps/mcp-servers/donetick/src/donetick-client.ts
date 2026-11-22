/**
 * HTTP client of the Donetick external API (eAPI). The low-level parts (send, parse) are in utils/http.ts.
 *
 * Donetick may be scaled to zero. The interceptor then holds the request until the pod is up, so the timeout is
 * generous. Only GET is retried (once, on a gateway error or a refused connection): repeating a POST could complete
 * or create a chore twice.
 */
import { RETRY_DELAY_MS, RETRYABLE_STATUS } from './constants.js'
import type { DonetickClient, DonetickConfig, RawResponse } from './types.js'
import { DonetickError, getErrorMessage } from './utils/errors.js'
import { isRetryableError, parseResponse, sendOnce } from './utils/http.js'
import { sleep } from './utils/sleep.js'

export const createDonetickClient = (config: DonetickConfig): DonetickClient => ({
  call: async (method, path, body) => {
    const payload = body === undefined ? undefined : JSON.stringify(body)
    const canRetry = method === 'GET'

    let response: RawResponse
    try {
      response = await sendOnce(config, method, path, payload)
    } catch (error) {
      if (!canRetry || !isRetryableError(error)) {
        throw error instanceof DonetickError ? error : new DonetickError(`request failed: ${getErrorMessage(error)}`)
      }
      await sleep(RETRY_DELAY_MS)
      try {
        response = await sendOnce(config, method, path, payload)
      } catch (retryError) {
        throw new DonetickError(`request failed: ${getErrorMessage(retryError)}`)
      }
    }

    if (canRetry && RETRYABLE_STATUS.has(response.status)) {
      await sleep(RETRY_DELAY_MS)
      response = await sendOnce(config, method, path, payload).catch((error: unknown) => {
        throw new DonetickError(`request failed: ${getErrorMessage(error)}`)
      })
    }
    return parseResponse(response)
  },
})
