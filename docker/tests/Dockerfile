# ARG TO BE DEFINED:
# - NODE_VERSION (optional, default 22)

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS shared

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    TURBO_TELEMETRY_DISABLED=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=4096" \
    CI=true \
    DOCKER=true

RUN apk add --no-cache libc6-compat bash curl jq && \
    npm i -g corepack && \
    corepack enable

COPY package.json .
RUN corepack prepare "$(jq -r '.packageManager' package.json)" --activate 
RUN rm package.json

WORKDIR /workspace
COPY . .
RUN pnpm install
RUN pnpm turbo build --filter="./packages/*"

ENTRYPOINT ["pnpm", "turbo", "test"]
