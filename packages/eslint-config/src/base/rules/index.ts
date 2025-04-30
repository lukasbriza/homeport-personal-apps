import { common } from './common'
import { imports } from './imports'
import { typescript } from './typescript'
import { unicorn } from './unicorn'

export const rules = {
  ...common,
  ...imports,
  ...typescript,
  ...unicorn,
}
