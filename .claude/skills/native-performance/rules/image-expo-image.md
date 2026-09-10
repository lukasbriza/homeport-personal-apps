---
title: Use expo-image for remote/large images
impact: MEDIUM
tags: [images, memory, caching]
---

## expo-image over RN Image

RN's core `Image` has weak caching and decodes at full resolution — heavy on memory in lists and
galleries. `expo-image` adds disk+memory caching, `priority`, `contentFit`, `transition`, and
blurhash/placeholder, and downscales to the layout size.

**Avoid:**

```tsx
import { Image } from 'react-native'
<Image source={{ uri }} style={styles.thumb} />
```

**Prefer:**

```tsx
import { Image } from 'expo-image'
<Image
  source={{ uri }}
  style={styles.thumb}
  contentFit="cover"
  cachePolicy="memory-disk"
  placeholder={blurhash}
  transition={150}
/>
```

In lists, size images to their rendered box and set a stable `cachePolicy` — decoding full-res
images per row is a common source of scroll jank and OOM.
