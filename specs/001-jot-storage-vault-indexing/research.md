# Research: Jot Storage & Quick Jot Interface

**Date**: 2026-01-19
**Phase**: 0 (Research & Outline)

---

## 1. YAML Frontmatter Parsing in Rust

**Decision**: Use `serde_yaml` for frontmatter parsing

**Rationale**:
- Standard, well-maintained crate (1M+ downloads/month)
- Direct serde integration with our Jot structs
- Handles complex YAML structures (arrays, nested objects)
- Alternative `gray_matter` (mentioned in spec) is unmaintained

**Implementation**:
```rust
use serde_yaml;

let (frontmatter, content) = split_frontmatter(file_content)?;
let metadata: JotFrontmatter = serde_yaml::from_str(&frontmatter)?;
```

**Alternatives Considered**:
- `gray_matter`: Unmaintained (last update 2020)
- Custom parser: Unnecessary complexity, error-prone

---

## 2. SQLite WAL Mode for Concurrent Access

**Decision**: Enable WAL (Write-Ahead Logging) mode

**Rationale**:
- Allows concurrent reads during writes (important for file watcher)
- Crash-safe (WAL journal persists uncommitted changes)
- Better performance for write-heavy workloads
- Industry standard for embedded databases

**Implementation**:
```rust
conn.pragma_update(None, "journal_mode", "WAL")?;
conn.pragma_update(None, "synchronous", "NORMAL")?;
```

**Alternatives Considered**:
- DELETE mode (default): Blocks all access during writes
- MEMORY mode: Not crash-safe

---

## 3. File Watcher Library: notify vs fsnotify

**Decision**: Use `notify` crate (version 6.x)

**Rationale**:
- Cross-platform (macOS FSEvents, Linux inotify, Windows ReadDirectoryChangesW)
- Actively maintained, stable API
- Debouncing built-in (prevents duplicate events)
- Used by popular projects (mdBook, cargo-watch)

**Implementation**:
```rust
use notify::{Watcher, RecursiveMode, Event};

let mut watcher = notify::recommended_watcher(|res: Result<Event, _>| {
    match res {
        Ok(event) => handle_jot_change(event),
        Err(e) => log::error!("Watch error: {:?}", e),
    }
})?;

watcher.watch(jots_path, RecursiveMode::NonRecursive)?;
```

**Alternatives Considered**:
- `hotwatch`: Simpler API but less flexible
- Manual polling: High CPU usage, slow detection

---

## 4. Unique Jot ID Generation

**Decision**: Use timestamp + 4-character hex (NOT UUID)

**Rationale**:
- Chronological sorting built into ID
- Filename-friendly (no special characters)
- Low collision probability (16^4 = 65,536 combinations per second)
- Short and readable

**Format**: `jot-YYYY-MM-DD-HHMMSS-XXXX`
- Example: `jot-2026-01-19-143256-a1b2`

**Implementation**:
```rust
use chrono::Utc;
use rand::Rng;

let now = Utc::now();
let hex: String = rand::thread_rng()
    .sample_iter(&rand::distributions::Alphanumeric)
    .take(4)
    .map(char::from)
    .collect::<String>()
    .to_lowercase();

let id = format!(
    "jot-{}-{}",
    now.format("%Y-%m-%d-%H%M%S"),
    hex
);
```

**Alternatives Considered**:
- UUID v4: Too long (36 chars), not chronological
- Snowflake IDs: Overkill for single-user app
- Auto-increment: Not stable across devices

---

## 5. Tag and Link Regex Patterns

**Decision**: Use specific regex patterns for tags and links

**Tag Pattern**: `#([a-zA-Z][a-zA-Z0-9_-]*)`
- Must start with letter (prevents `#123` false positives)
- Allows hyphens and underscores
- Case-sensitive

**Link Pattern**: `\[\[([^\]]+)\]\]`
- Non-greedy match (prevents spanning multiple links)
- Allows spaces, special characters inside brackets
- Obsidian-compatible

