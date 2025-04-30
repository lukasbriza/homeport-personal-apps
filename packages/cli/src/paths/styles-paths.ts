/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const indexPath = path.normalize(`${__dirname}/../../files/styles/src/index.txt`)
export const stylesPath = path.normalize(`${__dirname}/../../files/styles/src/styles.txt`)
export const utilsPath = path.normalize(`${__dirname}/../../files/styles/src/utils.txt`)

export const prettierIgnorePath = path.normalize(`${__dirname}/../../files/styles/.prettierignore`)
export const eslintrcPath = path.normalize(`${__dirname}/../../files/styles/esl`)
export const lintStagetPath = path.normalize(`${__dirname}/../../files/styles/lint-staged.config`)
export const packagePath = path.normalize(`${__dirname}/../../files/styles/package`)
export const tsConfigPath = path.normalize(`${__dirname}/../../files/styles/tsc`)
export const tsConfigBuildPath = path.normalize(`${__dirname}/../../files/styles/tsc.build`)
