import type { NextPage } from 'next'
import type { PropsWithChildren, ReactNode } from 'react'

import type { Locale } from '@/i18n/config'

/**
 * Route params shared by every localized page.
 */
export type WebPageParams = {
  locale: Locale
}

/**
 * Props shared by every localized page.
 * Next.js 15+/16: `params` (and `searchParams`) are async — always a Promise.
 */
export type WebPageProps<T extends WebPageParams = WebPageParams> = {
  params: Promise<T>
}

/**
 * Async (server component) layout — awaits `params` for the locale.
 */
export type AsyncWebLayout = (props: PropsWithChildren<WebPageProps>) => Promise<ReactNode> | ReactNode

/**
 * Page component.
 */
export type WebPage<T extends WebPageProps = WebPageProps, I = T> = NextPage<T, I>
