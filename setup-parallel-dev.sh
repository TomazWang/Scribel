#!/bin/bash
# Setup Parallel Development with Git Worktrees
# This script creates worktrees for FE_DUDES, BE_GEEKS, and AI_GODS teams

set -e  # Exit on error

BRANCH="${1:-001-jot-storage-vault-indexing}"
PARENT_DIR="../"  # Parent folder (robocosmo.scribel/)
FE_DUDES_DIR="${PARENT_DIR}worktree-fe"
BE_GEEKS_DIR="${PARENT_DIR}worktree-be"
AI_GODS_DIR="${PARENT_DIR}worktree-ai"

echo "🚀 Setting up parallel development environment for Scribel"
echo ""
echo "Teams: FE_DUDES, BE_GEEKS, AI_GODS"
echo "Branch: $BRANCH"
echo ""
echo "Directory Structure:"
echo "  robocosmo.scribel/"
echo "  ├── Scribel/           ← Main repo (THE_PO, MASTER_TL, human)"
echo "  ├── worktree-fe/       ← FE_DUDES workspace"
echo "  ├── worktree-be/       ← BE_GEEKS workspace"
echo "  └── worktree-ai/       ← AI_GODS workspace"
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Error: Must run from repository root (Scribel/)"
    exit 1
fi

# Check if branch exists
if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    echo "❌ Error: Branch '$BRANCH' does not exist"
    echo "Available branches:"
    git branch -a
    echo ""
    echo "Usage: ./setup-parallel-dev.sh [branch-name]"
    echo "Default branch: 001-jot-storage-vault-indexing"
    exit 1
fi

# Check if parent directory exists
if [ ! -d "$PARENT_DIR" ]; then
    echo "❌ Error: Parent directory does not exist"
    echo "Expected structure:"
    echo "  robocosmo.scribel/"
    echo "  └── Scribel/  ← You should be here"
    exit 1
fi

# Clean up existing worktrees if they exist
echo "🧹 Cleaning up existing worktrees..."
for DIR in "$FE_DUDES_DIR" "$BE_GEEKS_DIR" "$AI_GODS_DIR"; do
    if [ -d "$DIR" ]; then
        echo "  Removing existing worktree: $DIR"
        git worktree remove "$DIR" 2>/dev/null || rm -rf "$DIR"
    fi
done

git worktree prune

# Create worktrees
echo ""
echo "📦 Creating FE_DUDES worktree at $FE_DUDES_DIR..."
git worktree add "$FE_DUDES_DIR" "$BRANCH"

echo ""
echo "📦 Creating BE_GEEKS worktree at $BE_GEEKS_DIR..."
git worktree add "$BE_GEEKS_DIR" "$BRANCH"

echo ""
echo "📦 Creating AI_GODS worktree at $AI_GODS_DIR..."
git worktree add "$AI_GODS_DIR" "$BRANCH"

# List worktrees
echo ""
echo "✅ Worktrees created successfully!"
echo ""
git worktree list

# Create launch instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Next Steps: Launch Team Agents"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Terminal 1 - FE_DUDES (Frontend Team):"
echo "  cd $FE_DUDES_DIR"
echo "  claude  # or: code ."
echo ""
echo "  Prompt: \"I am FE_DUDES. Check work/handoffs/ for notes and"
echo "           implement frontend tasks from work/FE_DUDES_TASKS.md.\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Terminal 2 - BE_GEEKS (Backend Team):"
echo "  cd $BE_GEEKS_DIR"
echo "  claude  # or: code ."
echo ""
echo "  Prompt: \"I am BE_GEEKS. Check work/handoffs/ for notes and"
echo "           implement backend tasks from work/BE_GEEKS_TASKS.md.\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Terminal 3 - AI_GODS (AI/ML Team):"
echo "  cd $AI_GODS_DIR"
echo "  claude  # or: code ."
echo ""
echo "  Prompt: \"I am AI_GODS. Check work/handoffs/ for notes and"
echo "           implement AI features for RAG and embeddings.\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Main Repo - THE_PO / MASTER_TL / Human:"
echo "  Stay in: Scribel/"
echo "  • Review handoffs in work/handoffs/"
echo "  • Make decisions and leave notes"
echo "  • Coordinate and execute merges"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "  • work/WORKFLOW.md         - Complete workflow guide"
echo "  • work/handoffs/           - Team communication"
echo "  • work/FE_DUDES_TASKS.md   - Frontend tasks"
echo "  • work/BE_GEEKS_TASKS.md   - Backend tasks"
echo "  • work/HANDOFF_NOTES.md    - Status tracking"
echo ""
echo "📝 Communication:"
echo "  • Handoffs: work/handoffs/epic-X-fY-TEAM-to-TEAM.md"
echo "  • Code:     // AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM"
echo ""
echo "⚠️  Merge Rules:"
echo "  • Dev teams (FE_DUDES, BE_GEEKS, AI_GODS) NEVER merge directly"
echo "  • THE_PO coordinates merges with human"
echo "  • Human executes git merge commands"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
