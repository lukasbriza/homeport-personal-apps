# CLAUDE.md — homeport-personal-apps

Durable context for this repo. Keep it tight and high-signal; full procedures live in
`DEPLOYMENT.md` (server setup) and `CONTRIBUTING.md` (repo conventions) — read those
before making changes, don't duplicate their content here.

## What this repo is

Personal self-hosted apps for homeport, deployed to a single-node k3s cluster. Unlike
`homeport-infrastructure-apps`, this repo is entirely Docker/Helm config around
third-party images (`actual`, `homer`, `keycloak`, `seafile`, `vaultwarden`) — no app
here has real application source to lint or build via `turbo`.

## Repository structure

Each `apps/<name>/` folder colocates:
- `Dockerfile` (only if the image needs a custom build/re-tag — several apps just use
  the upstream image directly, e.g. `seafile`, no local Dockerfile at all)
- `docker-compose-local.yaml` for local dev (kept even after k3s migration)
- `k8s/chart/` — the app's Helm chart: `values.yaml` (safe defaults, committed),
  `values-prod.yaml` (real values, also committed — nothing in it is a secret, real
  credentials come from Infisical), `values-prod.example.yaml` (template for the above)

The ArgoCD `Application` manifests that deploy these charts live in the **other**
repo, `homeport-infrastructure-apps/infrastructure/argocd/k8s/applications/` — this
repo has no ArgoCD config of its own, just what gets deployed.

## GitOps loop

Apps with a custom Docker image release on a **version tag** (`<app>-v<version>`, e.g.
`keycloak-v1.0.0`), not on every push — see `.github/workflows/*-build-push.yml`.
Pushing the tag builds the image, pushes it to Docker Hub, and commits the bumped tag
into that app's `values.yaml`; ArgoCD (watching from `homeport-infrastructure-apps`)
picks up the commit from there. Apps that only ever use an upstream image unmodified
(no local Dockerfile) have no build workflow — bump the tag in `values.yaml` by hand.

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
