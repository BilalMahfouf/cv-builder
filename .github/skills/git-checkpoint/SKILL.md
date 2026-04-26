---
name: git-checkpoint
description: 'Pause at real implementation milestones, propose one conventional commit, and wait for explicit approval before any further coding. Use when: commit after each step, ask before committing, don''t dump everything in one commit, I want to review each commit.'
user-invocable: true
---

# Git Checkpoint

## When to Use
- User wants incremental, review-first commits.
- Work is done in meaningful milestones, not per function/file.

## Milestone Rule
A real milestone is one meaningful chunk: completed module, migration, end-to-end feature, or app compiles/tests for the target change.
Do not checkpoint tiny edits unless the user explicitly asks.

## Procedure
1. Implement until a real milestone is reached and minimally verified.
2. Stop coding immediately.
3. Output a checkpoint block with:
- `Suggested commit`: one conventional commit message (`feat|fix|chore|refactor: ...`).
- `Changed files`: every created/modified file path.
- `Status`: `WAITING_FOR_APPROVAL`.
4. Do not run `git commit` and do not write more code while waiting.

## Approval Branching
- If user approves (`continue`, `approved`, `commit it`): proceed with next implementation step (or commit only if explicitly requested).
- If user requests changes: apply requested edits, then re-issue a new checkpoint block and wait again.
- If user rejects scope: adjust plan to a smaller/larger milestone and continue to next checkpoint.

## Completion Checks
- Commit type matches intent (`feat`, `fix`, `chore`, `refactor`).
- File list is complete and current.
- Agent clearly states it is blocked pending user approval.
