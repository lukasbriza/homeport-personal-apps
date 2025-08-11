import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import ora from 'ora'

import { APPS_PATH, PACKAGES_PATH } from '../constants.js'
import { PROJECT_TYPE } from '../types.js'
import { addConfigs, addLocalDependency, cleanup, installDeps } from '../utils/index.js'

import { createComponents } from './create-components.js'
import { createStyles } from './create-styles.js'
import { createTheme } from './create-theme.js'

const cleanupSetup = (nextProjectName: string, hasTheme?: boolean, hasComponents?: boolean, hasStyles?: boolean) => {
  cleanup(nextProjectName, PROJECT_TYPE.APP)
  if (!hasTheme) {
    cleanup('theme', PROJECT_TYPE.PROJECT)
  }
  if (!hasComponents) {
    cleanup('components', PROJECT_TYPE.PROJECT)
  }
  if (!hasStyles) {
    cleanup('styles', PROJECT_TYPE.PROJECT)
  }
}

export const postCreateNextProject = (nextProjectName: string) => {
  // HAS THEME PACKAGE
  const hasThemeSpinner = ora().start('Searching for theme package...\n')
  const hasTheme = existsSync(`${PACKAGES_PATH}/theme`)
  try {
    if (hasTheme) {
      hasThemeSpinner.succeed('Theme package already exists...\n')
    } else {
      hasThemeSpinner.succeed()
      createTheme({})
    }
  } catch {
    hasThemeSpinner.fail()
    cleanupSetup(nextProjectName, hasTheme)
    return
  }

  // HAS STYLES PACKAGE
  const hasStylesPackageSpinner = ora().start('Searching for styles package...\n')
  const hasStyles = existsSync(`${PACKAGES_PATH}/styles`)
  try {
    if (hasStyles) {
      hasStylesPackageSpinner.succeed('Styles package already exist...\n')
    } else {
      hasStylesPackageSpinner.succeed()
      createStyles()
    }
  } catch {
    hasStylesPackageSpinner.fail()
    cleanupSetup(nextProjectName, hasTheme, undefined, hasStyles)
    return
  }

  // HAS COMPONENTS
  const hasComponentsPackageSpinner = ora('Search for components package...\n').start()
  const hasComponents = existsSync(`${PACKAGES_PATH}/components`)
  try {
    if (hasComponents) {
      hasComponentsPackageSpinner.succeed('Components package already exist...\n')
    } else {
      hasComponentsPackageSpinner.succeed()
      createComponents()
    }
  } catch {
    hasComponentsPackageSpinner.fail()
    cleanupSetup(nextProjectName, hasTheme, hasComponents, hasStyles)
    return
  }

  // ADD LOCAL DEPENDENCIES TO NEXTJS PROJECT
  const addLocalDependencies = ora().start('Add local dependencies to NextJs project...\n')
  try {
    const file = readFileSync(`${APPS_PATH}/${nextProjectName}/package.json`)
    const newValue = String(file).replace('@lukasbriza/next-template', `@lukasbriza/${nextProjectName}`)
    writeFileSync(`${APPS_PATH}/${nextProjectName}/package.json`, newValue)

    addLocalDependency(`@lukasbriza/${nextProjectName}`, '@lukasbriza/theme')
    addLocalDependency(`@lukasbriza/${nextProjectName}`, '@lukasbriza/components')
    addLocalDependency(`@lukasbriza/${nextProjectName}`, '@lukasbriza/styles')
    addConfigs(nextProjectName)
    addLocalDependencies.succeed()
  } catch {
    addLocalDependencies.fail()
    cleanupSetup(nextProjectName, hasTheme, hasComponents, hasStyles)
    return
  }

  // INSTALL DEPENDENCIES
  const installDependencies = ora('Install dependencies...\n').start()
  try {
    installDeps()
    installDependencies.succeed()
  } catch {
    installDependencies.fail()
    cleanupSetup(nextProjectName, hasTheme, hasComponents, hasStyles)
    return
  }

  // LINT FIX NEXTJS PROJECT
  const lintFixNextProjectSpinner = ora().start('Linting created NextJs project...\n')
  try {
    execSync(`pnpm turbo run lint:fix --filter @lukasbriza/${nextProjectName}`, {
      cwd: `${APPS_PATH}/${nextProjectName}`,
    })
    lintFixNextProjectSpinner.succeed()
  } catch {
    lintFixNextProjectSpinner.fail()
    cleanupSetup(nextProjectName, hasTheme, hasComponents, hasStyles)
    return
  }

  // BUILD ALL MONOREPO PROJECTS
  const buildMonorepoSpinner = ora().start('Building all monorepo projects...\n')
  try {
    execSync('pnpm turbo build', { cwd: path.normalize(`${APPS_PATH}/../`) })
    buildMonorepoSpinner.succeed()
  } catch {
    buildMonorepoSpinner.fail()
    cleanupSetup(nextProjectName, hasTheme, hasComponents, hasStyles)
  }
}
