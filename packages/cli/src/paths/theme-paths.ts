/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const eslintPath = path.normalize(`${__dirname}/../../files/theme/esl`)
export const tsconfigPath = path.normalize(`${__dirname}/../../files/theme/tsc`)
export const packagePath = path.normalize(`${__dirname}/../../files/theme/package`)
