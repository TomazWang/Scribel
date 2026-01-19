# Implementation Plan: File Watcher - Jots Folder

**Feature**: epic-2-feat-002-file-watcher-jots
**Epic**: 2 - Vault Integration
**Created**: 2026-01-19
**Status**: Ready for Implementation
**Priority**: P0 (Foundation for Epic 3)

---

## Executive Summary

**Goal**: Auto-detect external changes to jot files and update index in real-time

**Teams**: BE_GEEKS (backend only)

**Estimated Effort**:
- BE_GEEKS: 3-4 days
- FE_DUDES: 1 day (minimal integration - listen to events)

**Dependencies**:
- Epic 1.2 complete (jot storage, parser) ✅
- Epic 2.1 complete (vault configuration) ⏳ In Progress

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                File System (.scribel/jots/)                 │
│                                                              │
│   User edits jot in Obsidian or text editor                 │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ File System Events
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              File Watcher (notify crate)                    │
│                                                              │
│  • Monitors .scribel/jots/ non-recursively                  │
│  • Detects Create/Modify/Delete events                      │
│  • Runs in background thread (tokio)                        │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Events via Channel
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Debouncer (500ms)                         │
│                                                              │
│  • Batches rapid events for same file                       │
│  • Prevents excessive index updates                         │
│  • Bounded queue (max 1000 events)                          │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Debounced Events
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Handlers                           │
│                                                              │
│  • On Create: Parse file → Insert into index                │
│  • On Modify: Re-parse file → Update index                  │
│  • On Delete: Remove from index                             │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Index Updates
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite Database (jot_index)                    │
│                                                              │
│  Jots table stays in sync with file system                  │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ UI Events
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React)                          │
│                                                              │
│  • Listens to jot_created/updated/deleted events            │
│  • Refreshes jot list automatically                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow Diagram

```
External Edit (Obsidian) → File System Change
                                    ↓
                          notify detects (< 1s)
                                    ↓
                          Event sent to channel
                                    ↓
                         Debouncer batches (500ms)
                                    ↓
                          Parse jot file (50ms)
                                    ↓
                        Update SQLite index (20ms)
                                    ↓
                        Emit Tauri event to frontend
                                    ↓
                          UI refreshes (50ms)

Total latency: ~1.6 seconds (target: <2s) ✅
```

---

## Implementation Phases

### Phase 1: Dependencies & Setup (BE_GEEKS)

**Duration**: 0.5 days

**Deliverables**:
1. Add required crates
2. Create watcher module structure
3. Define types and errors

**Tasks**:

**T001**: Add dependencies to Cargo.toml
- `notify = "6.1"` (file system watcher)
- `notify-debouncer-mini = "0.4"` (debouncing)
- `tokio` already in project (async runtime)

**T002**: Create watcher module structure
- File: `src-tauri/src/watcher/mod.rs`
- Sub-modules: `events.rs`, `handlers.rs`, `state.rs`, `errors.rs`

**T003**: Define WatcherState struct
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
- Store in Tauri AppState

**T004**: Define WatcherError enum
- File: `src-tauri/src/watcher/errors.rs`
- Variants:
  ```rust
  pub enum WatcherError {
      NotifyError(notify::Error),
      IoError(std::io::Error),
      ParsingError(String),
      DatabaseError(rusqlite::Error),
      WatcherNotRunning,
  }
  ```

**T005**: Define WatcherStatus struct (for status command)
- File: `src-tauri/src/watcher/state.rs`
- Fields:
  ```rust
  #[derive(Serialize)]
  pub struct WatcherStatus {
      pub state: String, // "running" | "idle" | "stopped" | "error"
      pub events_processed: u64,
      pub last_event_time: Option<i64>,
      pub error_message: Option<String>,
  }
  ```

---

### Phase 2: File Watcher Core (BE_GEEKS)

**Duration**: 1.5 days

**Deliverables**:
1. File system monitoring
2. Debouncing logic
3. Event channel setup

**Tasks**:

**T006**: Implement start_watcher() function
- File: `src-tauri/src/watcher/events.rs`
- Function: `pub async fn start_watcher(vault_path: String, state: WatcherState, db: Arc<Mutex<Connection>>) -> Result<(), WatcherError>`
- Steps:
  1. Construct jots folder path: `{vault_path}/.scribel/jots/`
  2. Create debounced watcher:
     ```rust
     use notify_debouncer_mini::{new_debouncer, DebouncedEvent};
     let (tx, rx) = std::sync::mpsc::channel();
     let mut debouncer = new_debouncer(Duration::from_millis(500), None, tx)?;
     ```
  3. Watch jots folder:
     ```rust
     debouncer.watcher().watch(
         Path::new(&jots_path),
         RecursiveMode::NonRecursive
     )?;
     ```
  4. Spawn event processing loop in background

