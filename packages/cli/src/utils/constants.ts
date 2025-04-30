/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROJECT_TYPE, type Options } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const APPS_PATH = path.normalize(`${__dirname}/../../../../apps`)
export const PACKAGES_PATH = path.normalize(`${__dirname}/../../../../packages`)
export const STORYBOOK_PATH = path.resolve(`${APPS_PATH}/storybook`)
export const TEMP_PATH = path.normalize(`${APPS_PATH}/../.temp`)

export const OPTIONS: Options = [
  ['NextJS', PROJECT_TYPE.APP],
  ['Storybook', PROJECT_TYPE.APP],
  ['Theme', PROJECT_TYPE.PROJECT],
  ['NestJs', PROJECT_TYPE.APP],
  ['Component library', PROJECT_TYPE.PROJECT],
]

export const DEFAULT_OPTION_INDEX = 0
