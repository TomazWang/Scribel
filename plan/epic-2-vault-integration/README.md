# Epic 2: Vault Integration

**Goal:** Connect to user's Obsidian vault

This Epic adds the ability to connect Scribel to an existing Obsidian vault, monitor it for changes, and sync jots to daily notes.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 2.1 | Vault Configuration | F2 | Pending | Settings UI with vault path selector |
| 2.2 | File Watcher | F3 | Pending | Monitor vault for file changes |
| 2.3 | Daily Note Sync | F2 | Pending | Auto-append jots to daily notes |

## Success Criteria

- Vault path persisted in app settings
- Auto-detect Obsidian vault (`.obsidian/` folder)
- File changes detected within 2 seconds
- Daily note sync preserves existing content
- Respect `.gitignore` patterns

## Dependencies

- Epic 1: Foundation (completed)

## Tech Considerations

- Use `notify` crate for file watching in Rust
- Store settings in app data directory
- Daily note format: `YYYY-MM-DD.md`
