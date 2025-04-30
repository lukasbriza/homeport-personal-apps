import readlineSync from 'readline-sync'

import { createMatrix } from './projects/index.js'
import { chooseName, chooseOption } from './questions/index.js'
import type { Option } from './types.js'
import { allowChooseName, controlDirectorySetup, DEFAULT_OPTION_INDEX, OPTIONS } from './utils/index.js'

let selectedOption: Option

const option = readlineSync.question(chooseOption())

if (option.length === 0 || Number.isNaN(Number(option)) || Number(option) > OPTIONS.length || Number(option) <= 0) {
  const [array] = OPTIONS
  selectedOption = array
  // eslint-disable-next-line no-console
  console.log(`Choosed default option: ${array[DEFAULT_OPTION_INDEX]}`)
}

const optionIndex = Number(option) - 1

selectedOption = OPTIONS[optionIndex]

const name = allowChooseName(selectedOption[0]) ? chooseName() : ''
controlDirectorySetup(selectedOption)
createMatrix(selectedOption[0], name)
