# API Contract: Jot Commands

**Protocol**: Tauri IPC (invoke/command pattern)
**Version**: 1.0.0
**Date**: 2026-01-19

---

## Overview

All commands are invoked from frontend using `@tauri-apps/api/core`:

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<Jot>("create_jot", { content: "..." });
```

**Error Handling**: All commands return `Result<T, String>` in Rust, mapped to `Promise<T>` in TypeScript (rejects with error message).

---

## Commands

### 1. `create_jot`

Create a new jot with auto-generated ID and timestamp.

**Input**:
```typescript
{
  content: string  // 1-10,000 characters, non-empty after trim
}
```

**Output**:
```typescript
Jot  // Complete jot object with generated ID, timestamps, tags, links
```

**Behavior**:
1. Generate ID: `jot-{timestamp}-{hex}`
2. Extract tags and links from content
3. Create YAML frontmatter
4. Write `.md` file to `.scribel/jots/`
5. Insert into `jot_index` table
6. Return complete Jot object

**Errors**:
- `ValidationError`: Content empty or > 10,000 chars
- `VaultNotConfigured`: Vault path not set
- `FileError`: Cannot write file (permissions, disk full)
- `DbError`: Cannot update index

**Performance**: <50ms

**Example**:
```typescript
const jot = await invoke<Jot>("create_jot", {
  content: "Meeting with [[Sarah]] about #project-x"
});

// Returns:
// {
//   id: "jot-2026-01-19-143256-a1b2",
//   content: "Meeting with [[Sarah]] about #project-x",
//   created_at: "2026-01-19T14:32:56Z",
//   modified_at: "2026-01-19T14:32:56Z",
//   tags: ["project-x"],
//   links: ["Sarah"],
//   promoted: false,
//   file_path: ".scribel/jots/2026-01-19-143256-a1b2.md"
// }
```

---

### 2. `get_jots`

Get paginated list of jots, ordered by creation time (ascending).

**Input**:
```typescript
{
  limit?: number,   // Default: 50, Max: 500
  offset?: number   // Default: 0
}
```

**Output**:
```typescript
Jot[]  // Array of jots, oldest first
```

**Behavior**:
1. Query `jot_index` with `ORDER BY created_at ASC`
2. Apply pagination (LIMIT, OFFSET)
3. Return array of Jot objects

**Errors**:
- `DbError`: Cannot query index
- `ValidationError`: Invalid limit/offset

**Performance**: <100ms (50 items)

**Example**:
```typescript
const jots = await invoke<Jot[]>("get_jots", {
  limit: 20,
  offset: 0
});

// Returns array of 20 jots (or fewer if less exist)
```

---

### 3. `get_jot`

Get a single jot by ID. Reads from file (not index) to ensure freshness.

**Input**:
```typescript
{
  id: string  // Format: "jot-YYYY-MM-DD-HHMMSS-XXXX"
}
```

**Output**:
```typescript
Jot  // Complete jot object
```

**Behavior**:
1. Look up file path from index (if available)
2. Read `.md` file from `.scribel/jots/`
3. Parse frontmatter and content
4. Return Jot object

**Errors**:
- `NotFound`: Jot ID does not exist
- `FileError`: Cannot read file
- `ParseError`: Invalid frontmatter or format

**Performance**: <30ms

**Example**:
```typescript
const jot = await invoke<Jot>("get_jot", {
  id: "jot-2026-01-19-143256-a1b2"
});
```

---

### 4. `update_jot`

Update jot content. Rewrites file and updates index.

**Input**:
```typescript
{
  id: string,      // Existing jot ID
  content: string  // 1-10,000 characters
}
```

**Output**:
```typescript
Jot  // Updated jot object with new modified_at
```

**Behavior**:
1. Read existing jot from file
2. Update content, modified_at timestamp
3. Re-extract tags and links
4. Rewrite file with updated frontmatter
5. Update index entry
6. Return updated Jot

**Errors**:
- `NotFound`: Jot ID does not exist
- `ValidationError`: Content invalid
- `FileError`: Cannot write file
- `DbError`: Cannot update index

**Performance**: <50ms

**Example**:
```typescript
const updated = await invoke<Jot>("update_jot", {
  id: "jot-2026-01-19-143256-a1b2",
  content: "Updated content #new-tag"
});

// Returns jot with modified_at updated
```

---

### 5. `delete_jot`

Delete a jot. Removes file and index entry.

**Input**:
```typescript
{
  id: string  // Jot ID to delete
}
```

**Output**:
```typescript
void  // No return value (success)
```

**Behavior**:
1. Look up file path from index
2. Delete `.md` file from `.scribel/jots/`
3. Remove index entry
4. Return success

**Errors**:
- `NotFound`: Jot ID does not exist
- `FileError`: Cannot delete file (permissions)
- `DbError`: Cannot remove index entry

**Performance**: <30ms

**Example**:
```typescript
await invoke("delete_jot", {
  id: "jot-2026-01-19-143256-a1b2"
});

