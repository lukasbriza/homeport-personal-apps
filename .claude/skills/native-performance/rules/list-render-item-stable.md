---
title: Memoize list rows; keep renderItem/keyExtractor stable
impact: HIGH
tags: [lists, rerender, memo]
---

## Stable row identity keeps virtualization cheap

A new `renderItem`/`keyExtractor` function or an inline row component on every render defeats the
list's bail-out and re-renders visible rows. Define them once and memoize the row.

**Avoid:**

```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <Row item={item} onPress={() => open(item.id)} />} // new fns each render
/>
```

**Prefer:**

```tsx
const Row = memo(({ item, onOpen }: RowProps) => (
  <Pressable onPress={() => onOpen(item.id)}>
    <BodyText>{item.title}</BodyText>
  </Pressable>
))

const keyExtractor = (item: Item) => item.id
const renderItem = useCallback(({ item }: { item: Item }) => <Row item={item} onOpen={onOpen} />, [onOpen])
```

- `keyExtractor` must return a **stable, unique** id — never the array index for reorderable data.
- Pass a memoized `onOpen` (stable handler) so `Row`'s `memo` actually holds.
- On `FlashList`, add `getItemType` for lists that mix row shapes so it recycles per type.
