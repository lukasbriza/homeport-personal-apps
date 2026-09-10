---
description: Scaffold a new app or package from templates via turbo gen
argument-hint: <type> [name]
allowed-tools: Bash(pnpm turbo gen:*), Bash(ls:*), Read
---

Scaffold a new workspace using the repo's `turbo gen` generators. Arguments: `$ARGUMENTS`
(first token = **type**, second = **name** in kebab-case where the type needs one).

## Steps

1. Parse `$ARGUMENTS` into `type` and (optional) `name`. If `type` is missing or unknown,
   list the valid types below and stop.
2. Enforce prerequisites and fixed destinations (see table). If a prerequisite package is
   missing, tell the user which generator to run first instead of proceeding.
3. Run the generator **non-interactively**, mapping answers positionally with `--args`
   (prompt order is given per type). Default `install` to `true` unless the user says otherwise.
4. Report what was created and surface any post-step the generator prints (e.g. copy
   `.env.example`).

## Types, destinations, and `--args` order

| type | dest | prompt order → `--args` | prerequisites |
|---|---|---|---|
| `app-next` | `apps/<name>` | `<name> <install>` | — |
| `app-nest` | `apps/<name>` | `<name> <withPrisma> <install>` | — |
| `app-storybook` | `apps/storybook` (fixed) | `<withTheme> <install>` | theme if `withTheme` |
| `package-theme` | `packages/theme` (fixed) | `<install>` | — |
| `package-styles` | `packages/styles` (fixed) | `<install>` | `package-theme` |
| `package-components` | `packages/components` (fixed) | `<install>` | `package-theme`, `package-styles` |

Booleans are `true`/`false`. Examples:

```bash
pnpm turbo gen app-next --args my-web true
pnpm turbo gen app-nest --args my-api true true       # name, +Prisma, install
pnpm turbo gen app-storybook --args true true         # +theme, install
pnpm turbo gen package-styles --args true
```

## Notes

- Dependency order is `package-theme → package-styles → package-components`; the generators
  also guard this, but check first and give a clear message rather than triggering the guard.
- `app-storybook`, `package-theme/styles/components` ignore any `name` argument (fixed folders).
- Do not hand-edit scaffolded output to "fix" a template — conventions live in `templates/`.
