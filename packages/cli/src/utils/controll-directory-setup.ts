import { existsSync } from 'node:fs'

import { APPS_PATH, TEMP_PATH } from '../constants.js'
import { PROJECT_TYPE, type Option } from '../types.js'

import { createDirectory } from './create-directory.js'

export const controlDirectorySetup = (option: Option) => {
  if (option[1] === PROJECT_TYPE.APP) {
    const hasAppDirectory = existsSync(`${APPS_PATH}`)

    if (!hasAppDirectory) {
      createDirectory(`${APPS_PATH}`)
    }
  }

  const existTemporary = existsSync(`${TEMP_PATH}`)

  if (!existTemporary) {
    createDirectory(`${TEMP_PATH}`)
  }
}
