import '@emotion/react'

import type { AppTheme } from './index'

// Makes `props.theme` fully typed inside every @emotion/native `styled` block.
declare module '@emotion/react' {
  export type Theme = {} & AppTheme
}
