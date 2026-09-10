---
name: sync-template
description: Pull updates from @lukasbriza/monorepo-template into a project scaffolded from it — .claude/, shared configs, docker, husky, and turbo generators — via a reviewable 3-way merge that preserves local edits. Use when the user says "sync template", "update from template", "pull template changes", "upgrade the template", or "refresh the AI workflow". Never blindly overwrites; applies only the template's delta since the last sync recorded in .claude/.template-ref. Does not touch apps/* or packages/*.
---

# Sync from monorepo-template

Brings template-owned files up to date in a project created from
`@lukasbriza/monorepo-template`, without clobbering local changes. Your `apps/*` and
`packages/*` are never touched.

## When to use

- The template gained new/updated skills, agents, hooks, configs, docker, or generators.
- Upgrading an older scaffolded project to the current template.

## How it works

The template is a git remote (`template`). The last synced commit is stored in
`.claude/.template-ref`. Sync computes the template's diff on *owned paths* since that
ref and applies it with `git apply --3way`, so local edits survive and genuine
conflicts surface as normal merge conflict markers.

## Owned paths (maintained by the template)

`.claude/`, `turbo/generators/`, `docker/`, `.husky/`, and root config files
(`turbo.json`, `tsconfig.json`, `prettier.config.js`, `commitlint.config.js`,
`lint-staged.config.js`, `.eslintrc.cjs`, `.editorconfig`, `.npmrc`, `.nvmrc`, ignore
files). Edit conventions in the template, not in scaffolded copies, so they propagate.

## Procedure

1. From the project root, run:

   ```bash
   bash .claude/skills/sync-template/sync.sh
   ```

2. The script creates a `chore/template-sync-*` branch and applies the delta.
3. Review the diff. Resolve any conflict markers (your edit vs. the template change).
4. Commit and open a PR:

   ```bash
   git commit -m "chore: sync template $(date +%F)"
   ```

## Notes

- First run (no `.template-ref`) offers the full owned tree from the template's first
  commit — review carefully before committing.
- Override source with `TEMPLATE_REMOTE` / `TEMPLATE_URL` / `TEMPLATE_BRANCH` env vars.
- Refuses to run on a dirty working tree — commit or stash first.
- Never edits `apps/*` or `packages/*`.
