#!/bin/bash
# Cleanup Git Worktrees
# Run this after completing the feature or when you need to reset

set -e

# Always work relative to git repository root
GIT_ROOT=$(git rev-parse --show-toplevel)
PARENT_DIR=$(dirname "$GIT_ROOT")

WORKTREES_DIR="${PARENT_DIR}/worktrees"
FE_DUDES_DIR="${WORKTREES_DIR}/frontend"
BE_GEEKS_DIR="${WORKTREES_DIR}/backend"
AI_GODS_DIR="${WORKTREES_DIR}/ai"

echo "🧹 Cleaning up git worktrees..."
echo ""
echo "Directory Structure:"
echo "  robocosmo.scribel/"
echo "  ├── Scribel/           ← Main repo (you are here)"
echo "  └── worktrees/"
echo "      ├── frontend/      ← Will be removed"
echo "      ├── backend/       ← Will be removed"
echo "      └── ai/            ← Will be removed"
echo ""

# Check if we're in a git repository
if [ ! -d "$GIT_ROOT/.git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Change to git root to ensure consistent behavior
cd "$GIT_ROOT"

# Remove FE_DUDES worktree
if [ -d "$FE_DUDES_DIR" ]; then
    echo "  Removing FE_DUDES worktree: $FE_DUDES_DIR"
    git worktree remove "$FE_DUDES_DIR" 2>/dev/null || rm -rf "$FE_DUDES_DIR"
fi

# Remove BE_GEEKS worktree
if [ -d "$BE_GEEKS_DIR" ]; then
    echo "  Removing BE_GEEKS worktree: $BE_GEEKS_DIR"
    git worktree remove "$BE_GEEKS_DIR" 2>/dev/null || rm -rf "$BE_GEEKS_DIR"
fi

# Remove AI_GODS worktree
if [ -d "$AI_GODS_DIR" ]; then
    echo "  Removing AI_GODS worktree: $AI_GODS_DIR"
    git worktree remove "$AI_GODS_DIR" 2>/dev/null || rm -rf "$AI_GODS_DIR"
fi

# Prune worktree references
echo ""
echo "  Pruning worktree references..."
git worktree prune

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Remaining worktrees:"
git worktree list
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To recreate worktrees, run:"
echo "  ./work/scripts/setup-parallel-dev.sh [branch-name]"
echo ""
