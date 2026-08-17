# CLAUDE.md — Storybook app (@lukasbriza/storybook)

Storybook host for the monorepo's packages. Inherits root `CLAUDE.md`.

## Stack

- Storybook 8 + React + Vite (`@storybook/react-vite`). Config in `config/` (`--config-dir config`).
- Built static (`storybook build`) → `storybook-static`, served via `serve`.

## How stories are collected

- `config/main.ts` lists workspaces in `packages` and pulls their `stories/**` (mdx + \*.stories.tsx).
  Add a package there to surface its stories (e.g. `packages/components`).
- Story files live in each package's `stories/` dir, not here.

## Theme integration

- Scaffold with `turbo gen app-storybook` and answer "yes" to theme to wire
  `@lukasbriza/theme` into `config/preview.tsx` (ThemeProvider + backgrounds) and the tsconfig.

## Conventions

- Keep Storybook config in `config/`; don't add stories directly here.
- `pnpm dev` runs on port 6006.

## Don't touch

- Generated: `storybook-static/`. Edit conventions in `templates/app-storybook`.
