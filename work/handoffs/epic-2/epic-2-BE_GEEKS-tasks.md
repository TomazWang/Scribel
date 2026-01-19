# Backend Development Tasks - Epic 2 (Vault Integration)

**Status**: ⏳ READY TO START
**Tech Stack**: Rust 1.75+, Tauri, SQLite, `notify` crate
**Priority**: P0 (MVP Blocker)
**Estimated Duration**: 5-7 days total

---

## Overview

Epic 2 consists of two features:
1. **epic-2-feat-001**: Vault Configuration (2-3 days)
2. **epic-2-feat-002**: File Watcher - Jots Folder (3-4 days)

**Sequential Dependency**: Feature 001 MUST complete before 002 can start.

---

## Feature 001: Vault Configuration

**Goal**: Replace hardcoded vault path with user-configurable vault selection

**Your Tasks**: T001-T018, T031-T032, T036

**Duration**: 2-3 days

**Files You Own**:
- `src-tauri/src/config/` (all files)
- `src-tauri/src/commands/vault.rs`
- `src-tauri/src/db/migrations.rs` (config table)
- `src-tauri/tests/config_storage.rs`
- `src-tauri/tests/vault_detection.rs`

### Phase 1: Backend Foundation (Day 1)

**Tasks**: T001-T005

- [ ] **T001**: Create config module structure
  - File: `src-tauri/src/config/mod.rs`
  - Exports: `pub mod storage`, `pub mod detection`, `pub mod errors`, `pub mod models`

- [ ] **T002**: Create config table migration
  - File: `src-tauri/src/db/migrations.rs`
  - SQL:
    ```sql
    CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    ```

- [ ] **T003**: Implement `get_vault_path()`
  - File: `src-tauri/src/config/storage.rs`
  - Query: `SELECT value FROM config WHERE key = 'vault_path'`
  - Return `Ok(None)` if key doesn't exist

- [ ] **T004**: Implement `set_vault_path()`
  - File: `src-tauri/src/config/storage.rs`
  - **Important**: Use `fs::canonicalize()` to resolve symlinks
  - SQL: `INSERT OR REPLACE INTO config (key, value) VALUES ('vault_path', ?)`
  - Validate path is absolute

- [ ] **T005**: Define ConfigError enum
  - File: `src-tauri/src/config/errors.rs`
  - Variants: `DatabaseError`, `InvalidPath`, `NotFound`, `PermissionDenied`
  - Implement `From<rusqlite::Error>`

**Checkpoint**: Run tests, verify config storage works

---

### Phase 2: Vault Detection (Day 1-2)

**Tasks**: T006-T011

- [ ] **T006**: Create detection module
  - File: `src-tauri/src/config/detection.rs`
  - Add to Cargo.toml: `walkdir = "2.4"`

- [ ] **T007**: Implement `get_search_paths()`
  - Use `#[cfg(target_os = "...")]` for platform detection
  - **macOS**: `~/Documents`, `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`, `~/Obsidian`
  - **Windows**: `%USERPROFILE%\Documents`, `%USERPROFILE%\OneDrive\Documents`, `%APPDATA%\Obsidian`
  - **Linux**: `~/Documents`, `~/Obsidian`

- [ ] **T008**: Implement `detect_vaults()`
  - Algorithm:
    1. Get search paths
    2. For each path, use `walkdir` with `max_depth(2)`
    3. Check if directory contains `.obsidian/` subfolder
    4. Extract vault name (parent directory name)
    5. Get last modified time with `fs::metadata(path).modified()`
    6. Return `Vec<VaultInfo>` sorted by `last_modified` DESC
  - **Performance**: Timeout after 5 seconds

- [ ] **T009**: Implement `validate_vault_path()`
  - Checks:
    1. `path.exists()`
    2. `path.is_dir()`
    3. `path.join(".obsidian").exists()`
    4. `fs::metadata(path)` succeeds (readable)
    5. Parent is writable (for creating `.scribel/jots/`)
  - Return `Ok(true)` if all pass

- [ ] **T010**: Implement `ensure_jots_folder()`
  - Create `.scribel/jots/` using `fs::create_dir_all()`
  - Handle `ErrorKind::PermissionDenied` gracefully

