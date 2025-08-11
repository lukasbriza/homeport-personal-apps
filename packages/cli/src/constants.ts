/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROJECT_TYPE, type Options } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const GITHUB_URL = 'https://github.com/lukasbriza'
export const ROOT = `${__dirname}/../../..`

export const DOCKER_PATH = path.normalize(`${ROOT}/docker`)
export const APPS_PATH = path.normalize(`${__dirname}/../../../apps`) // ??
export const PACKAGES_PATH = path.normalize(`${ROOT}/packages`)
export const STORYBOOK_PATH = path.resolve(`${APPS_PATH}/storybook`)
export const TEMP_PATH = path.normalize(`${ROOT}/.temp`)

export const CROSSROAD_OPTIONS = ['Create project', 'Settings']
export const SETTINGS_OPTIONS = ['Update CLI', 'Update docker files', 'Update `CONTRIBUTING.md`']

export const OPTIONS: Options = [
  ['NextJS', PROJECT_TYPE.APP],
  ['NestJs', PROJECT_TYPE.APP],
  ['Storybook', PROJECT_TYPE.APP],
  ['Theme', PROJECT_TYPE.PROJECT],
  ['Component library', PROJECT_TYPE.PROJECT],
]

export const DEFAULT_OPTION_INDEX = 0
