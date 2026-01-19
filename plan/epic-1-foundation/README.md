# Epic 1: Foundation

**Goal:** Basic jot capture and storage working

This Epic establishes the core infrastructure for Scribel — the Tauri app scaffold, SQLite storage, basic UI, and global hotkey.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 1.1 | [Project Scaffold](feature-1-project-scaffold.md) | - | ✅ Done | Tauri + React + TypeScript + Tailwind |
| 1.2 | [Jot Storage](feature-2-jot-storage.md) | F2 | Pending | SQLite schema and CRUD operations |
| 1.3 | [Quick Jot Interface](feature-3-quick-jot-interface.md) | F1 | Pending | Input, list, timestamps, tags, links |
| 1.4 | [Global Hotkey](feature-4-global-hotkey.md) | F1 | Pending | System-wide keyboard shortcut |

## Success Criteria

From PRD/Constitution:
- Cold start to first jot: <500ms
- Jot creation latency: <50ms
- Global hotkey response: <200ms
- No data loss on crash (SQLite WAL mode)

## Dependencies

- None (this is the foundation)

## Tech Stack Used

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Backend:** Rust, Tauri 2.x
- **Storage:** SQLite with rusqlite (bundled)
- **Async:** tokio runtime
