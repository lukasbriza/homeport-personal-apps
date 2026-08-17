---
title: Don't define components inside components
impact: HIGH
tags: [rerender, components, remount]
---

## Define components at module scope, pass props

Defining a component inside another creates a new component type every render — React remounts it,
destroying its state and DOM and re-running effects. (Symptoms: inputs lose focus per keystroke,
animations restart, scroll resets.)

**Incorrect — `Avatar` remounts on every render:**

```tsx
const UserProfile = ({ user, theme }: { user: User; theme: string }) => {
  const Avatar = () => <img src={user.avatarUrl} className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'} />
  return (
    <div>
      <Avatar />
    </div>
  )
}
```

**Correct — hoist and pass props:**

```tsx
const Avatar = ({ src, theme }: { src: string; theme: string }) => (
  <img src={src} className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'} />
)

const UserProfile = ({ user, theme }: { user: User; theme: string }) => (
  <div>
    <Avatar src={user.avatarUrl} theme={theme} />
  </div>
)
```
