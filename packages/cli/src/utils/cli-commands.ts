import { exec, execSync } from 'node:child_process'
import { cpSync, rmSync, readdirSync } from 'node:fs'

import terminate from 'terminate'

import { APPS_PATH, GITHUB_URL, PACKAGES_PATH, STORYBOOK_PATH, TEMP_PATH } from '../constants.js'

export const addLocalDependency = (filter: string, dependency: string) =>
  execSync(`pnpm add ${dependency} --filter ${filter} --workspace`)

export const addConfigs = (projectName: string) => {
  addLocalDependency(projectName, '@lukasbriza/ts-config')
  addLocalDependency(projectName, '@lukasbriza/eslint-config')
}

// pnpm add @lukasbriza/ts-config --filter components --workspace

export const initStorybook = (onEndCallback: () => void) => {
  const command = `pnpm dlx storybook@latest init`
  const process = exec(command, { cwd: STORYBOOK_PATH })

  process.stdout?.on('data', (data) => {
    if (String(data).includes('Choose a project template')) {
      process.stdin?.write('\n')
    }
    if (String(data).includes('Installing dependencies') && process.pid) {
      terminate(process.pid)
    }
  })
  process.stdout?.on('close', onEndCallback)
}

export const installDeps = () => execSync(`pnpm i`)

export const downloadNextTemplate = (projectName: string) => {
  execSync(`git clone ${GITHUB_URL}/next-template`, { cwd: TEMP_PATH })
  cpSync(`${TEMP_PATH}/next-template`, `${APPS_PATH}/${projectName}`, { recursive: true, force: true })
  rmSync(`${TEMP_PATH}/next-template`, { recursive: true, force: true })
}
// `pnpm turbo gen workspace -n ${projectName} -t app -d apps/${projectName} -c https://github.com/lukasbriza/next-template/tree/master `

export const downloadTheme = (projectName: string) => {
  execSync(`git clone ${GITHUB_URL}/mui-theme-template`, { cwd: TEMP_PATH })
  cpSync(`${TEMP_PATH}/mui-theme-template`, `${PACKAGES_PATH}/${projectName}`, { recursive: true, force: true })
  rmSync(`${TEMP_PATH}/mui-theme-template`, { recursive: true, force: true })
}

// `pnpm turbo gen workspace -n ${projectName} -t package -d packages/${projectName} -c https://github.com/lukasbriza/mui-theme-template/tree/master`

export const downloadMonorepoTemplate = () => {
  execSync(`git clone ${GITHUB_URL}/monorepo-template`, { cwd: TEMP_PATH })
}

export const cleanTemporaryFolder = () => {
  const items = readdirSync(TEMP_PATH)

  for (const item of items) {
    rmSync(`${TEMP_PATH}/${item}`, { recursive: true, force: true })
  }
}
