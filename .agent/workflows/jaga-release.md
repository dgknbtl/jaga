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
> **Required before Step 4.** `@changesets/changelog-github` uses the GitHub API to resolve commits into PR links and author names. If you run `changeset version` before pushing, entries will fall back to plain commit hashes.

### Step 4: Bump versions
```bash
export GITHUB_TOKEN=$(gh auth token)
npx changeset version
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
Run the automation script to create the release:
```bash
./scripts/create-github-releases.sh
```

This creates the base release with `**Release Type:**` and `### Changelog` only.

### Step 9: Agent Release Note Analysis

After Step 8, the agent analyzes the diff between the previous tag and the new tag, then enriches the release notes using `gh release edit` if applicable.

**How to trigger:** After Step 8 completes, tell the agent:
```
analyze and enrich the release notes
```

**What the agent does:**

1. Runs `git diff <prev-tag>...<new-tag> -- src/` to inspect actual code changes.
2. Reads commit messages between the two tags.
3. Decides which sections to include based on release type and content:

| Release type | Sections added |
|---|---|
| `patch` | `### Security Posture` — only if security-related fixes are present |
| `minor` | `### Core Breakthroughs` — for new features or API additions |
| `major` | Both sections always |

4. Prepends the applicable sections **before** `### Changelog` using:
```bash
gh release edit <tag> --notes "<enriched body>"
```

**Output format:**

```markdown
**Release Type:** Patch

### Security Posture
- **Fix name:** What was fixed and why it matters security-wise.

### Changelog
- [`abc123`](...) Thanks @dgknbtl! - ...
```

**Rules for the agent:**
- Write in English, one bullet per fix/feature.
- Be specific: name the function, file, or attack vector — not vague summaries.
- Only include `### Core Breakthroughs` if there is a genuine architectural change (new module, new context support, new API surface).
- Only include `### Security Posture` if there is a concrete vulnerability fix or hardening — not refactors.
- If neither section applies (docs-only, chore, config change), skip Step 9 entirely.

---

## Quick copy-paste version

```bash
# After code is committed:
npx changeset                                        # declare
git push                                             # push intent
export GITHUB_TOKEN=$(gh auth token)                 # export token
npx changeset version                                # bump
npm run build                                        # verify integrity
npx changeset publish                                # publish + tag
git push --follow-tags                               # push tag
./scripts/create-github-releases.sh                  # create GitHub release
# → then tell the agent: "analyze and enrich the release notes"
```

## Rules
- Never manually edit version numbers in `package.json`.
- Every change requiring a release MUST include a changeset.
- Always `git push` before `changeset version`.
