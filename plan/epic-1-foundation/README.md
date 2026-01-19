# Epic 1: Foundation

**Goal:** Basic jot capture and storage working

This Epic establishes the core infrastructure for Scribel — the Tauri app scaffold, markdown-first jot storage, basic UI, and global hotkey.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 1.1 | [Project Scaffold](feature-1-project-scaffold.md) | - | ✅ Done | Tauri + React + TypeScript + Tailwind |
| 1.2 | [Jot Storage](feature-2-jot-storage.md) | F2 | Pending | Markdown files in vault + SQLite index |
| 1.3 | [Quick Jot Interface](feature-3-quick-jot-interface.md) | F1 | Pending | Input, list, timestamps, tags, links |
| 1.4 | [Global Hotkey](feature-4-global-hotkey.md) | F1 | Pending | System-wide keyboard shortcut |

## Architecture Overview

```
User's Obsidian Vault/
├── .scribel/jots/          ← Jots stored as markdown files
│   ├── 2025-01-19-143256-a1b2.md
│   └── ...
└── ...

{app_data}/scribel.db       ← SQLite for index + embeddings only
```

## Success Criteria

From PRD/Constitution:
- Cold start to first jot: <500ms
- Jot creation latency: <50ms
- Global hotkey response: <200ms
- No data loss on crash (markdown files are source of truth)
- Jots visible and searchable in Obsidian

## Dependencies

- None (this is the foundation)

## Tech Stack Used

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Backend:** Rust, Tauri 2.x
- **Jot Storage:** Markdown files with YAML frontmatter
- **Index/Cache:** SQLite with rusqlite (bundled)
- **File Watching:** notify crate
- **Async:** tokio runtime
