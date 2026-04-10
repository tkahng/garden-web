# CI Workflow Design

**Date:** 2026-04-10  
**Topic:** GitHub Actions CI workflow for PR gate on main

## Goal

Run the Vitest test suite automatically on every pull request targeting `main`. Failing tests block the merge via GitHub branch protection rules.

## Trigger

```yaml
on:
  pull_request:
    branches: [main]
```

Fires on PR open, sync (new commits pushed), and reopen.

## Job: `test`

Single job, runs on `ubuntu-latest`.

Steps:
1. `actions/checkout@v4` — check out PR branch
2. `pnpm/action-setup@v4` — install pnpm
3. `actions/setup-node@v4` with `node-version: 22` and `cache: 'pnpm'` — sets up Node and caches the pnpm store
4. `pnpm install --frozen-lockfile` — install dependencies (fails if lockfile is out of date)
5. `pnpm test` — runs `vitest run`

## File Location

`.github/workflows/ci.yml`

## Branch Protection (manual step after workflow exists)

GitHub → Settings → Branches → Add branch protection rule for `main`:
- Enable "Require status checks to pass before merging"
- Add `test` as a required status check

## Out of Scope

- Type-checking (`tsc`)
- Linting (`eslint`)
- Test result artifact upload
- Multi-version matrix
