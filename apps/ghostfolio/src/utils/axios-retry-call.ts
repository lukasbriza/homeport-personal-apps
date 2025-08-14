import { ConsoleLogger } from '@nestjs/common'
import { AxiosError } from 'axios'

export const axiosRetryCall = async <T>(
  call: () => Promise<T>,
  timeout: number,
  logger: ConsoleLogger,
  retries: number = 3,
  actualTryNumber: number = 1,
): Promise<T> => {
  try {
    return await call()
  } catch (error) {
    const axiosError = error as AxiosError

    if (axiosError.response?.status === 429 && actualTryNumber <= retries) {
      logger.log(`Starting timeout on call retry  ${timeout / 1000}s...`)
      await new Promise((resolve) => {
        setTimeout(resolve, timeout)
      })

      logger.log(`Retriying call. Retry number ${actualTryNumber}...`)
      return axiosRetryCall<T>(call, timeout, logger, retries, actualTryNumber + 1)
    }

    throw error
  }
}
