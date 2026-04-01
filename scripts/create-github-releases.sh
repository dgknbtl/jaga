#!/usr/bin/env bash
set -euo pipefail

# Jaga GitHub Release Script

if ! command -v gh &> /dev/null; then
  echo "Error: 'gh' CLI is required. Install it from https://cli.github.com/" >&2
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

if [ -z "$VERSION" ]; then
  echo "Error: Could not determine version from package.json." >&2
  exit 1
fi

# Detect release type from semver
PREV_TAG=$(git tag --sort=-version:refname | grep -v "^$TAG$" | head -n 1)
if [ -z "$PREV_TAG" ]; then
  RELEASE_TYPE="patch"
else
  PREV_VERSION="${PREV_TAG#v}"
  CUR_MAJOR=$(echo "$VERSION" | cut -d. -f1)
  CUR_MINOR=$(echo "$VERSION" | cut -d. -f2)
  PREV_MAJOR=$(echo "$PREV_VERSION" | cut -d. -f1)
  PREV_MINOR=$(echo "$PREV_VERSION" | cut -d. -f2)

  if [ "$((CUR_MAJOR))" -gt "$((PREV_MAJOR))" ]; then
    RELEASE_TYPE="major"
  elif [ "$((CUR_MINOR))" -gt "$((PREV_MINOR))" ]; then
    RELEASE_TYPE="minor"
  else
    RELEASE_TYPE="patch"
  fi
fi

echo "Preparing Jaga Release: $TAG ($RELEASE_TYPE)"

# Extract changelog notes for this version
PATCH_NOTES=$(awk "/^## $VERSION/{f=1;next} f && /^## /{exit} f{print}" CHANGELOG.md \
  | grep -v "^### Patch Changes" \
  | grep -v "^### Minor Changes" \
  | grep -v "^### Major Changes" \
  | sed '/^[[:space:]]*$/{ N; /^\n$/d; }')

if [ -z "$PATCH_NOTES" ]; then
  echo "Error: Could not extract changelog notes for version $VERSION." >&2
  exit 1
fi

RELEASE_TYPE_LABEL=$(echo "$RELEASE_TYPE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

RELEASE_BODY="**Release Type:** $RELEASE_TYPE_LABEL

### Changelog
$PATCH_NOTES"

gh release create "$TAG" --title "$TAG" --notes "$RELEASE_BODY"
