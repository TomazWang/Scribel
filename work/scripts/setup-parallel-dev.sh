#!/bin/bash
# Setup Parallel Development with Git Worktrees
# This script creates worktrees for FE_DUDES, BE_GEEKS, and AI_GODS teams

set -e  # Exit on error

# Always work relative to git repository root
GIT_ROOT=$(git rev-parse --show-toplevel)
PARENT_DIR=$(dirname "$GIT_ROOT")

BRANCH="${1:-001-jot-storage-vault-indexing}"
WORKTREES_DIR="${PARENT_DIR}/worktrees"
FE_DUDES_DIR="${WORKTREES_DIR}/frontend"
BE_GEEKS_DIR="${WORKTREES_DIR}/backend"
AI_GODS_DIR="${WORKTREES_DIR}/ai"

echo "🚀 Setting up parallel development environment for Scribel"
echo ""
echo "Teams: FE_DUDES, BE_GEEKS, AI_GODS"
echo "Branch: $BRANCH"
echo ""
echo "Directory Structure:"
echo "  robocosmo.scribel/"
echo "  ├── Scribel/           ← Main repo (THE_PO, MASTER_TL, human)"
echo "  └── worktrees/"
echo "      ├── frontend/      ← FE_DUDES workspace"
echo "      ├── backend/       ← BE_GEEKS workspace"
echo "      └── ai/            ← AI_GODS workspace"
echo ""

# Check if we're in a git repository
if [ ! -d "$GIT_ROOT/.git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Change to git root to ensure consistent behavior
cd "$GIT_ROOT"

# Check if branch exists
if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    echo "❌ Error: Branch '$BRANCH' does not exist"
    echo "Available branches:"
    git branch -a
    echo ""
    echo "Usage: ./work/scripts/setup-parallel-dev.sh [branch-name]"
    echo "Default branch: 001-jot-storage-vault-indexing"
    exit 1
fi

# Check if parent directory exists
if [ ! -d "$WORKTREES_DIR" ]; then
    echo "📁 Creating worktrees directory..."
    mkdir -p "$WORKTREES_DIR"
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

# Create team-specific branches from the base branch
echo ""
echo "📋 Creating team-specific feature branches..."

# Each team needs its own branch to work on the same feature
FE_BRANCH="${BRANCH}-fe-$(date +%s)"
BE_BRANCH="${BRANCH}-be-$(date +%s)"
AI_BRANCH="${BRANCH}-ai-$(date +%s)"

# Create branches from the base branch
echo "  Creating branch: $FE_BRANCH"
git branch "$FE_BRANCH" "$BRANCH" 2>/dev/null || true

echo "  Creating branch: $BE_BRANCH"
git branch "$BE_BRANCH" "$BRANCH" 2>/dev/null || true

echo "  Creating branch: $AI_BRANCH"
git branch "$AI_BRANCH" "$BRANCH" 2>/dev/null || true

# Create worktrees with team-specific branches
echo ""
echo "📦 Creating FE_DUDES worktree at $FE_DUDES_DIR..."
git worktree add "$FE_DUDES_DIR" "$FE_BRANCH"

echo ""
echo "📦 Creating BE_GEEKS worktree at $BE_GEEKS_DIR..."
git worktree add "$BE_GEEKS_DIR" "$BE_BRANCH"

echo ""
echo "📦 Creating AI_GODS worktree at $AI_GODS_DIR..."
git worktree add "$AI_GODS_DIR" "$AI_BRANCH"

# List worktrees
echo ""
echo "✅ Worktrees created successfully!"
echo ""
echo "📌 Team Branches Created:"
echo "  • FE_DUDES:  $FE_BRANCH"
echo "  • BE_GEEKS:  $BE_BRANCH"
echo "  • AI_GODS:   $AI_BRANCH"
echo ""
echo "Each team has their own branch to prevent git worktree conflicts."
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
echo "  • work/WORKFLOW.md                        - Complete workflow guide"
echo "  • work/handoffs/                          - Team communication"
echo "  • work/handoffs/epic-1/HANDOFF_NOTES.md   - Epic 1 status tracking"
echo "  • work/handoffs/epic-1/WORKING_LOG.md     - Epic 1 working log"
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
