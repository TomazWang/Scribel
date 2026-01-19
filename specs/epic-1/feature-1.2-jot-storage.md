# Specification: Feature 1.2 - Jot Storage

**Epic:** Epic 1 - Foundation
**Feature:** 1.2 Jot Storage
**Status:** Ready for Implementation
**PRD Reference:** F2 (Jot Storage & Sync)
**Plan Reference:** [plan/epic-1-foundation/feature-2-jot-storage.md](../../plan/epic-1-foundation/feature-2-jot-storage.md)

---

## 1. Overview

### 1.1 Purpose
Implement a local SQLite database for persistent jot storage with full CRUD operations exposed to the frontend via Tauri commands.

### 1.2 Scope
- SQLite database initialization with WAL mode
- Jot data model and schema
- CRUD Tauri commands (create, read, update, delete)
- Tag and wiki-link extraction from content
- Basic text search functionality

### 1.3 Out of Scope
- Vault synchronization (Epic 2)
- Full-text search with FTS5 (future optimization)
- Cloud backup

---

## 2. Technical Design

### 2.1 Database Schema

```sql
-- Main jots table
CREATE TABLE IF NOT EXISTS jots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,      -- Unix timestamp in milliseconds
    updated_at INTEGER NOT NULL,      -- Unix timestamp in milliseconds
    tags TEXT DEFAULT '[]',           -- JSON array: ["tag1", "tag2"]
    links TEXT DEFAULT '[]',          -- JSON array: ["Note A", "Note B"]
    promoted INTEGER DEFAULT 0        -- Boolean: 0 = false, 1 = true
);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_jots_created_at ON jots(created_at DESC);

-- Index for tag searches (future use)
CREATE INDEX IF NOT EXISTS idx_jots_promoted ON jots(promoted);
```

### 2.2 Data Model

```rust
// src-tauri/src/db/models.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jot {
    pub id: i64,
    pub content: String,
    pub created_at: i64,      // Unix timestamp (ms)
    pub updated_at: i64,      // Unix timestamp (ms)
    pub tags: Vec<String>,    // Extracted from content
    pub links: Vec<String>,   // Extracted from content (without [[ ]])
    pub promoted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJotInput {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateJotInput {
    pub id: i64,
    pub content: String,
}
```

### 2.3 Module Structure

```
src-tauri/src/
├── db/
│   ├── mod.rs              # Module exports
│   ├── connection.rs       # Database connection management
│   ├── migrations.rs       # Schema creation/migrations
│   ├── models.rs           # Jot struct definitions
│   ├── jots.rs             # CRUD operations
│   └── parser.rs           # Tag/link extraction
├── commands/
│   ├── mod.rs              # Command exports
│   └── jots.rs             # Tauri command handlers
└── lib.rs                  # App setup, command registration
```

### 2.4 Tauri Commands

```rust
// src-tauri/src/commands/jots.rs

/// Create a new jot from content
/// Automatically extracts tags and links
#[tauri::command]
pub async fn create_jot(content: String) -> Result<Jot, String>;

/// Get paginated list of jots (newest first)
/// Default: limit=50, offset=0
#[tauri::command]
pub async fn get_jots(limit: Option<u32>, offset: Option<u32>) -> Result<Vec<Jot>, String>;

/// Get a single jot by ID
#[tauri::command]
pub async fn get_jot(id: i64) -> Result<Jot, String>;

/// Update jot content (re-extracts tags/links)
#[tauri::command]
pub async fn update_jot(id: i64, content: String) -> Result<Jot, String>;

/// Delete a jot by ID
#[tauri::command]
pub async fn delete_jot(id: i64) -> Result<(), String>;

/// Search jots by content (LIKE query)
#[tauri::command]
pub async fn search_jots(query: String, limit: Option<u32>) -> Result<Vec<Jot>, String>;

/// Mark jot as promoted (synced to daily note)
#[tauri::command]
pub async fn promote_jot(id: i64, promoted: bool) -> Result<Jot, String>;
```

### 2.5 Content Parser

