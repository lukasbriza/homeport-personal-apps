import { DEFAULT_OPTION_INDEX, OPTIONS } from '../constants.js'

export const chooseOption = () => {
  const optionsString = OPTIONS.map((option, index) => `${index + 1}: ${option[0]} \n`).join('')
  const question = `Choose option number (default ${OPTIONS[DEFAULT_OPTION_INDEX][0]}): `
  return `${optionsString}\n${question}`
}
