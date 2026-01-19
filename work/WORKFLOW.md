# Team Workflow with Git Worktrees

**Purpose**: Enable multiple AI agent teams to work simultaneously on backend, frontend, and AI tasks without conflicts.

---

## Team Structure

| Team | Role | Implements Code? | Worktree |
|------|------|------------------|----------|
| **FE_DUDES** | Frontend Development Team | Yes | `worktrees/frontend/` |
| **BE_GEEKS** | Backend Development Team | Yes | `worktrees/backend/` |
| **AI_GODS** | AI/ML Development Team | Yes | `worktrees/ai/` |
| **THE_PO** | Product Owner | No — decisions only | main repo |
| **MASTER_TL** | Tech Lead | No — reviews only | main repo |

---

## Git Worktree Setup

### Overview

```
Scribel/                           ← Main repo (THE_PO, MASTER_TL, human)
├── worktrees/
│   ├── frontend/                  ← FE_DUDES workspace
│   ├── backend/                   ← BE_GEEKS workspace
│   └── ai/                        ← AI_GODS workspace
└── work/
    ├── handoffs/                  ← Team communication
    ├── FE_DUDES_TASKS.md          ← Frontend tasks
    ├── BE_GEEKS_TASKS.md          ← Backend tasks
    └── WORKFLOW.md                ← This file
```

### Setup Commands (One-Time)

```bash
# From main repository
git worktree add worktrees/frontend feature/epic-X-fY-fe-name
git worktree add worktrees/backend feature/epic-X-fY-be-name
git worktree add worktrees/ai feature/epic-X-fY-ai-name

# Verify
git worktree list
```

### Branch Naming Convention

```
feature/<epic-id>-<feature-id>-<team>-<short-name>

# Examples:
feature/epic-1-f1-fe-jot-input      # FE_DUDES
feature/epic-1-f2-be-jot-storage    # BE_GEEKS
feature/epic-3-f4-ai-rag-pipeline   # AI_GODS
```

---

## Communication Protocol

### 1. Handoff Documents

**Location**: `work/handoffs/`

**When to create**:
- Completing a feature or major component
- Needing input from another team
- Blocking on another team's work
- Ready for merge
- Escalating a decision to THE_PO or MASTER_TL

**Filename format**: `<epic-id>-<feature-id>-<from>-to-<to>.md`

**Examples**:
- `epic-1-f1-FE_DUDES-to-BE_GEEKS.md`
- `epic-1-f2-BE_GEEKS-to-THE_PO.md`
- `epic-3-f4-AI_GODS-to-MASTER_TL.md`

**Template**:
```markdown
# Handoff: [Feature Name]

**From**: [YOUR_TEAM]
**To**: [TARGET_TEAM]
**Epic/Feature**: epic-X / feature-Y
**Date**: YYYY-MM-DD

## Summary
[Brief description of what was done]

## What We Need
[Clear request or question]

## Context
[Relevant details, decisions made, constraints]

## Files Changed
- `path/to/file1`
- `path/to/file2`

## Notes for Recipient
[Specific information they need to know]
```

### 2. Code Comments

**Format**: `// AI-DEV-NOTE: @<TEAM> - <message> -- by @<YOUR_TEAM>`

**Examples**:
```typescript
// AI-DEV-NOTE: @BE_GEEKS - We expect this response shape from list_jots -- by @FE_DUDES
// AI-DEV-NOTE: @FE_DUDES - Command ready: invoke('create_jot', {...}) -- by @BE_GEEKS
// AI-DEV-NOTE: @AI_GODS - Need streaming support for chat responses -- by @FE_DUDES
// AI-DEV-NOTE: @THE_PO - Confirm this UX flow matches requirements -- by @FE_DUDES
// AI-DEV-NOTE: @MASTER_TL - Is this the right error handling pattern? -- by @BE_GEEKS
```

---

## Merge Rules

### Who Can Merge?

- **Development teams (FE_DUDES, BE_GEEKS, AI_GODS) NEVER merge directly**
- **THE_PO** coordinates merges and communicates with human
- **Human** executes the actual merge commands

### Merge Process

1. Team completes feature in their worktree branch
2. Team creates handoff to THE_PO: `epic-X-fY-TEAM-to-THE_PO.md`
3. THE_PO reviews and approves
4. THE_PO notifies human that merge is ready
5. Human executes merge
6. All teams pull from main

---

## File Ownership

### FE_DUDES Owns
```
src/
├── components/
├── hooks/
├── api/
├── utils/
├── types/
└── __tests__/

package.json
tsconfig.json
tailwind.config.js
vite.config.ts
```

### BE_GEEKS Owns
```
src-tauri/
├── src/
│   ├── jots/
│   ├── db/
│   ├── commands/
│   └── config.rs
├── tests/
└── Cargo.toml

tauri.conf.json
```

