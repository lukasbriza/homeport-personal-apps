---
title: Version, minimize, and guard localStorage
impact: MEDIUM
tags: [client, localStorage, versioning]
---

## Version keys, store only what you need, always try/catch

`localStorage` throws in private mode, when the quota is exceeded, or when disabled — always wrap
access. Version keys so the schema can evolve, and store only the fields the UI needs (never
tokens/PII).

```ts
const VERSION = 'v2'
const KEY = `userConfig:${VERSION}`

type Config = { theme: string; language: string }

const saveConfig = (config: Config) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(config))
  } catch {
    // private mode / quota exceeded / storage disabled
  }
}

const loadConfig = (): Config | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Config) : null
  } catch {
    return null
  }
}
```

Migrate old versions explicitly (read `…:v1`, write `…:v2`, remove `v1`). Store minimal fields from
server responses — not the whole user object.
