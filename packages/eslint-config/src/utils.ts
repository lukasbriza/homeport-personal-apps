import type { Linter } from 'eslint'

import { importExtensions } from './constants'

const getImportExtensionsRecord = (extensions: string[]) => {
  const record: Record<string, 'never'> = {}
  for (const extension of extensions) {
    record[extension.replace('.', '')] = 'never'
  }
  return record
}

export const getImportExtensionsRule = (...extensions: string[]): Linter.RulesRecord => ({
  'import/extensions': [
    // Avoid unnecessary file extensions in imports
    'error',
    'ignorePackages',
    getImportExtensionsRecord([...importExtensions, ...extensions]),
  ],
})
