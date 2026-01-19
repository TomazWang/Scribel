# Quick Start: Parallel Development with AI Agent Teams

This guide helps you launch multiple Claude Code agent teams to work on backend, frontend, and AI features simultaneously using git worktrees.

---

## Team Structure

| Team | Role | Worktree | Implements Code? |
|------|------|----------|------------------|
| **FE_DUDES** | Frontend Development | `worktree-fe/` | Yes |
| **BE_GEEKS** | Backend Development | `worktree-be/` | Yes |
| **AI_GODS** | AI/ML Development | `worktree-ai/` | Yes |
| **THE_PO** | Product Owner | Main repo | No — decisions only |
| **MASTER_TL** | Tech Lead | Main repo | No — reviews only |

---

## Prerequisites

- Git repository with target branch (default: `001-jot-storage-vault-indexing`)
- Claude Code or similar AI coding assistant
- Terminal access
- Parent folder structure ready:
  ```
  robocosmo.scribel/     ← Parent folder
  └── Scribel/           ← This repository
  ```

---

## 1️⃣ Setup Worktrees (One-Time)

Run the setup script from the repository root:

```bash
./setup-parallel-dev.sh [branch-name]
```

This will create:
```
robocosmo.scribel/
├── Scribel/           ← Main repo (THE_PO, MASTER_TL, human)
├── worktree-fe/       ← FE_DUDES workspace
├── worktree-be/       ← BE_GEEKS workspace
└── worktree-ai/       ← AI_GODS workspace
```

**Output**:
```
✅ Worktrees created successfully!

/Users/you/robocosmo.scribel/Scribel         001-jot-storage-vault-indexing
/Users/you/robocosmo.scribel/worktree-fe     001-jot-storage-vault-indexing
/Users/you/robocosmo.scribel/worktree-be     001-jot-storage-vault-indexing
/Users/you/robocosmo.scribel/worktree-ai     001-jot-storage-vault-indexing
```

---

## 2️⃣ Launch Team Agents

### Terminal 1: FE_DUDES (Frontend Team)

```bash
cd ../worktree-fe
claude  # or: code .
```

**Initial Prompt**:
```
I am FE_DUDES (Frontend Development Team).

1. Check work/handoffs/ for any notes addressed to me
2. Read work/handoffs/epic-1-FE_DUDES-tasks.md for my task list
3. Implement frontend components in src/

IMPORTANT:
- I only modify files in src/
- I NEVER modify src-tauri/ (that's BE_GEEKS territory)
- I communicate via work/handoffs/ documents
- I use code comments: // AI-DEV-NOTE: @TEAM - message -- by @FE_DUDES
- I NEVER merge directly; I create handoffs for THE_PO when ready
```

### Terminal 2: BE_GEEKS (Backend Team)

```bash
cd ../worktree-be
claude  # or: code .
```

**Initial Prompt**:
```
I am BE_GEEKS (Backend Development Team).

1. Check work/handoffs/ for any notes addressed to me
2. Read work/handoffs/epic-1-BE_GEEKS-tasks.md for my task list
3. Implement Rust backend in src-tauri/

IMPORTANT:
- I only modify files in src-tauri/
- I NEVER modify src/ (that's FE_DUDES territory)
- I communicate via work/handoffs/ documents
- I use code comments: // AI-DEV-NOTE: @TEAM - message -- by @BE_GEEKS
- I NEVER merge directly; I create handoffs for THE_PO when ready
```

### Terminal 3: AI_GODS (AI/ML Team)

```bash
cd ../worktree-ai
claude  # or: code .
```

**Initial Prompt**:
```
I am AI_GODS (AI/ML Development Team).

1. Check work/handoffs/ for any notes addressed to me
2. Read specs and plan documents for AI requirements
3. Implement AI features in src-tauri/src/ai/

IMPORTANT:
- I own src-tauri/src/ai/ and AI-related schemas
- I coordinate with BE_GEEKS for backend integration
- I communicate via work/handoffs/ documents
- I use code comments: // AI-DEV-NOTE: @TEAM - message -- by @AI_GODS
- I NEVER merge directly; I create handoffs for THE_PO when ready
```

### Main Repo: THE_PO / MASTER_TL / Human

```bash
cd Scribel  # Stay in main repo
```

- Review handoffs in `work/handoffs/`
- Make product/technical decisions
- Coordinate and execute merges

---

## 3️⃣ Communication Protocol

### Handoff Documents

**Location**: `work/handoffs/`

**Filename format**: `<epic-id>-<feature-id>-<from>-to-<to>.md`

