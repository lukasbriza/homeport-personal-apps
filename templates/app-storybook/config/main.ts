import { createRequire } from 'node:module'
import path from 'node:path'

import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

// Resolve an addon/framework package to an absolute path (pnpm-safe).
const getAbsolutePath = (value: string): string => path.dirname(require.resolve(path.join(value, 'package.json')))

// ADD SOURCES FOR STORIES e.g. packages/components
const packages = ['packages/components', 'packages/theme', 'packages/icons']

const titlePrefix = (workspace: string) => {
  const [, name] = workspace.split('/')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const config: StorybookConfig = {
  stories: packages.map((workspace) => ({
    directory: `../../../${workspace}/stories`,
    files: '**/*.@(mdx|stories.ts|stories.tsx)',
    titlePrefix: titlePrefix(workspace),
  })),
  addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: { strictMode: true },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
}

export default config
