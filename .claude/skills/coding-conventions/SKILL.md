---
name: coding-conventions
description: Use when writing, editing, or reviewing any code in this monorepo — TypeScript, React/MUI, Next.js, React Native (Expo), or NestJS: components, hooks, routes, modules, types, state, or naming. Covers conventions on top of @lukasbriza/eslint-config; read references/<framework>.md for framework specifics.
---

## Overview

Cross-cutting conventions for the whole monorepo. Mechanical rules (formatting, import order,
`import type`, unused vars, quotes, `type` over `interface`) are **enforced by
`@lukasbriza/eslint-config` + `prettier-config`** — don't restate them; this skill covers what
tooling can't. For framework specifics, read the matching reference:

| Working on… | Read |
|---|---|
| React / MUI components, hooks, styling | `references/react.md` |
| React Native (Expo), @emotion/native, Expo Router | `references/react-native.md` |
| Next.js App Router, RSC, i18n | `references/nextjs.md` |
| NestJS modules, DTOs, Prisma | `references/nestjs.md` |

Performance is a separate axis — see the `web-performance` (web/Next) and `native-performance` (Expo/RN) skills.

## When to Use

- Writing or editing any `.ts` / `.tsx` file
- Reviewing a diff for convention adherence
- Naming, structuring, or typing something

## Naming

| Thing | Convention | Example |
|---|---|---|
| File / folder | `kebab-case` | `root-layout.tsx`, `mui-typography.ts` |
| Component / type / enum | `PascalCase` | `WebTheme`, `AsyncWebLayout` |
| Hook / function / variable | `camelCase` | `useTheme`, `getScopedI18n` |
| Constant / enum value | `SCREAMING_SNAKE_CASE` | `DEFAULT_LOCALE` |
| CSS class / variable | `kebab-case` / `--prefix-name` | `.badge`, `--ion-color-primary` |

Boolean variables — required prefixes:

| Prefix | Meaning | Example |
|---|---|---|
| `is*` | state / type check | `isProvided`, `isEligible` |
| `has*` | presence of a value | `hasTheme` |
| `should*` | conditional intent | `shouldForwardProp` |
| `allow*` / `with*` | permission / feature flag | `withPrisma` |

Handler naming:

| Prefix | Role | Example |
|---|---|---|
| `on*` | callback prop from parent | `onChange`, `onSubmit` |
| `handle*` | internal handler | `handleSubmit` |
| `resolve*` / `get*` | computation / transform | `resolveLabel`, `getUsers` |

## Functions & types

- **Arrow-function consts**, not `function` declarations. Exceptions: generator functions, and
  Next route handlers (`export const GET = async …` preferred, `function` allowed). `class` only
  for Nest providers/decorated classes and custom `Error` subclasses.
- **Named exports.** Default export only where a framework requires it (Next `page`/`layout`
  re-exports, Nest `bootstrap`, config files).
- `type` over `interface` (enforced). `interface` only for MUI module augmentation.
- Compose types with `Pick` / `Omit` / `&` instead of re-declaring shapes.
- `ReactNode` for children — never `JSX.Element`. Import React types directly
  (`import type { ChangeEvent } from 'react'`), never `React.ChangeEvent`.

## Control flow

- **Early return** over `if/else` nesting — keep the happy path flat.
- **No nested ternaries** (enforced) — use `if / else if` or early returns. A single short
  ternary in JSX or a `const` is fine.
- Prefer `.map/.filter/.reduce/.forEach`; use `for…of` only for `break`/`continue` or sequential `await`.
- `?.` + `??` for null/undefined; be explicit (`=== null`) only when the distinction matters.

## Comments

- One short line, plain English a junior reads at a glance. No multi-line prose, no insider jargon.
- Comment only non-obvious logic, workarounds, guards. Default to no comment.
- Never restate well-named code. If a "why" doesn't fit one line, rename the symbol instead.

## Boundaries

- A package's public API is `src/index.ts`. Import from the package root (`@lukasbriza/x`), never
  deep-import internals.
- Shared config is consumed as packages, never copied.
- Never edit generated output: `dist/`, `build/`, `.next/`, `*.generated.*`, prisma `generated/`.
- Edit conventions in `templates/` + shared packages, not in scaffolded copies.

## Common Mistakes

| Mistake | Instead |
|---|---|
| `function foo() {}` | `const foo = () => {}` |
| `interface Props {}` (non-augmentation) | `type Props = {}` |
| Nested ternary | `if / else if` or early return |
| Deep import `@lukasbriza/theme/src/...` | import from `@lukasbriza/theme` |
| `React.ReactNode` | `import type { ReactNode } from 'react'` |
| Restating code in a comment | delete it or rename the symbol |
