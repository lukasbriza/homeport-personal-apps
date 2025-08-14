import { HttpException, HttpStatus } from '@nestjs/common'

import { getErrorMessage } from './get-error-message'

export const axiosCallWrapper = async <T>(call: () => Promise<T>, methodName: string) => {
  try {
    return await call()
  } catch (error) {
    const message = getErrorMessage(methodName, error)
    throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
