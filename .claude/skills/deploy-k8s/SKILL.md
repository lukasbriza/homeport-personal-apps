---
name: deploy-k8s
description: Use when adding Kubernetes (k3s + Helm + ArgoCD) deployment to an app in this monorepo — creating apps/<name>/k8s/chart, a GHCR build-push GitHub workflow, Infisical secrets wiring, an Ingress/TLS host, an ArgoCD Application manifest for hand-off, or when asked to "deploy to k8s", "add helm chart", "release image", "homeport".
---

# Deploy an app to the homeport k3s cluster

You only see this repo. The cluster and the GitOps repo are managed elsewhere and are
**not visible to you**. Do not search for them and do not guess their contents. Everything
you need is in this skill and in [references/templates.md](references/templates.md).

## Cluster facts (given, do not verify)

| Fact | Value |
|---|---|
| Cluster | single-node k3s, Helm charts, GitOps via ArgoCD |
| Ingress | Traefik, `ingressClassName: traefik` |
| Storage | StorageClass `local-path` (reclaim policy `Delete`) |
| TLS | issued by a cluster `cert-renewal` job, Secret named `<name>-tls` |
| Secrets | Infisical Kubernetes Operator, shared auth ref `homeport-infisical-auth` in namespace `infisical-system` |
| Infisical | project "Homeport", environment `prod`, one folder per app: `/<name>` |
| Registry | `ghcr.io/lukasbriza/<name>` |
| ArgoCD server | `argocd.lukasbriza.eu` (gRPC-web), token in GitHub secret `ARGOCD_AUTH_TOKEN` |
| Namespace | `<name>`, created by ArgoCD (`CreateNamespace=true`) |
| Tracked branch | `master` |

## What lives where

| Place | Content | Who creates it |
|---|---|---|
| This repo: `apps/<name>/k8s/chart/` | Helm chart | you |
| This repo: `.github/workflows/<name>-build-push.yml` | build, push, tag bump, ArgoCD sync | you |
| Infra repo: `applications/<name>.yaml` | ArgoCD `Application` | **the user**, from the manifest you print |
| Infisical `prod` `/<name>` | real secrets | **the user** |

Never create ArgoCD or cluster resources in this repo.

## Procedure

1. **Gather inputs.** If missing, ask: app name, container port, health endpoint path,
   hostname, stateful or not, env vars the app needs (split secret / non-secret).
2. **Chart.** Create `apps/<name>/k8s/chart/` from the templates. Use `{{ .Release.Name }}`
   for resource names. Always set `enableServiceLinks: false`. Drop PVC files if stateless.
3. **Values.** `values.yaml` has safe defaults and no secrets. `values-prod.yaml` (hostname,
   Infisical `projectId` and `secretPath`) is committed too. Ask the user for the project ID.
4. **Secrets.** Add `infisical-static-secret.yaml` behind `infisical.enabled`. Output the
   list of Infisical keys the user must create under `/<name>`.
5. **Workflow.** Create the build-push workflow from the template. Verify the image builds
   locally before the first tag (see "Image build").
6. **Hand-off.** Print the ArgoCD `Application` manifest (template) for the user to add to
   the infra repo. State plainly that this step is theirs and blocks the first deploy.
7. **First release (user runs):**
   ```bash
   git tag <name>-v0.1.0 && git push origin <name>-v0.1.0
   ```
   Then: set the GHCR package to **Public** (first push creates it private, the cluster has
   no pull secret), and trigger cert issuance and verify:
   ```bash
   kubectl create job --from=cronjob/cert-renewal -n cert-renewal cert-renewal-manual
   kubectl get secret <name>-tls -n <name>
   curl -v https://<hostname>
   ```

## Releasing later

`git tag <name>-v<version> && git push origin <name>-v<version>`. The workflow builds,
pushes, writes the new tag into `values.yaml`, commits to `master` and syncs ArgoCD.

## Image build

This is a turbo monorepo, so the Docker context is the repo root, not `apps/<name>`.
Use `docker/node/Dockerfile` (build args `APP`, `PORT`; it runs `turbo prune`). Apps with
Prisma may need `docker/node/prisma/Dockerfile`. Check which one the app needs and read it
before writing the workflow. Prisma migrations in the cluster (init container or Job) are
not covered here. Decide per app and record it in the app's `CLAUDE.md`.

## Gotchas

- **`enableServiceLinks: false`.** A Service named `foo` makes kubelet inject `FOO_PORT=tcp://…`.
  Apps that read `FOO_PORT` as a number crash. Fix this flag, do not rename the Service.
- **Hostname conflict (user check before cutover).** An old ad hoc `legacy-proxy` namespace
  may hold an Ingress for the same host. Two Ingresses for one host break TLS and routing.
  Ask the user to run `kubectl get ingress -A | grep <hostname>` and delete the old one.
- **PVC.** Every standalone PVC needs `helm.sh/resource-policy: keep`.
- **Data migration.** Files or SQLite: `rsync` into the PV host path. Postgres or MariaDB:
  dump and restore. Never copy a database data directory.
- **Replicas.** Keep `replicas: 1` for stateful apps on a `ReadWriteOnce` PVC.
- **YAML comments** are technical only. No migration phases, task numbers or process narrative.
- **Commits:** Conventional Commits, e.g. `feat(<name>): add helm chart`.

## Do not

- Look for or reference files in other repositories.
- Put real credentials in `values*.yaml`.
- Add `syncPolicy.automated` to the hand-off manifest. The user enables it after one manual sync works.
- Edit this skill in a scaffolded copy. Edit it in the template, then run `sync-template`.
