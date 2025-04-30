/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const eslintIgnorePath = path.normalize(`${__dirname}/../../files/nestjs/.eslintignore`)
export const eslintrcPath = path.normalize(`${__dirname}/../../files/nestjs/esl`)
export const gitignorePath = path.normalize(`${__dirname}/../../files/nestjs/.gitignore`)
export const prettierignorePath = path.normalize(`${__dirname}/../../files/nestjs/.prettierignore`)
export const lintStagedPath = path.normalize(`${__dirname}/../../files/nestjs/lint-staged.config`)
export const packagePath = path.normalize(`${__dirname}/../../files/nestjs/package`)
export const tsConfigPath = path.normalize(`${__dirname}/../../files/nestjs/tsc`)
export const tsConfigBuildPath = path.normalize(`${__dirname}/../../files/nestjs/tsc.build`)
export const vitestConfigPath = path.normalize(`${__dirname}/../../files/nestjs/vitest.config`)
export const mainFileConfigPath = path.normalize(`${__dirname}/../../files/nestjs/main.txt`)
export const turboFilePath = path.normalize(`${__dirname}/../../files/nestjs/turbo`)
