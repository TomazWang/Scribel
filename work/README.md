# Quick Start: Parallel Development

**See [`../PARALLEL_WORKFLOW.md`](../PARALLEL_WORKFLOW.md) for complete documentation.**

This folder contains team coordination files for parallel AI agent development.

---

## Setup (One-Time)

```bash
# From repository root
./work/scripts/setup-squad-dev.sh [branch-name]
```

Creates worktrees for 3 teams: FE_DUDES, BE_GEEKS, AI_GODS

---

## Launch Teams (3 Terminals)

```bash
# Terminal 1: Frontend Team
cd worktrees/frontend && claude

# Terminal 2: Backend Team
cd worktrees/backend && claude

# Terminal 3: AI Team
cd worktrees/ai && claude
```

---

## Team Communication

This folder is the central hub for team coordination:

### `handoffs/` - Team Communication
Create handoffs when:
- Feature complete
- Blocked on another team
- Need decision from THE_PO/MASTER_TL
- Ready for merge

**Filename**: `epic-X-fY-FROM-to-TO.md`

### Task Files
- `handoffs/epic-1/epic-1-FE_DUDES-tasks.md` - Frontend tasks
- `handoffs/epic-1/epic-1-BE_GEEKS-tasks.md` - Backend tasks
- `handoffs/epic-1/epic-1-AI_GODS-tasks.md` - AI tasks

---

## Quick Reference

| Team | Worktree | Owns |
|------|----------|------|
| **FE_DUDES** | `worktrees/frontend/` | `src/**/*` |
| **BE_GEEKS** | `worktrees/backend/` | `src-tauri/**/*` (except `ai/`) |
| **AI_GODS** | `worktrees/ai/` | `src-tauri/src/ai/**/*` |
| **THE_PO** | main repo | Decisions only |
| **MASTER_TL** | main repo | Reviews only |

**Communication**:
- Handoffs: `work/handoffs/epic-X-fY-FROM-to-TO.md`
- Code: `// AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM`

**Merge Rule**: Dev teams NEVER merge directly → Create handoffs to THE_PO

---

## For Complete Details

See [`../PARALLEL_WORKFLOW.md`](../PARALLEL_WORKFLOW.md) for:
- Full human quick start guide
- Workflow with/without Speckit
- Agent `/squad.go` command
- Testing strategies
- Git operations
- Troubleshooting

---

**Scripts**:
- `scripts/setup-squad-dev.sh` - Create worktrees
- `scripts/cleanup-squad.sh` - Remove worktrees
