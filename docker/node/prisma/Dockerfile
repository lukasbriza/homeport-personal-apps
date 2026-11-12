# syntax=docker/dockerfile:1

# Production image of a NestJS app with Prisma 7 (the `pg` driver adapter, the client generated into `src/`,
# `prisma.config.ts`; there is no query engine binary, so this is not for Prisma 6 and older). The build context is the
# repository root (turbo prune needs the whole workspace):
#
#   docker build -f docker/node/prisma/Dockerfile --build-arg APP=<name> -t <name>:local .
#
# ARG TO BE DEFINED:
# - APP (required): the name of the app, `apps/<APP>` with the package `@lukasbriza/<APP>`
# ARG WITH A DEFAULT:
# - NODE_VERSION, ALPINE_VERSION: the base image, the Node must be 22.12 or newer
# - APP_FOLDER (apps): the folder of the app in the workspace
# - PORT (3000): the port the server listens on
#
# The image holds no configuration and no secrets: everything comes from the environment at run time. Besides the
# server (the default command) it can apply the migrations, which never run on start:
#
#   node node_modules/prisma/build/index.js migrate deploy      (working directory /app/<APP_FOLDER>/<APP>)

ARG NODE_VERSION=22.22.3
ARG ALPINE_VERSION=3.22

################################
# Toolchain: Node and pnpm (the version of pnpm comes from `packageManager` of the root package.json)
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

################################
# Pruned workspace: only the app and the packages it depends on, manifests apart from sources so the dependency
# layers below do not change with the code
FROM base AS pruner

ARG APP
ENV TURBO_TELEMETRY_DISABLED=1

RUN test -n "${APP}" || { echo "The build argument APP is required, e.g. --build-arg APP=coffra-be" >&2; exit 1; }

# The same turbo as the repository uses
COPY package.json ./
RUN npm install --global "turbo@$(node -p "require('./package.json').dependencies.turbo")"

COPY . .
RUN turbo prune "@lukasbriza/${APP}" --docker

################################
# Build: every dependency, the Prisma client, the compiled app
FROM base AS build

ARG APP
ARG APP_FOLDER=apps

COPY --from=pruner /app/out/json/ ./

# No lifecycle scripts: the `postinstall` of the app generates the Prisma client, which needs the schema that is not
# here yet. The client is generated explicitly below.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ ./

WORKDIR /app/${APP_FOLDER}/${APP}
RUN pnpm run prisma:generate && pnpm run build

################################
# Production dependencies of the app only: `deploy` installs them into a folder of their own, so neither the
# dependencies of the workspace root (commit and lint tooling) nor the dev dependencies of the app come along
FROM base AS prod-deps

ARG APP

COPY --from=pruner /app/out/json/ ./

# pnpm adds the dependencies of the workspace root to every install, and the root lists tooling only (commit hooks,
# lint, turbo). The root is not part of what runs, so they are dropped; the versions still come from the lockfile.
RUN npm pkg delete dependencies

# The peers of Prisma Studio (React) are missing on purpose: the studio is never started
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm --filter "@lukasbriza/${APP}" --config.strict-peer-dependencies=false deploy --prod --ignore-scripts /prod

# The one install script that is needed: the one of `@prisma/engines` downloads the schema engine (migrations). Run
# directly, because `pnpm rebuild <package>` does nothing after a deploy without scripts and a plain `pnpm rebuild`
# also runs the `postinstall` of the app, which needs the schema.
RUN <<'EOF'
set -e
cd /prod
node -e '
const path = require("node:path")
const prisma = path.dirname(require.resolve("prisma/package.json"))
const engines = path.dirname(require.resolve("@prisma/engines/package.json", { paths: [prisma] }))
require("node:child_process").execFileSync(process.execPath, ["scripts/postinstall.js"], { cwd: engines, stdio: "inherit" })
'
EOF

################################
# Runtime: compiled code, production dependencies, the schema and migrations
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

ARG APP
ARG APP_FOLDER=apps
ARG PORT=3000

ENV NODE_ENV=production \
    PORT=${PORT}

WORKDIR /app/${APP_FOLDER}/${APP}

# Read-only for the user the server runs as
COPY --from=prod-deps /prod/node_modules ./node_modules
COPY --from=build /app/${APP_FOLDER}/${APP}/build ./build
COPY --from=pruner /app/out/full/${APP_FOLDER}/${APP}/package.json /app/out/full/${APP_FOLDER}/${APP}/prisma.config.ts ./
COPY --from=pruner /app/out/full/${APP_FOLDER}/${APP}/prisma ./prisma

USER node

EXPOSE ${PORT}

# Node is the one tool the image is certain to have; `/api/health` answers 503 when the database does not
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/api/health`, { signal: AbortSignal.timeout(4000) }).then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"]

# Node itself is the main process, so it receives SIGTERM
CMD ["node", "build/main"]
