import type { Linter } from 'eslint'

import { getImportExtensionsRule } from '../../utils'

export const imports: Linter.RulesRecord = {
  ...getImportExtensionsRule('.tsx'), // Avoid unnecessary `.tsx` extensions in imports
}
