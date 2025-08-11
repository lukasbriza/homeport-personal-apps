# ARG TO BE DEFINED:
# - TAG
# - APP
# - PORT

# For all available tags look at https://hub.docker.com/repository/docker/lbriza/shared/tags
ARG TAG=base-latest

FROM lbriza/shared:${TAG} AS shared

################################
# Corepack preparation
COPY package.json .
RUN corepack prepare "$(jq -r '.packageManager' package.json)" --activate 
RUN rm package.json

################################
# Setup turbo on the shared image base
FROM shared AS base
RUN npm install turbo --global

WORKDIR /application
RUN pnpm config set store-dir /application/.pnpm-store

################################
# Prune project
FROM base AS pruner
ARG APP

WORKDIR /application
COPY . .
RUN turbo prune @lukasbriza/${APP} --docker

################################
# Build the project
FROM base AS builder
ARG APP

# Copy codestyle configuration files
COPY --from=pruner /application/.npmrc /application/tsconfig.json /application/.eslintrc.cjs /application/.prettierignore /application/prettier.config.js /application/
COPY --from=pruner /application/scripts /application/scripts/

WORKDIR /application

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /application/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /application/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /application/out/json/ .

# Download node prune
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

# First install the dependencies (as they change less often)
RUN --mount=type=cache,id=pnpm,target=/application/.pnpm-store pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /application/out/full/ .

# Build and ceanup
RUN turbo build --filter=@lukasbriza/${APP} && \
    pnpm prune --prod --no-optional && \
    find . -type d \( -name "src" -o -name "test" -o -name "tests" -o -name ".turbo" \) -exec rm -rf {} + && \
    find . -type f -name "*.md" -delete && \
    node-prune && \
    rm -rf $(pnpm store path)

################################
# Final image
FROM shared AS runner
ARG APP
ARG PORT=3000

ENV PORT=${PORT}
ENV TZ=Europe/Prague
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs
USER nextjs

WORKDIR /application
COPY --from=builder --chown=nextjs:nextjs /application . 

WORKDIR /application/apps/${APP}
CMD sh -c "pnpm next start -p ${PORT}"
