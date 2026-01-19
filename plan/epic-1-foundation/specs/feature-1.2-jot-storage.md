# Specification: Feature 1.2 - Jot Storage

**Epic:** Epic 1 - Foundation
**Feature:** 1.2 Jot Storage
**Status:** Ready for Implementation
**PRD Reference:** F2 (Jot Storage & Sync)
**Plan Reference:** [plan/epic-1-foundation/feature-2-jot-storage.md](../../plan/epic-1-foundation/feature-2-jot-storage.md)

---

## 1. Overview

### 1.1 Purpose
Implement a **markdown-first** jot storage system where jots are saved as individual `.md` files inside the user's Obsidian vault. SQLite is used only for indexing and embeddings, ensuring full compatibility with Obsidian and seamless vault synchronization.

### 1.2 Scope
- Jot files stored as markdown in `.scribel/jots/` folder within vault
- Frontmatter schema for jot metadata
- SQLite index cache for fast queries
- CRUD operations via Tauri commands
- Tag and wiki-link extraction from content
- File watcher for external edits

### 1.3 Out of Scope
- Embeddings and vector search (Epic 2)
- Full-text search with FTS5 (future optimization)
- Cloud backup

---

## 2. Architecture

### 2.1 Storage Design

```
User's Obsidian Vault/
├── .scribel/                    ← Hidden folder (configurable)
│   └── jots/
│       ├── 2025-01-19-143256-a1b2.md
│       ├── 2025-01-19-144532-c3d4.md
│       └── 2025-01-19-150812-e5f6.md
├── Daily Notes/
├── Projects/
└── ...

{app_data}/scribel.db           ← SQLite for index + embeddings only
├── jot_index                   ← Cache for fast queries
└── embeddings                  ← Vector data (Epic 2)
```

### 2.2 Why Markdown-First?

| Benefit | Description |
|---------|-------------|
| **Obsidian compatibility** | Jots visible and searchable in Obsidian |
| **Native sync** | Jots sync with vault (iCloud, Syncthing, etc.) |
| **Backup included** | Vault backup includes all jots |
| **Portability** | No export needed - just files |
| **User ownership** | Standard format, no vendor lock-in |

### 2.3 SQLite Role

SQLite serves as an **index cache**, not primary storage:

1. **Fast queries** - Avoid scanning filesystem for every search
2. **Embeddings** - Store vector data for semantic search (Epic 2)
3. **Metadata cache** - Tags, links, timestamps indexed for filtering
4. **Rebuild on startup** - Cache rebuilt from files if corrupted

---

## 3. Technical Design

### 3.1 Jot File Format

Each jot is a markdown file with YAML frontmatter:

```markdown
---
id: jot-2025-01-19-143256-a1b2
created: 2025-01-19T14:32:56+08:00
modified: 2025-01-19T14:32:56+08:00
tags:
  - work
  - meeting
links:
  - Project X
  - Weekly Standup
promoted: false
---

Meeting idea: weekly async standups for [[Project X]] #work #meeting
```

**Filename format:** `{date}-{time}-{short-id}.md`
- Example: `2025-01-19-143256-a1b2.md`
- Date/time prefix enables chronological sorting in file explorers
- Short ID (4 hex chars) prevents collisions

### 3.2 Database Schema

```sql
-- Index cache for fast queries (rebuilt from files)
CREATE TABLE IF NOT EXISTS jot_index (
    id TEXT PRIMARY KEY,              -- matches frontmatter id
    file_path TEXT NOT NULL UNIQUE,   -- relative path from vault root
    content TEXT NOT NULL,            -- full jot content (for search)
    created_at INTEGER NOT NULL,      -- Unix timestamp (ms)
    modified_at INTEGER NOT NULL,     -- Unix timestamp (ms)
    tags TEXT DEFAULT '[]',           -- JSON array: ["tag1", "tag2"]
    links TEXT DEFAULT '[]',          -- JSON array: ["Note A", "Note B"]
    promoted INTEGER DEFAULT 0,       -- Boolean: 0 = false, 1 = true
    file_mtime INTEGER NOT NULL       -- File modification time (cache invalidation)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jot_created_at ON jot_index(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jot_promoted ON jot_index(promoted);

-- Embeddings table (for Epic 2, defined here for schema completeness)
CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,        -- 'jot' or 'vault_file'
    source_id TEXT NOT NULL,          -- jot id or file path
    embedding BLOB NOT NULL,          -- vector data
    model TEXT NOT NULL,              -- embedding model used
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_type, source_id);
```

### 3.3 Data Models

