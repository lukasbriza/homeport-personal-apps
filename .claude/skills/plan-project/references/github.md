# GitHub playbook (plan-project, Phase 5)

Writing the plan to GitHub. Projects v2 are owned by a **user or org** and *linked* to a repo.
`gh project` needs the **`project`** token scope. Flags vary slightly by `gh` version — when
unsure, run `gh <command> --help` rather than guessing.

## Mechanism — MCP first, then `gh`

Pick at runtime by what is connected:

1. **A GitHub MCP connector is connected** → prefer it. Probe once to learn the exact tool
   names/shapes (they differ per provider), then use its tools for list/create Project, create
   issue, add issue to Project, pin. The step sequence below (find-or-create Project → roadmap
   issue → issue per task → add to Project) is identical — only the calls change.
2. **No GitHub MCP, but `gh` is installed + authed** → use the `gh` playbook below.
3. **Neither** → Phase 5 fallback: present the plan + task list in chat and offer to create
   everything once GitHub access (a connector or `gh auth login`) is set up.

Note: the managed connector registry does not currently include GitHub; an MCP path means a
self-hosted `github-mcp-server` configured in `.mcp.json`. `gh` remains the zero-setup default.

## 0. Preconditions (`gh` path)

```bash
gh --version                 # gh installed?
gh auth status               # authed? do the listed scopes include 'project'?
```

- Missing `project` scope → `gh auth refresh -s project` (opens a browser; tell the user).
- No `gh` and no GitHub MCP → use the Phase 5 fallback (present plan in chat, offer to create later).

Resolve owner + repo from the current remote:

```bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
```

## 1. Find or create the Project

```bash
# Existing projects for the owner — match by the repo name / agreed title:
gh project list --owner "$OWNER" --format json -q '.projects[] | {number, title}'
```

- Match found → reuse that `number`.
- No match → create, re-read the number (robust across gh versions), then link to the repo:

```bash
gh project create --owner "$OWNER" --title "$REPO"
NUMBER=$(gh project list --owner "$OWNER" --format json \
  -q ".projects[] | select(.title==\"$REPO\") | .number")
gh project link "$NUMBER" --owner "$OWNER" --repo "$OWNER/$REPO"
```

Optionally record a one-line roadmap as the Project description (skip if the flag is absent in the
installed gh — the tracking issue below is the canonical place):

```bash
gh project edit "$NUMBER" --owner "$OWNER" --description "<one-line roadmap>" 2>/dev/null || true
```

## 2. Roadmap tracking issue

One issue holding milestones/roadmap as a checklist; pin it. Use `--body-file` (a temp file) for
multi-line bodies — safer than `--body` with shell quoting, especially on Windows.

```bash
ROADMAP_URL=$(gh issue create --repo "$OWNER/$REPO" \
  --title "Roadmap: <project>" --body-file /tmp/roadmap.md)
gh issue pin "$ROADMAP_URL" --repo "$OWNER/$REPO"
```

## 3. One issue per task, added to the Project

```bash
# Ensure labels exist (idempotent — ignore "already exists"):
gh label create feat    --repo "$OWNER/$REPO" --color 0e8a16 2>/dev/null || true
gh label create phase-1 --repo "$OWNER/$REPO" --color 5319e7 2>/dev/null || true

# gh issue create prints the new issue URL to stdout — capture it:
URL=$(gh issue create --repo "$OWNER/$REPO" \
  --title "<task title>" --body-file /tmp/task-01.md \
  --label feat --label phase-1)

gh project item-add "$NUMBER" --owner "$OWNER" --url "$URL"
```

- Create issues **sequentially**, collect URLs, then `item-add` each.
- Dependencies: write `Blocked by #NN` in the body — Projects v2 has no native blocker field via gh.
- Pure draft items (no issue) →
  `gh project item-create "$NUMBER" --owner "$OWNER" --title "..." --body "..."`.

## 4. Report

Print the Project URL and the created issue numbers/URLs, grouped by milestone. Include the roadmap
issue link.

## Notes / gotchas

- `--owner @me` = current user; for orgs pass the org login.
- Prefer `--body-file`; inline multi-line `--body` quoting is fragile on Windows `cmd`.
- `--format json -q '<expr>'` uses gh's built-in jq — no external `jq` needed.
- Create the Project and issues only after the user confirmed the count.
