# CLAUDE.md — NestJS app

Per-app context. Inherits monorepo conventions from the root `CLAUDE.md`; this file
covers only what is specific to a NestJS app.

## Stack

- NestJS 11 (Express 5 platform), TypeScript (CommonJS output via `nest build` → `build/`).
- Swagger at `/api/swagger` (`@nestjs/swagger`), config via `@nestjs/config` + dotenv.
- Validation: `class-validator`. Tests: **vitest** (`vitest.config.mjs`).

## Layout

- `src/main.ts` — bootstrap (Nest factory + Swagger).
- `src/app.module.ts` — root module; register feature modules here.
- Feature code in `src/modules/<feature>/` (module + controller + service + dto).

## Conventions

- One module per feature; keep controllers thin, logic in services (DI).
- DTOs validated with `class-validator`; enable a global `ValidationPipe` when adding input.
- Run: `pnpm dev` (watch), `pnpm build`, `pnpm test`, `pnpm lint`.

## Prisma 7 (optional)

- Scaffold with `turbo gen app-nest` and answer "yes" to Prisma. That adds:
  - `prisma`, `@prisma/client`, `@prisma/adapter-pg` (deps)
  - `prisma/schema.prisma` (v7: datasource has **no** `url`)
  - `prisma.config.ts` (connection URL for Migrate, from `DATABASE_URL`)
  - `src/modules/prisma/{prisma.module,prisma.service}.ts` (global module; service wires
    the `pg` driver adapter into `PrismaClient`)
  - `postinstall: prisma generate` → client generated to `src/modules/prisma/generated`
- v7 specifics: the schema no longer carries the connection URL. Migrate reads it from
  `prisma.config.ts`; the runtime client gets it via the **driver adapter**
  (`new PrismaPg({ connectionString: process.env.DATABASE_URL })`), not the schema.
- Set `DATABASE_URL` in `.env` (see `.env.example`). After schema changes:
  `pnpm prisma:generate`; migrate with `pnpm prisma:migrate`.
- The generated client (`src/modules/prisma/generated`) is git/eslint-ignored. Inject
  `PrismaService` into your services via DI (the module is `@Global`).

## Don't touch

- Generated: `build/`, `src/modules/prisma/generated`, `*.generated.*`.
- This app ships from `templates/app-nest`; edit conventions there so they propagate.
