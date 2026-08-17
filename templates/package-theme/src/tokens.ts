import { black, gray, mono, state, white } from '@lukasbriza/tokens'
import type { PaletteOptions, Shape } from '@mui/material/styles'
import type { SpacingOptions } from '@mui/system'
import { createBreakpoints } from '@mui/system'

// --- colors ---
// Raw brand colours come from the shared, framework-free `@lukasbriza/tokens`
// (the single source of truth used by web AND mobile). Everything below is the
// web/MUI-specific *composition* of those primitives. Type scale, spacing and
// breakpoints stay here — they're web-specific (rem/MUI variants) and differ from
// the mobile scale.

export const monoChromaticPalette = {
  color1: mono[1],
  color2: mono[2],
  color3: mono[3],
  color4: mono[4],
}

export const primaryColors = {
  main: monoChromaticPalette.color2,
  light: monoChromaticPalette.color1,
  dark: monoChromaticPalette.color4,
} as const

export const brandColors = {
  primary: primaryColors,
  surface: {
    primary: monoChromaticPalette.color4,
    secondary: monoChromaticPalette.color3,
    tertiary: monoChromaticPalette.color2,
    contrast: white,
    background: monoChromaticPalette.color4,
  },
  bodyText: {
    primary: black,
    secondary: gray,
    contrast: white,
  },
  state,
  border: {
    primary: primaryColors.main,
    activeHover: primaryColors.dark,
    contrast: white,
  },
} as const

// --- palette ---
export const palette: PaletteOptions = {
  primary: brandColors.primary,
  bodyText: brandColors.bodyText,
  surface: brandColors.surface,
  border: brandColors.border,
  state: brandColors.state,
  common: { white, black },
  mode: 'dark',
}

// --- breakpoints ---
export const breakpoints = createBreakpoints({
  values: { xs: 0, sm: 600, md: 1024, lg: 1440, xl: 1600 },
})

// --- shape (border radius) ---
export const shape: Shape = {
  borderRadiusNone: 0,
  borderRadiusXs: 2,
  borderRadiusS: 4,
  // `borderRadius` must exist; `borderRadiusM` is the alias of preference.
  borderRadius: 8,
  borderRadiusM: 8,
  borderRadiusL: 12,
  borderRadiusXl: 16,
  borderRadius2Xl: 20,
  borderRadius3Xl: 24,
  borderRadius4Xl: 32,
}

// --- spacing + size scale (sizeN = n * sizeStep) ---
export const spacing: SpacingOptions = 5
export const sizeStep = 5

export const size = Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`size${index}`, index * sizeStep]))

export { black, gray, white } from '@lukasbriza/tokens'