- [ ] **T011**: Define VaultInfo struct
  - File: `src-tauri/src/config/models.rs`
  - Fields:
    ```rust
    #[derive(Serialize, Deserialize, Debug)]
    pub struct VaultInfo {
        pub name: String,
        pub path: String,
        pub last_modified: i64, // Unix timestamp
    }
    ```

**Checkpoint**: Test detection with real Obsidian vaults

---

### Phase 3: Tauri Commands (Day 2)

**Tasks**: T012-T018

- [ ] **T012**: `get_vault_path` command
  - Signature: `#[tauri::command] pub async fn get_vault_path(state: State<AppState>) -> Result<Option<String>, String>`
  - Call `config::storage::get_vault_path(&state.db)`

- [ ] **T013**: `set_vault_path` command
  - Validate path first with `validate_vault_path()`
  - Call `set_vault_path()`
  - Call `ensure_jots_folder()`

- [ ] **T014**: `detect_vaults` command
  - Timeout after 5 seconds using `tokio::time::timeout()`
  - Return empty Vec if timeout

- [ ] **T015**: `validate_vault_path` command
  - Simple wrapper around `detection::validate_vault_path()`

- [ ] **T016**: `ensure_jots_folder` command
  - Get vault path from config first
  - Call `detection::ensure_jots_folder()`

- [ ] **T017**: `open_vault_in_finder` command
  - Use `tauri::api::shell::open()` to open vault folder
  - Platform-agnostic (works on macOS/Windows/Linux)

- [ ] **T018**: Register commands
  - File: `src-tauri/src/lib.rs`
  - Add to `tauri::Builder::default().invoke_handler(tauri::generate_handler![...])`

**Checkpoint**: Test commands via Tauri DevTools console

---

### Testing (Day 3)

**Tasks**: T031-T032, T036 (partial)

- [ ] **T031**: Unit tests for config storage
  - File: `src-tauri/tests/config_storage.rs`
  - Tests:
    - Set and get vault path
    - Get when no path set (returns None)
    - Set invalid path (returns error)
    - Set path with Unicode characters (test: `/Users/测试/Obsidian`)

- [ ] **T032**: Unit tests for vault detection
  - File: `src-tauri/tests/vault_detection.rs`
  - Create test fixtures in `tests/fixtures/test-vault/` with `.obsidian/` folder
  - Tests:
    - Detect vaults in test fixtures
    - Validate valid vault path
    - Reject invalid path (no .obsidian)
    - Reject non-existent path
    - Handle permission errors (create read-only folder)

- [ ] **T036**: Manual testing backend
  - [ ] Commands callable from DevTools console
  - [ ] Auto-detection finds real vaults
  - [ ] Validation correctly rejects invalid paths
  - [ ] Config persists across app restart

**Checkpoint**: All backend tests pass, ready for FE_DUDES integration

---

## Feature 002: File Watcher - Jots Folder

**Goal**: Auto-detect external changes to jot files and update index

**Your Tasks**: T001-T022, T026-T035, T036

**Duration**: 3-4 days

**Dependencies**: ⚠️ **BLOCKED until Feature 001 complete**

**Files You Own**:
- `src-tauri/src/watcher/` (all files)
- `src-tauri/src/commands/watcher.rs`
- `src-tauri/tests/watcher_events.rs`

### Phase 1: Dependencies & Setup (Day 4)

**Tasks**: T001-T005

- [ ] **T001**: Add dependencies
  - Cargo.toml:
    ```toml
    notify = "6.1"
    notify-debouncer-mini = "0.4"
    ```

- [ ] **T002**: Create watcher module structure
  - File: `src-tauri/src/watcher/mod.rs`
  - Sub-modules: `events`, `handlers`, `state`, `errors`

- [ ] **T003**: Define WatcherState
  - File: `src-tauri/src/watcher/state.rs`
  - Fields:
    ```rust
    pub struct WatcherState {
        pub running: Arc<AtomicBool>,
        pub events_processed: Arc<AtomicU64>,
        pub last_event_time: Arc<Mutex<Option<i64>>>,
        pub error_message: Arc<Mutex<Option<String>>>,
    }
    ```
  - Add to AppState in `src-tauri/src/lib.rs`

