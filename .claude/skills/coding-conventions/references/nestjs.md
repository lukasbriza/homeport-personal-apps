# NestJS conventions

Read with `coding-conventions` (base). Applies to `apps/*` Nest apps. CommonJS; `nest build` -> `build/`.

## Module structure

One feature = one module folder under `src/modules/<feature>/`:

```
src/modules/users/
  users.module.ts      # @Module wiring
  users.controller.ts  # HTTP layer — thin
  users.service.ts     # business logic — @Injectable
  dto/                 # request/response DTOs
```

`app.module.ts` imports feature modules; `main.ts` bootstraps (Swagger + `app.listen`).

## Classes, not arrow consts

Nest needs decorated **classes** — this is the base skill's `class` exception. Providers/controllers
are classes with **method** members (`getHello(): string {}`), not arrow-property fields.
Dependencies via constructor injection: `constructor(private readonly usersService: UsersService) {}`.

```ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll()
  }
}
```

- Controllers stay thin — validate, delegate to a service, shape the response. No business logic.
- Services own logic and data access; keep them injectable and unit-testable.

## DTOs & validation

- One `class` DTO per request/response shape in `dto/`; validate with `class-validator` decorators.
- Enable a global `ValidationPipe` (`whitelist: true`, `transform: true`).
- Annotate DTOs/endpoints with `@nestjs/swagger` decorators — Swagger is served at `api/swagger`.

## Config

- Read env via `@nestjs/config` (`ConfigModule`/`ConfigService`), not raw `process.env`.

## Prisma (optional `--prisma` variant)

- `PrismaService extends PrismaClient` in a **Global** `PrismaModule` (`src/modules/prisma/`);
  inject `PrismaService`, never instantiate `PrismaClient` elsewhere.
- Prisma 7: driver adapter (`@prisma/adapter-pg` `PrismaPg`) wired in the service; connection URL
  comes from `prisma.config.ts` — the schema carries **no `url`**.
- Client is generated to `src/modules/prisma/generated` — never edit it; run `pnpm prisma:generate`
  after schema changes (also runs on `postinstall`).

## Tests

- `vitest` (`vitest.config.mjs`), specs under `test/`. Unit-test services by mocking injected deps.

## Common Mistakes

| Mistake | Instead |
|---|---|
| Business logic in a controller | move it to the service |
| `new PrismaClient()` in a module | inject `PrismaService` |
| Raw `process.env` | `ConfigService` |
| Untyped/unvalidated body | DTO class + `class-validator` |
| `url` in `schema.prisma` (v7) | `prisma.config.ts` + adapter |
| Editing prisma `generated/` | `pnpm prisma:generate` |
