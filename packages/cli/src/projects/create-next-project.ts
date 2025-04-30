import { copyFileSync, rmSync, unlinkSync } from 'node:fs'

import ora from 'ora'

import { eslintPath, tsConfigPath, turboFilePath } from '../paths/nextjs-paths.js'
import { PROJECT_TYPE } from '../types.js'
import { APPS_PATH, cleanup, createDirectory, downloadNextTemplate } from '../utils/index.js'

export const createNextProject = (name: string) => {
  // CREATE PROJECT DIRECTORY
  const createFolder = ora('Creating NextJs directory...\n').start()
  try {
    createDirectory(`${APPS_PATH}/${name}`)
    createFolder.succeed()
  } catch {
    createFolder.fail()
    cleanup(name, PROJECT_TYPE.APP)
    return
  }

  // DOWNLOAD TEMPLATE FROM GIT
  const download = ora('Downloading NextJs template...\n').start()
  try {
    downloadNextTemplate(name)
    download.succeed()
  } catch {
    download.fail()
    cleanup(name, PROJECT_TYPE.APP)
    return
  }

  // COPY CONFIGURATIONS
  const copyFiles = ora('Copy configuration files...\n').start()
  try {
    unlinkSync(`${APPS_PATH}/${name}/tsconfig.json`)
    unlinkSync(`${APPS_PATH}/${name}/pnpm-lock.yaml`)
    rmSync(`${APPS_PATH}/${name}/.git`, { recursive: true, force: true })
    copyFileSync(tsConfigPath, `${APPS_PATH}/${name}/tsconfig.json`)
    copyFileSync(eslintPath, `${APPS_PATH}/${name}/.eslintrc.cjs`)
    copyFileSync(turboFilePath, `${APPS_PATH}/${name}/turbo.json`)
    copyFiles.succeed()
  } catch {
    copyFiles.fail()
    cleanup(name, PROJECT_TYPE.APP)
  }
}
