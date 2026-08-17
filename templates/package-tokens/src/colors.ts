// Framework-free brand palette (plain data — no MUI/emotion/React). Both the web
// MUI theme and the mobile @emotion/native theme compose their own theme objects
// from these primitives, so colours stay defined in exactly one place.

export const gray = '#27292c'
export const black = '#151617'
export const white = '#ffffff'

export const mono = {
  1: '#eeeeee',
  2: '#aeaeae',
  3: '#909090',
  4: '#5c5c5c',
} as const

export const state = {
  success: { primary: '#51a147', secondary: '#73976e' },
  warning: { primary: '#e8c53c', secondary: '#d7c066' },
  error: { primary: '#b72121', secondary: '#873434' },
} as const

export const palette = { gray, black, white, mono, state } as const