**Examples**:
- `epic-1-f1-FE_DUDES-to-BE_GEEKS.md`
- `epic-1-f2-BE_GEEKS-to-THE_PO.md`
- `epic-3-f4-AI_GODS-to-MASTER_TL.md`

### Code Comments

**Format**: `// AI-DEV-NOTE: @<TEAM> - <message> -- by @<YOUR_TEAM>`

**Examples**:
```typescript
// AI-DEV-NOTE: @BE_GEEKS - We expect this response shape from list_jots -- by @FE_DUDES
// AI-DEV-NOTE: @FE_DUDES - Command ready: invoke('create_jot', {...}) -- by @BE_GEEKS
// AI-DEV-NOTE: @AI_GODS - Need streaming support for chat responses -- by @FE_DUDES
```

---

## 4️⃣ File Ownership Rules

| Team | Owns | Must NOT Touch |
|------|------|----------------|
| **FE_DUDES** | `src/`, `package.json`, `vite.config.ts` | `src-tauri/` |
| **BE_GEEKS** | `src-tauri/` (except `src/ai/`) | `src/` |
| **AI_GODS** | `src-tauri/src/ai/` | `src/` |

**Shared (Read-Only for all teams)**:
- `.AI_INSTRUCTION.md`
- `CLAUDE.md`
- `docs/`
- `specs/`

---

## 5️⃣ Merge Rules

**CRITICAL**: Development teams (FE_DUDES, BE_GEEKS, AI_GODS) **NEVER** merge directly.

### Merge Process

1. Team completes feature in their worktree
2. Team creates handoff: `work/handoffs/epic-X-fY-TEAM-to-THE_PO.md`
3. THE_PO reviews and approves
4. THE_PO notifies human that merge is ready
5. Human executes `git merge` commands
6. All teams pull from main

---

## 6️⃣ Monitor Progress

Check for handoffs addressed to you:
```bash
ls work/handoffs/ | grep "to-YOUR_TEAM"
```

Search for code notes:
```bash
grep -r "AI-DEV-NOTE: @YOUR_TEAM" src/ src-tauri/
```

Read workflow documentation:
```bash
cat work/WORKFLOW.md
```

---

## 7️⃣ Cleanup (After Feature Complete)

When all work is merged and complete:

```bash
./cleanup-worktrees.sh
```

This removes all worktrees and prunes git references.

---

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| `work/WORKFLOW.md` | Complete workflow guide |
| `work/handoffs/epic-1-FE_DUDES-tasks.md` | Frontend task list |
| `work/handoffs/epic-1-BE_GEEKS-tasks.md` | Backend task list |
| `work/handoffs/` | Team communication |
| `.AI_INSTRUCTION.md` | Core AI guidance |
| `CLAUDE.md` | Claude Code runtime guidance |

---

## 🔧 Troubleshooting

### Worktrees already exist
```bash
./cleanup-worktrees.sh
./setup-parallel-dev.sh
```

### Branch not found
```bash
git branch -a
./setup-parallel-dev.sh your-branch-name
```

### Changes not syncing between teams
```bash
# Team A: Push changes
git push origin branch-name

# Team B: Pull changes
git pull origin branch-name
```

### Parent folder doesn't exist
Create the parent folder first:
```bash
cd ..
mkdir robocosmo.scribel
mv Scribel robocosmo.scribel/
cd robocosmo.scribel/Scribel
./setup-parallel-dev.sh
```

---

## 💡 Tips for Success

1. **FE_DUDES**: Build with mock data first, don't wait for backend
2. **BE_GEEKS**: Get commands working and tested before integration
3. **AI_GODS**: Coordinate with BE_GEEKS on API interfaces
4. **All Teams**: Update `work/handoffs/` frequently to stay synchronized
5. **All Teams**: Respect file ownership to avoid merge conflicts
6. **All Teams**: Run tests often (`cargo test` / `npm test`)
7. **THE_PO/MASTER_TL**: Monitor handoffs and respond to escalations

---

## 🚀 Quick Reference

```bash
# Setup
./setup-parallel-dev.sh [branch-name]

# Launch Teams
cd ../worktree-fe    # FE_DUDES
cd ../worktree-be    # BE_GEEKS
cd ../worktree-ai    # AI_GODS

# Communicate
# Create: work/handoffs/epic-X-fY-FROM-to-TO.md
# Code:   // AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM

# Sync
git push origin <branch>
git pull origin <branch>

# Test
npm test             # Frontend
cargo test           # Backend

# Cleanup
./cleanup-worktrees.sh
```

---

**Ready to start?** Run `./setup-parallel-dev.sh` and launch your teams! 🚀
