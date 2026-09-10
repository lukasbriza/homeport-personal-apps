---
title: Chain nested fetches per item, not in two global passes
impact: CRITICAL
tags: [server, parallel-fetching, promises]
---

## Chain dependent fetches inside each item's promise

When each item needs a follow-up fetch, don't do two global `Promise.all` passes — one slow item
in the first pass blocks the follow-ups for all the others. Chain per item instead.

**Incorrect — one slow chat blocks every author fetch:**

```ts
const chats = await Promise.all(chatIds.map((id) => getChat(id)))
const authors = await Promise.all(chats.map((chat) => getUser(chat.author)))
```

**Correct — each item chains `getChat` → `getUser` independently:**

```ts
const authors = await Promise.all(chatIds.map((id) => getChat(id).then((chat) => getUser(chat.author))))
```

A slow item only delays its own chain; the rest proceed. Same waterfall lesson as
`async-dependencies`, applied per collection item.