- [ ] **T004**: Define WatcherError enum
  - Variants: `NotifyError`, `IoError`, `ParsingError`, `DatabaseError`, `WatcherNotRunning`

- [ ] **T005**: Define WatcherStatus struct
  - For status command:
    ```rust
    #[derive(Serialize)]
    pub struct WatcherStatus {
        pub state: String,
        pub events_processed: u64,
        pub last_event_time: Option<i64>,
        pub error_message: Option<String>,
    }
    ```

---

### Phase 2: File Watcher Core (Day 4-5)

**Tasks**: T006-T009

- [ ] **T006**: Implement `start_watcher()`
  - File: `src-tauri/src/watcher/events.rs`
  - Algorithm:
    1. Get vault path from config (Feature 001)
    2. Construct jots path: `{vault_path}/.scribel/jots/`
    3. Create debounced watcher:
       ```rust
       use notify_debouncer_mini::{new_debouncer, DebouncedEvent};
       let (tx, rx) = std::sync::mpsc::channel();
       let mut debouncer = new_debouncer(Duration::from_millis(500), None, tx)?;
       debouncer.watcher().watch(Path::new(&jots_path), RecursiveMode::NonRecursive)?;
       ```
    4. Spawn event processing loop

- [ ] **T007**: Implement event processing loop
  - Loop receives events from channel
  - Match on `EventKind`:
    - `Create(CreateKind::File)` → `handle_create()`
    - `Modify(ModifyKind::Data(_))` → `handle_modify()`
    - `Remove(RemoveKind::File)` → `handle_delete()`
  - Update `WatcherState` after each event

- [ ] **T008**: Add file filtering
  - Only process files with `.md` extension
  - Skip hidden files (starts with `.`)
  - Skip non-file events (directories)

- [ ] **T009**: Implement bounded event queue
  - Use `crossbeam_channel::bounded(1000)` instead of unbounded
  - On queue full:
    1. Log warning: "Event queue overflow"
    2. Clear queue
    3. Call `resync_jots()`

---

### Phase 3: Event Handlers (Day 5)

**Tasks**: T010-T015

- [ ] **T010**: Implement `handle_create()`
  - File: `src-tauri/src/watcher/handlers.rs`
  - Steps:
    1. Parse jot file using Epic 1's `jots::parser::parse_jot_file()`
    2. Insert into `jot_index` table
    3. Emit Tauri event: `app.emit("jot_created", &jot)`

- [ ] **T011**: Add retry logic for file locking
  - Wrap `fs::read_to_string()` in retry loop:
    ```rust
    let mut attempts = 0;
    let content = loop {
        match fs::read_to_string(path) {
            Ok(c) => break c,
            Err(e) if e.kind() == ErrorKind::PermissionDenied && attempts < 3 => {
                tokio::time::sleep(Duration::from_secs(1)).await;
                attempts += 1;
            },
            Err(e) => return Err(WatcherError::IoError(e)),
        }
    };
    ```

- [ ] **T012**: Implement `handle_modify()`
  - Re-parse file (with retry)
  - Update index: `UPDATE jot_index SET content = ?, tags = ?, links = ?, modified_at = ? WHERE file_path = ?`
  - Emit: `app.emit("jot_updated", &jot)`

- [ ] **T013**: Implement `handle_delete()`
  - Delete from index: `DELETE FROM jot_index WHERE file_path = ?`
  - Emit: `app.emit("jot_deleted", JotDeleted { id })`

