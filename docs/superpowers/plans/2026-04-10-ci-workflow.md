# CI Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that runs the Vitest test suite on every PR targeting `main`, enabling branch protection to block merges on failure.

**Architecture:** A single workflow file at `.github/workflows/ci.yml` defines one job (`test`) triggered on `pull_request` to `main`. The job uses pnpm with the built-in Node setup cache, installs dependencies with a frozen lockfile, then runs `pnpm test`.

**Tech Stack:** GitHub Actions, pnpm, Node.js 22, Vitest

---

### Task 1: Create the CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the directory and workflow file**

Create `.github/workflows/ci.yml` with the following content:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test
```

- [ ] **Step 2: Verify the file exists and is valid YAML**

Run:
```bash
cat .github/workflows/ci.yml
```
Expected: the full YAML content printed without errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add CI workflow to run tests on PRs to main"
```

---

### Task 2: Enable branch protection on GitHub (manual)

This step is done in the GitHub web UI — it cannot be automated without a GitHub token or CLI setup.

- [ ] **Step 1: Push the branch and open a PR** so GitHub discovers the new workflow and registers the `test` status check.

- [ ] **Step 2: Navigate to branch protection settings**

Go to: `https://github.com/<owner>/garden-web/settings/branches`

- [ ] **Step 3: Add a branch protection rule for `main`**

- Branch name pattern: `main`
- Enable: "Require status checks to pass before merging"
- Search for and add `test` as a required status check
- Optionally enable: "Require branches to be up to date before merging"
- Save the rule

After this, any PR to `main` where the `test` job fails will be blocked from merging.
