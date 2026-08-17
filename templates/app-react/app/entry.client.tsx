// ─────────────────────────────────────────────────────────────────────────────
// CLIENT ENTRY — the first app code that runs in the browser.
//
// The server already sent finished HTML (see entry.server.tsx). This file does
// NOT re-render that HTML — it *hydrates* it: React walks the existing DOM and
// attaches event handlers / state so the static markup becomes interactive.
//
// React Router ships a default version of this file; we ejected it into `app/`
// only to wrap hydration in the Emotion CacheProvider. Drop Emotion and you can
// delete this file — RR falls back to its built-in default.
// ─────────────────────────────────────────────────────────────────────────────

import { CacheProvider } from '@emotion/react'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

import { createEmotionCache } from './lib/emotion/cache'

// One cache for the whole browser session. Its `key: 'css'` matches the
// `data-emotion="css …"` <style> tags the server injected, so Emotion adopts
// those styles instead of inserting duplicates (no flash of unstyled content).
const cache = createEmotionCache()

// `startTransition` marks hydration as non-urgent so the browser can keep
// responding to input while React attaches — the RR-recommended default.
startTransition(() => {
  // `hydrateRoot(document, …)` hydrates the *entire* document because our root
  // Layout renders the <html> shell. `<HydratedRouter />` is RR's client router,
  // picking up the route + loader data the server serialized into the page.
  hydrateRoot(
    document,
    <StrictMode>
      <CacheProvider value={cache}>
        <HydratedRouter />
      </CacheProvider>
    </StrictMode>,
  )
})
