---
description: Review the current changes with the reviewer subagent
argument-hint: [target: branch | PR | commit range]
allowed-tools: Task, Bash(git status:*), Bash(git diff:*)
---

Run a senior code review of the current changes using the **`reviewer`** subagent.

- Dispatch to the `reviewer` subagent (do not review inline yourself — keep the main thread clean).
- Target: `$ARGUMENTS` if provided (a branch, PR, or commit range); otherwise let the reviewer
  default to uncommitted work (`git diff HEAD` + `--staged`), falling back to `main...HEAD`.
- Relay the reviewer's findings verbatim, grouped by severity (Blocking / Should-fix / Nits).
  Do not soften or re-summarize; the reviewer is read-only and its report is the deliverable.