```rust
// src-tauri/src/jots/models.rs

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Jot as represented in memory and API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jot {
    pub id: String,                    // e.g., "jot-2025-01-19-143256-a1b2"
    pub content: String,               // The jot text (without frontmatter)
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub tags: Vec<String>,             // Extracted from content
    pub links: Vec<String>,            // Extracted from content (without [[ ]])
    pub promoted: bool,
    pub file_path: String,             // Relative path from vault root
}

/// Input for creating a new jot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJotInput {
    pub content: String,
}

/// Input for updating a jot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateJotInput {
    pub id: String,
    pub content: String,
}

/// Jot frontmatter structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JotFrontmatter {
    pub id: String,
    pub created: DateTime<Utc>,
    pub modified: DateTime<Utc>,
    pub tags: Vec<String>,
    pub links: Vec<String>,
    pub promoted: bool,
}
```

### 3.4 Module Structure

```
src-tauri/src/
├── jots/
│   ├── mod.rs              # Module exports
│   ├── models.rs           # Jot struct definitions
│   ├── storage.rs          # File read/write operations
│   ├── parser.rs           # Tag/link extraction, frontmatter parsing
│   ├── index.rs            # SQLite index operations
│   └── watcher.rs          # File watcher for external changes
├── db/
│   ├── mod.rs              # Module exports
│   ├── connection.rs       # SQLite connection management
│   └── migrations.rs       # Schema creation/migrations
├── commands/
│   ├── mod.rs              # Command exports
│   └── jots.rs             # Tauri command handlers
└── lib.rs                  # App setup, command registration
```

### 3.5 Tauri Commands

```rust
// src-tauri/src/commands/jots.rs

/// Create a new jot - writes markdown file and updates index
#[tauri::command]
pub async fn create_jot(content: String) -> Result<Jot, String>;

/// Get paginated list of jots (newest first) - reads from index
#[tauri::command]
pub async fn get_jots(limit: Option<u32>, offset: Option<u32>) -> Result<Vec<Jot>, String>;

/// Get a single jot by ID - reads from file
#[tauri::command]
pub async fn get_jot(id: String) -> Result<Jot, String>;

/// Update jot content - rewrites file and updates index
#[tauri::command]
pub async fn update_jot(id: String, content: String) -> Result<Jot, String>;

/// Delete a jot - removes file and index entry
#[tauri::command]
pub async fn delete_jot(id: String) -> Result<(), String>;

/// Search jots by content - uses index for fast search
#[tauri::command]
pub async fn search_jots(query: String, limit: Option<u32>) -> Result<Vec<Jot>, String>;

/// Mark jot as promoted
#[tauri::command]
pub async fn set_jot_promoted(id: String, promoted: bool) -> Result<Jot, String>;

/// Rebuild index from files (recovery/sync)
#[tauri::command]
pub async fn rebuild_jot_index() -> Result<u32, String>;  // Returns count
```

### 3.6 Content Parser

```rust
// src-tauri/src/jots/parser.rs

/// Extract #tags from content
/// Input: "Meeting about #work and #project-x"
/// Output: ["work", "project-x"]
pub fn extract_tags(content: &str) -> Vec<String>;

/// Extract [[wiki-links]] from content
/// Input: "Check [[Project Notes]] and [[Meeting Log]]"
/// Output: ["Project Notes", "Meeting Log"]
pub fn extract_links(content: &str) -> Vec<String>;

/// Parse jot file into Jot struct
pub fn parse_jot_file(content: &str, file_path: &str) -> Result<Jot, ParseError>;

/// Serialize Jot to markdown with frontmatter
pub fn serialize_jot(jot: &Jot) -> String;
```

**Regex Patterns:**
- Tags: `#([a-zA-Z][a-zA-Z0-9_-]*)`
- Links: `\[\[([^\]]+)\]\]`

### 3.7 File Watcher

```rust
// src-tauri/src/jots/watcher.rs

use notify::{Watcher, RecursiveMode};

/// Watch .scribel/jots/ folder for external changes
pub struct JotWatcher {
    watcher: RecommendedWatcher,
}

impl JotWatcher {
    /// Start watching jots folder
    pub fn start(vault_path: &Path, on_change: impl Fn(JotChangeEvent)) -> Result<Self, Error>;

    /// Stop watching
    pub fn stop(self);
}

#[derive(Debug)]
pub enum JotChangeEvent {
    Created(PathBuf),
    Modified(PathBuf),
    Deleted(PathBuf),
}
```

---

## 4. Implementation Details

### 4.1 Jot Creation Flow

```
User enters content
        │
        ▼
┌─────────────────────────────────────┐
│ 1. Generate ID: jot-{timestamp}-{hex}│
│ 2. Extract tags and links           │
│ 3. Build frontmatter                │
│ 4. Write .md file to .scribel/jots/ │
│ 5. Insert into jot_index table      │
│ 6. Return Jot to frontend           │
└─────────────────────────────────────┘
```

### 4.2 Index Rebuild Flow

On app startup or manual trigger:

