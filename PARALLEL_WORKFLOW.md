# Parallel Development Workflow

**Quick Reference**: Enable 3 AI agent teams to work simultaneously on frontend, backend, and AI features using git worktrees, with optional Speckit integration.

---

## 1. Human Quick Start

### Two Workflows: With or Without Speckit

#### Path A: With Speckit (Recommended for New Features)
```bash
# Step 1: Create feature spec and plan
/speckit.specify    # Create feature specification
/speckit.plan       # Generate implementation plan
# → This creates: specs/epic-N-feat-M-{short-name}/spec.md, plan.md, tasks.md
# → Defines branch names for each team

# Step 2: Setup parallel worktrees using branch names from plan
/squad.new [branch-name-from-plan]

# Step 3: Launch agents in each worktree (3 terminals)
cd worktrees/frontend && claude
cd worktrees/backend && claude
cd worktrees/ai && claude

# Step 4: In each terminal, agents run:
/squad.go          # Auto-detects team, runs /speckit.implement
```

#### Path B: Without Speckit (For Simple Tasks)
```bash
# Step 1: Create handoff documents manually
# Create work/handoffs/epic-X/epic-X-TEAM-tasks.md files

# Step 2: Setup parallel worktrees
/squad.new [branch-name]

# Step 3: Launch agents in each worktree (3 terminals)
cd worktrees/frontend && claude
cd worktrees/backend && claude
cd worktrees/ai && claude

# Step 4: In each terminal, agents run:
/squad.go          # Auto-detects team, works from handoff notes
```

### Worktree Structure Created
```
robocosmo.scribel/
├── Scribel/              ← Main repo (you + THE_PO + MASTER_TL)
├── specs/                ← Speckit artifacts (if using Speckit)
│   └── epic-N-feat-M-{short-name}/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── worktrees/
    ├── frontend/         ← FE_DUDES workspace
    ├── backend/          ← BE_GEEKS workspace
    └── ai/               ← AI_GODS workspace
```

### Agent Quick Start: Use `/squad.go`

Once in your worktree, simply run:
```bash
/squad.go
```

This command will:
1. Auto-detect which team you are (FE_DUDES, BE_GEEKS, or AI_GODS)
2. Check for Speckit artifacts (spec.md, plan.md, tasks.md)
3. If Speckit exists → Run `/speckit.implement`
4. If not → Work from `work/handoffs/` notes
5. Implement features, leaving handoff notes for other teams
6. When complete → Create handoff to THE_PO for review

### Monitor & Coordinate
```bash
# Check handoffs
ls work/handoffs/

# Read specific handoff
cat work/handoffs/epic-1-f1-FE_DUDES-to-BE_GEEKS.md

# Search for code notes
grep -r "AI-DEV-NOTE:" src/ src-tauri/
```

### Review & Create Pull Requests (When Teams Are Ready)

When agents complete work, they create handoffs to THE_PO. Human should:

1. **Review Handoffs**:
   ```bash
   ls work/handoffs/ | grep "to-THE_PO"
   cat work/handoffs/epic-X-fY-TEAM-to-THE_PO.md
   ```

