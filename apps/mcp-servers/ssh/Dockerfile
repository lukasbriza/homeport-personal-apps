# syntax=docker/dockerfile:1

# Production image of the SSH MCP server. Same structure as the shared Dockerfiles in `docker/`, but the build context
# is this folder, not the repository root: the server is a standalone package with its own lockfile, outside the pnpm
# workspace, so there is nothing to `turbo prune`.
#
#   docker build -t mcp-ssh:local apps/mcp-servers/ssh
#
# ARG WITH A DEFAULT:
# - NODE_VERSION, ALPINE_VERSION: the base image
#
# The image holds no configuration and no secrets: SSH_HOSTS, MCP_ALLOWED_HOSTS and MCP_PORT come from the environment
# at run time (see README.md).

ARG NODE_VERSION=22.22.3
ARG ALPINE_VERSION=3.22

################################
# Toolchain: Node and pnpm (the version of pnpm comes from `packageManager` of package.json)
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

################################
# Build: every dependency, then the compiled server in `dist/`
FROM base AS build

# Manifests apart from sources, so the dependency layer does not change with the code
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-workspace

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

################################
# Production dependencies only: no TypeScript, no tsx, no type packages
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
# pnpm skips the install scripts of dependencies; ssh2 then uses its pure-JS crypto instead of an optional native one
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-workspace --prod

################################
# Runtime: compiled code and production dependencies, no pnpm and no sources
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Read-only for the user the server runs as; package.json is needed for `"type": "module"`
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Non-root. In the cluster the chart sets its own uid (`runAsUser`, default 10001), which can read these files too.
USER node

# Default of MCP_PORT
EXPOSE 9600

# No HEALTHCHECK: Kubernetes ignores it and probes the port instead (see the chart). Node itself is the main process,
# so it receives SIGTERM and main.ts closes the SSH sessions before exiting.
CMD ["node", "dist/main.js"]
