---
description: Start squad work in a worktree, auto-detecting team and using Speckit if available
---

# /squad.go

## Purpose

This command helps AI agents start working in their squad worktree. It auto-detects which team the agent is (FE_DUDES, BE_GEEKS, or AI_GODS) and intelligently chooses between Speckit-driven implementation or handoff-based work.

## Team Detection

The command automatically detects which team you are based on:
1. Current working directory (`pwd`)
   - `worktrees/frontend` → FE_DUDES
   - `worktrees/backend` → BE_GEEKS
   - `worktrees/ai` → AI_GODS
2. Git branch name
   - Contains `-fe-` → FE_DUDES
   - Contains `-be-` → BE_GEEKS  
   - Contains `-ai-` → AI_GODS

## Execution Flow

### Step 1: Identify Team
```bash
# Check current directory
pwd

# Check git branch
git branch --show-current
```

Determine team identity and announce it:
```
I am [TEAM_NAME] working in [WORKTREE_PATH].
```

### Step 2: Check for Speckit Artifacts

Look for Speckit-generated files in the repository:
```bash
# Check if Speckit artifacts exist
find . -name "spec.md" -o -name "plan.md" -o -name "tasks.md" | head -5
```

If Speckit artifacts exist (spec.md, plan.md, tasks.md):
- **Path A: Use Speckit workflow**
- Call `/speckit.implement` to execute structured implementation

If no Speckit artifacts:
- **Path B: Use handoff-based workflow**
- Read handoff notes from `work/handoffs/`
- Read task files: `work/handoffs/epic-X/epic-X-[TEAM]-tasks.md`

### Step 3A: Speckit-Based Implementation

When Speckit artifacts are found:

1. **Announce Speckit Mode**:
   ```
   Speckit artifacts detected. Using /speckit.implement for structured implementation.
   ```

2. **Execute Speckit Implementation**:
   - Use the `Skill` tool to call `/speckit.implement`
   - Follow Speckit's structured task execution
   - Speckit will handle task breakdown and execution

3. **Communication**:
   - Leave `// AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM` comments in code
   - Create handoff documents in `work/handoffs/` when:
     - Blocking on another team
     - Needing coordination
     - Feature complete

### Step 3B: Handoff-Based Implementation

When no Speckit artifacts:

1. **Read Handoffs**:
   ```bash
   # Check for notes addressed to your team
   ls work/handoffs/ | grep "to-[TEAM_NAME]"

   # Read team task file
   cat work/handoffs/epic-X/epic-X-[TEAM_NAME]-tasks.md
   ```

2. **Search for Code Notes**:
   ```bash
   # Find AI-DEV-NOTE comments for your team
   grep -r "AI-DEV-NOTE: @[TEAM_NAME]" src/ src-tauri/
   ```

3. **Implement Tasks**:
   - Work through tasks in priority order
   - Follow file ownership rules (see below)
   - Write tests alongside implementation
   - Leave handoff notes for other teams when needed

4. **Create Handoffs**:
   - When blocking on another team
   - When needing coordination
   - When feature complete

### Step 4: Completion

When implementation is complete:

1. **Create Final Handoff to THE_PO**:
   ```markdown
   # work/handoffs/epic-X-fY-[TEAM]-to-THE_PO.md

   **From**: [YOUR_TEAM]
   **To**: THE_PO
   **Date**: [TODAY]

   ## Summary
   Completed implementation of [feature description].

   ## What We Need
   Ready for review, commit, and PR creation.

   ## Files Changed
   - List all modified/created files

   ## Testing
   - [x] Unit tests pass
   - [x] Integration tests pass (if applicable)
   - [x] Manual testing completed

   ## Notes
   - Any important decisions made
   - Any blockers encountered
   - Any coordination needed with other teams
   ```

2. **Ask Human for Review**:
   ```
   Implementation complete! Created handoff to THE_PO at:
   work/handoffs/epic-X-fY-[TEAM]-to-THE_PO.md

   Ready for human to:
   1. Review the changes
   2. Run tests: [npm test / cargo test]
   3. Commit changes: git add . && git commit
   4. Push branch: git push origin [branch-name]
   5. Create PR
   ```

## File Ownership Rules

**CRITICAL**: Each team has exclusive write access to specific folders.

| Team | Owns | MUST NOT Touch |
|------|------|----------------|
| **FE_DUDES** | `src/**/*`, `package.json`, `tsconfig.json`, `vite.config.ts` | `src-tauri/**/*` |
| **BE_GEEKS** | `src-tauri/**/*` (except `src/ai/`), `Cargo.toml`, `tauri.conf.json` | `src/**/*` |
| **AI_GODS** | `src-tauri/src/ai/**/*`, AI schemas | `src/**/*` |

**Shared (Read-Only)**:
- `.AI_INSTRUCTION.md`
- `CLAUDE.md`
- `PARALLEL_WORKFLOW.md`
- `docs/**/*`
- `specs/**/*`

## Communication Formats

### Handoff Document Format
```markdown
# Handoff: [Feature/Issue Name]

**From**: [YOUR_TEAM]
**To**: [TARGET_TEAM]
**Epic/Feature**: epic-X / feature-Y
**Date**: YYYY-MM-DD

## Summary
[Brief description]

## What We Need
[Clear request]

## Files Changed
- path/to/file1
- path/to/file2

## Notes
[Important context]
```

### Code Comment Format
```typescript
// AI-DEV-NOTE: @TEAM - message -- by @YOUR_TEAM
```

## Testing Requirements

Before marking work complete:

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

## Error Handling

If team cannot be detected:
1. Check if you're in a worktree directory
2. Check git branch name
3. Ask user to specify team: `/agent-work FE_DUDES` (optional argument)

If no tasks found:
1. Check `work/handoffs/` for handoffs
2. Check for Speckit artifacts in parent directories
3. Report to user and ask for guidance

## Example Usage

### Example 1: FE_DUDES with Speckit
```bash
cd worktrees/frontend
/agent-work
# → Detects FE_DUDES
# → Finds specs/jot-interface/spec.md
# → Calls /speckit.implement
# → Works through tasks
# → Creates handoff to THE_PO when done
```

### Example 2: BE_GEEKS without Speckit
```bash
cd worktrees/backend
/agent-work
# → Detects BE_GEEKS
# → No Speckit artifacts found
# → Reads work/handoffs/epic-1/epic-1-BE_GEEKS-tasks.md
# → Implements tasks
# → Creates handoff to THE_PO when done
```

## Related Documentation

- [`PARALLEL_WORKFLOW.md`](../../PARALLEL_WORKFLOW.md) - Complete parallel development guide
- [`work/README.md`](../../work/README.md) - Quick start for teams
- `.claude/agents/[TEAM].agent.md` - Individual team agent definitions
- Speckit commands: `/speckit.specify`, `/speckit.plan`, `/speckit.implement`

## Notes

- This command is designed to be run once per worktree session
- Agents should work autonomously until completion or blocking
- Always respect file ownership rules
- Always leave clear handoff notes for coordination
- Never merge directly; always create handoff to THE_PO when ready