2. **Review & Test Changes** (for each team):
   ```bash
   cd worktrees/frontend  # or backend, or ai

   # Run tests
   npm test              # Frontend
   cargo test            # Backend

   # Review code
   git diff
   git status
   ```

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat(area): description"
   git push origin <branch-name>
   ```

4. **Create Pull Request**:
   ```bash
   # Use GitHub CLI
   gh pr create --title "feat: description" --body "Description"

   # Or create manually on GitHub
   ```

5. **After PR Approval & Merge**:
   ```bash
   # All teams pull updated main
   cd worktrees/frontend && git pull origin main
   cd worktrees/backend && git pull origin main
   cd worktrees/ai && git pull origin main
   ```

### Cleanup (When Done)
```bash
./work/scripts/cleanup-worktrees.sh
```

---

## 2. Agent Team Structure

| Team | Role | Worktree | Owns | Code? |
|------|------|----------|------|-------|
| **FE_DUDES** | Frontend Dev | `worktrees/frontend/` | `src/` | Yes |
| **BE_GEEKS** | Backend Dev | `worktrees/backend/` | `src-tauri/` (except `ai/`) | Yes |
| **AI_GODS** | AI/ML Dev | `worktrees/ai/` | `src-tauri/src/ai/` | Yes |
| **THE_PO** | Product Owner | Main repo | Decisions | No |
| **MASTER_TL** | Tech Lead | Main repo | Reviews | No |

---

## 3. How Agents Work Together

### File Ownership (Exclusive Write Access)

**FE_DUDES** owns:
- `src/**/*`
- `package.json`, `tsconfig.json`, `vite.config.ts`

**BE_GEEKS** owns:
- `src-tauri/**/*` (except `src-tauri/src/ai/`)
- `Cargo.toml`, `tauri.conf.json`

**AI_GODS** owns:
- `src-tauri/src/ai/**/*`
- AI-related database schemas

**Shared (Read-Only)**:
- `.AI_INSTRUCTION.md`, `CLAUDE.md`, `docs/`, `specs/`, `plan/`

### Communication Protocol

#### 1. Handoff Documents (Major Communication)

**Location**: `work/handoffs/`

**Filename**: `<epic-id>-<feature-id>-<from>-to-<to>.md`

**Examples**:
- `epic-1-f1-FE_DUDES-to-BE_GEEKS.md`
- `epic-1-f2-BE_GEEKS-to-THE_PO.md`
- `epic-3-f4-AI_GODS-to-MASTER_TL.md`

**When to Create**:
- Feature complete / ready for review
- Blocked on another team
- Need decision from THE_PO/MASTER_TL
- Ready for merge

**Template**:
```markdown
# Handoff: [Feature Name]

**From**: [YOUR_TEAM]
**To**: [TARGET_TEAM]
**Epic/Feature**: epic-X / feature-Y
**Date**: YYYY-MM-DD

## Summary
[What was done]

## What We Need
[Clear request]

## Files Changed
- path/to/file1
- path/to/file2

## Notes
[Specific information for recipient]
```

#### 2. Code Comments (Inline Notes)

**Format**: `// AI-DEV-NOTE: @<TEAM> - <message> -- by @<YOUR_TEAM>`

**Examples**:
```typescript
// AI-DEV-NOTE: @BE_GEEKS - Need list_jots to return tags array -- by @FE_DUDES
// AI-DEV-NOTE: @FE_DUDES - Command ready: invoke('create_jot', {...}) -- by @BE_GEEKS
// AI-DEV-NOTE: @THE_PO - Confirm this UX matches requirements -- by @FE_DUDES
// AI-DEV-NOTE: @MASTER_TL - Is this error pattern correct? -- by @BE_GEEKS
```

### Workflow Loop

#### With Speckit
```
┌─────────────────────────────────────────────────────────┐
│ 1. Human runs /speckit.specify → /speckit.plan         │
│    ↓                                                    │
│ 2. Human runs /squad.new [branch-from-plan]         │
│    ↓                                                    │
│ 3. Agents run /squad.go in their worktrees           │
│    ↓                                                    │
│ 4. Agents use /speckit.implement to execute tasks      │
│    ↓                                                    │
│ 5. Agents create handoff to THE_PO when complete       │
│    ↓                                                    │
│ 6. Human reviews, commits, pushes, creates PR          │
│    ↓                                                    │
│ 7. After PR merge, all teams pull from main            │
└─────────────────────────────────────────────────────────┘
```

#### Without Speckit
```
┌─────────────────────────────────────────────────────────┐
│ 1. Human creates handoff docs in work/handoffs/        │
│    ↓                                                    │
│ 2. Human runs /squad.new [branch-name]              │
│    ↓                                                    │
│ 3. Agents run /squad.go in their worktrees           │
│    ↓                                                    │
│ 4. Agents implement from handoff notes                 │
│    ↓                                                    │
│ 5. Agents create handoff to THE_PO when complete       │
│    ↓                                                    │
│ 6. Human reviews, commits, pushes, creates PR          │
│    ↓                                                    │
│ 7. After PR merge, all teams pull from main            │
└─────────────────────────────────────────────────────────┘
```

