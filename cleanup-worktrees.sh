#!/bin/bash
# Cleanup Git Worktrees
# Run this after completing the feature or when you need to reset

set -e

PARENT_DIR="../"  # Parent folder (robocosmo.scribel/)
FE_DUDES_DIR="${PARENT_DIR}worktree-fe"
BE_GEEKS_DIR="${PARENT_DIR}worktree-be"
AI_GODS_DIR="${PARENT_DIR}worktree-ai"

echo "🧹 Cleaning up git worktrees..."
echo ""
echo "Directory Structure:"
echo "  robocosmo.scribel/"
echo "  ├── Scribel/           ← Main repo (you are here)"
echo "  ├── worktree-fe/       ← Will be removed"
echo "  ├── worktree-be/       ← Will be removed"
echo "  └── worktree-ai/       ← Will be removed"
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Error: Must run from repository root (Scribel/)"
    exit 1
fi

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
echo "  ./setup-parallel-dev.sh [branch-name]"
echo ""