- [ ] **T014**: Add parsing error handling
  - On parsing error:
    - Log error (don't crash)
    - Update `watcher_state.error_message`
    - Continue watching

- [ ] **T015**: Add database error handling
  - On database error:
    - Log error
    - Retry once after 1 second
    - If still fails, log and continue

---

### Phase 4: Tauri Commands (Day 6)

**Tasks**: T016-T022

- [ ] **T016**: `start_jot_watcher` command
  - Check if already running (idempotent)
  - Spawn watcher task with `tokio::spawn()`

- [ ] **T017**: `stop_jot_watcher` command
  - Set `running = false`
  - Drop watcher handle

- [ ] **T018**: `get_watcher_status` command
  - Return `WatcherStatus` from state

- [ ] **T019**: `resync_jots` command
  - Stop watcher
  - Clear `jot_index` table
  - Scan `.scribel/jots/` folder
  - Parse all `.md` files
  - Insert into index
  - Restart watcher
  - Return count

- [ ] **T020**: Initialize watcher on app startup
  - In `src-tauri/src/lib.rs` setup hook:
    ```rust
    .setup(|app| {
        let app_handle = app.handle();
        tauri::async_runtime::spawn(async move {
            let _ = start_jot_watcher(app_handle, state).await;
        });
        Ok(())
    })
    ```

- [ ] **T021**: Stop watcher on app shutdown
  - In cleanup hook or window event handler

- [ ] **T022**: Register watcher commands
  - Add to `invoke_handler`

---

### Testing (Day 6-7)

**Tasks**: T026-T035, T036 (partial)

**Unit Tests**:
- [ ] **T026**: Test event filtering
- [ ] **T027**: Test debouncing (10 rapid edits → 1 update)
- [ ] **T028**: Test event handlers (create/modify/delete)

**Integration Tests**:
- [ ] **T029**: Test watcher lifecycle (start/stop/restart)
- [ ] **T030**: Test external file operations (create/modify/delete files, verify index)
- [ ] **T031**: Test bulk operations (100 files simultaneously)

**Performance Tests**:
- [ ] **T032**: Event detection latency (<1s)
- [ ] **T033**: Index update latency (<100ms)
- [ ] **T034**: CPU usage (<1% idle)
- [ ] **T035**: Memory usage (<10MB growth over 1000 events)

**Manual Testing**:
- [ ] **T036**: Manual test checklist (see tasks.md)

---

## Communication with FE_DUDES

### Handoff Points

**Feature 001**:
- **After T018**: Commands registered → FE_DUDES can integrate real commands
- **Note**: FE_DUDES can start T019-T024 (onboarding) with mocked commands earlier

**Feature 002**:
- **After T022**: Commands registered → FE_DUDES can add event listeners
- **Note**: FE_DUDES needs minimal work (1 day) for integration

### Code Comments

Use `AI-DEV-NOTE` for communication:
```rust
// AI-DEV-NOTE: @FE_DUDES - Command ready: invoke('detect_vaults') returns Vec<VaultInfo> -- by @BE_GEEKS
```

### Handoff Documents

When complete, create:
- `work/handoffs/epic-2/epic-2-f1-BE_GEEKS-to-FE_DUDES.md` (after Feature 001)
- `work/handoffs/epic-2/epic-2-f2-BE_GEEKS-to-THE_PO.md` (after Feature 002)

---

## Build & Test Commands

```bash
# Backend tests
cd src-tauri
cargo test

# Run specific test
cargo test config_storage

# Check code
cargo clippy

# Build
cargo build

# Run app
cargo tauri dev
```

---

## Resources

### Documentation
- **Feature Specs**: `specs/epic-2-feat-001-vault-config/spec.md`, `specs/epic-2-feat-002-file-watcher-jots/spec.md`
- **Implementation Plans**: `specs/epic-2-feat-001-vault-config/plan.md`, `specs/epic-2-feat-002-file-watcher-jots/plan.md`
- **Tasks**: `specs/epic-2-feat-001-vault-config/tasks.md`, `specs/epic-2-feat-002-file-watcher-jots/tasks.md`

### External Docs
- **Tauri Commands**: https://tauri.app/v2/guides/features/command/
- **notify crate**: https://docs.rs/notify/latest/notify/
- **rusqlite**: https://docs.rs/rusqlite/latest/rusqlite/
- **walkdir**: https://docs.rs/walkdir/latest/walkdir/

---

## Next Steps

1. ✅ Review this handoff note
2. ⏭️ Start Feature 001, Phase 1 (T001-T005)
3. ⏭️ Checkpoint after each phase
4. ⏭️ Notify FE_DUDES when T018 complete
5. ⏭️ Complete Feature 001, then start Feature 002

**Status**: Ready to begin implementation
**Last Updated**: 2026-01-19