### Merge Rules

**CRITICAL**: Development teams (FE_DUDES, BE_GEEKS, AI_GODS) **NEVER** merge directly.

**Process**:
1. Team completes feature → creates handoff to THE_PO
2. THE_PO reviews → approves → notifies human
3. Human executes merge commands
4. All teams pull updated main

---

## 4. Agent Quick Start with `/squad.go`

### Recommended: Use the `/squad.go` Command

Once in your worktree, simply run:
```bash
/squad.go
```

This single command will:
1. **Auto-detect** which team you are (FE_DUDES, BE_GEEKS, or AI_GODS)
2. **Check for Speckit** artifacts (spec.md, plan.md, tasks.md)
3. **Execute appropriately**:
   - If Speckit exists → Run `/speckit.implement`
   - If not → Work from `work/handoffs/` notes
4. **Implement features** following file ownership rules
5. **Leave handoff notes** for coordination
6. **Create final handoff** to THE_PO when complete

### Manual Startup (Alternative)

If you prefer manual control:

```bash
# 1. Identify your team
pwd  # Check directory: worktrees/frontend, backend, or ai

# 2. Check for handoffs addressed to you
ls work/handoffs/ | grep "to-YOUR_TEAM"

# 3. Search for code notes
grep -r "AI-DEV-NOTE: @YOUR_TEAM" src/ src-tauri/

# 4. Check for Speckit artifacts
find . -name "spec.md" -o -name "plan.md" -o -name "tasks.md"

# 5. Start implementing
# - Use /speckit.implement if Speckit exists
# - Or implement from handoff notes
```

### Workflow Comparison

| Aspect | With Speckit | Without Speckit |
|--------|-------------|-----------------|
| **Task Source** | `specs/epic-N-feat-M-{short-name}/tasks.md` | `work/handoffs/epic-X-TEAM-tasks.md` |
| **Execution** | `/speckit.implement` | Manual implementation |
| **Structure** | Formal spec → plan → tasks | Informal handoff notes |
| **Best For** | New features, complex work | Bug fixes, simple tasks |
| **Agent Command** | `/squad.go` (auto-detects) | `/squad.go` (auto-detects) |

---

## 5. Testing

**FE_DUDES**:
```bash
npm test              # Unit tests
npm run lint          # Linting
npm run type-check    # TypeScript
```

**BE_GEEKS**:
```bash
cd src-tauri
cargo test            # All tests
cargo clippy          # Lint
cargo build           # Build check
```

**AI_GODS**:
```bash
cd src-tauri
cargo test ai::       # AI module tests
```

---

## 6. Decision Escalation

| Topic | Escalate To | Method |
|-------|-------------|--------|
| Feature scope, UX, product direction | **THE_PO** | Handoff document |
| Architecture, patterns, performance | **MASTER_TL** | Handoff document |
| Both product and technical | **THE_PO** first | Then MASTER_TL if needed |

---

## 7. Git Commands Reference

### Daily Operations (In Worktree)
```bash
git status
git add .
git commit -m "feat(area): description"
git push origin <branch-name>
```

### Stay in Sync
```bash
# Pull from main (coordinate first!)
git pull origin main

# Pull from another team's branch (if needed)
git pull origin <other-team-branch>
```

### Branch Naming Convention
```
feature/<epic-id>-<feature-id>-<team>-<short-name>

Examples:
- feature/epic-1-f1-fe-jot-input      (FE_DUDES)
- feature/epic-1-f2-be-jot-storage    (BE_GEEKS)
- feature/epic-3-f4-ai-rag-pipeline   (AI_GODS)
```

---

## 8. Troubleshooting

