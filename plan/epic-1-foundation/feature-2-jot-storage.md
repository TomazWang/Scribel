# Feature 1.2: Jot Storage

**Status:** Pending
**PRD Reference:** F2 (Jot Storage & Sync)
**Spec:** [specs/feature-1.2-jot-storage.md](specs/feature-1.2-jot-storage.md)

## Overview

Implement a **markdown-first** jot storage system where jots are saved as individual `.md` files inside the user's Obsidian vault. SQLite is used only for indexing and embeddings, ensuring full Obsidian compatibility.

## Architecture

```
User's Obsidian Vault/
├── .scribel/
│   └── jots/
│       ├── 2025-01-19-143256-a1b2.md
│       ├── 2025-01-19-144532-c3d4.md
│       └── ...
├── Daily Notes/
└── ...

{app_data}/scribel.db   ← SQLite for index + embeddings only
```

## Why Markdown-First?

| Benefit | Description |
|---------|-------------|
| **Obsidian compatibility** | Jots visible and searchable in Obsidian |
| **Native sync** | Jots sync with vault (iCloud, Syncthing, etc.) |
| **Backup included** | Vault backup includes all jots |
| **Portability** | No export needed - just files |

## Jot File Format

```markdown
---
id: jot-2025-01-19-143256-a1b2
created: 2025-01-19T14:32:56+08:00
modified: 2025-01-19T14:32:56+08:00
tags: [work, meeting]
links: [Project X]
promoted: false
---

Meeting idea: weekly async standups for [[Project X]] #work #meeting
```

## Requirements

From PRD F2:
- Jots stored as markdown files in `.scribel/jots/`
- Each jot has: `id`, `content`, `created`, `modified`, `tags[]`, `links[]`
- SQLite index for fast queries (cache, rebuilt from files)
- No data loss on crash (files are source of truth)
- Jots queryable by date, tag, content via index

## Tauri Commands

```rust
#[tauri::command]
fn create_jot(content: String) -> Result<Jot, String>

#[tauri::command]
fn get_jots(limit: Option<u32>, offset: Option<u32>) -> Result<Vec<Jot>, String>

#[tauri::command]
fn get_jot(id: String) -> Result<Jot, String>

#[tauri::command]
fn update_jot(id: String, content: String) -> Result<Jot, String>

#[tauri::command]
fn delete_jot(id: String) -> Result<(), String>

#[tauri::command]
fn search_jots(query: String, limit: Option<u32>) -> Result<Vec<Jot>, String>

#[tauri::command]
fn rebuild_jot_index() -> Result<u32, String>
```

## Implementation Tasks

1. [ ] Create `src-tauri/src/jots/` module structure
2. [ ] Implement `models.rs` with Jot and frontmatter structs
3. [ ] Implement `parser.rs` with tag/link extraction and frontmatter
4. [ ] Implement `storage.rs` with file read/write
5. [ ] Implement `index.rs` for SQLite cache
6. [ ] Implement `watcher.rs` for external edit detection
7. [ ] Create Tauri commands in `commands/jots.rs`
8. [ ] Add TypeScript types and API wrapper
9. [ ] Write tests for parser and storage

## Acceptance Criteria

- [ ] Jot files created in `.scribel/jots/` folder
- [ ] Jots visible and searchable in Obsidian
- [ ] Jots persist across app restarts
- [ ] Jot creation latency <50ms
- [ ] External edits (in Obsidian) detected and index updated
- [ ] Tags extracted from content (e.g., `#work` → `["work"]`)
- [ ] Wiki-links extracted (e.g., `[[Note]]` → `["Note"]`)

## Files to Create

```
src-tauri/src/
├── jots/
│   ├── mod.rs          # Module exports
│   ├── models.rs       # Jot struct, frontmatter
│   ├── storage.rs      # File operations
│   ├── parser.rs       # Tag/link extraction
│   ├── index.rs        # SQLite cache
│   └── watcher.rs      # File watcher
├── db/
│   ├── mod.rs
│   ├── connection.rs   # SQLite setup
│   └── migrations.rs   # Schema
└── commands/
    └── jots.rs         # Tauri commands
```

## Performance Target

| Metric | Target | Notes |
|--------|--------|-------|
| Create jot | <50ms | File write + index update |
| List 50 jots | <100ms | Index query |
| Search | <500ms | SQLite LIKE query |

## Dependencies

- `rusqlite` with `bundled` feature
- `serde`, `serde_yaml` for frontmatter
- `notify` for file watching
- `chrono` for timestamps
- `regex` for tag/link extraction

## Next Feature

→ [Feature 1.3: Quick Jot Interface](feature-3-quick-jot-interface.md)
