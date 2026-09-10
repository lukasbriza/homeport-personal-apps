export const Locale = {
  cs: 'cs',
  en: 'en',
} as const

export type Locale = (typeof Locale)[keyof typeof Locale]

export const i18nConfig = {
  locales: [Locale.cs, Locale.en],
  defaultLocale: Locale.en,
  prefixDefault: true,
} as const
