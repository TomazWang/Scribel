# Implementation Plan: Vault Configuration

**Feature**: epic-2-feat-001-vault-config
**Epic**: 2 - Vault Integration
**Created**: 2026-01-19
**Status**: Ready for Implementation
**Priority**: P0 (MVP Blocker)

---

## Executive Summary

**Goal**: Replace hardcoded vault path with user-configurable vault selection

**Teams**: BE_GEEKS (backend) + FE_DUDES (frontend)

**Estimated Effort**:
- BE_GEEKS: 2-3 days
- FE_DUDES: 2-3 days
- Can work in parallel after Phase 1

**Dependencies**:
- Epic 1.1 complete (project scaffold) ✅
- No blocking dependencies

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  • OnboardingScreen (first-run)                             │
│  • Settings Panel (vault management)                        │
│  • File Picker Integration (Tauri dialog)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Tauri Commands
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Rust/Tauri)                     │
├─────────────────────────────────────────────────────────────┤
│  • Config Module (vault path storage)                       │
│  • Detection Module (auto-find vaults)                      │
│  • Validation Module (check vault validity)                 │
│  • Commands Module (Tauri API)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite Database (config table)                 │
│                                                              │
│  Key: 'vault_path'  →  Value: '/path/to/vault'             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**First-Run Setup**:
```
1. App starts → No vault path in config
2. Show OnboardingScreen
3. Run auto-detection → Find vaults in common paths
4. User selects vault (or browses manually)
5. Validate path (check .obsidian/ exists)
6. Save to config table
7. Create .scribel/jots/ if missing
8. Navigate to main app
```

**Subsequent Launches**:
```
1. App starts → Load vault_path from config
2. If path still valid → Continue to main app
3. If path invalid → Show onboarding again
```

**Changing Vault**:
```
1. User opens Settings → Change Vault button
2. File picker opens
3. User selects new path
4. Validate path
5. Confirmation: "Switch to [new path]? App will reload."
6. Save new path to config
7. Reload app
```

---

## Implementation Phases

### Phase 1: Backend Foundation (BE_GEEKS)

**Duration**: 1 day

**Deliverables**:
1. Config storage module
2. Database schema
3. Vault path getter/setter

**Tasks**:

**T001**: Create config module structure
- File: `src-tauri/src/config/mod.rs`
- Export: `pub mod storage`, `pub mod errors`

**T002**: Create config table schema migration
- File: `src-tauri/src/db/migrations.rs`
- SQL:
  ```sql
  CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  ```

**T003**: Implement get_vault_path()
- File: `src-tauri/src/config/storage.rs`
- Function: `pub fn get_vault_path(db: &Connection) -> Result<Option<String>, ConfigError>`
- Query: `SELECT value FROM config WHERE key = 'vault_path'`
- Return None if key doesn't exist

**T004**: Implement set_vault_path()
- File: `src-tauri/src/config/storage.rs`
- Function: `pub fn set_vault_path(db: &Connection, path: &str) -> Result<(), ConfigError>`
- SQL: `INSERT OR REPLACE INTO config (key, value) VALUES ('vault_path', ?)`
- Validate path is absolute before saving

**T005**: Define ConfigError enum
- File: `src-tauri/src/config/errors.rs`
- Variants: `DatabaseError`, `InvalidPath`, `NotFound`
- Implement `From<rusqlite::Error>` for database errors

---

### Phase 2: Vault Detection (BE_GEEKS)

**Duration**: 1 day

**Deliverables**:
1. Auto-detection logic
2. Platform-specific path lists
3. Vault validation

**Tasks**:

**T006**: Create detection module
- File: `src-tauri/src/config/detection.rs`
- Dependencies: Add `walkdir = "2.4"` to Cargo.toml

**T007**: Implement get_search_paths()
- Function: `fn get_search_paths() -> Vec<PathBuf>`
- Platform-specific paths:
  - macOS: `~/Documents`, `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`, `~/Obsidian`
  - Windows: `%USERPROFILE%\Documents`, `%USERPROFILE%\OneDrive\Documents`, `%APPDATA%\Obsidian`
  - Linux: `~/Documents`, `~/Obsidian`
