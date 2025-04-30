import { common } from './common'
import { hooks } from './hooks'
import { imports } from './imports'
import { jsx } from './jsx'

export const rules = {
  ...common,
  ...hooks,
  ...imports,
  ...jsx,
}