### Worktrees Already Exist
```bash
./work/scripts/cleanup-worktrees.sh
./work/scripts/setup-parallel-dev.sh
```

### Changes Not Syncing
```bash
# Team A pushes
git push origin <branch>

# Team B pulls
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

## 9. Implementation Details

### Where Agents Are Defined

**Agent Definitions**: `.claude/agents/`
- `FE_DUDES.agent.md` - Frontend team prompt
- `BE_GEEKS.agent.md` - Backend team prompt
- `AI_GODS.agent.md` - AI team prompt
- `THE_PO.agent.md` - Product owner prompt
- `MASTER_TL.agent.md` - Tech lead prompt

**Setup Command**: `.claude/commands/squad.new.md`
- Defines the `/squad.new` command for Claude Code

**Scripts**:
- `work/scripts/setup-parallel-dev.sh` - Automated worktree setup
- `work/scripts/cleanup-worktrees.sh` - Automated cleanup

**Communication Folder**:
- `work/handoffs/` - All team handoff documents

### Core References

**Must Read**:
- `.AI_INSTRUCTION.md` - Core AI guidance and principles
- `CLAUDE.md` - Runtime guidance for Claude Code
- This file (`PARALLEL_WORKFLOW.md`) - Workflow reference

**Supporting Docs**:
- `docs/PRD.md` - Product requirements
- `docs/TECH_DESIGN.md` - Technical architecture

---

## 10. Quick Command Reference

### With Speckit Workflow
```bash
# ===== SETUP (Main Repo) =====
/speckit.specify                                 # Create feature spec
/speckit.plan                                    # Generate implementation plan
/squad.new [branch-from-plan]                # Setup worktrees

# ===== LAUNCH AGENTS (3 Terminals) =====
cd worktrees/frontend && claude                  # Terminal 1: FE_DUDES
cd worktrees/backend && claude                   # Terminal 2: BE_GEEKS
cd worktrees/ai && claude                        # Terminal 3: AI_GODS

# ===== START WORK (In Each Worktree) =====
/squad.go                                      # Auto-detects team, uses Speckit

# ===== MONITOR (Main Repo) =====
ls work/handoffs/ | grep "to-THE_PO"           # Check for completion
cat work/handoffs/epic-X-fY-TEAM-to-THE_PO.md  # Read handoff

# ===== REVIEW & PR (Main Repo) =====
cd worktrees/frontend                            # Or backend, ai
npm test                                         # Run tests
git add . && git commit -m "feat: description"  # Commit
git push origin <branch>                         # Push
gh pr create                                     # Create PR

# ===== CLEANUP =====
./work/scripts/cleanup-worktrees.sh             # Remove all worktrees
```

### Without Speckit Workflow
```bash
# ===== SETUP (Main Repo) =====
# Create handoff docs in work/handoffs/epic-X/
/squad.new [branch-name]                     # Setup worktrees

# ===== LAUNCH AGENTS (3 Terminals) =====
cd worktrees/frontend && claude                  # Terminal 1: FE_DUDES
cd worktrees/backend && claude                   # Terminal 2: BE_GEEKS
cd worktrees/ai && claude                        # Terminal 3: AI_GODS

# ===== START WORK (In Each Worktree) =====
/squad.go                                      # Auto-detects team, uses handoffs

# ===== REST OF WORKFLOW =====
# Same as "With Speckit" workflow above
```

### Common Commands
```bash
# ===== TESTING =====
npm test                                         # Frontend tests
cd src-tauri && cargo test                       # Backend tests
cargo test ai::                                  # AI module tests

# ===== GIT OPERATIONS =====
git push origin <branch>                         # Share changes
git pull origin main                             # Get updates
git status                                       # Check status

# ===== COMMUNICATION =====
ls work/handoffs/                                # List all handoffs
grep -r "AI-DEV-NOTE:" src/ src-tauri/          # Find code notes
```

---

**Last Updated**: 2026-01-19
**For Questions**: See `.AI_INSTRUCTION.md` or `CLAUDE.md`
