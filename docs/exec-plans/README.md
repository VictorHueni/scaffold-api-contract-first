# Execution Plans

Implementation plans broken into incremental, testable units. Each plan is derived from a PRD in [`../product-specs/`](../product-specs/) and tracks the work to deliver it.

## Structure

- `active/` — plans currently being executed or recently completed
- Each plan lives in its own folder named `{number}_{slug}/` and contains:
  - `{number}_exec_{slug}.md` — the plan itself (increments, scope, test gates)
  - `progress.txt` — execution log

## Active

| Plan | Source PRD | Status |
|---|---|---|
| [0001 — API-First Scaffold](active/0001_api-first-scaffold/0001_exec_api-first-scaffold.md) | [PRD 0001](../product-specs/0001_prd_api-first-scaffold.md) | Done — 12 increments delivered |
