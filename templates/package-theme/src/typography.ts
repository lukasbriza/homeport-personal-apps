import type { TypographyStyle, TypographyVariantsOptions } from '@mui/material/styles'

import { breakpoints } from './tokens'

// --- font style ---
export const fontFamily = 'Poppins, Arial, sans-serif'
export const headingsFontFamily = 'JetBrains Mono, monospace'
export const htmlFontSize = 10 // 62.5% of the default 16px
export const fontWeightRegular = 400
export const fontWeightMedium = 500
export const fontWeightBold = 700

// --- variants ---
export const variants: TypographyVariantsOptions = {
  h1: {
    fontFamily: headingsFontFamily,
    fontSize: 48,
    lineHeight: 1.33333,
    [breakpoints.down('md')]: { fontSize: 24, lineHeight: 1.33333 },
  },
  h2: {
    fontFamily: headingsFontFamily,
    fontSize: 32,
    lineHeight: 1.5,
    [breakpoints.down('md')]: { fontSize: 20, lineHeight: 1.4 },
  },
  h3: {
    fontFamily: headingsFontFamily,
    fontSize: 24,
    lineHeight: 1.33333,
    [breakpoints.down('md')]: { fontSize: 16, lineHeight: 1.5 },
  },
  h4: { fontFamily: headingsFontFamily, fontSize: 20, lineHeight: 1.4 },
  h5: { fontFamily: headingsFontFamily, fontSize: 16, lineHeight: 1.5 },
  S: { fontSize: 12, lineHeight: 1.33333 },
  M: { fontSize: 14, lineHeight: 1.42857 },
  L: { fontSize: 16, lineHeight: 1.5 },
  XL: { fontSize: 18, lineHeight: 1.77778 },
  // Disable unwanted built-in variants
  h6: undefined as unknown as TypographyStyle,
  body1: undefined as unknown as TypographyStyle,
  body2: undefined as unknown as TypographyStyle,
  button: undefined as unknown as TypographyStyle,
  caption: undefined as unknown as TypographyStyle,
  overline: undefined as unknown as TypographyStyle,
  subtitle1: undefined as unknown as TypographyStyle,
  subtitle2: undefined as unknown as TypographyStyle,
}

export const typography: TypographyVariantsOptions = {
  fontFamily,
  htmlFontSize,
  fontWeightRegular,
  fontWeightMedium,
  fontWeightBold,
  ...variants,
}
