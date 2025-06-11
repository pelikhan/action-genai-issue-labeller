# Step 1: Bump patch version using npm
NEW_VERSION=$(npm version patch -m "chore: bump version to %s")

# Step 2: Push commit and tag
git push origin HEAD --tags

# Step 3: Create GitHub release
gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "Patch release $NEW_VERSION"

echo "✅ GitHub release $NEW_VERSION created successfully."
