/* eslint-disable no-console */
import chalk from 'chalk'

export const cliEnd = () => {
  const border = chalk.greenBright('='.repeat(50))
  const message = chalk.bold.greenBright('🎉 Done!')
  const goodbye = chalk.gray('Thanks for using CLI package. Happy coding!')

  console.log(border)
  console.log(`\n${message}`)
  console.log(`${goodbye}\n`)
  console.log(`${border}\n`)
}
