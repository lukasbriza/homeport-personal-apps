'use client'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useServerInsertedHTML } from 'next/navigation'
import { useState, type FC, type PropsWithChildren } from 'react'

// import { ThemeProvider } from '@lukasbriza/theme' // uncomment when consuming the monorepo theme

export const EmotionRegistry: FC<PropsWithChildren> = ({ children }) => {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css' })
    cache.compat = true

    const insert = cache.insert.bind(cache)
    let inserted: string[] = []

    cache.insert = (...args) => {
      const serialized = args[1]
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return insert(...args)
    }

    const flush = () => {
      const previousInserted = inserted
      inserted = []
      return previousInserted
    }

    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) {
      return null
    }

    let styles = ''
    for (const name of names) {
      const inserted = cache.inserted[name]
      if (typeof inserted === 'string') {
        styles += inserted
      }
    }

    return (
      <style
        dangerouslySetInnerHTML={{ __html: styles }}
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      {/* <ThemeProvider> */}
      {children}
      {/* </ThemeProvider> */}
    </CacheProvider>
  )
}
