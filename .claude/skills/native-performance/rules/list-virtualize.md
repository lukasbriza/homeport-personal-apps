---
title: Virtualize long lists; never .map() in a ScrollView
impact: CRITICAL
tags: [lists, memory, scroll]
---

## Use a virtualized list, not a mapped ScrollView

`.map()` inside a `ScrollView` mounts **every** row up front — memory and mount cost grow with the
data and jank/OOM appear on real devices. `FlatList` (built in) or `FlashList` (`@shopify/flash-list`,
faster for large/heterogeneous data) only render what's on screen.

**Avoid:**

```tsx
<ScrollView>
  {items.map((item) => (
    <Row key={item.id} item={item} />
  ))}
</ScrollView>
```

**Prefer:**

```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem} // stable ref — see list-render-item-stable
/>
```

A mapped `ScrollView` is fine **only** for a small, fixed set (a handful of items that all fit).
Anything unbounded or data-driven → virtualize.