// File and index entry removed
```

---

### 6. `search_jots`

Search jots by content (LIKE query on index).

**Input**:
```typescript
{
  query: string,   // Search term (case-insensitive)
  limit?: number   // Default: 50, Max: 500
}
```

**Output**:
```typescript
Jot[]  // Array of matching jots, ordered by created_at DESC
```

**Behavior**:
1. Query `jot_index` with `content LIKE '%{query}%'` (case-insensitive)
2. Order by `created_at DESC` (newest first for search results)
3. Apply limit
4. Return array of Jots

**Errors**:
- `DbError`: Cannot query index
- `ValidationError`: Query empty or too long

**Performance**: <500ms

**Example**:
```typescript
const results = await invoke<Jot[]>("search_jots", {
  query: "meeting",
  limit: 20
});

// Returns jots containing "meeting" (case-insensitive)
```

---

### 7. `set_jot_promoted`

Mark a jot as promoted (converted to full note).

**Input**:
```typescript
{
  id: string,
  promoted: boolean
}
```

**Output**:
```typescript
Jot  // Updated jot object
```

**Behavior**:
1. Read existing jot from file
2. Update `promoted` field in frontmatter
3. Update `modified_at` timestamp
4. Rewrite file
5. Update index entry
6. Return updated Jot

**Errors**:
- `NotFound`: Jot ID does not exist
- `FileError`: Cannot write file
- `DbError`: Cannot update index

**Performance**: <50ms

**Example**:
```typescript
const promoted = await invoke<Jot>("set_jot_promoted", {
  id: "jot-2026-01-19-143256-a1b2",
  promoted: true
});
```

---

### 8. `rebuild_jot_index`

Rebuild the index from files (recovery/sync operation).

**Input**:
```typescript
{}  // No parameters
```

**Output**:
```typescript
number  // Count of jots indexed
```

**Behavior**:
1. Scan `.scribel/jots/*.md` files
2. For each file:
   - Check if in index
   - Compare file mtime with cached mtime
   - If changed or new: parse and upsert
   - If parse fails: log error, skip
3. Remove orphaned index entries (files deleted externally)
4. Return count of indexed jots

**Errors**:
- `VaultNotConfigured`: Vault path not set
- `DbError`: Cannot update index
- `FileError`: Cannot read jots folder

**Performance**: <2s (100 jots), <10s (1000 jots)

**Example**:
```typescript
const count = await invoke<number>("rebuild_jot_index");

console.log(`Indexed ${count} jots`);
```

---

## Type Definitions

### Jot

```typescript
export interface Jot {
  id: string;           // Format: "jot-YYYY-MM-DD-HHMMSS-XXXX"
  content: string;      // 1-10,000 characters
  created_at: string;   // ISO 8601: "2026-01-19T14:32:56Z"
  modified_at: string;  // ISO 8601: "2026-01-19T14:32:56Z"
  tags: string[];       // Extracted from content (without #)
  links: string[];      // Extracted from content (without [[]])
  promoted: boolean;    // Whether promoted to full note
  file_path: string;    // Relative path: ".scribel/jots/..."
}
```

---

## Error Responses

All errors are returned as rejected promises with string messages:

```typescript
try {
  const jot = await invoke<Jot>("get_jot", { id: "invalid" });
} catch (err) {
  // err is a string: "Jot not found: invalid"
  console.error(err);
}
```

**Error Message Prefixes**:
- `"Jot not found: {id}"` → NotFound
- `"File operation failed: {details}"` → FileError
- `"Invalid jot format: {details}"` → ParseError
- `"Database error: {details}"` → DbError
- `"Vault not configured"` → VaultNotConfigured
- `"Invalid content: {details}"` → ValidationError

---

## Performance Guarantees

| Command | Target Latency | Notes |
|---------|---------------|-------|
| `create_jot` | <50ms | File write + index insert |
| `get_jots` (50 items) | <100ms | Index query only |
| `get_jot` | <30ms | Single file read |
| `update_jot` | <50ms | File rewrite + index update |
| `delete_jot` | <30ms | File delete + index remove |
| `search_jots` | <500ms | LIKE query on index |
| `set_jot_promoted` | <50ms | File rewrite + index update |
| `rebuild_jot_index` (100 jots) | <2s | Full rescan |

---

## Concurrency

**SQLite WAL Mode**: Allows concurrent reads during writes.

**File Watcher**: Runs in background, updates index on external changes.

**Race Conditions**:
- External file edits detected within 1-2 seconds (file watcher debounce)
- Index queries may be stale by up to 2 seconds after external edit
- Solution: Manual refresh trigger or accept eventual consistency

---

## Versioning

**Current Version**: 1.0.0

**Breaking Changes** (require major version bump):
- Command signature changes (rename, remove, change types)
- Error format changes
- Behavioral changes (e.g., sort order)

**Non-Breaking Changes** (minor/patch):
- New commands
- Performance improvements
- Bug fixes
- Additional optional parameters

---

## Testing Checklist

- [ ] Create jot with valid content
- [ ] Create jot with empty content (should error)
- [ ] Create jot with 10,001 chars (should error)
- [ ] Get jots with pagination (limit/offset)
- [ ] Get single jot by ID
- [ ] Get non-existent jot (should error)
- [ ] Update jot content
- [ ] Update non-existent jot (should error)
- [ ] Delete jot
- [ ] Delete non-existent jot (should error)
- [ ] Search jots with query
- [ ] Search with empty query (should error)
- [ ] Set jot promoted
- [ ] Rebuild index (manually delete index, rebuild)
- [ ] Rebuild index with corrupted file (should skip)
- [ ] External edit detected by watcher (index updated)
- [ ] Concurrent reads during write (should not block)
