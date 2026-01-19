# Tasks: File Watcher - Jots Folder

**Feature**: epic-2-feat-002-file-watcher-jots
**Epic**: 2 - Vault Integration
**Branch**: `epic-2-feat-002`
**Created**: 2026-01-19
**Status**: Ready for Implementation (Blocked by Epic 2.1)

---

## Task Format

`[ID] [Team] [Phase] Description`

- **[Team]**: BE = BE_GEEKS, FE = FE_DUDES
- **[Phase]**: Which implementation phase (1-5)
- **[P]**: Can run in parallel with other tasks

---

## Phase 1: Dependencies & Setup (BE_GEEKS)

**Duration**: 0.5 days
**Dependencies**: Epic 2.1 (Vault Configuration) must be complete

- [ ] T001 [BE] [P1] Add dependencies to Cargo.toml: `notify = "6.1"`, `notify-debouncer-mini = "0.4"`
- [ ] T002 [BE] [P1] Create watcher module structure in `src-tauri/src/watcher/mod.rs`
- [ ] T003 [BE] [P1] Define WatcherState struct in `src-tauri/src/watcher/state.rs`
- [ ] T004 [BE] [P1] Define WatcherError enum in `src-tauri/src/watcher/errors.rs`
- [ ] T005 [BE] [P1] Define WatcherStatus struct in `src-tauri/src/watcher/state.rs`

**Checkpoint**: Module structure ready, types defined

---

## Phase 2: File Watcher Core (BE_GEEKS)

**Duration**: 1.5 days
**Dependencies**: Phase 1 complete

- [ ] T006 [BE] [P2] Implement `start_watcher()` in `src-tauri/src/watcher/events.rs` - setup debounced watcher
- [ ] T007 [BE] [P2] Implement event processing loop - handle Create/Modify/Delete events
- [ ] T008 [BE] [P2] Add file filtering - only process `.md` files, skip hidden files
- [ ] T009 [BE] [P2] Implement bounded event queue (max 1000) with overflow handling

**Checkpoint**: Watcher detects file changes, processes events

---

## Phase 3: Event Handlers (BE_GEEKS)

**Duration**: 1 day
**Dependencies**: Phase 2 complete

- [ ] T010 [BE] [P3] Implement `handle_create()` in `src-tauri/src/watcher/handlers.rs` - parse, insert to index, emit event
- [ ] T011 [BE] [P3] Add retry logic for file locking (3 attempts, 1s delay)
- [ ] T012 [BE] [P3] Implement `handle_modify()` - re-parse, update index, emit event
- [ ] T013 [BE] [P3] Implement `handle_delete()` - remove from index, emit event
- [ ] T014 [BE] [P3] Add error handling for parsing failures - log and continue
- [ ] T015 [BE] [P3] Add error handling for database failures - retry once, then log and continue

**Checkpoint**: All event types handled correctly, errors don't crash watcher

---

## Phase 4: Tauri Commands & State Management (BE_GEEKS)

**Duration**: 0.5 days
**Dependencies**: Phase 3 complete

- [ ] T016 [BE] [P4] Implement `start_jot_watcher` Tauri command in `src-tauri/src/commands/watcher.rs`
- [ ] T017 [BE] [P4] Implement `stop_jot_watcher` Tauri command
- [ ] T018 [BE] [P4] Implement `get_watcher_status` Tauri command
- [ ] T019 [BE] [P4] Implement `resync_jots` Tauri command - full index rebuild
- [ ] T020 [BE] [P4] Initialize watcher on app startup in `src-tauri/src/lib.rs` setup hook
- [ ] T021 [BE] [P4] Stop watcher on app shutdown in cleanup hook
- [ ] T022 [BE] [P4] Register watcher commands in invoke_handler

**Checkpoint**: Watcher lifecycle managed, commands exposed

---

## Phase 5: Frontend Integration (FE_DUDES)

**Duration**: 1 day
**Dependencies**: Phase 4 complete

- [ ] T023 [FE] [P5] Create `useWatcherEvents` hook in `src/hooks/useWatcherEvents.ts` - listen to Tauri events
- [ ] T024 [FE] [P5] Integrate `useWatcherEvents` in JotPanel - auto-refresh on events
- [ ] T025 [FE] [P5] Add watcher status to Settings panel (optional) - display state, events count

**Checkpoint**: Frontend listens to events, jot list auto-refreshes

---

## Testing Tasks

### Unit Tests (BE_GEEKS)

- [ ] T026 [BE] [Test] Test event filtering in `src-tauri/tests/watcher_events.rs`
  - `.md` files trigger events
  - Non-`.md` files ignored
  - Hidden files (`.DS_Store`) ignored
  - Subdirectories ignored (non-recursive)

- [ ] T027 [BE] [Test] Test debouncing logic
  - 10 rapid edits to same file → only 1 index update
  - Debounce delay is ~500ms

- [ ] T028 [BE] [Test] Test event handlers
  - `handle_create`: Insert into index
  - `handle_modify`: Update index
  - `handle_delete`: Remove from index
  - Error handling: Invalid frontmatter doesn't crash

### Integration Tests (BE_GEEKS)

- [ ] T029 [BE] [Test] Test watcher lifecycle
  - Start watcher → verify running state
  - Stop watcher → verify stopped state
  - Restart watcher