- Use `#[cfg(target_os = "...")]` for platform detection

**T008**: Implement detect_vaults()
- Function: `pub fn detect_vaults() -> Result<Vec<VaultInfo>, ConfigError>`
- Algorithm:
  1. Get search paths
  2. For each path, walk directory (max depth 2)
  3. Check if directory contains `.obsidian/` subfolder
  4. Extract vault name (parent directory name)
  5. Get last modified time
  6. Return sorted by last_modified DESC

**T009**: Implement validate_vault_path()
- Function: `pub fn validate_vault_path(path: &Path) -> Result<bool, ConfigError>`
- Checks:
  1. Path exists: `path.exists()`
  2. Is directory: `path.is_dir()`
  3. Contains `.obsidian/`: `path.join(".obsidian").exists()`
  4. Readable: `fs::metadata(path)` succeeds
  5. Can create `.scribel/jots/` (check parent write permissions)
- Return Ok(true) if all checks pass

**T010**: Implement ensure_jots_folder()
- Function: `pub fn ensure_jots_folder(vault_path: &Path) -> Result<(), ConfigError>`
- Create `.scribel/jots/` if it doesn't exist
- Use `fs::create_dir_all()`
- Return error if permission denied

**T011**: Define VaultInfo struct
- File: `src-tauri/src/config/models.rs`
- Fields: `name: String`, `path: String`, `last_modified: i64`
- Derive: `Serialize`, `Deserialize`, `Debug`

---

### Phase 3: Tauri Commands (BE_GEEKS)

**Duration**: 0.5 days

**Deliverables**:
1. Six Tauri commands
2. Command registration
3. Error handling

**Tasks**:

**T012**: Implement get_vault_path command
- File: `src-tauri/src/commands/vault.rs`
- Signature: `#[tauri::command] pub async fn get_vault_path(state: State<AppState>) -> Result<Option<String>, String>`
- Call `config::storage::get_vault_path(&state.db)`
- Convert errors to String

**T013**: Implement set_vault_path command
- Signature: `#[tauri::command] pub async fn set_vault_path(path: String, state: State<AppState>) -> Result<(), String>`
- Validate path first
- Call `config::storage::set_vault_path(&state.db, &path)`
- Call `config::detection::ensure_jots_folder(&PathBuf::from(&path))`

**T014**: Implement detect_vaults command
- Signature: `#[tauri::command] pub async fn detect_vaults() -> Result<Vec<VaultInfo>, String>`
- Call `config::detection::detect_vaults()`
- Timeout after 5 seconds (graceful failure)

**T015**: Implement validate_vault_path command
- Signature: `#[tauri::command] pub async fn validate_vault_path(path: String) -> Result<bool, String>`
- Call `config::detection::validate_vault_path(&PathBuf::from(path))`

**T016**: Implement ensure_jots_folder command
- Signature: `#[tauri::command] pub async fn ensure_jots_folder(state: State<AppState>) -> Result<(), String>`
- Get vault path from config
- Call `config::detection::ensure_jots_folder()`

**T017**: Implement open_vault_in_finder command
- Signature: `#[tauri::command] pub async fn open_vault_in_finder(state: State<AppState>) -> Result<(), String>`
- Get vault path from config
- Use `tauri::api::shell::open()` to open in file manager

**T018**: Register commands in main.rs
- File: `src-tauri/src/lib.rs`
- Add all 6 commands to `tauri::Builder` invoke_handler

---

### Phase 4: Frontend Onboarding (FE_DUDES)

**Duration**: 1.5 days

**Deliverables**:
1. Onboarding screen UI
2. Vault selection flow
3. File picker integration

**Tasks**:

**T019**: Create OnboardingScreen component
- File: `src/components/OnboardingScreen.tsx`
- Props: None (full-screen modal)
- State: `detectedVaults: VaultInfo[]`, `loading: boolean`, `error: string | null`