**T007**: Implement event processing loop
- Function: `async fn process_events(rx: Receiver<DebouncedEvent>, state: WatcherState, db: Arc<Mutex<Connection>>)`
- Loop:
  ```rust
  loop {
      match rx.recv() {
          Ok(events) => {
              for event in events {
                  match event.kind {
                      EventKind::Create(CreateKind::File) => handle_create(&event.path, &db).await,
                      EventKind::Modify(ModifyKind::Data(_)) => handle_modify(&event.path, &db).await,
                      EventKind::Remove(RemoveKind::File) => handle_delete(&event.path, &db).await,
                      _ => continue,
                  }
                  state.increment_events_processed();
                  state.update_last_event_time();
              }
          },
          Err(_) => {
              state.set_running(false);
              break;
          }
      }
  }
  ```

**T008**: Filter non-markdown files
- In event loop, add filter:
  ```rust
  if !path.extension().map_or(false, |ext| ext == "md") {
      continue; // Skip non-markdown files
  }
  if path.file_name().map_or(false, |name| name.to_str().unwrap().starts_with('.')) {
      continue; // Skip hidden files (.DS_Store, etc.)
  }
  ```

**T009**: Implement bounded event queue
- Limit: Max 1000 pending events
- If queue full:
  1. Log warning: "Event queue overflow, triggering full resync"
  2. Clear queue
  3. Call `resync_jots()`
- Implementation: Use `crossbeam_channel::bounded(1000)`

---

### Phase 3: Event Handlers (BE_GEEKS)

**Duration**: 1 day

**Deliverables**:
1. Create/Modify/Delete handlers
2. Index synchronization
3. Error handling

**Tasks**:

**T010**: Implement handle_create()
- File: `src-tauri/src/watcher/handlers.rs`
- Function: `async fn handle_create(path: &Path, db: &Connection) -> Result<(), WatcherError>`
- Steps:
  1. Parse jot file using Epic 1's `parse_jot_file()` (with retry on lock)
  2. Extract tags and wiki-links
  3. Insert into jot_index:
     ```sql
     INSERT INTO jot_index (id, file_path, content, tags, links, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ```
  4. Emit Tauri event: `app.emit("jot_created", jot)`
  5. Log: "Jot created: {path}"

**T011**: Add retry logic for file locking
- Wrap file read in retry loop:
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

**T012**: Implement handle_modify()
- Function: `async fn handle_modify(path: &Path, db: &Connection) -> Result<(), WatcherError>`
- Steps:
  1. Parse jot file (with retry)
  2. Extract tags and wiki-links
  3. Update index:
     ```sql
     UPDATE jot_index
     SET content = ?, tags = ?, links = ?, modified_at = ?
     WHERE file_path = ?
     ```
  4. Emit Tauri event: `app.emit("jot_updated", jot)`
  5. Log: "Jot updated: {path}"

**T013**: Implement handle_delete()
- Function: `async fn handle_delete(path: &Path, db: &Connection) -> Result<(), WatcherError>`
- Steps:
  1. Get jot ID from file path (query index)
  2. Delete from index:
     ```sql
     DELETE FROM jot_index WHERE file_path = ?
     ```
  3. Emit Tauri event: `app.emit("jot_deleted", { id })`
  4. Log: "Jot deleted: {path}"

**T014**: Add error handling for parsing failures
- On parsing error:
  1. Log error: "Failed to parse {path}: {error}"
  2. Don't crash watcher (continue to next event)
  3. Update watcher state error_message
  4. Emit error event to UI (optional notification)

**T015**: Add error handling for database failures
- On database error:
  1. Log error: "Database error for {path}: {error}"
  2. Retry once after 1 second
  3. If still fails, log and continue
  4. Don't crash watcher

---

### Phase 4: Tauri Commands & State Management (BE_GEEKS)

**Duration**: 0.5 days

**Deliverables**:
1. Four Tauri commands
2. Watcher lifecycle management
3. Status monitoring

**Tasks**:

**T016**: Implement start_jot_watcher command
- File: `src-tauri/src/commands/watcher.rs`
- Signature: `#[tauri::command] pub async fn start_jot_watcher(app: AppHandle, state: State<AppState>) -> Result<(), String>`
- Steps:
  1. Check if already running (idempotent)
  2. Get vault path from config
  3. Spawn watcher task:
     ```rust
     let watcher_state = state.watcher_state.clone();
     let db = state.db.clone();
     tokio::spawn(async move {
         start_watcher(vault_path, watcher_state, db).await
     });
     ```
  4. Return Ok(())

**T017**: Implement stop_jot_watcher command
- Signature: `#[tauri::command] pub async fn stop_jot_watcher(state: State<AppState>) -> Result<(), String>`
- Steps:
  1. Set watcher state running = false
  2. Drop watcher handle (stops event loop)
  3. Return Ok(())

