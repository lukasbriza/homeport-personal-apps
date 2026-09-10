import type { NextRequest } from 'next/server'
import { createI18nMiddleware } from 'next-international/middleware'

import { i18nConfig } from './i18n/config'

const I18nMiddleware = createI18nMiddleware({
  locales: [...i18nConfig.locales],
  defaultLocale: i18nConfig.defaultLocale,
})

// Next 16 renamed the `middleware` convention to `proxy` (nodejs runtime; no edge).
export function proxy(request: NextRequest) {
  return I18nMiddleware(request)
}

export const config = {
  // Run on every route except Next internals and files with an extension (static assets).
  // Must be a plain string literal — Next statically parses this and rejects String.raw.
  matcher: [
    // eslint-disable-next-line unicorn/prefer-string-raw
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