**Rationale**:
- Matches Obsidian's behavior
- Prevents false positives (#123, ##header)
- Handles edge cases ([[Link with spaces]])

**Implementation**:
```rust
use regex::Regex;

lazy_static! {
    static ref TAG_RE: Regex = Regex::new(r"#([a-zA-Z][a-zA-Z0-9_-]*)").unwrap();
    static ref LINK_RE: Regex = Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
}

pub fn extract_tags(content: &str) -> Vec<String> {
    TAG_RE.captures_iter(content)
        .map(|cap| cap[1].to_string())
        .collect()
}
```

**Alternatives Considered**:
- Simple `#\w+`: Matches numbers, not Obsidian-compatible
- AST parsing: Overkill for simple syntax

---

## 6. Optimistic UI Updates Pattern

**Decision**: Optimistic updates with rollback on error

**Rationale**:
- Instant feedback (perceived performance)
- Simple to implement with React state
- Graceful degradation on errors
- Standard pattern in modern web apps

**Implementation Flow**:
1. User submits → Add temp jot to state (with negative ID)
2. Call backend API
3. On success: Replace temp jot with real jot
4. On error: Remove temp jot, show error message

**Frontend Code**:
```typescript
const createJot = async (content: string) => {
  const tempId = -Date.now();
  const tempJot = { id: tempId, content, created_at: Date.now(), ... };

  setJots(prev => [...prev, tempJot]);

  try {
    const newJot = await api.createJot(content);
    setJots(prev => prev.map(j => j.id === tempId ? newJot : j));
  } catch (err) {
    setJots(prev => prev.filter(j => j.id !== tempId));
    showError(err);
  }
};
```

**Alternatives Considered**:
- Wait for backend: Slow, bad UX
- Optimistic with no rollback: Confusing on errors

---

## 7. Relative Timestamp Formatting

**Decision**: Multi-tier relative time display

**Tiers**:
- < 1 min: "just now"
- < 1 hour: "X min ago"
- < 24 hours: "Xh ago"
- Today: "2:30 PM"
- Yesterday: "Yesterday 2:30 PM"
- Older: "Jan 19"

**Rationale**:
- Balances recency with precision
- Matches user mental model (recent = relative, old = absolute)
- Common pattern (Slack, Discord, Twitter)

**Implementation**: See `src/utils/formatTime.ts` in spec

**Alternatives Considered**:
- Always relative: Confusing for old jots ("367 days ago")
- Always absolute: Loses recency context

---

## 8. Index Rebuild Strategy

**Decision**: Rebuild on startup + manual trigger

**Rebuild Conditions**:
- App startup (if index schema version changed)
- Manual user action (settings menu)
- File watcher detects bulk changes

**Implementation**:
1. Scan `.scribel/jots/*.md`
2. For each file:
   - Check if in index
   - Compare file mtime with cached mtime
   - If changed or new: parse and upsert
3. Remove orphaned index entries (files deleted externally)

**Performance**:
- 100 jots: <2 seconds (per spec)
- 1000 jots: <10 seconds (acceptable for manual trigger)
- 10,000 jots: <60 seconds (rare, background task)

**Alternatives Considered**:
- Real-time sync only: Fragile, loses changes if watcher fails
- Full rebuild every startup: Slow, wastes CPU

---

## 9. Error Handling Strategy

**Decision**: Use `thiserror` for Rust errors, type-safe frontend errors

**Backend**:
```rust
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
}
```

**Frontend**:
```typescript
try {
  await createJot(content);
} catch (err) {
  if (err instanceof Error) {
    toast.error(err.message);
  } else {
    toast.error("Unknown error occurred");
  }
}
```

**Rationale**:
- Typed errors prevent silent failures
- `thiserror` reduces boilerplate
- User-friendly error messages

---

## 10. Testing Strategy

**Unit Tests** (Rust):
- Parser functions (tags, links, frontmatter)
- ID generation (uniqueness, format)
- Time formatting utilities

**Integration Tests** (Rust):
- File create/read/update/delete with temp directory
- Index rebuild from files
- File watcher event handling

**Component Tests** (React):
- JotInput submission behavior
- JotList rendering and scrolling
- Optimistic update flow

**E2E Tests** (Future):
- Full user flow: create → display → delete
- External edit detection (manual test)

**Tools**:
- Rust: `cargo test` with `tempfile` for isolated tests
- React: Vitest + Testing Library
- Coverage: `cargo tarpaulin` (Rust), `vitest --coverage` (TS)

---

## Summary

All technical decisions resolved. No NEEDS CLARIFICATION items remaining. Ready for Phase 1 (Design & Contracts).

**Key Takeaways**:
- Markdown-first with SQLite index (not DB-first)
- WAL mode for concurrent access
- notify crate for file watching
- Optimistic UI for responsiveness
- Comprehensive error handling