### AI_GODS Owns
```
src-tauri/src/ai/
└── (all AI module files)

AI-related schemas in src-tauri/src/db/
```

### Shared (Read-Only for Teams)
```
.AI_INSTRUCTION.md
CLAUDE.md
docs/
specs/
plan/
```

### Coordination Files (Teams Update)
```
work/
├── handoffs/*.md       ← Create handoffs here
├── FE_DUDES_TASKS.md   ← FE_DUDES updates progress
├── BE_GEEKS_TASKS.md   ← BE_GEEKS updates progress
└── WORKING_LOG.md      ← All teams can read
```

---

## Team Startup Checklist

### FE_DUDES
```bash
cd worktrees/frontend

# 1. Check for handoffs addressed to you
ls work/handoffs/ | grep "to-FE_DUDES"

# 2. Search for code notes
grep -r "AI-DEV-NOTE: @FE_DUDES" src/

# 3. Read your task file
cat work/FE_DUDES_TASKS.md

# 4. Start work!
```

### BE_GEEKS
```bash
cd worktrees/backend

# 1. Check for handoffs addressed to you
ls work/handoffs/ | grep "to-BE_GEEKS"

# 2. Search for code notes
grep -r "AI-DEV-NOTE: @BE_GEEKS" src-tauri/

# 3. Read your task file
cat work/BE_GEEKS_TASKS.md

# 4. Start work!
```

### AI_GODS
```bash
cd worktrees/ai

# 1. Check for handoffs addressed to you
ls work/handoffs/ | grep "to-AI_GODS"

# 2. Search for code notes
grep -r "AI-DEV-NOTE: @AI_GODS" src-tauri/

# 3. Read relevant specs
cat specs/*/plan.md

# 4. Start work!
```

---

## Decision Escalation

| Topic | Escalate To | Method |
|-------|-------------|--------|
| Feature scope, UX, priorities | **THE_PO** | Handoff document |
| Architecture, patterns, performance | **MASTER_TL** | Handoff document |
| Both product and technical | **THE_PO** first | Then MASTER_TL |

### Escalation Template

```markdown
# Escalation: [Topic]

**From**: [YOUR_TEAM]
**To**: THE_PO / MASTER_TL
**Epic/Feature**: epic-X / feature-Y
**Date**: YYYY-MM-DD

## Context
[What you're trying to do]

## Options
1. **Option A**: [Description]
   - Pros: ...
   - Cons: ...
2. **Option B**: [Description]
   - Pros: ...
   - Cons: ...

## Our Recommendation
[What the team thinks is best and why]

## What We Need
[Clear decision request]
```

---

## Testing

### FE_DUDES
```bash
npm test                    # Unit tests
npm run lint                # Code style
npm run type-check          # TypeScript
npm run dev                 # Dev server
```

### BE_GEEKS
```bash
cd src-tauri
cargo test                  # Unit tests
cargo clippy                # Lint
cargo build                 # Build
```

### AI_GODS
```bash
cd src-tauri
cargo test ai::             # AI module tests
cargo test rag::            # RAG tests
```

---

## Git Operations in Worktrees

### Daily Operations
```bash
# In your worktree
git status
git add .
git commit -m "feat(<area>): description"
git push origin <branch-name>
```

### Syncing Changes
```bash
# Pull from main (coordinate with other teams first!)
git pull origin main

# Pull from another team's branch (if needed)
git pull origin feature/epic-X-fY-be-name
```

### Cleanup (After Feature Complete)
```bash
# From main repo
git worktree remove worktrees/frontend
git worktree remove worktrees/backend
git worktree remove worktrees/ai

# Or if worktree is gone
git worktree prune
```

---

## Troubleshooting

### Worktree Conflicts
```bash
# "already exists" error
git worktree prune
git worktree add worktrees/frontend feature/...
```

### Changes Not Syncing
```bash
# Team A: push changes
git push origin <branch>

# Team B: pull changes
git pull origin <branch>
```

### Build Errors After Pull
```bash
# Backend
cd src-tauri && cargo clean && cargo build

# Frontend
rm -rf node_modules && npm install
```

---

## Quick Reference

```bash
# Setup
git worktree add worktrees/frontend feature/epic-X-fY-fe-name
git worktree add worktrees/backend feature/epic-X-fY-be-name
git worktree add worktrees/ai feature/epic-X-fY-ai-name

# Work
cd worktrees/frontend    # FE_DUDES
cd worktrees/backend     # BE_GEEKS
cd worktrees/ai          # AI_GODS

# Communicate
# Create: work/handoffs/epic-X-fY-FROM-to-TO.md
# Code:   // AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM

# Sync
git push origin <branch>
git pull origin <branch>

# Test
npm test                 # Frontend
cargo test               # Backend

# Cleanup
git worktree remove worktrees/<name>
```

---

**Last Updated**: 2026-01-19
**Teams**: FE_DUDES, BE_GEEKS, AI_GODS, THE_PO, MASTER_TL
