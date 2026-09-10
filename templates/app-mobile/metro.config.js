// Metro config, monorepo-aware. Metro is CommonJS (this file is NOT ESM), so the
// app package.json deliberately omits `"type": "module"`.
const path = require('node:path')

const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch the whole workspace so edits in shared packages trigger reloads.
config.watchFolders = [workspaceRoot]

// 2. Resolve modules from the app first, then the hoisted workspace root
//    (see the root .npmrc public-hoist-pattern block for why RN deps are hoisted).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
