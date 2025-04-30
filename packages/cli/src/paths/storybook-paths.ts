/* eslint-disable no-underscore-dangle */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const eslintIgnorePath = path.normalize(`${__dirname}/../../files/storybook/.eslintignore`)
export const eslintrcPath = path.normalize(`${__dirname}/../../files/storybook/esl`)
export const gitIgnorePath = path.normalize(`${__dirname}/../../files/storybook/.gitignore`)
export const prettierIgnorePath = path.normalize(`${__dirname}/../../files/storybook/.prettierignore`)
export const babelConfigPath = path.normalize(`${__dirname}/../../files/storybook/babel.config.js`)
export const lintStagetConfigPath = path.normalize(`${__dirname}/../../files/storybook/lint-staged.config`)
export const packagePath = path.normalize(`${__dirname}/../../files/storybook/package`)
export const servePath = path.normalize(`${__dirname}/../../files/storybook/serve.json`)
export const tsConfigPath = path.normalize(`${__dirname}/../../files/storybook/tsc`)
export const viteConfigPath = path.normalize(`${__dirname}/../../files/storybook/vite.config.txt`)

export const storybookMainPath = path.normalize(`${__dirname}/../../files/storybook/config/main.txt`)
export const storybookManangerPath = path.normalize(`${__dirname}/../../files/storybook/config/manager.txt`)
export const storybookPreviewPath = path.normalize(`${__dirname}/../../files/storybook/config/preview.txt`)
export const storybookPreviewThemePath = path.normalize(
  `${__dirname}/../../files/storybook/config/with-theme/preview.txt`,
)
export const storybookThemePath = path.normalize(`${__dirname}/../../files/storybook/config/theme.txt`)

export const tscWithThemePath = path.normalize(`${__dirname}/../../files/storybook/with-theme/tsc`)
