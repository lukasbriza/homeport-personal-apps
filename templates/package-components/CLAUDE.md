# CLAUDE.md — components package (@lukasbriza/components)

Shared React component library. Inherits root `CLAUDE.md`.

## Stack

- React 18 + MUI (base/material/system), `clsx`, `react-hook-form`. Built as a library (`dist/`).
- Depends on `@lukasbriza/theme` and `@lukasbriza/styles` (`workspace:*`) — both must exist first.
- Storybook stories live in `stories/` (picked up by the storybook app).

## Layout

- `src/<component>/` — component + its `index.ts`; public surface re-exported from `src/index.ts`.
- `stories/<component>/` — `*.stories.tsx` + `*.mdx` docs.
- `src/example` is a starter — replace with real components.

## Conventions

- Keep the public API in `src/index.ts`; don't deep-import internals from consumers.
- Each component gets a story; prefer `satisfies Meta<typeof X>`.

## Don't touch

- Generated: `dist/`. Edit conventions in `templates/package-components`.
