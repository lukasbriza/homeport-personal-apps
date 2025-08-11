import { rmSync } from 'node:fs'

import ora from 'ora'

import { APPS_PATH, PACKAGES_PATH } from '../constants.js'
import { PROJECT_TYPE } from '../types.js'

export const cleanup = (projectName: string, type: PROJECT_TYPE) => {
  const spinner = ora(`Starting ${projectName} cleanup...\n`).start()
  const path = `${type === PROJECT_TYPE.APP ? APPS_PATH : PACKAGES_PATH}/${projectName}`
  rmSync(path, { recursive: true, force: true })
  spinner.succeed()
}
