import { execSync } from 'node:child_process'
import { copyFileSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'

import ora from 'ora'

import {
  eslintIgnorePath,
  eslintrcPath,
  gitignorePath,
  lintStagedPath,
  mainFileConfigPath,
  packagePath,
  prettierignorePath,
  tsConfigBuildPath,
  tsConfigPath,
  turboFilePath,
  vitestConfigPath,
} from '../paths/nestjs-paths.js'
import { PROJECT_TYPE } from '../types.js'
import { APPS_PATH, createDirectory, cleanup, installDeps } from '../utils/index.js'

export const createNestJs = (projectName: string) => {
  // CREATE NEST JS PROJECT WITH CLI
  const createNestProjectSpinner = ora('Creating NestJs project...\n').start()
  try {
    execSync(`pnpm nest new ./apps/${projectName} --package-manager pnpm --language ts`, { cwd: APPS_PATH })
    createNestProjectSpinner.succeed()
  } catch {
    createNestProjectSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  // CLEAR NESTJS FILES
  const clearFilesSpinner = ora('Clear NestJs files...\n').start()
  try {
    rmSync(`${APPS_PATH}/${projectName}/.git`, { recursive: true, force: true })
    unlinkSync(`${APPS_PATH}/${projectName}/tsconfig.build.json`)
    unlinkSync(`${APPS_PATH}/${projectName}/tsconfig.json`)
    unlinkSync(`${APPS_PATH}/${projectName}/.prettierrc`)
    unlinkSync(`${APPS_PATH}/${projectName}/package.json`)
    unlinkSync(`${APPS_PATH}/${projectName}/.gitignore`)
    unlinkSync(`${APPS_PATH}/${projectName}/.eslintrc.js`)
    unlinkSync(`${APPS_PATH}/${projectName}/README.md`)
    unlinkSync(`${APPS_PATH}/${projectName}/src/app.controller.spec.ts`)
    rmSync(`${APPS_PATH}/${projectName}/test`, { recursive: true, force: true })
    clearFilesSpinner.succeed()
  } catch {
    clearFilesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  // COPY NEW FILES
  const copyNewNestFilesSpinner = ora('Copy new NestJs files...\n').start()
  try {
    createDirectory(`${APPS_PATH}/${projectName}/test`)
    copyFileSync(eslintIgnorePath, `${APPS_PATH}/${projectName}/.eslintignore`)
    copyFileSync(eslintrcPath, `${APPS_PATH}/${projectName}/.eslintrc.cjs`)
    copyFileSync(gitignorePath, `${APPS_PATH}/${projectName}/.gitignore`)
    copyFileSync(prettierignorePath, `${APPS_PATH}/${projectName}/.prettierignore`)
    copyFileSync(lintStagedPath, `${APPS_PATH}/${projectName}/lint-staged.config.mjs`)
    copyFileSync(packagePath, `${APPS_PATH}/${projectName}/package.json`)
    copyFileSync(tsConfigPath, `${APPS_PATH}/${projectName}/tsconfig.json`)
    copyFileSync(tsConfigBuildPath, `${APPS_PATH}/${projectName}/tsconfig.build.json`)
    copyFileSync(vitestConfigPath, `${APPS_PATH}/${projectName}/vitest.config.mjs`)
    copyFileSync(mainFileConfigPath, `${APPS_PATH}/${projectName}/src/main.ts`)
    copyFileSync(turboFilePath, `${APPS_PATH}/${projectName}/turbo.json`)

    const file = readFileSync(`${APPS_PATH}/${projectName}/package.json`)
    const newValue = String(file).replace('@lukasbriza/nestjs', `@lukasbriza/${projectName}`)
    writeFileSync(`${APPS_PATH}/${projectName}/package.json`, newValue)

    copyNewNestFilesSpinner.succeed()
  } catch {
    copyNewNestFilesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  // INSTALL DEPENDENCIES
  const installDependenciesSpinner = ora('Install dependencies...\n').start()
  try {
    installDeps()
    installDependenciesSpinner.succeed()
  } catch {
    installDependenciesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  // LINTING
  const lintSpinner = ora('Linting NestJs project...').start()
  try {
    execSync('pnpm run lint --fix', { cwd: `${APPS_PATH}/${projectName}` })
    lintSpinner.succeed()
  } catch (error) {
    lintSpinner.fail()
    // eslint-disable-next-line no-console
    console.log(error)
    cleanup(projectName, PROJECT_TYPE.APP)
  }
}