```rust
// src-tauri/src/db/parser.rs

/// Extract #tags from content
/// Input: "Meeting about #work and #project"
/// Output: ["work", "project"]
pub fn extract_tags(content: &str) -> Vec<String>;

/// Extract [[wiki-links]] from content
/// Input: "Check [[Project Notes]] and [[Meeting Log]]"
/// Output: ["Project Notes", "Meeting Log"]
pub fn extract_links(content: &str) -> Vec<String>;
```

**Regex Patterns:**
- Tags: `#([a-zA-Z][a-zA-Z0-9_-]*)`
- Links: `\[\[([^\]]+)\]\]`

---

## 3. Implementation Details

### 3.1 Database Connection

- Use `rusqlite` with `bundled` feature (SQLite embedded)
- Enable WAL mode for crash safety: `PRAGMA journal_mode=WAL;`
- Store database in app data directory: `{app_data}/scribel.db`
- Use connection pooling via `Mutex<Connection>` or dedicated state management

```rust
// src-tauri/src/db/connection.rs

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::AppHandle;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let app_data = app.path().app_data_dir()
            .map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&app_data)
            .map_err(|e| e.to_string())?;

        let db_path = app_data.join("scribel.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| e.to_string())?;

        // Enable WAL mode
        conn.execute_batch("PRAGMA journal_mode=WAL;")
            .map_err(|e| e.to_string())?;

        Ok(Self { conn: Mutex::new(conn) })
    }
}
```

### 3.2 State Management

Register database as Tauri managed state:

```rust
// src-tauri/src/lib.rs

use db::Database;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = Database::new(&app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::jots::create_jot,
            commands::jots::get_jots,
            commands::jots::get_jot,
            commands::jots::update_jot,
            commands::jots::delete_jot,
            commands::jots::search_jots,
            commands::jots::promote_jot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3.3 Error Handling

Use a custom error type for consistent error responses:

```rust
// src-tauri/src/db/error.rs

