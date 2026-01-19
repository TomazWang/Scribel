# Feature Specification: File Watcher - Jots Folder

**Epic**: 2 - Vault Integration
**Feature ID**: epic-2-feat-002
**PRD Reference**: F3 (Vault Indexing)
**Priority**: P0 (Foundation for Epic 3)
**Status**: Specification Complete
**Created**: 2026-01-19
**Last Updated**: 2026-01-19

---

## Overview

### Purpose

Automatically detect when jot files in `.scribel/jots/` are created, modified, or deleted externally (e.g., via Obsidian, text editors, or file sync tools) and update the Scribel index accordingly. This enables seamless bidirectional integration between Scribel and Obsidian.

### User Value

- **Seamless Sync**: Edit jots in Obsidian, see changes instantly in Scribel
- **No Manual Refresh**: App automatically detects external changes
- **Data Integrity**: Index always reflects actual file system state
- **Foundation for Epic 3**: Infrastructure needed for vault-wide indexing and embeddings
- **Conflict-Free**: Works alongside Obsidian without file locking issues

---

## User Scenarios & Testing

### Scenario 1: External Edit Detection

**Given**: Scribel is running with 10 jots in the index
**When**: User opens a jot file in Obsidian and changes the content
**Then**:
1. File watcher detects the Modify event within 1 second
2. Scribel re-parses the modified file
3. Jot index is updated with new content, tags, and links
4. UI automatically refreshes to show updated content
5. No user action required

**Edge Cases**:
- Multiple rapid edits → Debounced to single update after 500ms
- Invalid YAML frontmatter → Log error, skip index update, show warning in UI
- File locked by another process → Retry after 1 second, max 3 attempts

---

### Scenario 2: External File Creation

**Given**: User creates a new jot file manually in `.scribel/jots/`
**When**: User saves `2026-01-19-150000-abc1.md` with valid frontmatter
**Then**:
1. File watcher detects Create event
2. Scribel parses the new file
3. New jot inserted into index
4. UI updates to show new jot in chronological list
5. Jot is immediately searchable

**Edge Cases**:
- File created without frontmatter → Generate frontmatter, insert into index
- Filename doesn't match pattern → Log warning, still index by content
- Duplicate ID in frontmatter → Regenerate unique ID

---

### Scenario 3: External File Deletion

**Given**: User has 10 jots in Scribel
**When**: User deletes `2026-01-19-143000-xyz1.md` from file system
**Then**:
1. File watcher detects Delete event
2. Jot with matching filename removed from index
3. UI removes jot from list
4. No orphaned index entries remain

---

### Scenario 4: Bulk Operations (File Sync)

**Given**: User has Obsidian Sync or Dropbox syncing vault
**When**: 20 jot files sync from another device simultaneously
**Then**:
1. Watcher detects multiple Create/Modify events
2. Events debounced (500ms) and batched
3. Index updates processed in order
4. UI updates once after all processing complete
5. No performance degradation or UI freezing

---

## Functional Requirements

### FR-1: File System Monitoring

**Requirement**: System shall monitor `.scribel/jots/` folder for file system changes in real-time

**Technical Details**:
- Use Rust `notify` crate with `recommended_watcher()`
- Watch `.scribel/jots/` folder non-recursively (files in this folder only)
- Monitor these events:
  - **Create**: New `.md` file added
  - **Modify**: Existing `.md` file content changed
  - **Remove**: `.md` file deleted
- Ignore non-markdown files (`.DS_Store`, `.tmp`, etc.)

**Acceptance Criteria**:
- [ ] Watcher starts automatically on app launch
- [ ] Detects events within 1 second of file change
- [ ] Only monitors `.scribel/jots/` (not subdirectories)
- [ ] Ignores hidden files and non-`.md` files
- [ ] Watcher survives file system errors (logs and continues)

---

### FR-2: Event Debouncing

**Requirement**: System shall debounce rapid file changes to avoid excessive index updates

**Debounce Logic**:
- **Delay**: 500ms after last event before processing
- **Batching**: If multiple events for same file, process only the last one
- **Performance**: Reduces index churn during typing/saving

