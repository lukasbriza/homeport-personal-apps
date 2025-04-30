ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine3.20

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV TURBO_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=true
ENV DOCKER=true

RUN rm -rf /var/cache/apk/*

RUN mirrors="http://mirror.fel.cvut.cz/alpine/ \
             https://mirror1.hs-esslingen.de/pub/Mirrors/alpine/ \
             https://mirror.ibcp.fr/pub/alpine/"; \
    for mirror in $mirrors; do \
        echo "Trying mirror: $mirror"; \
        sed -i "s|http[s]*://[a-zA-Z0-9.-]*/alpine/|$mirror|" /etc/apk/repositories; \
        if apk update && \
        apk add --no-cache \
          libc6-compat \
          bash \
          curl \
          jq; then \
        break; \
      else \
        echo "Mirror $mirror failed, trying next..."; \
      fi; \
  done

RUN npm i -g corepack && \
  corepack enable
RUN rm -rf /var/cache/apk/*

COPY package.json .
RUN corepack prepare "$(jq -r '.packageManager' package.json)" --activate 
RUN rm package.json

WORKDIR /workspace
COPY . .
RUN pnpm install
RUN pnpm turbo build --filter="./packages/*"

ENTRYPOINT ["pnpm", "turbo", "test"]
