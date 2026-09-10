import { I18nProviderClient } from '@/i18n/client'
import { QueryProvider } from '@/lib/query/providers'
import type { AsyncWebLayout } from '@/shared/types'
import { UiStoreProvider } from '@/stores/ui-store-provider'

import { EmotionRegistry } from './registry'

export const RootWebLayout: AsyncWebLayout = async ({ children, params }) => {
  const { locale } = await params

  return (
    <EmotionRegistry>
      <QueryProvider>
        <UiStoreProvider>
          <I18nProviderClient locale={locale}>{children}</I18nProviderClient>
        </UiStoreProvider>
      </QueryProvider>
    </EmotionRegistry>
  )
}
