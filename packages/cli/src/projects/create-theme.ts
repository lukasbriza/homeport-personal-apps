import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, rmSync, unlinkSync } from 'node:fs'

import ora from 'ora'

import { PACKAGES_PATH } from '../constants.js'
import { tsconfigPath, eslintPath, packagePath } from '../paths/theme-paths.js'
import { PROJECT_TYPE } from '../types.js'
import { addLocalDependency, cleanup, createDirectory, downloadTheme, installDeps } from '../utils/index.js'

export const createTheme = ({ connectTheme }: { connectTheme?: boolean }) => {
  const projectName = 'theme'

  // SEARCH FOR EXISTING PROJECT
  const searchForThemeFolderSpinner = ora().start('Searching for theme folder...\n')
  try {
    const exist = existsSync(`${PACKAGES_PATH}/${projectName}`)
    if (exist === true) {
      searchForThemeFolderSpinner.fail('Project already exists...\n')
      return
    }
    searchForThemeFolderSpinner.succeed()
  } catch {
    searchForThemeFolderSpinner.fail()
    return
  }

  // CREATING PROJECT FOLDER
  const createThemeFolderSpinner = ora().start('Creating theme directory...\n')
  try {
    createDirectory(`${PACKAGES_PATH}/${projectName}`)
    createThemeFolderSpinner.succeed()
  } catch {
    createThemeFolderSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // DOWNLOAD THEME FROM GIT
  const downloadSpinner = ora().start('Downloading MUI theme tamplate...\n')
  try {
    downloadTheme(projectName)
    downloadSpinner.succeed()
  } catch {
    downloadSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // COPY CONFIGURATION FILE
  const copyFilesSpinner = ora().start('Copy configuration files...\n')
  try {
    unlinkSync(`${PACKAGES_PATH}/${projectName}/.eslintrc.cjs`)
    unlinkSync(`${PACKAGES_PATH}/${projectName}/tsconfig.json`)
    unlinkSync(`${PACKAGES_PATH}/${projectName}/pnpm-lock.yaml`)
    rmSync(`${PACKAGES_PATH}/${projectName}/.git`, { recursive: true, force: true })
    copyFileSync(eslintPath, `${PACKAGES_PATH}/${projectName}/.eslintrc.cjs`)
    copyFileSync(tsconfigPath, `${PACKAGES_PATH}/${projectName}/tsconfig.json`)
    copyFileSync(packagePath, `${PACKAGES_PATH}/${projectName}/package.json`)
    copyFilesSpinner.succeed()
  } catch {
    copyFilesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // INSTALL DEPENDENCIES
  const addConfigSpinner = ora().start('Installing dependencies...\n')
  try {
    if (connectTheme === true) {
      addLocalDependency('storybook', '@lukasbriza/theme')
    }
    installDeps()
    addConfigSpinner.succeed()
  } catch {
    addConfigSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // RUN LINTER
  const runLinterSpinner = ora().start('Running linter...\n')
  try {
    execSync(`pnpm run lint:fix`, {
      cwd: `${PACKAGES_PATH}/${projectName}`,
    })
    runLinterSpinner.succeed()
  } catch {
    runLinterSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // BUILD THEME
  const buildThemeSpinner = ora().start('Building theme...\n')
  try {
    execSync('tsc --build tsconfig.build.json', { cwd: `${PACKAGES_PATH}/${projectName}` })
    buildThemeSpinner.succeed()
  } catch (error) {
    buildThemeSpinner.fail()
    // eslint-disable-next-line no-console
    console.log(error)
    cleanup(projectName, PROJECT_TYPE.PROJECT)
  }
}
