import { AxiosResponse } from 'axios'
import { validate } from 'class-validator'

import { getValidationMessageFromErrorArray } from './get-validation-message-from-error-array'

export const axiosResponseValidation = async <T extends object>(response: AxiosResponse<T>) => {
  const validationErrors = await validate(response.data)
  const validationMessage = getValidationMessageFromErrorArray(validationErrors)

  if (validationMessage) {
    throw new Error(validationMessage)
  }
}
