FROM lbriza/coincrusade-runner-game:base AS alpine

################################
# Setup turbo on the alpine base
FROM alpine AS base
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

WORKDIR /application/apps/${APP}

# Remove generated prisma client if exists
RUN rm -rf ./src/modules/prisma/generated

# Generate prisma code
RUN pnpm prisma:generate

# Build and ceanup
WORKDIR /application
RUN turbo build --filter=@lukasbriza/${APP}

# Copy libquery_engine-linux-musl-openssl-3.0.x.so.node in deployment folder
RUN cp ./apps/${APP}/src/modules/prisma/generated/libquery_engine-linux-musl-openssl-3.0.x.so.node ./apps/${APP}/build/modules/prisma/generated

RUN --mount=type=cache,id=pnpm,target=/application/.pnpm-store pnpm prune --prod --no-optional
RUN rm -rf ./.turbo && \
    rm -rf ./**/*/src && \
    rm -rf ./**/*/test && \
    rm -rf ./**/*/tests && \
    rm -rf ./**/*/.turbo && \
    rm -rf ./**/*/*.md
RUN node-prune
RUN sh -c "rm -rf $(pnpm store path)"

################################
# Final image
FROM alpine AS runner
ARG APP
ARG PORT=3001

ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"
ENV TZ=Europe/Prague
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /application
COPY --from=builder --chown=nodejs:nodejs /application .

WORKDIR /application/apps/${APP}
EXPOSE ${PORT}
CMD pnpm start -p ${PORT}
