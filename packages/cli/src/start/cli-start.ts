/* eslint-disable no-console */
import chalk from 'chalk'

import { GITHUB_URL } from '../constants.js'

export const cliStart = async () => {
  console.clear()

  const border = chalk.greenBright('='.repeat(50))
  const title = chalk.bold.greenBright('🚀 Welcome to Projects CLI')
  const subtitle = chalk.gray('Standardized way to add new projects to the Turbo monorepo.')

  console.log(`\n${border}`)
  console.log(`\n${title}\n${chalk.dim(`by ${GITHUB_URL}`)}\n\n${subtitle}\n`)
  console.log(`${border}\n`)

  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
}
