# Tasks: Vault Configuration

**Feature**: epic-2-feat-001-vault-config
**Epic**: 2 - Vault Integration
**Branch**: `epic-2-feat-001`
**Created**: 2026-01-19
**Status**: Ready for Implementation

---

## Task Format

`[ID] [Team] [Phase] Description`

- **[Team]**: BE = BE_GEEKS, FE = FE_DUDES
- **[Phase]**: Which implementation phase (1-5)
- **[P]**: Can run in parallel with other tasks

---

## Phase 1: Backend Foundation (BE_GEEKS)

**Duration**: 1 day
**Dependencies**: None

- [ ] T001 [BE] [P1] Create config module structure (`src-tauri/src/config/mod.rs`)
- [ ] T002 [BE] [P1] Create config table schema migration in `src-tauri/src/db/migrations.rs`
- [ ] T003 [BE] [P1] Implement `get_vault_path()` in `src-tauri/src/config/storage.rs`
- [ ] T004 [BE] [P1] Implement `set_vault_path()` with canonicalization in `src-tauri/src/config/storage.rs`
- [ ] T005 [BE] [P1] Define ConfigError enum in `src-tauri/src/config/errors.rs`

**Checkpoint**: Config storage functional, can set and get vault path

---

## Phase 2: Vault Detection (BE_GEEKS)

**Duration**: 1 day
**Dependencies**: Phase 1 complete

- [ ] T006 [BE] [P2] Create detection module `src-tauri/src/config/detection.rs`, add `walkdir` to Cargo.toml
- [ ] T007 [BE] [P2] Implement `get_search_paths()` with platform-specific paths (macOS/Windows/Linux)
- [ ] T008 [BE] [P2] Implement `detect_vaults()` - walk directories, find `.obsidian/` folders
- [ ] T009 [BE] [P2] Implement `validate_vault_path()` - check exists, is_dir, contains `.obsidian/`, readable
- [ ] T010 [BE] [P2] Implement `ensure_jots_folder()` - create `.scribel/jots/` if missing
- [ ] T011 [BE] [P2] Define VaultInfo struct in `src-tauri/src/config/models.rs`

**Checkpoint**: Auto-detection works, validation works

---

## Phase 3: Tauri Commands (BE_GEEKS)

**Duration**: 0.5 days
**Dependencies**: Phase 2 complete

- [ ] T012 [BE] [P3] Implement `get_vault_path` Tauri command in `src-tauri/src/commands/vault.rs`
- [ ] T013 [BE] [P3] Implement `set_vault_path` Tauri command with validation
- [ ] T014 [BE] [P3] Implement `detect_vaults` Tauri command with 5s timeout
- [ ] T015 [BE] [P3] Implement `validate_vault_path` Tauri command
- [ ] T016 [BE] [P3] Implement `ensure_jots_folder` Tauri command
- [ ] T017 [BE] [P3] Implement `open_vault_in_finder` Tauri command using `tauri::api::shell::open()`
- [ ] T018 [BE] [P3] Register all 6 commands in `src-tauri/src/lib.rs`

**Checkpoint**: All backend commands exposed to frontend

---

## Phase 4: Frontend Onboarding (FE_DUDES)

**Duration**: 1.5 days
**Dependencies**: Can start with mocked commands, integrate real commands after Phase 3

- [ ] T019 [FE] [P4] Create OnboardingScreen component in `src/components/OnboardingScreen.tsx`
- [ ] T020 [FE] [P4] Implement auto-detection UI - call `detect_vaults()`, show loading, display list
- [ ] T021 [FE] [P4] Implement manual browse button - use Tauri file dialog API
- [ ] T022 [FE] [P4] Implement `handleVaultSelect()` - validate, set path, ensure folder, navigate
- [ ] T023 [FE] [P4] Add validation error handling with clear error messages
- [ ] T024 [FE] [P4] Style onboarding screen - full-screen overlay, centered card, dark mode

**Checkpoint**: First-run onboarding complete, user can select vault

---

## Phase 5: Frontend Settings Panel (FE_DUDES)

**Duration**: 1 day
**Dependencies**: Phase 3 complete (needs real backend commands)

