#!/bin/bash
# Git workflow helper for bacnet-tagging
# Usage:
#   ./dev.sh start <branch-name>   — Create feature branch from main
#   ./dev.sh save "message"        — Commit + push current branch
#   ./dev.sh merge                 — Merge current branch into main
#   ./dev.sh rollback              — Reset main to previous commit
#   ./dev.sh status                — Show branches, commits, what's changed
#   ./dev.sh diff                  — Show what this branch changed vs main

cd "$(dirname "$0")"
CMD=${1:-status}

case "$CMD" in

  start)
    BRANCH=${2:?Usage: ./dev.sh start <branch-name>}
    echo "Creating feature branch: $BRANCH"
    git checkout main
    git pull origin main
    git checkout -b "$BRANCH"
    echo "Now on branch: $BRANCH"
    echo "Make your changes, then: ./dev.sh save \"description\""
    ;;

  save)
    MSG=${2:-"WIP on $(git branch --show-current)"}
    git add -A
    git reset HEAD .env data/*.db data/*.db-wal data/*.db-shm 2>/dev/null
    BRANCH=$(git branch --show-current)
    echo "=== Committing to $BRANCH ==="
    git status --short
    git commit -m "$MSG

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
    git push -u origin "$BRANCH" 2>&1
    echo "Pushed to origin/$BRANCH"
    ;;

  merge)
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" = "main" ]; then
      echo "Already on main. Switch to a feature branch first."
      exit 1
    fi
    echo "=== Merging $BRANCH into main ==="
    echo "Commits on this branch:"
    git log main.."$BRANCH" --oneline
    echo ""
    read -p "Proceed with merge? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout main
      git pull origin main
      git merge "$BRANCH" --no-ff -m "Merge branch '$BRANCH' into main"
      git push origin main
      echo ""
      echo "Merged. Delete the feature branch? (y/n)"
      read -p "" -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -d "$BRANCH"
        git push origin --delete "$BRANCH" 2>/dev/null
        echo "Branch $BRANCH deleted."
      fi
    fi
    ;;

  rollback)
    echo "=== Recent commits on main ==="
    git log --oneline -10 main
    echo ""
    echo "Current HEAD: $(git rev-parse --short HEAD)"
    echo ""
    echo "To rollback main to a specific commit:"
    echo "  git checkout main"
    echo "  git reset --hard <commit-hash>"
    echo "  git push --force origin main"
    echo ""
    echo "To rollback just the last commit (safe):"
    echo "  git revert HEAD"
    echo "  git push origin main"
    echo ""
    read -p "Revert the last commit? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout main
      git revert HEAD --no-edit
      git push origin main
      echo "Last commit reverted."
    fi
    ;;

  status)
    echo "=== Branch ==="
    BRANCH=$(git branch --show-current)
    echo "Current: $BRANCH"
    echo ""
    echo "=== All branches ==="
    git branch -a --format='%(refname:short) %(objectname:short) %(subject)' | head -20
    echo ""
    echo "=== Recent commits ==="
    git log --oneline -8
    echo ""
    echo "=== Uncommitted changes ==="
    git status --short
    ;;

  diff)
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" = "main" ]; then
      echo "On main — showing diff of last commit:"
      git diff HEAD~1 --stat
    else
      echo "=== Changes on $BRANCH vs main ==="
      git diff main..."$BRANCH" --stat
      echo ""
      echo "Commits:"
      git log main.."$BRANCH" --oneline
    fi
    ;;

  *)
    echo "Usage: ./dev.sh {start|save|merge|rollback|status|diff}"
    echo ""
    echo "  start <name>    Create feature branch from main"
    echo "  save \"msg\"      Commit + push current branch"
    echo "  merge           Merge current branch into main"
    echo "  rollback        Revert last commit on main"
    echo "  status          Show branches and changes"
    echo "  diff            Show what this branch changed vs main"
    ;;
esac
