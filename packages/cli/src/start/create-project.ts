/* eslint-disable no-console */
import chalk from 'chalk'
import readlineSync from 'readline-sync'

import { OPTIONS } from '../constants.js'
import { createMatrix } from '../projects/index.js'
import { chooseName } from '../questions/index.js'
import { allowChooseName, controlDirectorySetup } from '../utils/index.js'

export const createProject = () => {
  console.log(chalk.green('\nCreate project:\n'))
  const projectOptions = OPTIONS.map((option) => option[0])
  const option = readlineSync.keyInSelect(projectOptions, 'What type of project do you want to create?', {
    defaultInput: '0',
    cancel: 'Cancel',
  })

  if (option === -1) {
    console.clear()
    return {
      stop: true,
      option,
    }
  }

  const selectedOption = OPTIONS[option]
  const shouldChooseName = allowChooseName(selectedOption[0])
  const name = shouldChooseName ? chooseName() : ''
  controlDirectorySetup(selectedOption)
  createMatrix(selectedOption[0], name)
  console.clear()
  return {
    stop: true,
    option,
  }
}
