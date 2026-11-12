# CLAUDE.md — homeport-personal-apps

Durable context for this repo. Keep it tight and high-signal; full procedures live in
`DEPLOYMENT.md` (server setup) and `CONTRIBUTING.md` (repo conventions) — read those
before making changes, don't duplicate their content here.

## What this repo is

Personal self-hosted apps for homeport, deployed to a single-node k3s cluster. Mostly
Docker/Helm config around third-party images (`actual`, `donetick`, `homer`,
`keycloak`, `seafile`, `vaultwarden`, `wishlist`, the `email` MCP server). The only own
application source is an MCP server with its own code under `apps/mcp-servers/<name>/`
(e.g. `ssh`, TypeScript) — a standalone package with its own lockfile, outside the pnpm
workspace, built and tested by its release workflow, not by `turbo`.

## Repository structure

Each `apps/<name>/` folder colocates:

- `Dockerfile` (only if the image needs a custom build/re-tag — several apps just use
  the upstream image directly, e.g. `seafile`, no local Dockerfile at all)
- `docker-compose-local.yaml` for local dev (kept even after k3s migration) and, for
  several apps, a bind-mounted `local_data/` holding that local dev instance's real
  state (SQLite files, a Postgres data directory, uploaded blobs) — not source, never
  meant to be read or graphed
- `k8s/chart/` — the app's Helm chart: `values.yaml` (safe defaults, committed),
  `values-prod.yaml` (real values, also committed — nothing in it is a secret, real
  credentials come from Infisical), `values-prod.example.yaml` (template for the above)

`apps/mcp-servers/` is one chart for several MCP servers behind a token gateway. Each
server is one `k8s/chart/servers/<name>.yaml` — read via `.Files.Glob`, so it must live
inside the chart. A server with its own code keeps `Dockerfile` and sources in
`apps/mcp-servers/<name>/` (outside the chart) and releases on `mcp-<name>-v<version>`.

The ArgoCD `Application` manifests that deploy these charts live in the **other**
repo, `homeport-infrastructure-apps/infrastructure/argocd/k8s/applications/` — this
repo has no ArgoCD config of its own, just what gets deployed.

`turbo/generators/` and `templates/*` are inherited from the monorepo-template this
repo was scaffolded from — they scaffold new **JS/TS** apps/packages and aren't used
here. A new app is added by copying an existing app's `k8s/chart` folder (see
`DEPLOYMENT.md`/`CONTRIBUTING.md`) or with the `deploy-k8s` skill, never via
`pnpm turbo gen`.

## GitOps loop

Nothing deploys on a plain push: every ArgoCD `Application` (in
`homeport-infrastructure-apps`) has automated sync off. A deploy is a **tag push**, and
every workflow ends with `argocd app sync`:

- `<app>-v<version>` on an app with a local Dockerfile (`<app>-build-push.yml`, e.g.
  `keycloak-v1.0.0`) builds the image, pushes it to GHCR (`ghcr.io/lukasbriza/<app>`)
  and commits the bumped tag into the chart's `values.yaml` on `master`.
- `mcp-<name>-v<version>` does the same for an MCP server with its own code
  (`mcp-<name>-build-push.yml`); the bump lands in
  `apps/mcp-servers/k8s/chart/servers/<name>.yaml`.
- `<app>-v*` on an upstream-image app (`<app>-deploy.yml`) only syncs; the tag carries
  no version. Bump the image tag in `values.yaml` (or `servers/<name>.yaml`) by hand
  first.

## Secrets

