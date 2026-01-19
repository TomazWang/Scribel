---
description: Setup squad development environment with git worktrees for FE_DUDES, BE_GEEKS, and AI_GODS teams
---

# /squad.new

## Purpose

This command automates the setup of squad development environments using git worktrees, enabling multiple AI agent teams to work simultaneously on different aspects of the codebase.

## User Input

```text
$ARGUMENTS
```

The user can optionally provide a branch name. If not provided, defaults to `001-jot-storage-vault-indexing`.

## Team Structure

| Team | Role | Worktree | Implements Code? |
|------|------|----------|------------------|
| **FE_DUDES** | Frontend Development | `worktrees/frontend/` | Yes |
| **BE_GEEKS** | Backend Development | `worktrees/backend/` | Yes |
| **AI_GODS** | AI/ML Development | `worktrees/ai/` | Yes |
| **THE_PO** | Product Owner | Main repo | No — decisions only |
| **MASTER_TL** | Tech Lead | Main repo | No — reviews only |

## Execution Steps

1. **Validate Prerequisites**
   - Check that we're in the repository root by verifying `CLAUDE.md` exists
   - Verify git repository is initialized
   - Confirm user is in the main Scribel directory (not a worktree)

2. **Parse Arguments**
   - Extract branch name from `$ARGUMENTS` if provided
   - Default to `001-jot-storage-vault-indexing` if no branch specified
   - Validate that the branch exists

3. **Run Setup Script**
   - Execute `./work/scripts/setup-parallel-dev.sh [branch-name]` using the Bash tool
   - The script will:
     - Create `worktrees/` directory if needed
     - Clean up any existing worktrees
     - Create team-specific feature branches with timestamps
     - Set up three worktrees: `worktrees/frontend/`, `worktrees/backend/`, `worktrees/ai/`
     - Display the complete directory structure

4. **Display Launch Instructions**
   - Show the user the team launch commands from the script output
   - Provide quick reference for each team:
     - Terminal paths (`cd worktrees/frontend/`, etc.)
     - Initial prompts for each team agent
     - File ownership rules
     - Communication protocols

5. **Provide Next Steps**
   - Remind user about key documentation:
     - `work/README.md` - Quick start guide
     - `work/WORKFLOW.md` - Complete workflow
     - `work/handoffs/` - Team communication folder
   - Summarize merge rules:
     - Dev teams NEVER merge directly
     - THE_PO coordinates merges
     - Human executes git commands

## Example Usage

User runs:
```
/parallel-dev
```

Or with a specific branch:
```
/parallel-dev my-feature-branch
```

## Output Format

After successful execution, display:

```
✅ Parallel Development Environment Ready

📦 Worktrees Created:
  • FE_DUDES:  worktrees/frontend/  → [branch-name]-fe-[timestamp]
  • BE_GEEKS:  worktrees/backend/   → [branch-name]-be-[timestamp]
  • AI_GODS:   worktrees/ai/        → [branch-name]-ai-[timestamp]

🚀 Launch Your Teams:

Terminal 1 (FE_DUDES):
  cd worktrees/frontend && claude

Terminal 2 (BE_GEEKS):
  cd worktrees/backend && claude

Terminal 3 (AI_GODS):
  cd worktrees/ai && claude

📚 Documentation:
  • work/README.md - Quick start guide
  • work/WORKFLOW.md - Complete workflow
  • work/handoffs/ - Team communication

⚠️  Remember:
  • Each team has their own branch
  • Dev teams communicate via work/handoffs/
  • Dev teams NEVER merge directly
  • THE_PO coordinates all merges
```

## Error Handling

If errors occur, provide helpful guidance:

- **Not in repository root**: Guide user to `cd` to the Scribel directory
- **Branch doesn't exist**: Show available branches with `git branch -a`
- **Script not executable**: Run `chmod +x work/scripts/setup-parallel-dev.sh`
- **Worktrees already exist**: Suggest running `./work/scripts/cleanup-worktrees.sh` first

## Related Documentation

- [work/scripts/setup-parallel-dev.sh](../../work/scripts/setup-parallel-dev.sh) - The setup script
- [work/scripts/cleanup-worktrees.sh](../../work/scripts/cleanup-worktrees.sh) - The cleanup script
- [work/README.md](../../work/README.md) - Quick start guide
- [work/WORKFLOW.md](../../work/WORKFLOW.md) - Complete workflow guide
- [CLAUDE.md](../../CLAUDE.md) - Runtime guidance including team structure

## Notes

- This command is idempotent - it cleans up existing worktrees before creating new ones
- Each run creates new timestamped branches to avoid conflicts
- The script output is piped through to show full setup details
- After setup, teams work independently in their worktrees and communicate via `work/handoffs/`
