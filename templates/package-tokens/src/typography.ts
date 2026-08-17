// Type scale primitives (unitless). Font families live per-platform (web loads via
// CSS, RN via expo-font), so only sizes/weights are shared here.
export const fontSize = { body: 16, title: 22 } as const

export const fontWeight = { regular: '400', bold: '600' } as const
