// 4px base grid. `spacing(2)` → 8. Unitless number (works for RN and, via a `px`
// wrapper, for the web).
export const spacing = (steps: number) => steps * 4

export const radius = { sm: 4, md: 8, lg: 16 } as const
