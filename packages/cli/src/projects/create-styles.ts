import { copyFileSync, existsSync } from 'node:fs'

import ora from 'ora'

import {
  eslintrcPath,
  indexPath,
  lintStagetPath,
  packagePath,
  prettierIgnorePath,
  stylesPath,
  tsConfigBuildPath,
  tsConfigPath,
  utilsPath,
} from '../paths/styles-paths.js'
import { PROJECT_TYPE } from '../types.js'
import { addConfigs, addLocalDependency, cleanup, createDirectory, installDeps, PACKAGES_PATH } from '../utils/index.js'

import { createTheme } from './create-theme.js'

export const createStyles = () => {
  const projectName = 'styles'
  const basePath = `${PACKAGES_PATH}/${projectName}`

  // SEARCH FOR THEME PACKAGE
  const hasThemeSpinner = ora('Searching for theme package...\n').start()
  let hasTheme = false
  try {
    hasTheme = existsSync(`${PACKAGES_PATH}/theme`)

    if (hasTheme) {
      hasThemeSpinner.succeed()
    } else {
      hasThemeSpinner.fail()
    }
  } catch {
    hasThemeSpinner.fail()
    return
  }

  // CREATE THEME
  if (!hasTheme) {
    try {
      createTheme({})
    } catch {
      cleanup('theme', PROJECT_TYPE.PROJECT)
    }
  }

  // CREATE PACKAGE DIRECTORY
  const createDirectorySpinner = ora('Creating styles directory...\n').start()
  try {
    createDirectory(`${PACKAGES_PATH}/${projectName}`)
    createDirectorySpinner.succeed()
  } catch {
    createDirectorySpinner.fail()
    return
  }

  // COPY FILES
  const copyFilesSpinner = ora('Copy config files...\n').start()
  try {
    createDirectory(`${basePath}/src`)
    copyFileSync(indexPath, `${basePath}/src/index.ts`)
    copyFileSync(stylesPath, `${basePath}/src/styles.ts`)
    copyFileSync(utilsPath, `${basePath}/src/utils.ts`)

    copyFileSync(prettierIgnorePath, `${basePath}/.prettierignore`)
    copyFileSync(eslintrcPath, `${basePath}/.eslintrc.cjs`)
    copyFileSync(lintStagetPath, `${basePath}/lint-staged.config.js`)
    copyFileSync(packagePath, `${basePath}/package.json`)
    copyFileSync(tsConfigPath, `${basePath}/tsconfig.json`)
    copyFileSync(tsConfigBuildPath, `${basePath}/tsconfig.build.json`)
    copyFilesSpinner.succeed()
  } catch {
    copyFilesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // ADD THEME DEPENDENCY
  const addMonorepoDependencies = ora('Add monorepo dependencies...\n')
  try {
    addConfigs(projectName)
    addLocalDependency(projectName, '@lukasbriza/theme')
    addMonorepoDependencies.succeed()
  } catch {
    addMonorepoDependencies.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // INSTALL DEPENDENCIES
  const installDependencies = ora('Install dependencies...\n').start()
  try {
    installDeps()
    installDependencies.succeed()
  } catch {
    installDependencies.fail()
  }
}
