# CLAUDE.md — tokens package (@lukasbriza/tokens)

Framework-free design tokens. Inherits root `CLAUDE.md`.

## Stack

- **Pure TypeScript data** — no MUI, emotion, React, or DOM. Built as a library (`dist/`).
- Zero runtime dependencies.

## Surface (`src/index.ts`)

- `palette` (+ `mono`, `state`, `black`/`white`/`gray`) — brand colours.
- `spacing(steps)` + `radius` — 4px grid.
- `fontSize` + `fontWeight` — type scale primitives (unitless).

## Why it exists

Single source of truth for design values. **Colours are shared across platforms** — the web MUI
theme (`@lukasbriza/theme`) and the mobile `@emotion/native` theme both compose their palette from
`palette`/`mono`/`state`, so brand colours are defined once. The `spacing`/`radius`/`fontSize`/
`fontWeight` scales are the **mobile baseline**; the web theme keeps its own rem/MUI type scale and
spacing unit (they differ by design). If a scale ever converges across platforms, move it here too.

## Rules

- **Keep it framework-free.** Never import MUI/emotion/React here — that's what makes it usable
  from both web and native bundles.
- Values only (plain consts). No theme-building logic; that's the consumers' job.

## Don't touch

- Generated: `dist/`. Edit conventions in `templates/package-tokens`.
