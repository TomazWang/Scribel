# Feature 1.2: Jot Storage

**Status:** Pending
**PRD Reference:** F2 (Jot Storage & Sync)

## Overview

Implement SQLite database for storing jots with CRUD operations exposed to the frontend via Tauri commands.

## Requirements

From PRD F2:
- Jots stored in local SQLite database
- Each jot has: `id`, `content`, `timestamp`, `tags[]`, `links[]`
- No data loss on crash (SQLite WAL mode)
- Jots queryable by date, tag, content

## Schema

```sql
CREATE TABLE jots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,  -- Unix timestamp (ms)
  tags TEXT,                   -- JSON array: ["tag1", "tag2"]
  links TEXT,                  -- JSON array: ["[[Note A]]", "[[Note B]]"]
  promoted BOOLEAN DEFAULT 0
);

-- Index for common queries
CREATE INDEX idx_jots_timestamp ON jots(timestamp DESC);
```

## Tauri Commands

```rust
#[tauri::command]
fn create_jot(content: String) -> Result<Jot, String>

#[tauri::command]
fn get_jots(limit: Option<u32>, offset: Option<u32>) -> Result<Vec<Jot>, String>

#[tauri::command]
fn get_jot(id: i64) -> Result<Jot, String>

#[tauri::command]
fn delete_jot(id: i64) -> Result<(), String>

#[tauri::command]
fn search_jots(query: String) -> Result<Vec<Jot>, String>
```

## Implementation Tasks

1. [ ] Create `src-tauri/src/db/` module
2. [ ] Implement database initialization with WAL mode
3. [ ] Define `Jot` struct with serde
4. [ ] Implement `create_jot` command
5. [ ] Implement `get_jots` command with pagination
6. [ ] Implement `delete_jot` command
7. [ ] Implement basic `search_jots` (text search)
8. [ ] Parse `#tags` and `[[links]]` from content
9. [ ] Add tests for CRUD operations

## Acceptance Criteria

- [ ] Jots persist across app restarts
- [ ] Jot creation latency <50ms
- [ ] No data loss on crash/force quit
- [ ] Tags extracted from content (e.g., `#work` → `["work"]`)
- [ ] Wiki-links extracted (e.g., `[[Note]]` → `["Note"]`)

## Files to Create

```
src-tauri/src/
├── db/
│   ├── mod.rs          # Module exports
│   ├── init.rs         # Database initialization
│   └── jots.rs         # Jot CRUD operations
└── lib.rs              # Register commands
```

## Performance Target

| Metric | Target | Method |
|--------|--------|--------|
| Create jot | <50ms | Benchmark with `std::time::Instant` |
| List 100 jots | <100ms | Pagination prevents loading all |
| Search | <500ms | SQLite FTS or LIKE query |

## Dependencies

- `rusqlite` with `bundled` feature (already added)
- `serde` for JSON serialization (already added)

## Next Feature

→ [Feature 1.3: Quick Jot Interface](feature-3-quick-jot-interface.md)
