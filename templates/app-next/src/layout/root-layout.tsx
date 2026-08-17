import type { Metadata } from 'next'

import { i18nConfig } from '@/i18n/config'
import type { AsyncWebLayout } from '@/shared/types'

import { RootWebLayout } from './web-layout'

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }))
}

export function generateMetadata(): Metadata {
  return {
    // NEXT_PUBLIC_* vars are inlined at build time; read via process.env.
    robots: process.env.NEXT_PUBLIC_META_ROBOTS ?? null,
  }
}

export const RootLayout: AsyncWebLayout = async ({ children, params }) => {
  const { locale } = await params

  return (
    <html lang={locale}>
      <body>
        <RootWebLayout params={params}>{children}</RootWebLayout>
      </body>
    </html>
  )
}
