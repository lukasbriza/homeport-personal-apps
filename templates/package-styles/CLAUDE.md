# CLAUDE.md — styles package (@lukasbriza/styles)

Themed `styled` helper + prop utilities on top of MUI. Inherits root `CLAUDE.md`.

## Stack

- MUI system/styled-engine + emotion, React 18. Built as a library (`dist/`).
- Depends on `@lukasbriza/theme` (`workspace:*`) — theme must exist first.

## Surface (`src/index.ts`)

- `styled` — MUI `styled` pre-bound to the project `webTheme` (`src/styles.ts`).
- `shouldForwardProp` — helper for `styled`'s prop filtering (`src/utils.ts`).
- Re-exports `css` and common style types.

## Don't touch

- Generated: `dist/`. Edit conventions in `templates/package-styles`.