**T018**: Implement get_watcher_status command
- Signature: `#[tauri::command] pub async fn get_watcher_status(state: State<AppState>) -> Result<WatcherStatus, String>`
- Return current watcher state:
  ```rust
  WatcherStatus {
      state: if running { "running" } else { "stopped" },
      events_processed: state.events_processed.load(),
      last_event_time: state.last_event_time.lock().clone(),
      error_message: state.error_message.lock().clone(),
  }
  ```

**T019**: Implement resync_jots command
- Signature: `#[tauri::command] pub async fn resync_jots(state: State<AppState>) -> Result<u32, String>`
- Steps:
  1. Get vault path from config
  2. Stop watcher
  3. Clear jot_index table
  4. Scan `.scribel/jots/` folder
  5. Parse all `.md` files
  6. Insert into index
  7. Restart watcher
  8. Return count of jots synced

**T020**: Initialize watcher on app startup
- File: `src-tauri/src/lib.rs`
- In Tauri setup hook:
  ```rust
  .setup(|app| {
      let app_handle = app.handle();
      tauri::async_runtime::spawn(async move {
          let _ = commands::watcher::start_jot_watcher(app_handle, state).await;
      });
      Ok(())
  })
  ```

**T021**: Stop watcher on app shutdown
- In Tauri cleanup:
  ```rust
  .on_window_event(|event| {
      if let WindowEvent::Destroyed = event.event() {
          let _ = commands::watcher::stop_jot_watcher(state);
      }
  })
  ```

**T022**: Register watcher commands
- File: `src-tauri/src/lib.rs`
- Add to invoke_handler:
  ```rust
  .invoke_handler(tauri::generate_handler![
      commands::watcher::start_jot_watcher,
      commands::watcher::stop_jot_watcher,
      commands::watcher::get_watcher_status,
      commands::watcher::resync_jots,
  ])
  ```

---

### Phase 5: Frontend Integration (FE_DUDES)

**Duration**: 1 day

**Deliverables**:
1. Event listeners
2. Jot list auto-refresh
3. Optional status indicator

**Tasks**:

**T023**: Create useWatcherEvents hook
- File: `src/hooks/useWatcherEvents.ts`
- Listen to Tauri events:
  ```typescript
  import { listen } from '@tauri-apps/api/event';

  export function useWatcherEvents() {
      useEffect(() => {
          const unlistenCreate = listen('jot_created', (event) => {
              // Refresh jot list
          });
          const unlistenUpdate = listen('jot_updated', (event) => {
              // Refresh jot list
          });
          const unlistenDelete = listen('jot_deleted', (event) => {
              // Refresh jot list
          });

          return () => {
              unlistenCreate.then(fn => fn());
              unlistenUpdate.then(fn => fn());
              unlistenDelete.then(fn => fn());
          };
      }, []);
  }
  ```

**T024**: Integrate useWatcherEvents in JotPanel
- File: `src/components/JotPanel.tsx`
- Add hook: `useWatcherEvents()`
- On events, call `useJots.refresh()`
- Jot list automatically updates

**T025**: Add watcher status to Settings panel (optional)
- File: `src/components/settings/VaultSettings.tsx`
- Add section: "File Watcher"
- Display status:
  ```typescript
  const status = await invoke('get_watcher_status');
  // Show: "Watcher: Running" or "Watcher: Stopped"
  // Show events processed count
  ```
- Add "Restart Watcher" button (calls `stop_jot_watcher` then `start_jot_watcher`)

---

## Testing Strategy

### Unit Tests (BE_GEEKS)

**T026**: Test event filtering
- File: `src-tauri/tests/watcher_events.rs`
- Tests:
  - `.md` files trigger events
  - Non-`.md` files ignored
  - Hidden files (`.DS_Store`) ignored
  - Subdirectories ignored (non-recursive)

**T027**: Test debouncing logic
- Create test with 10 rapid edits to same file
- Verify only 1 index update occurs
- Verify debounce delay is ~500ms

**T028**: Test event handlers
- Test handle_create: Insert into index
- Test handle_modify: Update index
- Test handle_delete: Remove from index
- Test error handling: Invalid frontmatter doesn't crash

### Integration Tests (BE_GEEKS)

**T029**: Test watcher lifecycle
- Start watcher
- Verify running state
- Stop watcher
- Verify stopped state
- Restart watcher

**T030**: Test external file operations
- Create test vault in temp directory
- Start watcher on test vault
- Create jot file externally
- Verify jot appears in index
- Modify jot file externally
- Verify index updated
- Delete jot file externally
- Verify jot removed from index

**T031**: Test bulk operations
- Create 100 jot files simultaneously
- Verify all indexed
- Modify 50 files simultaneously
- Verify all updated
- Delete 25 files simultaneously
- Verify all removed

