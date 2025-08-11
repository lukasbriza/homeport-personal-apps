# Contributing Guide

## 📦 Repository Structure & Tooling

This repository includes a suite of universal Dockerfiles and a custom CLI tool designed to streamline development and deployment.

To launch the CLI, run the following command from the root of the repository:

```bash
pnpm run cli
```

With this CLI, you can:

- Fetch the latest Dockerfiles from the inherited repository
- Update the CLI tool itself

Please ensure you're working with the latest version of both before committing updates.

---

## 🧪 Testing Guidelines

All applications and packages **must be covered by tests**, as long as it makes sense in the given context.

- Include a `test` script in your package's `package.json` so tests can be run globally across services via Docker.
- Aim for automated, reliable, and reproducible tests.
- Use meaningful test cases that reflect real-world usage.

## 🚀 Deployment Structure

Deployment is configured using two distinct Docker Compose files:

- `docker-compose-local.yaml` - for local testing without need of exhausting .env configuration
- `docker-compose-test.yaml` – for testing and QA environments
- `docker-compose-prod.yaml` – for production deployments

Ensure your changes support both environments or clearly specify if they are intended for only one.

---

## ✅ Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This standard makes commit history readable and automates versioning and changelog generation.

**Examples:**

```
feat(cli): add update command for Dockerfiles
fix(api): resolve crash when fetching empty payload
chore(deps): upgrade pnpm to latest version
```

---

## 🧭 Final Notes

- Always create a branch for your feature or fix.
- Keep pull requests focused and small – one purpose per PR.
- Follow clean code principles: readable, maintainable, and testable code.
