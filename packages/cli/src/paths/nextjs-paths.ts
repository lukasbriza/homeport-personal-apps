/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const eslintPath = path.normalize(`${__dirname}/../../files/next-js/esl`)
export const tsConfigPath = path.normalize(`${__dirname}/../../files/next-js/tsc`)
export const turboFilePath = path.normalize(`${__dirname}/../../files/nextjs/turbo`)
