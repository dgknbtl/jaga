#!/usr/bin/env bash
set -euo pipefail

# Jaga GitHub Release Automation (GEA Hybrid Style)
# This script identifies tags at HEAD and formats them for Jaga's security-first aesthetic.

# Detect tag at current commit (usually created by npx changeset publish)
TAG=$(git tag --points-at HEAD | head -n 1)

if [ -z "$TAG" ]; then
  echo "⚠️  No tag found at HEAD. Did you run 'npx changeset publish'?"
  exit 1
fi

# Get version from tag (removes leading 'v' if present)
VERSION="${TAG#v}"
PACKAGE_NAME=$(node -p "require('./package.json').name")

echo "🛡️  Preparing Jaga Release: $TAG ($PACKAGE_NAME)"

# Extract notes from CHANGELOG.md
# We find the section for this version and stop before the next version header
NOTES=$(awk "/^## $VERSION/{if(f)exit;f=1;next}f" CHANGELOG.md)

if [ -z "$NOTES" ]; then
  # Fallback: if awk fails, try simple sed for one-header files
  NOTES=$(sed -n "/^## $VERSION/,\$p" CHANGELOG.md | sed '1d')
fi

# Final Jaga Visual Template
RELEASE_TITLE="🛡️ Jaga $TAG"
RELEASE_BODY="> **[Release Theme]**

**Release Type:** Patch

### Core Breakthroughs
* [Architectural innovations]

### Security Posture
* [Security enhancements/fixes]

### Changelog & Maintenance
$NOTES"

# Create the release using 'gh' CLI if available
if command -v gh &> /dev/null; then
  echo "📡 Pushing release to GitHub..."
  gh release create "$TAG" --title "$RELEASE_TITLE" --notes "$RELEASE_BODY"
else
  echo ""
  echo "----------------- JAGA RELEASE DRAFT -----------------"
  echo "⚠️  GitHub CLI (gh) not found. Manual copy-paste required."
  echo ""
  echo "Title: $RELEASE_TITLE"
  echo "---"
  echo "$RELEASE_BODY"
  echo "------------------------------------------------------"
fi