**Example**:
```
t=0ms:    File modified (event 1)
t=100ms:  File modified (event 2) → Reset timer
t=200ms:  File modified (event 3) → Reset timer
t=700ms:  Process event 3 (500ms after last event)
```

**Acceptance Criteria**:
- [ ] Single edit triggers one index update
- [ ] Rapid edits (10 in 2 seconds) trigger one update
- [ ] Debounce delay is 500ms ± 50ms
- [ ] Different files process independently (no global lock)

---

### FR-3: Index Synchronization

**Requirement**: System shall update jot index when file system events occur

**Event Handlers**:

**On Create**:
1. Parse new file (frontmatter + content)
2. Extract tags and wiki-links
3. Insert jot into `jot_index` table
4. Emit UI event: `jot_created`

**On Modify**:
1. Re-parse modified file
2. Update existing index entry (by file path)
3. Update: content, tags, links, modified timestamp
4. Emit UI event: `jot_updated`

**On Delete**:
1. Find jot by file path
2. Remove from `jot_index` table
3. Emit UI event: `jot_deleted`

**Error Handling**:
- Invalid frontmatter → Log error, skip update, continue watching
- File unreadable → Retry 3 times (1s delay), then log and skip
- Database error → Log, emit error event to UI

**Acceptance Criteria**:
- [ ] Create event inserts jot into index
- [ ] Modify event updates existing jot
- [ ] Delete event removes jot from index
- [ ] Index update completes within 100ms (excluding file I/O)
- [ ] Parsing errors don't crash watcher
- [ ] UI events trigger list refresh

---

### FR-4: Background Operation

**Requirement**: File watcher shall run in background thread without blocking UI

**Technical Implementation**:
- Run watcher in separate async task (Tokio runtime)
- Use channel (mpsc) for event communication to main thread
- Main thread processes events and updates UI
- Graceful shutdown on app close (stop watching, flush events)

**Performance**:
- Watcher thread uses <1% CPU when idle
- Event processing <10ms per event
- No UI freezing during bulk updates

**Acceptance Criteria**:
- [ ] Watcher runs on background thread
- [ ] UI remains responsive during file operations
- [ ] Watcher stops cleanly on app close
- [ ] No memory leaks after 1000 events
- [ ] CPU usage <1% when no events occurring

---

### FR-5: Health Monitoring

**Requirement**: System shall expose watcher health status to UI

**Status States**:
- **Running**: Actively watching, last event <5 minutes ago
- **Idle**: Watching but no recent events
- **Stopped**: Watcher not active (error or manually stopped)
- **Error**: Watcher crashed, restart required

**Tauri Command**:
```rust
get_watcher_status() -> Result<WatcherStatus, String>

struct WatcherStatus {
    state: String, // "running" | "idle" | "stopped" | "error"
    events_processed: u64,
    last_event_time: Option<i64>, // Unix timestamp
    error_message: Option<String>,
}
```

**Acceptance Criteria**:
- [ ] Status command returns accurate state
- [ ] UI can query status on demand
- [ ] Error state includes descriptive message
- [ ] Events_processed counter increments correctly

---

### FR-6: Tauri Commands (Backend API)

**Requirement**: Expose watcher control and status via Tauri commands

**Commands**:

```rust
// Start file watcher (called on app startup)
start_jot_watcher() -> Result<(), String>

// Stop file watcher (called on app shutdown)
stop_jot_watcher() -> Result<(), String>

// Get current watcher status
get_watcher_status() -> Result<WatcherStatus, String>

// Manually trigger full re-sync (rebuilds index from files)
resync_jots() -> Result<u32, String> // Returns number of jots synced
```

**Acceptance Criteria**:
- [ ] All commands callable from frontend
- [ ] Start/stop are idempotent (safe to call multiple times)
- [ ] Resync forces full index rebuild
- [ ] Commands complete within 100ms (except resync)

---

## Success Criteria

### User Experience Metrics

