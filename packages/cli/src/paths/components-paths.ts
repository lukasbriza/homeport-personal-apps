/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const prettierignorePath = path.normalize(`${__dirname}/../../files/components/.prettierignore`)
export const eslintsrcPath = path.normalize(`${__dirname}/../../files/components/esl`)
export const lintStagetPath = path.normalize(`${__dirname}/../../files/components/lint-staged.config`)
export const tsConfigPath = path.normalize(`${__dirname}/../../files/components/tsc`)
export const tsConfigBuildPath = path.normalize(`${__dirname}/../../files/components/tsc.build`)

export const sourceIndexPath = path.normalize(`${__dirname}/../../files/components/src/index.txt`)
export const exampleIndexPath = path.normalize(`${__dirname}/../../files/components/src/example/index.txt`)
export const exampleFilePath = path.normalize(`${__dirname}/../../files/components/src/example/example.txt`)

export const exampleStoryFilePath = path.normalize(`${__dirname}/../../files/components/stories/example.stories.txt`)
export const exampleMdxFilePath = path.normalize(`${__dirname}/../../files/components/stories/example.txt`)

export const packagePath = path.normalize(`${__dirname}/../../files/components/package`)
