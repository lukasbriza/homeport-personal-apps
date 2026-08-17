import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import type { PlopTypes } from '@turbo/gen'

// eslint-disable-next-line unicorn/better-regex
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Artifacts that must never be copied from an (installed) template into a new workspace.
const isCopyable = (entry: string): boolean => {
  const base = path.basename(entry)
  const skip = ['node_modules', '.next', '.turbo', '.eslintcache', 'dist', 'build']
  return !skip.includes(base) && !base.endsWith('.tsbuildinfo')
}

// --- Prisma 7 (optional, app-nest) ---------------------------------------------
// Runtime connection uses a driver adapter (@prisma/adapter-pg); Migrate reads the
// URL from prisma.config.ts. The schema no longer carries `url` (removed in v7).

const PRISMA_DEPENDENCIES = {
  '@prisma/adapter-pg': '7.8.0',
  '@prisma/client': '7.8.0',
  prisma: '7.8.0',
}

const PRISMA_SCRIPTS = {
  postinstall: 'prisma generate',
  'prisma:generate': 'prisma generate',
  'prisma:migrate': 'prisma migrate dev',
  'prisma:deploy': 'prisma migrate deploy',
  'prisma:studio': 'prisma studio',
}

const PRISMA_SCHEMA = `generator client {
  provider     = "prisma-client"
  output       = "../src/modules/prisma/generated"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

model Model {
  id String @id @default(uuid())
}
`

const PRISMA_CONFIG = `import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    url: process.env.DATABASE_URL ?? '',
  },
})
`

const PRISMA_SERVICE = `import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
`

const PRISMA_MODULE = `import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`

const PRISMA_ENV_EXAMPLE = 'DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"\n'

// --- Storybook theme variant (optional, app-storybook) -------------------------

const STORYBOOK_THEME_PREVIEW = `import { ThemeProvider, useTheme, webTheme, type WebTheme } from '@lukasbriza/theme'
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from '@storybook/addon-viewport'
import type { Decorator, Preview, ReactRenderer } from '@storybook/react'
import type { PartialStoryFn, StoryContext } from '@storybook/types'
import { useEffect, type FunctionComponent } from 'react'

declare global {
  interface Window {
    theme: WebTheme
  }
}

const RootStory: FunctionComponent<{ context: StoryContext; story: PartialStoryFn<ReactRenderer> }> = ({
  context,
  story: Story,
}) => {
  const theme = useTheme()

  useEffect(() => {
    window.parent.window.theme = theme
  }, [theme])

  return <Story {...context} />
}

const RootDecorator: Decorator = (story, context) => (
  <ThemeProvider>
    <RootStory context={context} story={story} />
  </ThemeProvider>
)

const preview: Preview = {
  decorators: [RootDecorator],
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: webTheme.palette.surface.inverse },
        { name: 'dark', value: webTheme.palette.surface.background },
      ],
    },
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        ...MINIMAL_VIEWPORTS,
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['*', ['Docs', 'Overview', '*']],
      },
    },
  },
}

export default preview
`

const STORYBOOK_THEME_TSCONFIG = `{
  "extends": "@lukasbriza/ts-config/app",
  "include": ["**/*.js", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "storybook-static"],
  "references": [{ "path": "../../packages/theme/tsconfig.build.json" }]
}
`

/**
 * Turborepo generators.
 *
 * Scaffolding copies a canonical workspace from `templates/<type>` into `apps/` or
 * `packages/`, then post-processes it (rename, optional variants) and optionally runs
 * install + lint:fix. Templates are real, installed workspaces (single source of
 * truth); generators copy verbatim minus build artifacts.
 */
