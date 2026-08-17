# Development environment — one consistent Linux toolchain to develop against,
# regardless of host OS. Consumed by `.devcontainer/devcontainer.json`.
#
# This is NOT a ship image: no app code is copied in. The repo is bind-mounted at
# /workspace and `node_modules` / the pnpm store live on named volumes (fast, and
# never touching the host filesystem). The images that actually get deployed are
# the per-runtime Dockerfiles next to this one (nextjs/, node/, postgres/, ...).
FROM node:22-bookworm

# git is required by husky hooks; ca-certificates for registry TLS.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm via corepack, pinned to the repo's `packageManager`.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Pre-create the paths backed by named volumes so the volumes inherit `node`
# ownership on first mount (otherwise they'd be root-owned and installs fail).
RUN mkdir -p /workspace/node_modules /home/node/.pnpm-store \
  && chown -R node:node /workspace /home/node

USER node
ENV PNPM_HOME=/home/node/.local/share/pnpm \
    PATH=/home/node/.local/share/pnpm:/home/node/.local/share/pnpm/bin:$PATH

# Point the pnpm store at its own volume. Written straight to ~/.npmrc on purpose:
# `pnpm config set --global` refuses to run until the global bin dir is on PATH,
# which is pointless indirection inside an image.
RUN printf 'store-dir=/home/node/.pnpm-store\n' > /home/node/.npmrc

WORKDIR /workspace
