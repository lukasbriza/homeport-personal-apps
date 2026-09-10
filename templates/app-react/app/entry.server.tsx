// ─────────────────────────────────────────────────────────────────────────────
// SERVER ENTRY — runs on the server for every request.
//
// React Router calls the default export to turn a request into an HTML Response:
// it renders the matched routes to markup, which the browser shows immediately
// (SSR) before entry.client.tsx hydrates it.
//
// RR ships a default (streaming) version of this file; we ejected it into `app/`
// to plug in Emotion. Emotion can only collect the CSS a page actually used
// *after* the HTML exists, so we render to a full string, extract that "critical
// CSS", and inject it into <head>. Trade-off: `renderToString` is synchronous, so
// this app gives up RR's streaming SSR in exchange for flash-free styles. Drop
// Emotion (→ CSS Modules / Tailwind) and you can delete this file to get the
// streaming default back.
// ─────────────────────────────────────────────────────────────────────────────

import { CacheProvider } from '@emotion/react'
import createEmotionServer from '@emotion/server/create-instance'
import { renderToString } from 'react-dom/server'
import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

import { createEmotionCache } from './lib/emotion/cache'

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  // `routerContext` carries the matched routes + loader data RR prepared for this
  // request; `<ServerRouter />` renders the app from it.
  routerContext: EntryContext,
) => {
  // A fresh cache per request — never share one between users (styles would leak).
  const cache = createEmotionCache()
  // Keep the instance and call its methods directly (destructuring them would
  // strip their `this` binding — see @typescript-eslint/unbound-method).
  const emotionServer = createEmotionServer(cache)

  // 1) Render the whole app to an HTML string. Emotion records every style used
  //    into `cache` as it renders. Because our root Layout renders the <html>
  //    shell, this string is a complete document.
  const html = renderToString(
    <CacheProvider value={cache}>
      <ServerRouter context={routerContext} url={request.url} />
    </CacheProvider>,
  )

  // 2) Pull only the CSS this page actually used and build <style> tags for it,
  //    then splice them in just before </head> so styles arrive with the markup.
  const styleTags = emotionServer.constructStyleTagsFromChunks(emotionServer.extractCriticalToChunks(html))
  const markup = html.replace('</head>', `${styleTags}</head>`)

  responseHeaders.set('Content-Type', 'text/html')

  // 3) Return the finished document. React doesn't emit <!DOCTYPE>, so we prepend it.
  return new Response(`<!DOCTYPE html>${markup}`, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}

export default handleRequest
