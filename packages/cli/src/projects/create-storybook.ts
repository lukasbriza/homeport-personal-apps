import { copyFileSync, existsSync } from 'node:fs'

import ora from 'ora'

import {
  babelConfigPath,
  eslintIgnorePath,
  eslintrcPath,
  gitIgnorePath,
  lintStagetConfigPath,
  packagePath,
  prettierIgnorePath,
  servePath,
  storybookMainPath,
  storybookManangerPath,
  storybookPreviewPath,
  storybookPreviewThemePath,
  storybookThemePath,
  tsConfigPath,
  tscWithThemePath,
  viteConfigPath,
} from '../paths/storybook-paths.js'
import { addTheme } from '../questions/index.js'
import { PROJECT_TYPE } from '../types.js'
import {
  addConfigs,
  APPS_PATH,
  cleanup,
  createDirectory,
  installDeps,
  PACKAGES_PATH,
  STORYBOOK_PATH,
} from '../utils/index.js'

export const createStorybook = () => {
  const projectName = 'storybook'
  const storybookPath = `${APPS_PATH}/${projectName}`

  // CREATE DIRECTORY
  const makeDirectorySpinner = ora('Create storybook directory...\n').start()
  try {
    createDirectory(storybookPath)
    makeDirectorySpinner.succeed()
  } catch {
    makeDirectorySpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  const searchingForThemeSpinner = ora('Searching for theme package...\n').start()
  const hasTheme = existsSync(`${PACKAGES_PATH}/theme`)
  let wantTheme = false

  // ADD THEME SUPPORT
  try {
    if (!hasTheme) {
      wantTheme = addTheme().includes('y')
    }
    searchingForThemeSpinner.succeed()
  } catch {
    searchingForThemeSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    cleanup('theme', PROJECT_TYPE.PROJECT)
    return
  }

  // COPY CONFIG FILES
  const copyStorybookFilesSpinner = ora('Copy storybook files...\n').start()
  try {
    createDirectory(`${storybookPath}/config`)
    copyFileSync(storybookMainPath, `${storybookPath}/config/main.ts`)
    copyFileSync(storybookManangerPath, `${storybookPath}/config/manager.ts`)
    copyFileSync(wantTheme ? storybookPreviewThemePath : storybookPreviewPath, `${storybookPath}/config/preview.tsx`)
    copyFileSync(storybookThemePath, `${storybookPath}/config/theme.ts`)

    copyFileSync(packagePath, `${STORYBOOK_PATH}/package.json`)
    copyFileSync(eslintIgnorePath, `${STORYBOOK_PATH}/.eslintignore`)
    copyFileSync(eslintrcPath, `${STORYBOOK_PATH}/.eslintrc.cjs`)
    copyFileSync(gitIgnorePath, `${STORYBOOK_PATH}/.gitignore`)
    copyFileSync(prettierIgnorePath, `${STORYBOOK_PATH}/.prettierignore`)
    copyFileSync(babelConfigPath, `${STORYBOOK_PATH}/babel.config.js`)
    copyFileSync(lintStagetConfigPath, `${STORYBOOK_PATH}/lint-staged.config.js`)
    copyFileSync(servePath, `${STORYBOOK_PATH}/serve.json`)
    copyFileSync(wantTheme ? tscWithThemePath : tsConfigPath, `${STORYBOOK_PATH}/tsconfig.json`)
    copyFileSync(viteConfigPath, `${STORYBOOK_PATH}/vite.config.ts`)
    copyStorybookFilesSpinner.succeed()
  } catch {
    copyStorybookFilesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.APP)
    return
  }

  // ADD WORKSPACE REFERENCE
  const addConfigsSpinner = ora('Add configs...\n').start()
  try {
    addConfigs('storybook')
    addConfigsSpinner.succeed()
  } catch {
    cleanup('storybook', PROJECT_TYPE.APP)
    addConfigsSpinner.fail()
    return
  }

  // INSTALL DEPENDENCIES
  const installDepsSpinner = ora('Installing dependencies...\n').start()
  try {
    installDeps()
    installDepsSpinner.succeed()
  } catch {
    cleanup('storybook', PROJECT_TYPE.APP)
    installDepsSpinner.fail()
  }
  return wantTheme
}
