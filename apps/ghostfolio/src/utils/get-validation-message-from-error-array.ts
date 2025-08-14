import { ValidationError } from 'class-validator'

export const getValidationMessageFromErrorArray = (errors: ValidationError[]) => {
  const errorStrings = errors.map((error) => error.toString(true, false, undefined, false))

  if (errorStrings.length === 0) {
    return null
  }

  const message = errorStrings.join(' ,')
  return `Error ocured in: ${message}.`
}
