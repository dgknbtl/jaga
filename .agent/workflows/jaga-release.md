---
description: Changesets versioning and release workflow adapted for Jaga
alwaysApply: true
---

# 🛡️ Jaga Changeset Workflow

Jaga uses `@changesets/cli` for versioning and publishing. This workflow is adapted from high-standard monorepo patterns but simplified for Jaga's "Zero Dependency" single-package architecture.

## Package topology

| Package | npm name | Published to |
| ------- | -------- | ------------ |
| `.`     | `jagajs` | npm          |

## Key config (`.changeset/config.json`)

- **`access: "public"`** — published as a public package.
- **`commit: true`** — changeset intents and version bumps are auto-committed.
- **`changelog: @changesets/changelog-github`** — entries link to PRs and contributors (Requires `GITHUB_TOKEN`).

## How changesets works

1. **Declare** — create a `.md` file in `.changeset/` via `npx changeset`.
2. **Version** — consume intents, bump `package.json`, and write `CHANGELOG.md`.
3. **Publish** — run `npm publish` and create git tags.

---

## Release workflow (step by step)

### Step 1: Make your code changes
Write code, commit, push — normal development.

### Step 2: Create a changeset
```bash
npx changeset
```
Select `patch`/`minor`/`major` and write a summary. This is auto-committed.

### Step 3: Push to GitHub
```bash
git push
```
**Required before Step 4** so the GitHub Changelog plugin can find the commits.

### Step 4: Bump versions
```bash
GITHUB_TOKEN=$(gh auth token) npx changeset version
```
- Updates `package.json` and `CHANGELOG.md`.
- Uses GitHub API to link PRs/authors.
- Auto-committed.

### Step 5: Build Jaga (Audit Integrity)
```bash
npm run build
```
Ensure `__VERSION__` injection and bundle size (<3KB) are correct.

### Step 6: Publish to npm + create tags
```bash
npx changeset publish
```
Publishes to NPM and creates the git tag (e.g., `v1.4.2`).

### Step 7: Push the release commit and tags
```bash
git push --follow-tags
```

### Step 8: Create GitHub Release
Prepare the release notes using the Jaga standard format:

```markdown
## 🛡️ Jaga vX.Y.Z
> **[Release Theme]**

**Release Type:** [Major / Minor / Patch]

### Core Breakthroughs
* [Architectural innovations]

### Security Posture
* [Security enhancements/fixes]

### Changelog & Maintenance
* **[NEW]** / **[UPDATE]** / **[FIX]**
```

---

## Quick copy-paste version

```bash
# After code is committed:
npx changeset                                        # declare
git push                                             # push intent
GITHUB_TOKEN=$(gh auth token) npx changeset version  # bump
npm run build                                        # verify integrity
npx changeset publish                                # publish + tag
git push --follow-tags                               # push tag
```

## Rules
- Never manually edit version numbers in `package.json`.
- Every change requiring a release MUST include a changeset.
- Always `git push` before `changeset version`.
