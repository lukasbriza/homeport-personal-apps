/* eslint-disable no-console */
import readlineSync from 'readline-sync'

import { CROSSROAD_OPTIONS } from '../constants.js'

export const crossroad = () => {
  const option = readlineSync.keyInSelect(CROSSROAD_OPTIONS, 'Where to start?', {
    defaultInput: '0',
    cancel: 'Cancel',
  })

  console.clear()

  // Cancel option
  if (option === -1) {
    return {
      stop: true,
      option,
    }
  }

  return {
    stop: false,
    option,
  }
}