- [ ] T025 [FE] [P5] Create VaultSettings component in `src/components/settings/VaultSettings.tsx`
- [ ] T026 [FE] [P5] Implement current vault display - show name, path, status indicator
- [ ] T027 [FE] [P5] Implement change vault flow - file dialog, validate, confirm, reload app
- [ ] T028 [FE] [P5] Implement rebuild index button - call `rebuild_jot_index()`, show progress
- [ ] T029 [FE] [P5] Implement open folder button - call `open_vault_in_finder()`
- [ ] T030 [FE] [P5] Add settings panel route in `src/App.tsx`

**Checkpoint**: Settings panel complete, user can manage vault

---

## Testing Tasks

### Unit Tests (BE_GEEKS)

- [ ] T031 [BE] [Test] Test config storage in `src-tauri/tests/config_storage.rs`
  - Set and get vault path
  - Get when no path set (returns None)
  - Set invalid path (returns error)
  - Set path with Unicode characters

- [ ] T032 [BE] [Test] Test vault detection in `src-tauri/tests/vault_detection.rs`
  - Detect vaults in test fixtures
  - Validate valid vault path
  - Reject invalid path (no .obsidian)
  - Reject non-existent path
  - Handle permission errors gracefully

### Integration Tests (Both Teams)

- [ ] T033 [BE+FE] [Test] End-to-end onboarding test
  - Create test vault in temp directory
  - Launch app (fresh state, no config)
  - Verify onboarding appears
  - Select test vault
  - Verify navigation to main app
  - Verify config saved

- [ ] T034 [BE+FE] [Test] Test vault switching
  - Configure vault A
  - Create jots in vault A
  - Switch to vault B via settings
  - Verify app reloads
  - Verify jots from vault B appear
  - Switch back to vault A
  - Verify jots from vault A reappear

### Manual Testing

- [ ] T035 [BE+FE] [Test] Manual test checklist
  - First-run onboarding appears
  - Auto-detection finds real Obsidian vaults
  - Can select detected vault with one click
  - Can browse for vault manually
  - Invalid paths show clear error messages
  - Vault path persists after app restart
  - Settings panel shows correct vault info
  - Change vault triggers confirmation
  - Change vault reloads app
  - Open folder button works (macOS/Windows/Linux)
  - Dark mode styles work correctly

---

## Performance Verification

- [ ] T036 [BE] [Test] Verify performance targets
  - Auto-detection completes in <3s
  - Path validation completes in <500ms
  - Path retrieval on startup <50ms
  - Settings panel loads in <100ms

---

## Task Dependencies

### Parallel Opportunities

**Phase 1**: All tasks (T001-T005) can run in parallel

**Phase 2**: All tasks (T006-T011) can run in parallel after Phase 1

**Phase 3**: All tasks (T012-T018) can run in parallel after Phase 2

**Phase 4 and Phase 3**: Can overlap!
- FE_DUDES can start Phase 4 with mocked commands
- Integrate real commands once Phase 3 complete

**Phase 5**: Requires Phase 3 complete

### Critical Path

```
P1 (BE) → P2 (BE) → P3 (BE)
                      ↓
               P4 (FE) ← Can start early with mocks
                      ↓
               P5 (FE)
```

**Total Duration**: 4-5 days (with parallel work)

---

## Team Assignments

### BE_GEEKS (Backend)
- **Tasks**: T001-T018, T031-T032, T036
- **Duration**: 2-3 days
- **Files**: `src-tauri/src/config/`, `src-tauri/src/commands/vault.rs`

### FE_DUDES (Frontend)
- **Tasks**: T019-T030
- **Duration**: 2-3 days
- **Files**: `src/components/OnboardingScreen.tsx`, `src/components/settings/VaultSettings.tsx`

### Both Teams
- **Tasks**: T033-T035 (integration and manual testing)
- **Duration**: 0.5 days
- **Coordination**: Required for end-to-end testing

---

## Success Criteria

All tasks complete when:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual test checklist 100% complete
- [ ] All performance targets met
- [ ] No blocking bugs or regressions

---

## Notes

- Backend team can start immediately (no blockers)
- Frontend team can start with mocked commands, then integrate real ones
- Testing should happen incrementally (don't wait until end)
- Each phase has a clear checkpoint for validation

---

**Tasks Generated**: 2026-01-19
**Generated By**: MASTER_TL
**Ready for**: Team Assignment and Implementation
