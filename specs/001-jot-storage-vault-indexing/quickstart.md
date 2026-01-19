# Quickstart: Jot Storage & Quick Jot Interface

**For**: Developers implementing features 1.2 and 1.3
**Estimated Time**: 2-4 days
**Prerequisites**: Rust basics, React basics, Tauri setup complete

---

## Overview

This guide walks you through implementing:
1. **Backend**: Markdown storage + SQLite index + Tauri commands
2. **Frontend**: JotInput + JotList components with optimistic updates

---

## Phase 1: Backend Setup (Day 1)

### Step 1.1: Add Rust Dependencies

Edit `src-tauri/Cargo.toml`:

```toml
[dependencies]
# Existing
tauri = { version = "2", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# New for this feature
rusqlite = { version = "0.32", features = ["bundled"] }
serde_yaml = "0.9"
thiserror = "2"
regex = "1"
chrono = { version = "0.4", features = ["serde"] }
notify = "6"
rand = "0.8"
```

Run:
```bash
cd src-tauri && cargo build
```

### Step 1.2: Create Module Structure

```bash
cd src-tauri/src
mkdir -p jots db commands tests

touch jots/mod.rs jots/models.rs jots/storage.rs jots/parser.rs jots/index.rs jots/watcher.rs
touch db/mod.rs db/connection.rs db/migrations.rs
touch commands/mod.rs commands/jots.rs
touch config.rs
```

### Step 1.3: Implement Data Models

**File**: `src-tauri/src/jots/models.rs`

Copy from [data-model.md](./data-model.md) Section 1.1.

Key types:
- `Jot` struct
- `CreateJotInput` struct
- `UpdateJotInput` struct
- `JotFrontmatter` struct
- `JotError` enum

### Step 1.4: Implement Parser

**File**: `src-tauri/src/jots/parser.rs`

Functions to implement:
1. `extract_tags(content: &str) -> Vec<String>`
2. `extract_links(content: &str) -> Vec<String>`
3. `parse_jot_file(content: &str, file_path: &str) -> Result<Jot, JotError>`
4. `serialize_jot(jot: &Jot) -> String`

See [research.md](./research.md) Section 5 for regex patterns.

**Test First**:
```rust
// src-tauri/src/jots/parser.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_tags() {
        assert_eq!(extract_tags("Hello #world #test"), vec!["world", "test"]);
    }

    #[test]
    fn test_extract_links() {
        assert_eq!(extract_links("See [[Note A]] and [[Note B]]"), vec!["Note A", "Note B"]);
    }
}
```

Run:
```bash
cargo test --package scribel --lib jots::parser::tests
```

### Step 1.5: Implement SQLite Connection

**File**: `src-tauri/src/db/connection.rs`

```rust
use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for concurrent access
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;

    Ok(conn)
}
```

**File**: `src-tauri/src/db/migrations.rs`

Copy schema from [data-model.md](./data-model.md) Section 2.1.

```rust
use rusqlite::{Connection, Result};

pub const SCHEMA_VERSION: i32 = 1;

pub fn run_migrations(conn: &Connection) -> Result<()> {
    let version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);

    if version < SCHEMA_VERSION {
        create_jot_index_table(conn)?;
        conn.execute(&format!("PRAGMA user_version = {}", SCHEMA_VERSION), [])?;
    }

    Ok(())
}

fn create_jot_index_table(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS jot_index (
            id TEXT PRIMARY KEY,
            file_path TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            modified_at INTEGER NOT NULL,
            tags TEXT DEFAULT '[]',
            links TEXT DEFAULT '[]',
            promoted INTEGER DEFAULT 0,
            file_mtime INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_jot_created_at ON jot_index(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_jot_promoted ON jot_index(promoted);
        "#,
    )?;

    Ok(())
}
```

### Step 1.6: Implement File Storage

**File**: `src-tauri/src/jots/storage.rs`

Key functions:
1. `create_jot(vault_path: &Path, content: &str) -> Result<Jot, JotError>`
2. `read_jot(vault_path: &Path, id: &str) -> Result<Jot, JotError>`
3. `update_jot(vault_path: &Path, id: &str, content: &str) -> Result<Jot, JotError>`
4. `delete_jot(vault_path: &Path, id: &str) -> Result<(), JotError>`

**ID Generation**:
```rust
use chrono::Utc;
use rand::Rng;

fn generate_jot_id() -> String {
    let now = Utc::now();
    let hex: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(4)
        .map(char::from)
        .map(|c| c.to_lowercase().to_string())
        .collect();

    format!("jot-{}-{}", now.format("%Y-%m-%d-%H%M%S"), hex)
}
```