use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    SqliteError(#[from] rusqlite::Error),

    #[error("Jot not found: {0}")]
    NotFound(i64),

    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

impl From<DbError> for String {
    fn from(err: DbError) -> Self {
        err.to_string()
    }
}
```

---

## 4. API Contract

### 4.1 Frontend Types

```typescript
// src/types/jot.ts

export interface Jot {
  id: number;
  content: string;
  created_at: number;  // Unix timestamp (ms)
  updated_at: number;  // Unix timestamp (ms)
  tags: string[];
  links: string[];
  promoted: boolean;
}

export interface CreateJotInput {
  content: string;
}
```

### 4.2 Frontend API

```typescript
// src/api/jots.ts

import { invoke } from "@tauri-apps/api/core";
import type { Jot } from "../types/jot";

export async function createJot(content: string): Promise<Jot> {
  return invoke("create_jot", { content });
}

export async function getJots(limit?: number, offset?: number): Promise<Jot[]> {
  return invoke("get_jots", { limit, offset });
}

export async function getJot(id: number): Promise<Jot> {
  return invoke("get_jot", { id });
}

export async function updateJot(id: number, content: string): Promise<Jot> {
  return invoke("update_jot", { id, content });
}

export async function deleteJot(id: number): Promise<void> {
  return invoke("delete_jot", { id });
}

export async function searchJots(query: string, limit?: number): Promise<Jot[]> {
  return invoke("search_jots", { query, limit });
}

export async function promoteJot(id: number, promoted: boolean): Promise<Jot> {
  return invoke("promote_jot", { id, promoted });
}
```

---

## 5. Performance Requirements

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| Create jot | < 50ms | `std::time::Instant` in Rust |
| Get jots (50 items) | < 100ms | Frontend `performance.now()` |
| Delete jot | < 30ms | `std::time::Instant` in Rust |
| Search (LIKE) | < 500ms | End-to-end timing |
| Cold start DB init | < 200ms | Part of app startup budget |

---

## 6. Testing Strategy

### 6.1 Unit Tests (Rust)

```rust
// src-tauri/src/db/parser.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_tags() {
        let content = "Meeting about #work and #project-x";
        let tags = extract_tags(content);
        assert_eq!(tags, vec!["work", "project-x"]);
    }

    #[test]
    fn test_extract_tags_empty() {
        let content = "No tags here";
        let tags = extract_tags(content);
        assert!(tags.is_empty());
    }

    #[test]
    fn test_extract_links() {
        let content = "Check [[Project Notes]] and [[Meeting Log]]";
        let links = extract_links(content);
        assert_eq!(links, vec!["Project Notes", "Meeting Log"]);
    }

    #[test]
    fn test_extract_links_nested_brackets() {
        let content = "Link to [[Note [v2]]]";
        let links = extract_links(content);
        // Should handle edge cases gracefully
    }
}
```

### 6.2 Integration Tests (Rust)

```rust
// src-tauri/src/db/jots.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn setup_test_db() -> Database {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        Database::open(&db_path).unwrap()
    }

    #[test]
    fn test_create_and_get_jot() {
        let db = setup_test_db();
        let jot = db.create_jot("Test #tag [[Link]]").unwrap();

        assert_eq!(jot.content, "Test #tag [[Link]]");
        assert_eq!(jot.tags, vec!["tag"]);
        assert_eq!(jot.links, vec!["Link"]);

        let fetched = db.get_jot(jot.id).unwrap();
        assert_eq!(fetched.id, jot.id);
    }

    #[test]
    fn test_delete_jot() {
        let db = setup_test_db();
        let jot = db.create_jot("To delete").unwrap();

        db.delete_jot(jot.id).unwrap();

        let result = db.get_jot(jot.id);
        assert!(result.is_err());
    }
}
```

---

## 7. Acceptance Criteria

- [ ] Database file created in app data directory
- [ ] WAL mode enabled (verified via `PRAGMA journal_mode;`)
- [ ] Jots persist across app restarts
- [ ] `create_jot` returns complete Jot with extracted tags/links
- [ ] `get_jots` returns jots in reverse chronological order
- [ ] `get_jots` pagination works correctly (limit/offset)
- [ ] `delete_jot` removes jot from database
- [ ] `search_jots` finds jots containing query string
- [ ] Tags extracted correctly: `#tag-name` → `["tag-name"]`
- [ ] Links extracted correctly: `[[Note Name]]` → `["Note Name"]`
- [ ] No data loss on force quit (WAL mode)
- [ ] All operations complete within performance targets

---

## 8. Dependencies

### 8.1 Rust Crates

```toml
# Already in Cargo.toml
[dependencies]
rusqlite = { version = "0.32", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
regex = "1"
```

### 8.2 Prerequisites

- Feature 1.1 Project Scaffold (Done)

### 8.3 Dependents

- Feature 1.3 Quick Jot Interface (requires storage backend)
- Feature 2.3 Daily Note Sync (requires jot storage)

---

## 9. Implementation Tasks

1. [ ] Create `src-tauri/src/db/` module structure
2. [ ] Implement `connection.rs` with WAL mode initialization
3. [ ] Implement `migrations.rs` with schema creation
4. [ ] Implement `models.rs` with Jot struct
5. [ ] Implement `parser.rs` with tag/link extraction
6. [ ] Implement `jots.rs` with CRUD operations
7. [ ] Create `src-tauri/src/commands/jots.rs` with Tauri commands
8. [ ] Register commands in `lib.rs`
9. [ ] Create `src/types/jot.ts` TypeScript types
10. [ ] Create `src/api/jots.ts` frontend API wrapper
11. [ ] Write unit tests for parser
12. [ ] Write integration tests for CRUD operations
13. [ ] Add performance benchmarks
14. [ ] Verify WAL mode and crash recovery

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database corruption | Low | High | WAL mode, regular backups (future) |
| Performance degradation with large datasets | Medium | Medium | Pagination, indexes, future FTS5 |
| Tag/link regex edge cases | Medium | Low | Comprehensive test suite, fallback to empty |

---

## 11. Future Considerations

- **FTS5 Full-Text Search:** Upgrade from LIKE to FTS5 for better search performance
- **Database Migrations:** Add version tracking for schema changes
- **Batch Operations:** Add bulk insert/delete for import/export
- **Encryption:** Optional database encryption for sensitive notes
