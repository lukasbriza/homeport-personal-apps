# Contributing Guide

## 📦 Repository Structure & Tooling

Each `apps/<name>/` folder colocates its Dockerfile (if any), its
`docker-compose-local.yaml` for local dev, and its `k8s/chart/` Helm chart. All
apps here are Docker/Helm config around third-party images — none has application
source to lint or build via `turbo`.

See `DEPLOYMENT.md` for how an app's chart actually gets deployed and updated.

---

## 🧪 Testing Guidelines

All applications and packages **must be covered by tests**, as long as it makes sense in the given context.

- Include a `test` script in your package's `package.json` so tests can be run globally across services via Docker.
- Aim for automated, reliable, and reproducible tests.
- Use meaningful test cases that reflect real-world usage.

## 🚀 Deployment Structure

Everything here runs on **Kubernetes (k3s)** via Helm charts in each app's
`k8s/chart/`. `docker-compose-local.yaml` still exists per app for local dev
before/alongside k3s. There's no shared prod compose file — the ArgoCD
`Application` manifests that deploy these charts live in
`homeport-infrastructure-apps/infrastructure/argocd/k8s/applications/`, not in
this repo. See `DEPLOYMENT.md` for the full loop.

---

## 🏷️ Releasing app images

Apps with a local Dockerfile (`actual`, `keycloak`, `seafile`) release on a
version tag, not on every push:

```bash
git tag <app>-v<version>   # e.g. actual-v1.1.0
git push origin <app>-v<version>
```

This builds the image, pushes it to Docker Hub, and commits the bumped tag into
that app's `values.yaml` — ArgoCD picks it up from there. See
`.github/workflows/actual-build-push.yml` for a working example. Apps using an
upstream image unmodified (`homer`, `vaultwarden`) have no workflow — bump the
tag in `values.yaml` by hand.

---

## ✅ Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This standard makes commit history readable and automates versioning and changelog generation.

**Examples:**

```
feat(seafile): add memcached service
fix(actual): disable service-link env injection
chore(deps): upgrade pnpm to latest version
```

---

## 🧭 Final Notes

- Always create a branch for your feature or fix.
- Keep pull requests focused and small – one purpose per PR.
- Follow clean code principles: readable, maintainable, and testable code.