### Step 1.7: Implement Index Operations

**File**: `src-tauri/src/jots/index.rs`

Key functions:
1. `insert_jot(conn: &Connection, jot: &Jot) -> Result<(), JotError>`
2. `update_jot_index(conn: &Connection, jot: &Jot) -> Result<(), JotError>`
3. `delete_jot_index(conn: &Connection, id: &str) -> Result<(), JotError>`
4. `get_jots(conn: &Connection, limit: u32, offset: u32) -> Result<Vec<Jot>, JotError>`
5. `search_jots(conn: &Connection, query: &str, limit: u32) -> Result<Vec<Jot>, JotError>`

### Step 1.8: Implement Tauri Commands

**File**: `src-tauri/src/commands/jots.rs`

Copy signatures from [contracts/jot-api.md](./contracts/jot-api.md).

Example:
```rust
use tauri::State;
use crate::jots::{Jot, storage, index};
use rusqlite::Connection;
use std::sync::Mutex;

#[tauri::command]
pub async fn create_jot(
    content: String,
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, String>,
) -> Result<Jot, String> {
    let vault = std::path::Path::new(vault_path.inner());
    let jot = storage::create_jot(vault, &content)
        .map_err(|e| e.to_string())?;

    let conn = db.lock().unwrap();
    index::insert_jot(&conn, &jot)
        .map_err(|e| e.to_string())?;

    Ok(jot)
}
```

### Step 1.9: Register Commands in Tauri

**File**: `src-tauri/src/lib.rs`

```rust
mod jots;
mod db;
mod commands;
mod config;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let app_data = app.path().app_data_dir()?;
            let db_path = app_data.join("scribel.db");
            let conn = db::connection::init_db(&db_path)?;
            db::migrations::run_migrations(&conn)?;

            app.manage(std::sync::Mutex::new(conn));

            // TODO: Get vault path from config
            app.manage(String::from("/Users/user/Documents/Obsidian"));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::jots::create_jot,
            commands::jots::get_jots,
            commands::jots::get_jot,
            commands::jots::update_jot,
            commands::jots::delete_jot,
            commands::jots::search_jots,
            commands::jots::set_jot_promoted,
            commands::jots::rebuild_jot_index,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 1.10: Test Backend

```bash
cargo test
cargo build
cargo run
```

**Manual Test**: Use Tauri DevTools console:
```javascript
await __TAURI__.invoke('create_jot', { content: 'Test #tag [[Link]]' });
```

---

## Phase 2: Frontend Setup (Day 2)

### Step 2.1: Create TypeScript Types

**File**: `src/types/jot.ts`

Copy from [contracts/jot-api.md](./contracts/jot-api.md) Type Definitions.

### Step 2.2: Create API Wrappers

**File**: `src/api/jots.ts`

```typescript
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

export async function deleteJot(id: string): Promise<void> {
  return invoke("delete_jot", { id });
}

// ... rest of commands
```

### Step 2.3: Create Utility Functions

**File**: `src/utils/parseJot.ts`

Copy from Feature 1.3 spec, Section 6.1.

**File**: `src/utils/formatTime.ts`

Copy from Feature 1.3 spec, Section 6.2.

**Test First**:
```typescript
// src/utils/__tests__/parseJot.test.ts

import { describe, it, expect } from 'vitest';
import { parseJotContent, extractTags, extractLinks } from '../parseJot';

describe('parseJotContent', () => {
  it('parses plain text', () => {
    const result = parseJotContent('Hello world');
    expect(result).toEqual([{ type: 'text', value: 'Hello world' }]);
  });

  it('parses tags', () => {
    const result = parseJotContent('Hello #world');
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ type: 'tag', value: 'world' });
  });
});
```

Run:
```bash
npm test
```

### Step 2.4: Create React Hook

**File**: `src/hooks/useJots.ts`

Copy from Feature 1.3 spec, Section 5.1.

Key features:
- State management (`jots`, `loading`, `error`)
- `createJot` with optimistic updates
- `deleteJot` with optimistic updates
- `refresh` for manual reload

### Step 2.5: Create Components (Bottom-Up)

**Order**:
1. `JotContent.tsx` (leaf, no dependencies)
2. `JotItem.tsx` (uses JotContent)
3. `JotList.tsx` (uses JotItem)
4. `JotInput.tsx` (standalone)
5. `JotPanel.tsx` (uses JotList + JotInput)

Copy implementations from Feature 1.3 spec, Section 4.

### Step 2.6: Wire Up in App

**File**: `src/App.tsx`

```tsx
import { JotPanel } from './components/JotPanel';

