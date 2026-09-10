'use client'

import type { Components, ThemeOptions } from '@mui/material'
import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material'
import type { ThemeProviderProps } from '@mui/material/styles'

import { breakpoints, palette, shape, size, spacing } from './tokens'
import type { WebTheme } from './types'
import { typography } from './typography'

const components: Components<Omit<WebTheme, 'components'>> = {
  MuiTypography: {
    defaultProps: {
      color: 'bodyText.primary',
      variantMapping: { S: 'span', M: 'div', L: 'p', XL: 'p' },
    },
  },
}

const options: ThemeOptions = {
  breakpoints,
  components,
  palette,
  size,
  shape,
  spacing,
  typography,
}

export const webTheme = createTheme(options)

export const ThemeProvider = ({ children, theme = webTheme }: Partial<ThemeProviderProps>) => (
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </MuiThemeProvider>
)

export { useTheme } from '@mui/material'
