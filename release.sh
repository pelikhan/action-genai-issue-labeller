# Step 0: ensure we're in sync
if [ "$(git status --porcelain)" ]; then
  echo "❌ Pending changes detected. Commit or stash them first."
  exit 1
fi
git pull

# Step 1: Bump patch version using npm
NEW_VERSION=$(npm version patch -m "chore: bump version to %s")

# Step 2: Push commit and tag
git push origin HEAD --tags

# Step 3: Create GitHub release
gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "Patch release $NEW_VERSION"

# Step 4: update major tag if any
MAJOR=$(echo "$version" | cut -d. -f1)
git tag -f "v$MAJOR"
git push origin HEAD --tags

echo "✅ GitHub release $NEW_VERSION created successfully."