function App() {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-900">
      <header className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Scribel
        </h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <JotPanel />
      </main>
    </div>
  );
}

export default App;
```

### Step 2.7: Test Frontend

```bash
npm run dev
```

**Manual Test**:
1. Open app
2. Type in input field
3. Press Enter
4. Verify jot appears at bottom
5. Hover over jot, click delete
6. Verify jot disappears

---

## Phase 3: Integration Testing (Day 3)

### Test 3.1: End-to-End Flow

1. Create jot with tags and links
2. Verify file created in `.scribel/jots/`
3. Verify index entry exists
4. Close app, reopen
5. Verify jot persists

### Test 3.2: External Edit Detection

1. Create jot in app
2. Open jot file in text editor
3. Modify content, save
4. Verify app detects change (file watcher)
5. Verify index updated

### Test 3.3: Index Rebuild

1. Create 10 jots
2. Close app
3. Delete `scribel.db` file
4. Reopen app
5. Trigger rebuild (or automatic on startup)
6. Verify all jots reappear

### Test 3.4: Performance

1. Create 100 jots
2. Measure `create_jot` latency (<50ms)
3. Measure `get_jots` latency (<100ms)
4. Verify scroll smoothness (60fps)

---

## Phase 4: File Watcher (Day 4)

### Step 4.1: Implement Watcher

**File**: `src-tauri/src/jots/watcher.rs`

```rust
use notify::{Watcher, RecursiveMode, Event, EventKind};
use std::path::Path;
use std::sync::mpsc;

pub fn watch_jots_folder(
    jots_path: &Path,
    on_change: impl Fn(Event) + Send + 'static,
) -> notify::Result<impl Watcher> {
    let (tx, rx) = mpsc::channel();

    let mut watcher = notify::recommended_watcher(move |res| {
        if let Ok(event) = res {
            tx.send(event).ok();
        }
    })?;

    watcher.watch(jots_path, RecursiveMode::NonRecursive)?;

    // Spawn thread to handle events
    std::thread::spawn(move || {
        while let Ok(event) = rx.recv() {
            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                    on_change(event);
                }
                _ => {}
            }
        }
    });

    Ok(watcher)
}
```

### Step 4.2: Integrate Watcher in Tauri Setup

**File**: `src-tauri/src/lib.rs` (update setup)

```rust
.setup(|app| {
    // ... existing db setup ...

    // Start file watcher
    let vault_path = /* get from config */;
    let jots_path = vault_path.join(".scribel/jots");

    let db_handle = /* clone db handle */;
    jots::watcher::watch_jots_folder(&jots_path, move |event| {
        // Handle file change: re-parse and update index
        for path in event.paths {
            if let Some(id) = extract_jot_id_from_path(&path) {
                let jot = storage::read_jot(&vault_path, &id).ok();
                if let Some(jot) = jot {
                    let conn = db_handle.lock().unwrap();
                    index::update_jot_index(&conn, &jot).ok();
                }
            }
        }
    })?;

    Ok(())
})
```

---

## Troubleshooting

### Issue: SQLite locked

**Cause**: WAL mode not enabled, or multiple processes accessing DB

**Fix**: Ensure `pragma_update(None, "journal_mode", "WAL")` is called

### Issue: File watcher not detecting changes

**Cause**: Recursive mode on, debounce too aggressive, or OS limitation

**Fix**: Use `RecursiveMode::NonRecursive`, check notify crate logs

### Issue: Tags not extracted

**Cause**: Regex pattern doesn't match, or tag starts with number

**Fix**: Ensure tag starts with letter: `#([a-zA-Z][a-zA-Z0-9_-]*)`

### Issue: Jots not persisting

**Cause**: Vault path incorrect, or permissions issue

**Fix**: Check vault path in config, verify `.scribel/jots/` folder exists and is writable

---

## Next Steps

After completing this feature:
1. Implement Feature 1.4: Global Hotkey
2. Add vault configuration UI (Epic 2)
3. Add embeddings and RAG (Epic 3)

---

## Resources

- [Feature Spec](./spec.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/jot-api.md)
- [Tauri Docs](https://tauri.app/v2/guides/)
- [rusqlite Docs](https://docs.rs/rusqlite/latest/rusqlite/)
- [notify Docs](https://docs.rs/notify/latest/notify/)
