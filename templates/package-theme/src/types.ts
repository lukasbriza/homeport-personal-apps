/* eslint-disable @typescript-eslint/consistent-type-definitions -- MUI augmentation needs interfaces */
import type { CSSProperties } from 'react'

import type { webTheme } from './theme'

// --- token types ---
export type PrimarySecondary = {
  primary: string
  secondary: string
}

export type Base = PrimarySecondary & {
  contrast: string
}

export type WebPalette = {
  bodyText: Base
  surface: Base & {
    tertiary: string
    background: string
  }
  border: {
    primary: string
    activeHover: string
    contrast: string
  }
  state: {
    success: PrimarySecondary
    warning: PrimarySecondary
    error: PrimarySecondary
  }
}

export type WebShape = {
  borderRadiusNone: number
  borderRadiusXs: number
  borderRadiusS: number
  borderRadiusM: number
  borderRadiusL: number
  borderRadiusXl: number
  borderRadius2Xl: number
  borderRadius3Xl: number
  borderRadius4Xl: number
}

export type WebSize = Record<`size${number}`, number>

export type WebFontWeight = 'bold' | 'medium' | 'regular'

export type WebTypographyVariants = {
  h1: CSSProperties
  h2: CSSProperties
  h3: CSSProperties
  h4: CSSProperties
  h5: CSSProperties
  S: CSSProperties
  M: CSSProperties
  L: CSSProperties
  XL: CSSProperties
}

export type { Theme } from '@mui/material'

export type WebTheme = typeof webTheme

// --- MUI module augmentation ---
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    S: true
    M: true
    L: true
    XL: true
    h6: false
    body1: false
    body2: false
    button: false
    caption: false
    overline: false
    subtitle1: false
    subtitle2: false
  }
}

declare module '@mui/material/styles' {
  interface Palette extends WebPalette {}
  interface PaletteOptions extends Partial<WebPalette> {}
  interface Shape extends WebShape {}
  interface ShapeOptions extends Partial<WebShape> {}
  interface TypographyVariants extends WebTypographyVariants {}
  interface TypographyVariantsOptions extends Partial<WebTypographyVariants> {}
  interface Theme {
    size: WebSize
  }
  interface ThemeOptions {
    size?: WebSize
  }
}

declare module '@mui/system' {
  interface Shape extends WebShape {}
}