Real credentials come from Infisical via the Infisical Kubernetes Operator
(`InfisicalStaticSecret` + `infisical.enabled` toggle in each chart's `values.yaml`),
one folder per app in the shared "Homeport" Infisical project. Falls back to a plain
`kubectl`-created Secret (values from `values.yaml`) when `infisical.enabled: false` —
useful for local testing, never used in prod.

## Known gotchas

- **legacy-proxy hostname conflicts**: not-yet-migrated apps are still fronted by an
  ad hoc `legacy-proxy` namespace (untracked by any repo). When cutting an app over to
  k3s, check `kubectl get ingress -A | grep <hostname>` and delete the matching
  `legacy-proxy` Ingress — two Ingress objects for the same host breaks TLS issuance
  (`cert-renewal` in the infra repo dedupes by hostname, not by namespace/secretName)
  and Traefik routing. Hit and fixed identically for homer, keycloak, and actual.
- **Kubernetes Service-name collisions**: naming a Service the same as an app's own
  env var (e.g. Service `actual` vs. actual-server's own `ACTUAL_PORT` config var)
  triggers kubelet's legacy Docker-links env injection (`ACTUAL_PORT=tcp://...`),
  which crashes apps that read that var as a bare port number. Fix: `enableServiceLinks:
false` on the pod spec, not a rename.

## Common tasks

Root scripts run through Turborepo across every workspace (`apps/*`, `packages/*`) —
but no `apps/*` workspace has lint/build/test scripts, so only `packages/*` (the shared
config packages) and the repo's own root-level files actually do anything:

```
pnpm lint       # turbo lint (--no-daemon) | pnpm lint:fix
pnpm ts         # turbo typecheck
pnpm format     # prettier --write "**/*.{ts,tsx,md}"
pnpm build      # turbo build — no-op outside packages/*
pnpm test       # turbo test — no-op, no workspace has tests
pnpm dev        # turbo dev  — no-op, nothing has a dev server
```

An MCP server with its own code is built and tested from its own folder:

```
cd apps/mcp-servers/ssh && pnpm install --ignore-workspace && pnpm build && pnpm test
```

## AI workflow

`.claude/` (skills, agents, commands, hooks) is inherited from the monorepo-template
and kept in sync via the `sync-template` skill (`.claude/skills/sync-template`). Most
of the synced skills (`coding-conventions`, `web-performance`, `native-performance`)
target React/Next/Nest/Expo code and don't apply here; the generic ones do —
`commit-and-pr` (Conventional Commits), `plan-project`, `writing-skills`, and
`deploy-k8s` (chart, release workflow, Infisical, ArgoCD hand-off; every app here is
its "Upstream image" or "Local Dockerfile" type, none is a turbo app). Edit synced skills in
monorepo-template, never here — a local edit or delete breaks the next `sync-template`
(`git apply --3way` is atomic, one failed file drops the whole delta).

- **Knowledge graph (graphify)**: the `graphifyy` CLI (installed per-machine —
  `pip install graphifyy`) builds a queryable graph of this repo into `graphify-out/`
  (gitignored, regenerable — never commit it). Build via the **terminal CLI**
  (`graphify .`), never through an agent — with no external key it falls back to using
  the _host agent itself_ as its LLM, which burns Claude session quota summarizing
  every file.
  - **Code-only by default.** This repo's `.graphifyignore` excludes docs/images (so
    the build is AST-only — no LLM, no API key, no token cost) _and_ every app's
    `local_data/` — real bind-mounted dev state (SQLite/Postgres files, blobs), not
    source. `.graphifyignore` **replaces** `.gitignore` for graphify rather than
    merging with it — keep both in sync if you add a new ignored path.
  - **Query instead of reading the graph**: `graphify query "…"`, `graphify path A B`,
    `graphify explain <node>`. Never read `graph.json`/`graph.html` directly into
    context (~1 MB each).

## Conventions

- No migration-phase, task-number, or process-narrative language in YAML/config
  comments — only technical rationale or a description of what the field/app is.
- Conventional Commits, enforced by commitlint (`husky` `commit-msg` hook).
- `helm.sh/resource-policy: keep` on every standalone PVC (not on StatefulSet
  `volumeClaimTemplates`, which Helm doesn't track) — local-path's reclaim policy is
  `Delete`, so this is what stops `helm uninstall` from wiping real data.
- Data migrations from the old Docker Compose stack: SQLite/plain files → `rsync`
  the bind-mount into the new PV's host path; a real RDBMS (Postgres, MariaDB) →
  `pg_dump`/`mysqldump` and restore, not a raw data-directory copy.
- Low-traffic apps can opt into scale-to-zero (KEDA's HTTP Add-on, installed
  cluster-wide from `homeport-infrastructure-apps`' `core/keda`) instead of running
  24/7 — `scaleToZero.*` in a chart's `values.yaml`; see `apps/wishlist` for the
  reference implementation and that repo's `DEPLOYMENT.md` for how it works. Not a
  fit for anything with long-lived connections (SSE/WebSocket) or that other apps
  depend on for auth.
