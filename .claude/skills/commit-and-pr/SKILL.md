---
name: commit-and-pr
description: Use when committing changes or opening a pull request in this repo — writing a commit message, staging and committing, or creating a PR. Ensures messages pass the Conventional Commits commit-msg hook (@commitlint/config-conventional) and PRs follow a consistent shape. Trigger on "commit this", "commit and push", "open a PR", "create a pull request".
---

## Overview

Commits here are validated by a husky `commit-msg` hook running `@commitlint/config-conventional`,
and `pre-commit` runs `lint-staged`. Write the message correctly the first time so the hook passes;
don't fight the hooks or bypass them with `--no-verify`.

**Sandboxed environments:** if the hook can't run at all (e.g. `.husky/_/husky.sh` missing in a
throwaway checkout), `--no-verify` is fine — that's a broken hook installation, not a message you're
trying to sneak past. Still write the message as if the hook would check it.

## When to Use

- Turning finished work into one or more commits
- Writing a commit message that must pass commitlint
- Opening a PR for a branch

## Commit procedure

1. `git status` + `git diff` — know exactly what changed. Don't stage blindly.
2. Group into **logical commits** (one concern each); split unrelated changes.
3. Stage (`git add <paths>`), then commit. `pre-commit` (lint-staged) auto-fixes staged files —
   if it modifies files, re-stage and commit again.
4. Never `git add .` sweeping in unrelated changes; never commit `.env*`, `values-prod.yaml` secrets,
   or anything `kubectl create secret` should own instead.
5. Do **not** use `--no-verify` to skip a *working* hook. If a hook fails, fix the cause.

> **No AI attribution.** Commit as the user: never add `Co-Authored-By: Claude`, a "Generated with
> Claude Code" footer, or any mention of AI in the message. (`.claude/settings.json` sets
> `includeCoAuthoredBy: false`, but hold this rule regardless of client.)

## Message format (Conventional Commits)

`type(scope)?: subject` — scope optional, then optional body/footer after a blank line.

| Rule (enforced) | Requirement |
|---|---|
| type | one of the table below, lower-case |
| subject | present, **lower-case start**, imperative, **no trailing period** |
| header | `type(scope): subject` ≤ **100 chars** |
| body / footer | separated from header by a **blank line** |
| breaking change | footer `BREAKING CHANGE: …`, or `type!:` in header |

| type | use for |
|---|---|
| `feat` | new capability (a new app, a new chart, a new workflow) |
| `fix` | bug fix |
| `refactor` | code/manifest change that isn't a feat or fix |
| `docs` | docs / comments / CLAUDE.md / README / DEPLOYMENT.md |
| `build` | dependency bumps, tsconfig/eslint/prettier config |
| `ci` | GitHub Actions workflow changes |
| `chore` | tooling, repo layout, `.claude` upkeep |
| `style` | formatting only (no logic/behavior change) |
| `revert` | reverting a prior commit |

Scope, when used, is the app or area: `feat(seafile): …`, `fix(ghostfolio): …`, `chore(actual): …`.
Keep it short and lower-case — see `CONTRIBUTING.md` for more examples.

```
feat(seafile): add memcached deployment

Referenced via MEMCACHED_HOST in both compose files but never actually
defined as a service in either — added as a real Deployment in the chart.
```

## Pull request procedure

1. Push the branch (`git push -u origin <branch>`).
2. Open the PR with `gh` **if available** (`gh pr create`); otherwise print the title + body for
   the user to paste. Check with `gh --version` first — don't assume it's installed.
3. **Title**: Conventional-Commits style, same rules as a commit header (it becomes the squash
   subject).
4. **Body** — keep it tight:

```
## What
<one or two sentences: what changed and why>

## How to verify
<commands / steps a reviewer runs: kubectl get pods, argocd app sync, manual check>

## Notes
<risks, follow-ups, breaking changes — omit if none>
```

5. The PR title and body are authored **as the user** — no Claude/AI attribution anywhere in
   the title, body, or trailers.

## Common Mistakes

| Mistake | Instead |
|---|---|
| `Fix: Bug` / `Fixed bug.` | `fix: correct …` (lower type, lower subject, no period) |
| Header > 100 chars | shorten; move detail to the body |
| One commit mixing feat + refactor + docs | separate commits |
| `git commit --no-verify` on a working hook | fix what the hook flags |
| `git add .` then commit | stage explicit paths |
| PR title in sentence case | Conventional-Commits header |
| `Co-Authored-By: Claude` / "Generated with Claude Code" | omit — commit/PR as the user |