- [ ] T030 [BE] [Test] Test external file operations
  - Create test vault in temp directory
  - Start watcher on test vault
  - Create jot file externally → verify jot appears in index
  - Modify jot file externally → verify index updated
  - Delete jot file externally → verify jot removed from index

- [ ] T031 [BE] [Test] Test bulk operations
  - Create 100 jot files simultaneously → verify all indexed
  - Modify 50 files simultaneously → verify all updated
  - Delete 25 files simultaneously → verify all removed

### Performance Tests (BE_GEEKS)

- [ ] T032 [BE] [Test] Measure event detection latency - file change to detection (<1s)
- [ ] T033 [BE] [Test] Measure index update latency - parse + SQLite update (<100ms)
- [ ] T034 [BE] [Test] Measure CPU usage - idle for 5 minutes, verify <1%
- [ ] T035 [BE] [Test] Measure memory usage - process 1000 events, verify <10MB growth

### Manual Testing

- [ ] T036 [BE+FE] [Test] Manual test checklist
  - Watcher starts automatically on app launch
  - Edit jot in Obsidian → changes appear in Scribel within 2 seconds
  - Create new jot file externally → appears in Scribel
  - Delete jot file externally → removed from Scribel
  - Rapid edits (save 10 times quickly) → only one index update
  - Watcher survives file system errors (unmount drive, permission change)
  - Status command returns accurate state
  - Resync rebuilds index from files
  - Watcher stops cleanly on app close

---

## Task Dependencies

### Sequential Dependencies

```
Phase 1 (Setup)
   ↓
Phase 2 (Watcher Core)
   ↓
Phase 3 (Event Handlers)
   ↓
Phase 4 (Commands)
   ↓
Phase 5 (Frontend Integration)
```

### Parallel Opportunities

**Phase 1**: All tasks (T001-T005) can run in parallel

**Phase 2**: Tasks T006-T009 depend on each other sequentially

**Phase 3**: Tasks T010-T015 can partially overlap:
- T010 (create) and T012 (modify) can be done in parallel
- T011 (retry logic) must complete before others
- T013 (delete) can be done in parallel with T010/T012
- T014-T015 (error handling) after handlers complete

**Phase 4**: All tasks (T016-T022) can run in parallel after Phase 3

**Phase 5**: Tasks T023-T025 sequential

### Critical Path

```
Epic 2.1 Complete
   ↓
P1 (Setup)
   ↓
P2 (Watcher Core)
   ↓
P3 (Event Handlers)
   ↓
P4 (Commands)
   ↓
P5 (Frontend)
```

**Total Duration**: 4-5 days (after Epic 2.1)

---

## Team Assignments

### BE_GEEKS (Backend)
- **Tasks**: T001-T022, T026-T035
- **Duration**: 3-4 days
- **Files**: `src-tauri/src/watcher/`, `src-tauri/src/commands/watcher.rs`
- **Note**: Pure backend feature, majority of work

### FE_DUDES (Frontend)
- **Tasks**: T023-T025
- **Duration**: 1 day
- **Files**: `src/hooks/useWatcherEvents.ts`, minor Settings panel update
- **Note**: Minimal frontend work (just listen to events)

### Both Teams
- **Tasks**: T036 (manual testing)
- **Duration**: 0.5 days
- **Coordination**: Required for end-to-end testing

---

## Performance Targets

| Metric | Target | Task |
|--------|--------|------|
| Event detection latency | <1s | T032 |
| Index update latency | <100ms | T033 |
| CPU usage (idle) | <1% | T034 |
| Memory overhead | <10MB | T035 |
| Bulk sync (100 files) | <15s | T031 |

---

## Risk Mitigation

| Risk | Mitigation Task | Fallback |
|------|----------------|----------|
| File locking (Windows) | T011 (retry logic) | Log error and skip |
| Event storm | T009 (bounded queue) | Trigger full resync |
| Watcher crash | T017-T018 (lifecycle management) | Manual restart via Settings |
| Memory leaks | T035 (performance test) | Use mature `notify` crate |

---

## Integration Points

### With Epic 1.2 (Jot Storage)
- Uses `parse_jot_file()` (T010, T012)
- Updates `jot_index` table (T010, T012, T013)

### With Epic 2.1 (Vault Configuration)
- Gets vault path via `get_vault_path()` (T006)
- **Blocker**: Epic 2.1 must complete before this feature can start

### With Epic 3 (Vault Indexing)
- Phase 2 will extend watcher to entire vault
- Will monitor all `*.md` files recursively

---

## Success Criteria

All tasks complete when:
- [ ] All unit tests passing (95%+ coverage)
- [ ] All integration tests passing
- [ ] All performance tests passing (meet targets)
- [ ] Manual test checklist 100% complete
- [ ] No blocking bugs or regressions
- [ ] External edits appear in Scribel within 2 seconds

---

## Notes

- **BLOCKED**: Cannot start until Epic 2.1 (Vault Configuration) is complete
- Backend team does 80% of the work
- Frontend integration is minimal (just event listeners)
- Testing is critical - must verify watcher is reliable
- Performance tests must be automated (don't rely on manual testing)

---

**Tasks Generated**: 2026-01-19
**Generated By**: MASTER_TL
**Ready for**: Implementation (after Epic 2.1)
