import { copyFileSync, existsSync } from 'node:fs'

import ora from 'ora'

import {
  eslintsrcPath,
  exampleFilePath,
  exampleIndexPath,
  exampleMdxFilePath,
  exampleStoryFilePath,
  lintStagetPath,
  packagePath,
  prettierignorePath,
  sourceIndexPath,
  tsConfigBuildPath,
  tsConfigPath,
} from '../paths/components-paths.js'
import { PROJECT_TYPE } from '../types.js'
import { cleanup, createDirectory, installDeps, PACKAGES_PATH } from '../utils/index.js'

import { createStyles } from './create-styles.js'
import { createTheme } from './create-theme.js'

export const createComponents = () => {
  const projectName = 'components'
  const componentsPath = `${PACKAGES_PATH}/${projectName}`

  // SEARCH FOR THEME
  const hasThemePackageSpinner = ora('Search for theme directory...\n').start()
  const hasTheme = existsSync(`${PACKAGES_PATH}/theme`)
  try {
    if (hasTheme) {
      hasThemePackageSpinner.succeed('Theme package already exists...\n')
    } else {
      hasThemePackageSpinner.succeed()
      createTheme({})
    }
  } catch {
    hasThemePackageSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // SERACH FOR STYLES
  const hasStylesPackageSpinner = ora('Search for styles directory...\n').start()
  const hasStyles = existsSync(`${PACKAGES_PATH}/styles`)
  try {
    if (hasStyles) {
      hasStylesPackageSpinner.succeed('Styles package already exists...\n')
    } else {
      hasStylesPackageSpinner.succeed()
      createStyles()
    }
  } catch {
    hasStylesPackageSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // CREATE PROJECT DIRECTORY
  const makeDirectorySpinner = ora('Create components directory...\n').start()
  try {
    createDirectory(componentsPath)
    makeDirectorySpinner.succeed()
  } catch {
    makeDirectorySpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // CREATE SRC DIRECTORY
  const makeSourceSpinner = ora('Create source directory...\n').start()
  try {
    createDirectory(`${componentsPath}/src`)
    makeSourceSpinner.succeed()
  } catch {
    makeSourceSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // CREATE TEST DIRECTORY
  const makeTestSpinner = ora('Create test directory...\n').start()
  try {
    createDirectory(`${componentsPath}/test`)
    makeTestSpinner.succeed()
  } catch {
    makeTestSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // CREATE STORIES DIRECTORY
  const makeStoriesSpinner = ora('Create stories directory...\n').start()
  try {
    createDirectory(`${componentsPath}/stories`)
    createDirectory(`${componentsPath}/stories/example`)
    makeStoriesSpinner.succeed()
  } catch {
    makeStoriesSpinner.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // CREATE EXAMPLE DIRECTORY
  const makeExampleDirectory = ora('Create example directory...\n').start()
  try {
    createDirectory(`${componentsPath}/src/example`)
    makeExampleDirectory.succeed()
  } catch {
    makeExampleDirectory.fail()
    cleanup(projectName, PROJECT_TYPE.PROJECT)
    return
  }

  // COPY FILES
  const copyFiles = ora('Create project initial files...\n').start()
  try {
    copyFileSync(prettierignorePath, `${componentsPath}/.prettierignore`)
    copyFileSync(eslintsrcPath, `${componentsPath}/.eslintrc.cjs`)
    copyFileSync(lintStagetPath, `${componentsPath}/lint-staged.config.js`)
    copyFileSync(tsConfigPath, `${componentsPath}/tsconfig.json`)
    copyFileSync(tsConfigBuildPath, `${componentsPath}/tsconfig.build.json`)
    copyFileSync(packagePath, `${componentsPath}/package.json`)

    copyFileSync(sourceIndexPath, `${componentsPath}/src/index.ts`)
    copyFileSync(exampleIndexPath, `${componentsPath}/src/example/index.ts`)
    copyFileSync(exampleFilePath, `${componentsPath}/src/example/example.tsx`)

    copyFileSync(exampleStoryFilePath, `${componentsPath}/stories/example/example.stories.tsx`)
    copyFileSync(exampleMdxFilePath, `${componentsPath}/stories/example/example.mdx`)
    copyFiles.succeed()
  } catch {
    copyFiles.fail()
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
    cleanup(projectName, PROJECT_TYPE.PROJECT)
  }
}
