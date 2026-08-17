# React / MUI conventions

Read with `coding-conventions` (base). Applies to the frontend apps and `@lukasbriza/components`.
Performance rules live in the `web-performance` skill.

## Components

- Function components as **arrow consts** with **named export** (library components are
  re-exported from `src/index.ts`).
- Props as a `type`, destructured in the signature with defaults: `{ disabled = false }`.
- Conditional props via spread: `{...(id && { id })}` — not `id={id || undefined}`.
- `clsx` for conditional classes: `clsx('badge', small && 'badge-small', className)`.
- Keep components small and presentational; push logic into hooks/services.

```tsx
type BadgeProps = {
  count: number
  className?: string
}

export const Badge = ({ count, className }: BadgeProps) => (
  <span className={clsx('badge', className)}>{count}</span>
)
```

## Body order (pages / complex components)

`state → hooks → handlers → effects → render`, effects grouped just above `return`.

```tsx
const HomePage = async () => {
  const t = await getScopedI18n('home') // hooks/data
  return (
    <main>
      <h1>{t('title')}</h1>
    </main>
  )
}
```

## State & effects — antipatterns

- **Derive, don't mirror** — compute from props/state during render; never `useState` + `useEffect`
  to sync a derived value. To reset state on a prop change, use `key`.
- `useEffect` only for real side effects (subscriptions, DOM, network).
- Don't define a component inside another (remounts it). See `web-performance`: `rerender-*`,
  `no-inline-components`.

## Styling (MUI + emotion)

- Use `styled` from `@lukasbriza/styles` (pre-bound to the theme) — not raw `@mui/system`.
- Read design tokens from the theme (`useTheme`, `theme.palette/…`); never hard-code colours/sizes.
- Typography uses custom variants `S/M/L/XL` + `h1..h5`; built-in `body1`/`button`/etc. are disabled
  by the theme — don't use them.
- Emotion needs an SSR registry so styles ship with the first paint (no flash):
  - **Next (app-next):** `EmotionRegistry` (`src/layout/registry`) using `useServerInsertedHTML`.
  - **React Router (app-react):** ejected `entry.server.tsx` extracts critical CSS via
    `@emotion/server` (`renderToString`) — trades RR streaming SSR for flash-free styles; the
    `CacheProvider` lives in `entry.{server,client}.tsx`.
  - **React Native (app-mobile):** `@emotion/native` `styled.View`/`styled.Text` — no registry
    and no SSR (renders on-device); RN style semantics (unitless numbers), not CSS.
- **One component per folder** (apps too, not just `@lukasbriza/components`): `<name>/` holds
  `<name>.tsx`, `<name>.styles.ts` (the component's `styled` defs — never inline in JSX), `index.ts`.
- **Scope split:** global styles (reset/tokens) → `app/styles/` (Emotion `<Global>` in app-react);
  component styles → local `<name>.styles.ts`. The Emotion cache factory is infra → `app/lib/emotion/`.

## Context pattern (three-file split)

| File | Responsibility |
|---|---|
| `types/context.ts` | `ContextBase<T>` type (adds `isProvided: boolean`) |
| `context/xxx-context.tsx` | `createContext` + Provider; Provider = default export, context = named |
| `hooks/context/use-xxx.ts` | `useContext` + guard that throws outside the provider |

- Default values set `isProvided: false`; function fields **throw**
  `new Error('… must be implemented')`, never a silent `() => {}`.
- Components never call `useContext` directly — always via the `useXxx` hook.

## Component library (@lukasbriza/components)

- One component per folder under `src/`; re-export from `src/index.ts`.
- Ship a story per component (`stories/<name>/*.stories.ts` + `.mdx`).

## Common Mistakes

| Mistake | Instead |
|---|---|
| `useEffect` to sync derived state | compute during render |
| Component defined inside a component | hoist it, pass props |
| Raw `@mui/system` `styled` | `styled` from `@lukasbriza/styles` |
| Hard-coded colour/size | theme token |
| `useContext(Ctx)` in a component | the `useXxx` hook |