**T020**: Implement auto-detection UI
- On mount: Call `invoke('detect_vaults')`
- Show loading spinner during detection
- Display detected vaults in list:
  - Vault icon + name (bold)
  - Full path (muted, truncated)
  - "Most Recent" badge on first item
- Each vault is clickable

**T021**: Implement manual browse button
- Button: "Browse for Vault..."
- Click handler: Open Tauri file dialog
  ```typescript
  import { open } from '@tauri-apps/api/dialog';

  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Your Obsidian Vault'
  });
  ```
- Call `validate_vault_path(selected)` before accepting

**T022**: Implement vault selection handler
- Function: `handleVaultSelect(path: string)`
- Steps:
  1. Call `validate_vault_path(path)`
  2. If invalid, show error toast
  3. If valid, call `set_vault_path(path)`
  4. Call `ensure_jots_folder()`
  5. Navigate to main app (`navigate('/')`)

**T023**: Add validation error handling
- Display validation errors clearly:
  - "Path does not exist"
  - "Not a valid Obsidian vault (missing .obsidian folder)"
  - "Permission denied"
- Allow user to try again (don't auto-close on error)

**T024**: Style onboarding screen
- Full-screen overlay (80% opacity background)
- Centered card (max-width 600px)
- Heading: "Welcome to Scribel"
- Subheading: "Select your Obsidian vault to get started"
- Button styles: Primary (vault list), Secondary (browse)
- Dark mode support

---

### Phase 5: Frontend Settings Panel (FE_DUDES)

**Duration**: 1 day

**Deliverables**:
1. Vault section in settings
2. Vault change flow
3. Status indicators

**Tasks**:

**T025**: Create VaultSettings component
- File: `src/components/settings/VaultSettings.tsx`
- Display current vault path
- Status indicator: Connected (green) / Not Found (red)
- Buttons: Change Vault, Reload Index, Open in Finder

**T026**: Implement current vault display
- On mount: Call `get_vault_path()`
- Display vault name (extract from path)
- Display full path (clickable to copy)
- Status indicator checks if path still valid:
  ```typescript
  const isValid = await invoke('validate_vault_path', { path: vaultPath });
  setStatus(isValid ? 'connected' : 'not-found');
  ```

**T027**: Implement change vault flow
- Button: "Change Vault"
- Click handler:
  1. Open file dialog (same as onboarding)
  2. Validate selected path
  3. Show confirmation dialog:
     "Switch to [new path]? This will reload the app and clear current jots from view."
  4. On confirm: Call `set_vault_path(newPath)`
  5. Reload app: `window.location.reload()`

**T028**: Implement reload index button
- Button: "Rebuild Index"
- Click handler:
  1. Show confirmation: "This will re-scan all jot files. Continue?"
  2. Call `rebuild_jot_index()` (Epic 1 command)
  3. Show progress toast: "Rebuilding index..."
  4. On complete: "Index rebuilt successfully"

**T029**: Implement open in finder/explorer button
- Button: "Open Vault Folder"
- Click handler: Call `invoke('open_vault_in_finder')`
- Opens vault directory in system file manager

**T030**: Add settings panel route
- File: `src/App.tsx`
- Route: `/settings`
- Link in main nav: Settings icon/button
- VaultSettings as subsection

---

## Testing Strategy

### Unit Tests (BE_GEEKS)

**T031**: Test config storage
- File: `src-tauri/tests/config_storage.rs`
- Tests:
  - Set and get vault path
  - Get when no path set (returns None)
  - Set invalid path (returns error)
  - Set path with Unicode characters

**T032**: Test vault detection
- File: `src-tauri/tests/vault_detection.rs`
- Tests:
  - Detect vaults in test fixtures
  - Validate valid vault path
  - Reject invalid path (no .obsidian)
  - Reject non-existent path
  - Handle permission errors gracefully

### Integration Tests (Both Teams)

**T033**: End-to-end onboarding test
- Create test vault in temp directory
- Launch app (fresh state, no config)
- Verify onboarding appears
- Select test vault
- Verify navigation to main app
- Verify config saved

**T034**: Test vault switching
- Configure vault A
- Create jots in vault A
- Switch to vault B via settings
- Verify app reloads
- Verify jots from vault B appear
- Switch back to vault A
- Verify jots from vault A reappear

### Manual Test Checklist

**T035**: Manual testing
- [ ] First-run onboarding appears
- [ ] Auto-detection finds real Obsidian vaults
- [ ] Can select detected vault with one click
- [ ] Can browse for vault manually
- [ ] Invalid paths show clear error messages
- [ ] Vault path persists after app restart
- [ ] Settings panel shows correct vault info
- [ ] Change vault triggers confirmation
- [ ] Change vault reloads app
- [ ] Open folder button works (macOS/Windows/Linux)
- [ ] Dark mode styles work correctly

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-detection time | <3s | Time from onboarding mount to list display |
| Path validation | <500ms | Time to validate and return result |
| Path retrieval on startup | <50ms | Time from app launch to config loaded |
| Settings panel load | <100ms | Time to display current vault info |

---

## Risk Mitigation

### Risk 1: Permission Errors

**Mitigation**: Validation step (T009) checks write permissions before allowing selection

**Fallback**: Clear error message guides user to select writable location

### Risk 2: Symlinks

**Mitigation**: Add `fs::canonicalize()` in T004 to resolve symlinks before saving

**Status**: Added to implementation plan

### Risk 3: Network Drives

**Mitigation**: Accept limitation for MVP (THE_PO approval)

**Future**: v1.1 can add warning for non-local paths

---

## Integration Points

### With Epic 1
- Uses existing SQLite database connection
- Uses existing jot storage module (expects `.scribel/jots/`)

### With Epic 2.2 (File Watcher)
- Provides vault path via `get_vault_path()`
- File watcher will use this to construct full path to jots folder

### With Epic 3 (Vault Indexing)
- Provides vault path for markdown file discovery
- Future: Will use vault path to watch entire vault

---

## Team Coordination

### BE_GEEKS Tasks (Phases 1-3)
- **Duration**: 2-3 days
- **Blockers**: None
- **Handoff to FE**: After T018 (commands registered)
- **Note**: Can mock commands using Tauri DevTools for early testing

### FE_DUDES Tasks (Phases 4-5)
- **Duration**: 2-3 days
- **Blockers**: Can start T019-T024 (onboarding) with mocked commands
- **Requires BE complete**: T025-T030 (settings) needs real commands
- **Handoff to BE**: When encountering edge cases not handled

### Sync Points
- **Day 1 End**: BE_GEEKS completes Phase 1, FE_DUDES starts mocking
- **Day 2 End**: BE_GEEKS completes Phase 3, FE_DUDES integrates real commands
- **Day 3**: Integration testing (both teams)

---

## Deployment Notes

### Database Migration
- Add migration in `src-tauri/src/db/migrations.rs`
- Run on app startup (before any config access)
- Migration is idempotent (CREATE TABLE IF NOT EXISTS)

### First-Run Detection
- Check if vault_path exists in config
- If not exists → Show onboarding
- If exists but invalid → Show onboarding with error message

### Backward Compatibility
- Epic 1 had hardcoded vault path
- No migration needed (Epic 1 not shipped to users)
- Fresh installs only

---

## Success Criteria

- [ ] 95% of users complete vault selection within 60 seconds
- [ ] Auto-detection finds vaults for 95% of Obsidian users
- [ ] Vault path persists across app restarts
- [ ] Users can change vaults without data loss
- [ ] Feature works identically on macOS, Windows, Linux
- [ ] All performance targets met (<3s detection, <500ms validation, <50ms retrieval)

---

## Next Steps

1. ✅ Specification approved (THE_PO + MASTER_TL)
2. ✅ Plan complete (this document)
3. ⏭️ Generate tasks with `/speckit.tasks`
4. ⏭️ Create team handoff notes
5. ⏭️ BE_GEEKS starts Phase 1 (config storage)
6. ⏭️ FE_DUDES starts Phase 4 (onboarding with mocks)

---

**Plan Completed**: 2026-01-19
**Planned By**: MASTER_TL
**Ready for**: Task Generation
