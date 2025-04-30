import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, rmSync, unlinkSync } from 'node:fs'

import ora from 'ora'

import { tsconfigPath, eslintPath, packagePath } from '../paths/theme-paths.js'
import { PROJECT_TYPE } from '../types.js'
import {
  addLocalDependency,
  cleanup,
  createDirectory,
  downloadTheme,
  installDeps,
  PACKAGES_PATH,
} from '../utils/index.js'

export const createTheme = ({ connectTheme }: { connectTheme?: boolean }) => {
  const projectName = 'theme'

  // SEARCH FOR EXISTING PROJECT
  const searchForThemeFolderSpinner = ora('Searching for theme folder...\n').start()
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
  const createThemeFolderSpinner = ora('Creating theme directory...\n').start()
  try {
    createDirectory(`${PACKAGES_PATH}/${projectName}`)
    createThemeFolderSpinner.succeed()
  } catch {
    createThemeFolderSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // DOWNLOAD THEME FROM GIT
  const downloadSpinner = ora('Downloading MUI theme tamplate...\n').start()
  try {
    downloadTheme(projectName)
    downloadSpinner.succeed()
  } catch {
    downloadSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // COPY CONFIGURATION FILE
  const copyFilesSpinner = ora('Copy configuration files...\n').start()
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
  const addConfigSpinner = ora('Installing dependencies...\n').start()
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
  const runLinterSpinner = ora('Running linter...\n').start()
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
  const buildThemeSpinner = ora('Building theme...\n').start()
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
