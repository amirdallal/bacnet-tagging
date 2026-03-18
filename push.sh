#!/bin/bash
# Quick commit and push to GitHub
# Usage: ./push.sh "your commit message"
# Or just: ./push.sh (auto-generates message from changed files)

cd "$(dirname "$0")"

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to commit."
  exit 0
fi

# Show what's changed
echo "=== Changes ==="
git status --short
echo ""

# Build commit message
if [ -n "$1" ]; then
  MSG="$1"
else
  # Auto-generate from changed files
  CHANGED=$(git diff --name-only --cached 2>/dev/null; git diff --name-only; git ls-files --others --exclude-standard)
  COUNT=$(echo "$CHANGED" | sort -u | wc -l | tr -d ' ')
  MSG="Update ${COUNT} files: $(echo "$CHANGED" | sort -u | head -3 | xargs -I{} basename {} | tr '\n' ', ' | sed 's/,$//')"
fi

# Stage all tracked + new files (excluding .env and db files)
git add -A
git reset HEAD .env data/*.db data/*.db-wal data/*.db-shm 2>/dev/null

echo "=== Committing ==="
echo "$MSG"
echo ""

git commit -m "$MSG

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

echo ""
echo "=== Pushing to origin/main ==="
git push origin main

echo ""
echo "Done."