1. **Detection Speed**: 95% of external edits reflected in UI within 2 seconds
2. **Data Consistency**: Index matches file system 100% of the time (no drift)
3. **Zero Manual Refresh**: Users never need to manually reload after external edits
4. **Conflict-Free**: No file locking conflicts with Obsidian or other editors

### Technical Metrics

1. **Performance**:
   - Event detection within 1 second
   - Index update within 100ms per event
   - UI refresh within 50ms after index update
   - CPU usage <1% when idle

2. **Reliability**:
   - Watcher uptime >99.9% (survives file system errors)
   - Zero memory leaks over 1000+ events
   - Graceful degradation on permission errors
   - Handles 100 simultaneous file changes without crashing

3. **Resource Efficiency**:
   - Memory overhead <10MB for watcher thread
   - No file descriptor leaks
   - Debouncing reduces index writes by 80% during bulk operations

---

## Dependencies

### Epic 1
- Epic 1.2 (Jot Storage): Defines `.scribel/jots/` structure
- Epic 1.2 (SQLite Index): `jot_index` table schema
- Epic 1.2 (Parser): `parse_jot_file()` function

### Epic 2
- Epic 2.1 (Vault Configuration): Provides vault path to construct `.scribel/jots/` full path

### External
- `notify` crate (already in `Cargo.toml`)
- `tokio` async runtime (already in `Cargo.toml`)

### Blocks
- Epic 3 (Vault Indexing): Will extend this watcher to monitor entire vault

---

## Assumptions

1. **File System**: Standard POSIX or Windows file systems (no network drives for MVP)
2. **Permissions**: User has read/write access to `.scribel/jots/` folder
3. **File Format**: All jot files follow the format defined in Epic 1 (YAML frontmatter)
4. **Concurrency**: Only one Scribel instance runs per vault at a time
5. **Obsidian Behavior**: Obsidian uses atomic writes (write to temp, rename) - compatible with watching

---

## Phased Implementation

### Phase 1 (This Feature - Epic 2)

**Scope**: Watch `.scribel/jots/` folder only

**Deliverables**:
- Monitor jots folder for Create/Modify/Delete
- Update jot_index automatically
- Debouncing and background operation
- Health monitoring

**Goal**: Enable seamless Obsidian ↔ Scribel sync for jots

---

### Phase 2 (Epic 3 - Vault Indexing)

**Scope**: Extend to watch entire vault

**Additions**:
- Monitor all `*.md` files in vault recursively
- Track file mtimes for incremental re-embedding
- Respect `.gitignore` patterns and custom exclusions
- Trigger embedding generation for new/modified files

**Goal**: Real-time vault indexing for semantic search

---

## Out of Scope (Deferred)

- **Vault-Wide Monitoring**: Only jots folder in Phase 1
- **Conflict Resolution UI**: No merge/diff interface for external conflicts
- **Sync Status Visualization**: No detailed file sync progress UI
- **Custom Ignore Patterns UI**: No settings for excluding files
- **Multi-Device Coordination**: Assumes single-device usage (no distributed locking)

---

## Open Questions

None. All decisions made by THE_PO (see `work/handoffs/epic-1/epic-1-f1-MASTER_TL-to-TEAMS.md`).

---

## Related Documents

- **PRD**: `docs/PRD.md` → Feature F3 (Vault Indexing)
- **Constitution**: `.specify/memory/constitution.md` → Crash Safety & Data Integrity
- **THE_PO Decisions**: `work/handoffs/epic-1/epic-1-f1-MASTER_TL-to-TEAMS.md`
- **Tech Design**: `docs/TECH_DESIGN.md` → File Watcher Architecture

---

## Approval

**Specification Status**: ✅ Ready for Planning

**Next Steps**:
1. MASTER_TL & THE_PO review (this step)
2. Run `/speckit.plan` to create implementation plan
3. Generate tasks with `/speckit.tasks`
4. Assign to team: BE_GEEKS (pure backend feature)

---

**Last Reviewed**: 2026-01-19
**Approved By**: Pending MASTER_TL & THE_PO sign-off
