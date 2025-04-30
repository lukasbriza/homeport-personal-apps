/* eslint-disable import/extensions */
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { isGitRepository } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.chdir(path.resolve(dirname, '../'))

const prepare = () => {
  if (isGitRepository()) {
    try {
      execSync('pnpm run prepare:husky')
      console.log('Husky successfully prepared.')
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to prepare Husky:', error.message)
      } else {
        console.error('Failed to prepare Husky:', error)
      }
      throw new Error('Failed to prepare Husky.')
    }
  } else {
    console.log('Not a git repository. Skipping Husky setup.')
  }
}

prepare()
