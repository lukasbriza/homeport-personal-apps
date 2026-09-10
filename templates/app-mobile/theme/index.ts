import { fontSize, fontWeight, mono, palette, radius, spacing } from '@lukasbriza/tokens'

// Mobile theme composed from the shared framework-free tokens (`@lukasbriza/tokens`),
// so colours/scales match the web MUI theme. @emotion/native reads `theme` via props;
// MUI's theme/styled are web-only and not used here.

// Explicit (widened) shape so `lightTheme` and `darkTheme` share one type.
export type AppTheme = {
  mode: 'light' | 'dark'
  colors: {
    background: string
    surface: string
    text: string
    textMuted: string
    border: string
    primary: string
  }
  spacing: (steps: number) => number
  radius: { sm: number; md: number; lg: number }
  typography: {
    bodySize: number
    titleSize: number
    weightRegular: string
    weightBold: string
  }
  state: { success: string; warning: string; error: string }
}

const shared = {
  spacing,
  radius,
  typography: {
    bodySize: fontSize.body,
    titleSize: fontSize.title,
    weightRegular: fontWeight.regular,
    weightBold: fontWeight.bold,
  },
  state: {
    success: palette.state.success.primary,
    warning: palette.state.warning.primary,
    error: palette.state.error.primary,
  },
}

export const lightTheme: AppTheme = {
  ...shared,
  mode: 'light',
  colors: {
    background: palette.white,
    surface: '#f4f4f5',
    text: palette.black,
    textMuted: mono[4],
    border: '#e4e4e7',
    primary: mono[4],
  },
}

export const darkTheme: AppTheme = {
  ...shared,
  mode: 'dark',
  colors: {
    background: palette.black,
    surface: '#1f2123',
    text: palette.white,
    textMuted: mono[2],
    border: '#2a2c2f',
    primary: mono[2],
  },
}
