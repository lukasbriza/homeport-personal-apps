'use client'

import { webTheme as defaultTheme } from '@lukasbriza/theme'
import type { WebTheme } from '@lukasbriza/theme'
import type { CreateMUIStyled } from '@mui/styled-engine'
import type { MUIStyledCommonProps, MuiStyledOptions } from '@mui/system'
import { createStyled } from '@mui/system'
import type { ElementType } from 'react'

export { css } from '@mui/material'
export type { CSSObject, MUIStyledCommonProps, MuiStyledOptions } from '@mui/system'
export type { StyledComponent, StyledOptions } from '@mui/styled-engine'

/**
 * Themed `styled` function with default `webTheme`.
 */
export const styled: CreateMUIStyled<
  Omit<MUIStyledCommonProps<WebTheme>, 'as'> & { as?: ElementType | undefined },
  MuiStyledOptions,
  WebTheme
> = createStyled({ defaultTheme })
