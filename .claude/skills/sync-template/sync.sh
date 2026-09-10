#!/usr/bin/env bash
# Sync template-owned files from @lukasbriza/monorepo-template into this project.
# Reviewable 3-way merge; never touches apps/* or packages/*.
set -euo pipefail

TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-template}"
TEMPLATE_URL="${TEMPLATE_URL:-https://github.com/lukasbriza/monorepo-template}"
TEMPLATE_BRANCH="${TEMPLATE_BRANCH:-master}"
REF_FILE=".claude/.template-ref"

# Paths the template owns. Everything else (apps/*, packages/*) is yours.
OWNED=(
  ".claude"
  "turbo/generators"
  "docker"
  ".husky"
  ".editorconfig"
  ".npmrc"
  ".nvmrc"
  ".eslintrc.cjs"
  ".eslintignore"
  ".prettierignore"
  "turbo.json"
  "tsconfig.json"
  "commitlint.config.js"
  "lint-staged.config.js"
  "prettier.config.js"
)

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

if ! git remote get-url "$TEMPLATE_REMOTE" >/dev/null 2>&1; then
  echo "Adding remote '$TEMPLATE_REMOTE' -> $TEMPLATE_URL"
  git remote add "$TEMPLATE_REMOTE" "$TEMPLATE_URL"
fi

git fetch --quiet "$TEMPLATE_REMOTE" "$TEMPLATE_BRANCH"
NEW_REF="$(git rev-parse "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH")"

if [[ -f "$REF_FILE" ]]; then
  LAST_REF="$(cat "$REF_FILE")"
else
  # First sync: diff from the template's root commit so the full owned tree is offered.
  LAST_REF="$(git rev-list --max-parents=0 "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH" | tail -1)"
fi

if [[ "$LAST_REF" == "$NEW_REF" ]]; then
  echo "Already up to date with template ($NEW_REF)."
  exit 0
fi

PATCH="$(git diff "$LAST_REF" "$NEW_REF" -- "${OWNED[@]}")"
if [[ -z "$PATCH" ]]; then
  echo "No changes on owned paths between $LAST_REF and $NEW_REF. Recording ref."
  mkdir -p "$(dirname "$REF_FILE")"
  echo "$NEW_REF" >"$REF_FILE"
  exit 0
fi

BRANCH="chore/template-sync-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH"

set +e
echo "$PATCH" | git apply --3way --whitespace=nowarn
STATUS=$?
set -e

mkdir -p "$(dirname "$REF_FILE")"
echo "$NEW_REF" >"$REF_FILE"
git add -A

if [[ $STATUS -eq 0 ]]; then
  echo "Template delta applied cleanly on branch '$BRANCH'."
else
  echo "Applied with conflicts — resolve the markers, then 'git add' the files."
fi
echo "Review the diff, then: git commit -m \"chore: sync template $(date +%F)\""
