# CLAUDE.md — theme package (@lukasbriza/theme)

Shared MUI theme. Inherits monorepo conventions from the root `CLAUDE.md`.

## Stack

- MUI v9 (`@mui/material`, `@mui/system`, `@mui/types`), React 18.
- Built as a library (`tsc --build tsconfig.build.json` → `dist/`), consumed by apps via `workspace:*`.
- Depends on **`@lukasbriza/tokens`** (`workspace:*`) — the framework-free brand palette. Tokens
  must exist first (generator order).

## Layout (src)

- `tokens.ts` — **web/MUI composition** of the shared colours: raw brand colours are imported from
  `@lukasbriza/tokens`; this file builds `palette`, plus web-specific `breakpoints`, `shape`
  (radius), `size` scale + `spacing` (these differ from the mobile scale, so they live here).
- `typography.ts` — font-style constants + typography `variants` (custom `S/M/L/XL`, built-in `body1`/etc. disabled).
- `theme.tsx` — assembles `webTheme` (`createTheme`) + `ThemeProvider` + component defaults; re-exports `useTheme`.
- `types.ts` — token types (`WebPalette`, `WebShape`, `WebSize`, ...) **and** MUI module augmentation.
- `index.ts` — public API (`export * from './theme'` + `./types`).
- Storybook presentation data lives in `stories/` (e.g. `color-definition.ts`, `font-variants.ts`), not in `src`.

## Conventions

- Keep the public API in `index.ts`; don't deep-import internals from consumers.
- `size` is a generated scale: `sizeN = n * sizeStep` (0..32). Prefer MUI `theme.spacing()` for layout.
- Consuming Next apps must add `@lukasbriza/theme` to `next.config.mjs` `transpilePackages`.

## Don't touch

- Generated: `dist/`. Edit conventions here; this package ships from `templates/package-theme`.
