---
name: ship
description: Generate a Conventional Commits message from the current diff and commit it; optionally push and open a PR with a templated description. Use when the user wants to commit changes, write a commit message, or open/update a pull request for the current work.
argument-hint: "[commit | pr]  (default: commit; 'pr' also pushes and opens a PR)"
---

# /ship — commit + PR descriptions

Turn the current changes into a well-described commit, and (when asked) a pull request.
Default action is **commit only**. If the argument contains `pr`, also push and open a PR.

## 0. Decide the mode
- No argument, or `commit` → produce a commit only.
- `pr` → produce the commit (if there are uncommitted changes), then push + open a PR.

## 1. Inspect the change (always do this first)
Run these read-only commands and base everything on their real output — never invent a summary:
- `git status --short`
- `git diff --staged` and `git diff` (staged + unstaged). If nothing is staged, treat all
  tracked modifications as the change set and `git add -A` them after confirming they belong
  together; if the changes are unrelated, ask the user how to split them.
- `git log --oneline -10` to match the repo's existing tone/scope vocabulary.

## 2. Write the commit message (Conventional Commits)
Format:
```
<type>(<scope>): <imperative summary ≤72 chars>

<body: what changed and WHY — wrap ~72 cols, bullet multiple changes>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
- **type**: `feat | fix | perf | refactor | docs | test | chore | build | ci`.
- **scope**: the package/app/area, taken from the paths actually touched
  (e.g. `web`, `form`, `db`, `llm`, `landing`, `lantern`, `deps`). Omit if it spans many.
- **summary**: imperative mood ("add", not "added"); no trailing period.
- **body**: explain the motivation and any non-obvious decisions or trade-offs; reference issues
  (`Refs #123`) when relevant. Skip the body only for truly trivial one-liners.
- Use `BREAKING CHANGE:` footer when applicable.

## 3. Commit safely
- If on the default branch (`main`), create a topic branch first
  (`git checkout -b <type>/<short-slug>`) — do not commit straight to `main`.
- Stage the intended files, then commit with the message from step 2 (use a HEREDOC so the body
  formats correctly).
- Do **not** add files the user didn't intend (build artifacts, `.env*`, `next-env.d.ts`, etc.).
  Never commit secrets.

## 4. If mode is `pr`
- Push the branch: `git push -u origin <branch>`.
- Open the PR with `gh pr create` using this body template:
  ```
  ## Summary
  1–3 sentences on what this change does and why.

  ## Changes
  - bullet per meaningful change (grouped by area)

  ## Testing
  - what you ran (e.g. `pnpm type-check`, `pnpm build`, manual steps) and the result

  ## Notes
  - follow-ups, risks, or anything reviewers should know (omit if none)

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```
- Title = the commit summary (or an aggregate summary if the branch has several commits).
- After creating, print the PR URL.

## 5. Report back
Show the final commit message (and PR link if created) so the user can confirm. Do not push or
open a PR unless mode is `pr` or the user explicitly asks.

## Guardrails
- Outward-facing steps (push, PR) happen only in `pr` mode or on explicit request.
- If the working tree is clean, say so and stop.
- Keep messages factual to the diff — if tests weren't run, say so in the Testing section.