```
┌─────────────────────────────────────┐
│ 1. Scan .scribel/jots/*.md          │
│ 2. For each file:                   │
│    - Check if in index              │
│    - Compare file mtime             │
│    - If changed: parse & update     │
│    - If new: parse & insert         │
│ 3. Remove orphaned index entries    │
│ 4. Emit "index_rebuilt" event       │
└─────────────────────────────────────┘
```

### 4.3 Vault Path Configuration

```rust
// src-tauri/src/config.rs

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub vault_path: PathBuf,
    pub jots_folder: String,  // default: ".scribel/jots"
}

impl AppConfig {
    /// Detect Obsidian vault in common locations
    pub fn detect_vault() -> Option<PathBuf> {
        // Check for .obsidian folder in:
        // - ~/Documents/
        // - ~/Obsidian/
        // - User-configured path
    }
}
```

### 4.4 Error Handling

```rust
// src-tauri/src/jots/error.rs

use thiserror::Error;

#[derive(Error, Debug)]
pub enum JotError {
    #[error("Jot not found: {0}")]
    NotFound(String),

    #[error("File operation failed: {0}")]
    FileError(#[from] std::io::Error),

    #[error("Invalid jot format: {0}")]
    ParseError(String),

    #[error("Database error: {0}")]
    DbError(#[from] rusqlite::Error),

    #[error("Vault not configured")]
    VaultNotConfigured,
}

impl From<JotError> for String {
    fn from(err: JotError) -> Self {
        err.to_string()
    }
}
```

---

## 5. API Contract

### 5.1 Frontend Types

```typescript
// src/types/jot.ts

export interface Jot {
  id: string;
  content: string;
  created_at: string;   // ISO 8601 datetime
  modified_at: string;  // ISO 8601 datetime
  tags: string[];
  links: string[];
  promoted: boolean;
  file_path: string;    // Relative path from vault root
}

export interface CreateJotInput {
  content: string;
}

export interface UpdateJotInput {
  id: string;
  content: string;
}
```

### 5.2 Frontend API

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

export async function getJot(id: string): Promise<Jot> {
  return invoke("get_jot", { id });
}

export async function updateJot(id: string, content: string): Promise<Jot> {
  return invoke("update_jot", { id, content });
}

export async function deleteJot(id: string): Promise<void> {
  return invoke("delete_jot", { id });
}

export async function searchJots(query: string, limit?: number): Promise<Jot[]> {
  return invoke("search_jots", { query, limit });
}

export async function setJotPromoted(id: string, promoted: boolean): Promise<Jot> {
  return invoke("set_jot_promoted", { id, promoted });
}

export async function rebuildJotIndex(): Promise<number> {
  return invoke("rebuild_jot_index");
}
```

---

## 6. Performance Requirements

| Operation | Target | Notes |
|-----------|--------|-------|
| Create jot | < 50ms | File write + index update |
| Get jots (50 items) | < 100ms | Index query only |
| Get single jot | < 30ms | File read |
| Delete jot | < 30ms | File delete + index update |
| Search (LIKE) | < 500ms | Index search |
| Index rebuild (100 jots) | < 2s | Full rescan |
| Cold start index check | < 200ms | Part of app startup budget |

---

## 7. Testing Strategy

### 7.1 Unit Tests (Rust)

```rust
// src-tauri/src/jots/parser.rs

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
    fn test_extract_links() {
        let content = "Check [[Project Notes]] and [[Meeting Log]]";
        let links = extract_links(content);
        assert_eq!(links, vec!["Project Notes", "Meeting Log"]);
    }

    #[test]
    fn test_parse_frontmatter() {
        let content = r#"---
id: jot-2025-01-19-143256-a1b2
created: 2025-01-19T14:32:56Z
modified: 2025-01-19T14:32:56Z
tags: [work]
links: [Project X]
promoted: false
---

Test content"#;
        let jot = parse_jot_file(content, ".scribel/jots/test.md").unwrap();
        assert_eq!(jot.id, "jot-2025-01-19-143256-a1b2");
        assert_eq!(jot.content, "Test content");
    }

    #[test]
    fn test_serialize_jot() {
        let jot = Jot { /* ... */ };
        let markdown = serialize_jot(&jot);
        assert!(markdown.starts_with("---\n"));
        assert!(markdown.contains("id: jot-"));
    }
}
```

### 7.2 Integration Tests

```rust
// src-tauri/src/jots/storage.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_create_and_read_jot() {
        let vault = tempdir().unwrap();
        let storage = JotStorage::new(vault.path()).unwrap();

        let jot = storage.create("Test #tag [[Link]]").await.unwrap();

        assert!(jot.id.starts_with("jot-"));
        assert_eq!(jot.tags, vec!["tag"]);
        assert_eq!(jot.links, vec!["Link"]);

        // Verify file exists
        let file_path = vault.path().join(&jot.file_path);
        assert!(file_path.exists());

        // Read back
        let fetched = storage.get(&jot.id).await.unwrap();
        assert_eq!(fetched.content, "Test #tag [[Link]]");
    }

    #[tokio::test]
    async fn test_delete_jot() {
        let vault = tempdir().unwrap();
        let storage = JotStorage::new(vault.path()).unwrap();

        let jot = storage.create("To delete").await.unwrap();
        let file_path = vault.path().join(&jot.file_path);

        storage.delete(&jot.id).await.unwrap();

        assert!(!file_path.exists());
    }

    #[tokio::test]
    async fn test_index_rebuild() {
        let vault = tempdir().unwrap();
        let storage = JotStorage::new(vault.path()).unwrap();

        // Create jots
        storage.create("Jot 1").await.unwrap();
        storage.create("Jot 2").await.unwrap();

        // Clear index
        storage.clear_index().await.unwrap();

        // Rebuild
        let count = storage.rebuild_index().await.unwrap();
        assert_eq!(count, 2);
    }
}
```

---

## 8. Acceptance Criteria

- [ ] Jot files created in `.scribel/jots/` folder within vault
- [ ] Frontmatter contains valid YAML with id, created, modified, tags, links
- [ ] Jots visible and searchable in Obsidian
- [ ] Jots persist across app restarts
- [ ] `create_jot` returns complete Jot with extracted tags/links
- [ ] `get_jots` returns jots in reverse chronological order
- [ ] `get_jots` pagination works correctly (limit/offset)
- [ ] `delete_jot` removes both file and index entry
- [ ] `search_jots` finds jots containing query string
- [ ] Tags extracted correctly: `#tag-name` → `["tag-name"]`
- [ ] Links extracted correctly: `[[Note Name]]` → `["Note Name"]`
- [ ] External edits (in Obsidian) detected and index updated
- [ ] Index rebuilds correctly from files on demand
- [ ] All operations complete within performance targets