### Performance Tests (BE_GEEKS)

**T032**: Measure event detection latency
- Create jot file
- Measure time until watcher detects (<1s)

**T033**: Measure index update latency
- Modify jot file
- Measure time until index updated (<100ms)

**T034**: Measure CPU usage
- Start watcher
- Let idle for 5 minutes
- Verify CPU <1%

**T035**: Measure memory usage
- Start watcher
- Process 1000 events
- Verify no memory leaks (<10MB growth)

### Manual Test Checklist

**T036**: Manual testing
- [ ] Watcher starts automatically on app launch
- [ ] Edit jot in Obsidian → changes appear in Scribel within 2 seconds
- [ ] Create new jot file externally → appears in Scribel
- [ ] Delete jot file externally → removed from Scribel
- [ ] Rapid edits (save 10 times quickly) → only one index update
- [ ] Watcher survives file system errors (unmount drive, permission change)
- [ ] Status command returns accurate state
- [ ] Resync rebuilds index from files
- [ ] Watcher stops cleanly on app close

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Event detection latency | <1s | File change to watcher notification |
| Index update latency | <100ms | Parse + SQLite update |
| UI refresh latency | <50ms | Event to UI update |
| CPU usage (idle) | <1% | Monitor background thread |
| Memory overhead | <10MB | Watcher thread + event queue |
| Bulk sync (100 files) | <15s | Total processing time |

---

## Risk Mitigation

### Risk 1: File Locking (Windows)

**Mitigation**: Retry logic (3 attempts, 1s delay) in T011

**Fallback**: Log error and skip file (don't crash watcher)

### Risk 2: Event Storm

**Mitigation**: Debouncing (500ms) + bounded queue (1000 events) in T009

**Fallback**: Trigger full resync if queue overflows

### Risk 3: Watcher Crash

**Mitigation**: Health monitoring (FR-5) exposes error state

**Fallback**: User can manually restart watcher via Settings

### Risk 4: Memory Leaks

**Mitigation**: Use mature `notify` crate + integration tests (T035)

**Monitoring**: Performance test verifies <10MB growth over 1000 events

---

## Integration Points

### With Epic 1.2 (Jot Storage)
- Uses `parse_jot_file()` from Epic 1.2
- Updates `jot_index` table from Epic 1.2
- Emits events that trigger Epic 1.3 UI refresh

### With Epic 2.1 (Vault Configuration)
- Gets vault path via `get_vault_path()`
- Constructs jots folder path: `{vault_path}/.scribel/jots/`
- **Dependency**: Epic 2.1 must complete before 2.2 can start

### With Epic 3 (Vault Indexing)
- Phase 2 will extend watcher to entire vault
- Will monitor all `*.md` files recursively
- Will track file mtimes for incremental re-embedding

---

## Team Coordination

### BE_GEEKS Tasks (Phases 1-4)
- **Duration**: 3-4 days
- **Blockers**: Epic 2.1 (vault configuration) must complete first
- **Note**: Pure backend feature, minimal frontend work

### FE_DUDES Tasks (Phase 5)
- **Duration**: 1 day
- **Blockers**: Can start after BE_GEEKS completes T022 (commands registered)
- **Minimal Work**: Just listen to events and refresh jot list

### Sync Points
- **After Epic 2.1 Complete**: BE_GEEKS starts Phase 1
- **Day 3**: BE_GEEKS completes Phase 4, FE_DUDES starts Phase 5
- **Day 4**: Integration testing (both teams)

---

## Deployment Notes

### Startup Behavior
- Watcher starts automatically on app launch (T020)
- If vault path not configured, watcher doesn't start (waits for Epic 2.1)
- If watcher crashes, error shown in Settings (not obtrusive)

### Graceful Shutdown
- Watcher stops cleanly on app close (T021)
- Pending events are discarded (debouncer clears queue)
- No data loss (index reflects last completed update)

---

## Success Criteria

- [ ] 95% of external edits reflected in UI within 2 seconds
- [ ] Index matches file system 100% of the time (no drift)
- [ ] Zero manual refresh needed after external edits
- [ ] CPU usage <1% when idle
- [ ] No memory leaks over 1000+ events
- [ ] Handles 100 simultaneous file changes without crashing
- [ ] All performance targets met

---

## Next Steps

1. ✅ Specification approved (THE_PO + MASTER_TL)
2. ✅ Plan complete (this document)
3. ⏭️ Generate tasks with `/speckit.tasks`
4. ⏭️ Create team handoff notes
5. ⏭️ Wait for Epic 2.1 to complete
6. ⏭️ BE_GEEKS starts Phase 1 (dependencies & setup)

---

**Plan Completed**: 2026-01-19
**Planned By**: MASTER_TL
**Ready for**: Task Generation (pending Epic 2.1 completion)
