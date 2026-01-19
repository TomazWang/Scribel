# MASTER_TL: Epic 2 Specification Technical Review

**From**: MASTER_TL
**To**: Planning Phase
**Epic**: 2 - Vault Integration
**Date**: 2026-01-19
**THE_PO Approval**: ✅ Received (agent aa8ec3b)

---

## Overview

Both specifications have been reviewed from a technical architecture perspective. This review focuses on:
- Technical feasibility
- Performance implications
- Architecture consistency with Constitution
- Risk identification
- Team ownership clarity

---

## Vault Configuration (epic-2-feat-001)

**Status**: ✅ APPROVED FOR PLANNING

### Technical Feasibility

✅ **Architecture Alignment**:
- Uses SQLite for config storage (consistent with Epic 1)
- Tauri file picker and fs APIs are mature and stable
- Platform-specific path detection is straightforward

✅ **Performance**:
- Auto-detection (3s) is generous - likely completes faster
- Path validation (500ms) is reasonable for file system checks
- 50ms retrieval on startup is well within Constitution targets

✅ **Dependencies**:
- No external services required
- All dependencies already in `Cargo.toml` (Tauri, rusqlite)
- Clean separation from Epic 1 (only depends on scaffold)

### Architecture Notes

**Config Storage Pattern**:
```rust
// SQLite: config table
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

// Usage
INSERT OR REPLACE INTO config (key, value) VALUES ('vault_path', '/path/to/vault');
```

This is simple and correct. No concerns.