export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // `turbo gen` returns the generators directory (`turbo/generators`) here.
  const generatorsDir = plop.getPlopfilePath()
  const repoRoot = path.resolve(generatorsDir, '..', '..')
  const templatesDir = path.join(repoRoot, 'templates')

  const copyTemplate = (template: string, destinationRelative: string): string => {
    const source = path.join(templatesDir, template)
    const destination = path.join(repoRoot, destinationRelative)

    if (existsSync(destination)) {
      throw new Error(`${destinationRelative} already exists — choose another name or remove it first.`)
    }

    cpSync(source, destination, { recursive: true, filter: isCopyable })
    return destination
  }

  // Guard for packages that depend on other workspace packages existing first.
  const requirePackages = (names: string[]): void => {
    const missing = names.filter((name) => !existsSync(path.join(repoRoot, 'packages', name)))
    if (missing.length > 0) {
      throw new Error(
        `Missing required package(s): ${missing.join(', ')}. Scaffold them first (e.g. turbo gen package-theme).`,
      )
    }
  }

  const renamePackage = (destination: string, from: string, to: string): void => {
    const packageJsonPath = path.join(destination, 'package.json')
    writeFileSync(packageJsonPath, readFileSync(packageJsonPath, 'utf8').replace(from, to))
  }

  const addPrisma = (destination: string): void => {
    const packageJsonPath = path.join(destination, 'package.json')
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
    pkg.dependencies = { ...pkg.dependencies, ...PRISMA_DEPENDENCIES }
    pkg.scripts = { ...pkg.scripts, ...PRISMA_SCRIPTS }
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)

    const prismaDir = path.join(destination, 'prisma')
    mkdirSync(prismaDir, { recursive: true })
    writeFileSync(path.join(prismaDir, 'schema.prisma'), PRISMA_SCHEMA)
    writeFileSync(path.join(destination, 'prisma.config.ts'), PRISMA_CONFIG)
    writeFileSync(path.join(destination, '.env.example'), PRISMA_ENV_EXAMPLE)

    const moduleDir = path.join(destination, 'src', 'modules', 'prisma')
    mkdirSync(moduleDir, { recursive: true })
    writeFileSync(path.join(moduleDir, 'prisma.service.ts'), PRISMA_SERVICE)
    writeFileSync(path.join(moduleDir, 'prisma.module.ts'), PRISMA_MODULE)

    const appModulePath = path.join(destination, 'src', 'app.module.ts')
    const appModule = readFileSync(appModulePath, 'utf8')
      .replace(
        "import { AppService } from './app.service'\n",
        "import { AppService } from './app.service'\nimport { PrismaModule } from './modules/prisma/prisma.module'\n",
      )
      .replace('imports: [],', 'imports: [PrismaModule],')
    writeFileSync(appModulePath, appModule)
  }

  const addStorybookTheme = (destination: string): void => {
    writeFileSync(path.join(destination, 'config', 'preview.tsx'), STORYBOOK_THEME_PREVIEW)
    writeFileSync(path.join(destination, 'tsconfig.json'), STORYBOOK_THEME_TSCONFIG)
    const packageJsonPath = path.join(destination, 'package.json')
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { dependencies?: Record<string, string> }
    pkg.dependencies = { '@lukasbriza/theme': 'workspace:*', ...pkg.dependencies }
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  // Install + format the new workspace (mirrors the old CLI's post-create flow).
  // lint:fix runs through turbo so the shared eslint-config is built first.
  const finalize = (packageName: string, install: boolean): string => {
    if (!install) {
      return [
        'Skipped install. To finish:',
        '  pnpm install',
        `  pnpm turbo run lint:fix --filter ${packageName}`,
      ].join('\n')
    }
    execSync('pnpm install', { cwd: repoRoot, stdio: 'inherit' })
    try {
      execSync(`pnpm turbo run lint:fix --filter ${packageName}`, { cwd: repoRoot, stdio: 'inherit' })
    } catch {
      return `Installed dependencies. lint:fix reported issues — run "pnpm turbo run lint --filter ${packageName}".`
    }
    return `Installed dependencies and formatted ${packageName}.`
  }

  const kebabPrompt: PlopTypes.PromptQuestion = {
    type: 'input',
    name: 'name',
    message: 'Workspace name (kebab-case) — becomes the folder and @lukasbriza/<name>:',
    validate: (value: string) => KEBAB_CASE.test(value) || 'Use kebab-case: a-z, 0-9 and single dashes.',
  }

  const installPrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'install',
    message: 'Run pnpm install + lint:fix for the new workspace now?',
    default: true,
  }

  plop.setGenerator('app-next', {
    description: 'Scaffold a Next.js app from templates/app-next into apps/<name>',
    prompts: [kebabPrompt, installPrompt],
    actions: [
      (answers) => {
        const { name } = answers as { name: string }
        const destination = copyTemplate('app-next', path.join('apps', name))
        renamePackage(destination, '@lukasbriza/next-template', `@lukasbriza/${name}`)
        return `Created apps/${name} from templates/app-next`
      },
      (answers) => {
        const { name, install } = answers as { name: string; install: boolean }
        const message = finalize(`@lukasbriza/${name}`, install)
        return `${message}\nRemember: cp apps/${name}/.env.example apps/${name}/.env.local`
      },
    ],
  })

  plop.setGenerator('app-react', {
    description: 'Scaffold a React Router (framework, SSR) app from templates/app-react into apps/<name>',
    prompts: [kebabPrompt, installPrompt],
    actions: [
      (answers) => {
        const { name } = answers as { name: string }
        const destination = copyTemplate('app-react', path.join('apps', name))
        renamePackage(destination, '@lukasbriza/react-template', `@lukasbriza/${name}`)
        return `Created apps/${name} from templates/app-react`
      },
      (answers) => {
        const { name, install } = answers as { name: string; install: boolean }
        return finalize(`@lukasbriza/${name}`, install)
      },
    ],
  })

  plop.setGenerator('app-mobile', {
    description: 'Scaffold an Expo (Expo Router, RN) app from templates/app-mobile into apps/<name>',
    prompts: [kebabPrompt, installPrompt],
    actions: [
      (answers) => {
        const { name } = answers as { name: string }
        const destination = copyTemplate('app-mobile', path.join('apps', name))
        renamePackage(destination, '@lukasbriza/mobile-template', `@lukasbriza/${name}`)
        return `Created apps/${name} from templates/app-mobile`
      },
      (answers) => {
        const { name, install } = answers as { name: string; install: boolean }
        const message = finalize(`@lukasbriza/${name}`, install)
        return `${message}\nNext: cd apps/${name} && add the router runtime deps: pnpm exec expo install expo-linking expo-constants expo-status-bar expo-system-ui react-native-safe-area-context react-native-screens react-native-reanimated react-native-worklets react-native-gesture-handler react-native-web — then pnpm exec expo install --fix to lock everything to the SDK`
      },
    ],
  })

  plop.setGenerator('app-nest', {
    description: 'Scaffold a NestJS app from templates/app-nest into apps/<name> (optional Prisma 7)',
    prompts: [
      kebabPrompt,
      {
        type: 'confirm',
        name: 'withPrisma',
        message: 'Include Prisma 7 (schema, prisma.config.ts, PrismaService + pg adapter)?',
        default: false,
      },
      installPrompt,
    ],
    actions: [
      (answers) => {
        const { name, withPrisma } = answers as { name: string; withPrisma: boolean }
        const destination = copyTemplate('app-nest', path.join('apps', name))
        renamePackage(destination, '@lukasbriza/nestjs', `@lukasbriza/${name}`)
        if (withPrisma) {
          addPrisma(destination)
        }
        return `Created apps/${name} from templates/app-nest${withPrisma ? ' (+ Prisma 7)' : ''}`
      },
      (answers) => {
        const { name, withPrisma, install } = answers as { name: string; withPrisma: boolean; install: boolean }
        let message = finalize(`@lukasbriza/${name}`, install)
        if (withPrisma) {
          message += `\nRemember: cp apps/${name}/.env.example apps/${name}/.env   # set DATABASE_URL`
        }
        return message
      },
    ],
  })

  plop.setGenerator('app-storybook', {
    description: 'Scaffold the Storybook host from templates/app-storybook into apps/storybook (optional theme)',
    prompts: [
      {
        type: 'confirm',
        name: 'withTheme',
        message: 'Wire @lukasbriza/theme into Storybook (ThemeProvider preview + backgrounds)?',
        default: false,
      },
      installPrompt,
    ],
    actions: [
      (answers) => {
        const { withTheme } = answers as { withTheme: boolean }
        if (withTheme) {
          requirePackages(['theme'])
        }
        const destination = copyTemplate('app-storybook', path.join('apps', 'storybook'))
        if (withTheme) {
          addStorybookTheme(destination)
        }
        return `Created apps/storybook from templates/app-storybook${withTheme ? ' (+ theme)' : ''}`
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/storybook', install)
      },
    ],
  })

  plop.setGenerator('package-tokens', {
    description: 'Scaffold the framework-free design tokens package from templates/package-tokens into packages/tokens',
    prompts: [installPrompt],
    actions: [
      () => {
        copyTemplate('package-tokens', path.join('packages', 'tokens'))
        return 'Created packages/tokens from templates/package-tokens'
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/tokens', install)
      },
    ],
  })

  plop.setGenerator('package-api', {
    description: 'Scaffold the shared API package (openapi-fetch + $api) from templates/package-api into packages/api',
    prompts: [installPrompt],
    actions: [
      () => {
        copyTemplate('package-api', path.join('packages', 'api'))
        return 'Created packages/api from templates/package-api'
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/api', install)
      },
    ],
  })

  plop.setGenerator('package-theme', {
    description: 'Scaffold the shared MUI theme package from templates/package-theme into packages/theme (needs tokens)',
    prompts: [installPrompt],
    actions: [
      () => {
        requirePackages(['tokens'])
        copyTemplate('package-theme', path.join('packages', 'theme'))
        return 'Created packages/theme from templates/package-theme'
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/theme', install)
      },
    ],
  })

  plop.setGenerator('package-styles', {
    description: 'Scaffold the shared styles package from templates/package-styles into packages/styles (needs theme)',
    prompts: [installPrompt],
    actions: [
      () => {
        requirePackages(['theme'])
        copyTemplate('package-styles', path.join('packages', 'styles'))
        return 'Created packages/styles from templates/package-styles'
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/styles', install)
      },
    ],
  })

  plop.setGenerator('package-components', {
    description:
      'Scaffold the component library from templates/package-components into packages/components (needs theme + styles)',
    prompts: [installPrompt],
    actions: [
      () => {
        requirePackages(['theme', 'styles'])
        copyTemplate('package-components', path.join('packages', 'components'))
        return 'Created packages/components from templates/package-components'
      },
      (answers) => {
        const { install } = answers as { install: boolean }
        return finalize('@lukasbriza/components', install)
      },
    ],
  })
}