---

## 9. Dependencies

### 9.1 Rust Crates

```toml
[dependencies]
# Already in Cargo.toml
rusqlite = { version = "0.32", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_yaml = "0.9"
thiserror = "2"
regex = "1"
chrono = { version = "0.4", features = ["serde"] }

# New dependencies
notify = "6"              # File watcher
uuid = { version = "1", features = ["v4"] }  # For short ID generation
gray_matter = "0.2"       # Frontmatter parsing (or custom impl)
```

### 9.2 Prerequisites

- Feature 1.1 Project Scaffold (Done)
- Vault path configuration (can be part of this feature)

### 9.3 Dependents

- Feature 1.3 Quick Jot Interface (requires storage backend)
- Feature 2.3 Vault Indexing (uses same SQLite, adds embeddings)
- Feature 2.4 Daily Note Sync (reads from jot files)

---

## 10. Implementation Tasks

1. [ ] Create `src-tauri/src/jots/` module structure
2. [ ] Implement `models.rs` with Jot and frontmatter structs
3. [ ] Implement `parser.rs` with tag/link extraction and frontmatter handling
4. [ ] Implement `storage.rs` with file read/write operations
5. [ ] Create `src-tauri/src/db/` module for SQLite
6. [ ] Implement `connection.rs` with WAL mode initialization
7. [ ] Implement `migrations.rs` with index schema
8. [ ] Implement `index.rs` for SQLite cache operations
9. [ ] Implement `watcher.rs` for file change detection
10. [ ] Create `src-tauri/src/commands/jots.rs` with Tauri commands
11. [ ] Register commands in `lib.rs`
12. [ ] Add vault path configuration and detection
13. [ ] Create `src/types/jot.ts` TypeScript types
14. [ ] Create `src/api/jots.ts` frontend API wrapper
15. [ ] Write unit tests for parser
16. [ ] Write integration tests for storage
17. [ ] Add performance benchmarks
18. [ ] Test Obsidian compatibility (files visible, searchable)

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| File write slower than SQLite | Low | Low | Still <50ms target; SSD assumed |
| Sync conflicts with Obsidian | Medium | Medium | File watcher, last-write-wins |
| Frontmatter corruption | Low | Medium | Validation on read, backup before write |
| Large jot folder (10k+ files) | Medium | Medium | Pagination, lazy loading, index cache |
| External tool modifies jots | Medium | Low | File watcher updates index |

---

## 12. Future Considerations

- **FTS5 Full-Text Search:** Add FTS5 index for faster content search
- **Jot Templates:** Support for structured jot types (meeting, idea, todo)
- **Attachments:** Support for images/files linked in jots
- **Encryption:** Optional encryption for sensitive jots
- **Conflict Resolution:** UI for handling sync conflicts