**Auto-Detection Algorithm**:
- Platform-specific paths hard-coded (macOS, Windows, Linux)
- Recursive directory search with depth limit (good!)
- Checks for `.obsidian/` folder (Obsidian's marker)

**Recommendation**: Use `walkdir` crate with `max_depth(2)` to avoid searching too deep. This limits detection time.

**Validation Logic**:
- Path exists → `std::path::Path::exists()`
- Is directory → `path.is_dir()`
- Contains `.obsidian/` → `path.join(".obsidian").exists()`
- Readable → `std::fs::metadata(path)` succeeds

All standard library - no issues.

### Risk Assessment

**Medium Risk**: Permission Errors
- **Issue**: User selects path they don't have write permissions to
- **Mitigation**: Validation step checks if `.scribel/jots/` can be created
- **Fallback**: Clear error message, allow re-selection

**Low Risk**: Network Drives
- **Issue**: Vault on network drive may be slow or unreliable
- **Mitigation**: Show warning if path is not on local drive (defer to v1.1)
- **Note**: THE_PO accepted this limitation (Assumption 2)

**Low Risk**: Symlinks
- **Issue**: User selects symlink instead of actual directory
- **Mitigation**: Resolve symlinks with `fs::canonicalize()` before saving
- **Status**: Spec doesn't mention this - add to planning

### Team Ownership

**BE_GEEKS**:
- Config storage (SQLite)
- Auto-detection logic
- Validation logic
- Tauri commands (6 commands)
- Estimated: 2-3 days

**FE_DUDES**:
- Onboarding screen UI
- Settings panel UI
- File picker integration
- Estimated: 2-3 days

**Integration Point**: Tauri commands are the contract. FE_DUDES can mock commands while BE_GEEKS implements.

---

## File Watcher - Jots Folder (epic-2-feat-002)

**Status**: ✅ APPROVED FOR PLANNING

### Technical Feasibility

✅ **Architecture Alignment**:
- Uses `notify` crate (industry standard, mature)
- Background thread pattern matches Constitution recommendation
- Debouncing prevents excessive SQLite writes (performance-first)

✅ **Performance**:
- <1% CPU when idle is achievable with `notify`
- 100ms index update is well within target
- Debouncing (500ms) significantly reduces database churn

✅ **Dependencies**:
- `notify` crate already in `Cargo.toml`
- `tokio` async runtime already configured
- Epic 2.1 provides vault path

### Architecture Notes

**Watcher Implementation Pattern**:
```rust
use notify::{Watcher, RecursiveMode, RecommendedWatcher};
use tokio::sync::mpsc;

// Setup
let (tx, rx) = mpsc::channel(100);
let watcher = RecommendedWatcher::new(tx, Config::default())?;
watcher.watch(".scribel/jots/", RecursiveMode::NonRecursive)?;

// Event loop (separate thread)
loop {
    match rx.recv().await {
        Ok(Event::Create(path)) => handle_create(path),
        Ok(Event::Modify(path)) => handle_modify(path),
        Ok(Event::Remove(path)) => handle_remove(path),
        Err(_) => break, // Channel closed, shutdown
    }
}
```

This is the standard pattern. Proven architecture.

**Debouncing Strategy**:
- Use `tokio::time::sleep(Duration::from_millis(500))`
- Store pending events in `HashMap<PathBuf, Event>`
- On sleep completion, process all pending events
- Different files process independently (good concurrency)

**Recommendation**: Use `notify_debouncer_mini` crate instead of manual debouncing. It's battle-tested.

**Index Update Flow**:
```
File Change → notify event → Debouncer → Parser → SQLite UPDATE → UI event
                 ^1s            ^500ms       ^50ms    ^20ms        ^instant
```

Total latency: ~1.6 seconds (well within 2s target)

### Risk Assessment

**Medium Risk**: File Locking (Windows)
- **Issue**: Obsidian may lock files during sync, blocking our read
- **Mitigation**: Retry logic (3 attempts, 1s delay) specified in FR-3
- **Status**: Spec addresses this - good

**Medium Risk**: Bulk Sync Events
- **Issue**: Dropbox/iCloud syncing 100+ files triggers event storm
- **Mitigation**: Debouncing batches events, spec mentions "batch processing"
- **Additional Recommendation**: THE_PO noted bounded queue (max 1000 events). Add this to planning.

**Low Risk**: Watcher Crash
- **Issue**: File system errors (unmounted drive, permission changes) crash watcher
- **Mitigation**: Health monitoring (FR-5) exposes error state
- **Recovery**: User sees "Watcher stopped" in settings, can manually restart or app reload

**Low Risk**: Memory Leaks
- **Issue**: Long-running watcher accumulates memory
- **Mitigation**: Spec requires "No memory leaks after 1000 events" test
- **Note**: `notify` crate is well-maintained, unlikely to leak

### Performance Deep Dive

**CPU Usage Analysis**:
- `notify` uses platform-native APIs (FSEvents on macOS, ReadDirectoryChangesW on Windows)
- Native APIs are event-driven (no polling) - achieves <1% CPU idle
- Our event processing (parse + SQLite update) is ~100ms per file
- For 100 simultaneous changes: 100ms x 100 = 10 seconds processing time
  - But debouncing batches these, so UI updates once after 10s
  - CPU spike during processing, then back to idle
  - **Acceptable** for bulk operations

**Memory Usage Analysis**:
- Watcher thread: ~5MB baseline (notify internals)
- Event queue (100 capacity): ~10KB (small event structs)
- Debouncer HashMap: ~1KB per pending file x 100 = 100KB max
- **Total**: ~10MB worst case (matches spec target)

**Recommendation**: Add integration test that simulates 100-file sync and measures:
- Peak memory usage (<10MB)
- Processing time (<15 seconds total)
- UI responsiveness (no freezing)

### Team Ownership

**BE_GEEKS**:
- File watcher implementation (notify, debouncing)
- Event handlers (create/modify/delete)
- SQLite index updates
- Health monitoring
- Tauri commands (4 commands)
- Estimated: 3-4 days

**FE_DUDES**:
- Listen to UI events (`jot_created`, `jot_updated`, `jot_deleted`)
- Refresh jot list on events
- Optional: Settings panel status indicator
- Estimated: 1 day (minimal integration)

**Integration Point**: Tauri events. BE_GEEKS emits events, FE_DUDES listens.

---

## Cross-Feature Technical Considerations

### Execution Sequence

1. **Epic 2.1 (Vault Configuration) MUST complete first**
   - Provides vault path
   - File watcher needs this path to construct `.scribel/jots/` full path

2. **Epic 2.2 (File Watcher) can start planning during 2.1 implementation**
   - But cannot start implementation until 2.1 backend complete

**Timeline Estimate**:
- **Week 1**: Epic 2.1 (both teams in parallel)
- **Week 2**: Epic 2.2 (BE_GEEKS only) + Epic 2.1 polish (FE_DUDES)

### Shared Infrastructure

Both features use:
- **SQLite** (config table, jot_index table)
- **Tauri state management** (vault path stored in app state)
- **Error handling patterns** (Result<T, String> for all commands)

**Recommendation**: BE_GEEKS should define shared error types in `src-tauri/src/errors.rs`:
```rust
pub enum VaultError {
    NotFound,
    PermissionDenied,
    InvalidPath(String),
    // ...
}
```

This ensures consistent error messages across both features.

### Testing Strategy

**Epic 2.1 (Vault Configuration)**:
- Unit tests: Validation logic, path canonicalization
- Integration tests: Create test vaults, run detection
- Manual tests: Test on macOS/Windows/Linux with real Obsidian vaults

**Epic 2.2 (File Watcher)**:
- Unit tests: Debouncing logic, event handling
- Integration tests: Create files, modify, delete → verify index updates
- Performance tests: 100-file bulk sync, measure latency and memory
- Manual tests: Edit files in Obsidian while Scribel running

**End-to-End Test**:
- User configures vault (2.1)
- Watcher starts automatically (2.2)
- User edits jot in Obsidian
- Change appears in Scribel within 2 seconds

---

## Architecture Decisions Summary

### Decision 1: Config Storage in SQLite

**Choice**: Store vault path in SQLite `config` table

**Alternatives Considered**:
- **Tauri app data dir** (JSON file): Simpler but less queryable
- **Environment variable**: Not persistent

**Rationale**: SQLite is already initialized for jot_index. Reusing it is simpler than introducing a second storage mechanism.

**Approved**: ✅

---

### Decision 2: Debouncing Strategy

**Choice**: 500ms debounce with batching per file

**Alternatives Considered**:
- **No debouncing**: Excessive SQLite writes, poor performance
- **1000ms debounce**: Too slow, user waits too long

**Rationale**: 500ms balances responsiveness (feels instant) with performance (reduces churn by 80%).

**Approved**: ✅

---

### Decision 3: Watcher Scope (Phase 1)

**Choice**: Watch `.scribel/jots/` only, not entire vault

**Alternatives Considered**:
- **Watch entire vault immediately**: Over-engineering, no use case yet
- **No watcher**: Manual refresh required, poor UX

**Rationale**: Phased approach validates infrastructure before scaling. Epic 3 extends to full vault.

**Approved**: ✅

---

### Decision 4: Health Monitoring Exposure

**Choice**: Expose watcher status via Tauri command, minimal UI

**Alternatives Considered**:
- **No status exposed**: Hard to debug issues
- **Full sync dashboard**: Over-engineering for MVP

**Rationale**: Status command enables diagnostics without cluttering UI. THE_PO confirmed "mostly invisible" approach.

**Approved**: ✅

---

## Risks & Mitigations Summary

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Permission errors (2.1) | Medium | Validation with retry, clear error messages | BE_GEEKS |
| Network drives (2.1) | Low | Accept limitation for MVP, warn user | Deferred to v1.1 |
| File locking (2.2) | Medium | Retry logic (3x, 1s delay) | BE_GEEKS |
| Event storm (2.2) | Medium | Debouncing + bounded queue | BE_GEEKS |
| Watcher crash (2.2) | Low | Health monitoring, manual restart | BE_GEEKS |
| Memory leaks (2.2) | Low | Integration tests, use mature `notify` crate | BE_GEEKS |

---

## Technical Sign-Off

✅ **Both specifications are technically sound and ready for planning.**

**Recommendations for Planning Phase**:
1. Add symlink resolution to 2.1 validation logic
2. Add bounded event queue (1000 max) to 2.2 watcher
3. Define shared error types in `errors.rs`
4. Create test vault fixture for integration tests
5. Plan for integration test: configure vault + watcher + external edit

**Estimated Total Effort**:
- BE_GEEKS: 5-7 days (3 days for 2.1, 4 days for 2.2)
- FE_DUDES: 3-4 days (all in 2.1, minimal 2.2 integration)

**Critical Path**: Epic 2.1 completion → Epic 2.2 can begin

---

**Technical Review Complete**: 2026-01-19
**Reviewed By**: MASTER_TL

**Next Steps**:
1. ✅ THE_PO approval received
2. ✅ MASTER_TL approval received
3. ⏭️ Run `/speckit.plan` for epic-2-feat-001
4. ⏭️ Run `/speckit.plan` for epic-2-feat-002
5. ⏭️ Generate tasks with `/speckit.tasks`
6. ⏭️ Create team handoff notes

**Proceeding to planning phase...**
