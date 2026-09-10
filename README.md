# Homeport personal apps

Personal self-hosted apps for Lukáš Bříza's homeport home lab, deployed onto the
k3s cluster set up in `homeport-infrastructure-apps`.

## 🧭 Overview

- **actual** — Personal finances manager
- **homer** — Homepage/dashboard
- **keycloak** — Identity and access management
- **seafile** — File sync and sharing
- **vaultwarden** — Password manager

## Structure

Each `apps/<name>/` folder colocates its Dockerfile (if any), its
`docker-compose-local.yaml` for local dev, and its `k8s/chart/` Helm chart. The
ArgoCD `Application` manifests that deploy these charts onto the cluster live in
`homeport-infrastructure-apps/infrastructure/argocd/k8s/applications/`, not here.

## CI/CD

Apps with a custom Docker image (`actual`, `keycloak`, `seafile`) build and
release through GitHub Actions, triggered by a version tag rather than every
push — see [CONTRIBUTING.md](CONTRIBUTING.md#-releasing-app-images).

## 📘 Additional Documentation

- 🛠️ **Contributing**: see [CONTRIBUTING.md](CONTRIBUTING.md) for repo structure, testing, releasing images, and commit conventions.
- 🚀 **Deployment**: see [DEPLOYMENT.md](DEPLOYMENT.md) for deploying and updating apps on k3s.
