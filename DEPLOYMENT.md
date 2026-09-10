# Deployment Guide

This repo has no cluster of its own — everything here deploys onto the k3s cluster
set up in `homeport-infrastructure-apps` (see that repo's `DEPLOYMENT.md` for the
one-time server/cluster setup: k3s, Helm, Infisical, the Infisical Operator,
ArgoCD, cert-renewal). This guide covers deploying and updating an app that lives
in *this* repo.

## What's here

Each `apps/<name>/` folder is one app:

- `actual`, `keycloak`, `seafile` — custom-built or re-tagged images, released via
  a GitHub Actions workflow.
- `homer`, `vaultwarden` — upstream images used as-is, no build step.

Each has a `k8s/chart/` Helm chart and a `docker-compose-local.yaml` for local dev.

## Deploying an app for the first time

1. **Add secrets to Infisical.** Create a folder for the app in the shared
   "Homeport" Infisical project, `prod` environment, with whatever keys its
   `templates/infisical-static-secret.yaml` expects. Note the project ID
   (already `701566fc-6192-4ca5-b01b-b9e5a4c31214` for Homeport).

2. **Fill in `values-prod.yaml`.** Copy `apps/<name>/k8s/chart/values-prod.example.yaml`
   to `values-prod.yaml` if it doesn't already exist, and set the app's hostname
   and Infisical `projectId`/`secretPath`. Nothing in this file is a secret —
   real credentials come from Infisical.

3. **Add an ArgoCD Application.** This repo has no ArgoCD config of its own — add
   a file in `homeport-infrastructure-apps/infrastructure/argocd/k8s/applications/`
   pointing at this repo and `apps/<name>/k8s/chart`. Leave `syncPolicy` without
   `automated` for the first sync so you can verify it manually; add it once
   confirmed:

   ```yaml
   syncPolicy:
     automated:
       prune: true
       selfHeal: true
   ```

4. **Migrate existing data, if any.** SQLite or plain files: `rsync` the old bind
   mount into the new PV's host path (found via
   `kubectl get pv $(kubectl get pvc <name> -n <ns> -o jsonpath='{.spec.volumeName}') -o jsonpath='{.spec.local.path}'`).
   A real RDBMS (Postgres, MariaDB): `pg_dump`/`mysqldump` and restore into the new
   database pod, not a raw data-directory copy.

5. **Issue the TLS cert and verify:**

   ```bash
   kubectl create job --from=cronjob/cert-renewal -n cert-renewal cert-renewal-manual
   kubectl logs -n cert-renewal -l job-name=cert-renewal-manual -f
   kubectl get secret <app>-tls -n <namespace>
   curl -v https://<hostname>
   ```

## Releasing a new image

Only apps with a local Dockerfile (`actual`, `keycloak`, `seafile`) have a build
workflow — see `.github/workflows/<app>-build-push.yml`. Pushing a version tag
builds the image, pushes it to Docker Hub, and commits the bumped tag into that
app's `values.yaml`; ArgoCD picks up the commit from there:

```bash
git tag <app>-v<version>   # e.g. actual-v1.1.0
git push origin <app>-v<version>
```

Apps using an upstream image unmodified (`homer`, `vaultwarden`) have no workflow
— bump the tag in `values.yaml` by hand and commit.
