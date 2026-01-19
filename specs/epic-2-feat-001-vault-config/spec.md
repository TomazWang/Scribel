# Feature Specification: Vault Configuration

**Epic**: 2 - Vault Integration
**Feature ID**: epic-2-feat-001
**PRD Reference**: F2 (Jot Storage & Quick Jot Interface)
**Priority**: P0 (MVP Blocker)
**Status**: Specification Complete
**Created**: 2026-01-19
**Last Updated**: 2026-01-19

---

## Overview

### Purpose

Enable users to select and configure their Obsidian vault location, replacing the hardcoded vault path from Epic 1. This feature is essential for MVP as it allows users to connect Scribel to their existing Obsidian vaults.

### User Value

- **Flexibility**: Users can choose any vault location on their system
- **Zero Setup Friction**: Auto-detection finds existing Obsidian vaults automatically
- **Multi-Platform**: Works on macOS, Windows, and Linux
- **First-Run Experience**: Guided onboarding for new users
- **Data Portability**: Easy to switch vaults or use multiple installations

---

## User Scenarios & Testing

### Scenario 1: First-Time User Setup

**Given**: User launches Scribel for the first time
**When**: App starts
**Then**:
1. Onboarding screen appears with "Select Your Vault" heading
2. System automatically detects existing Obsidian vaults
3. Detected vaults are displayed in a list with path and name
4. User can select a detected vault or choose "Browse..." for manual selection
5. After selection, vault path is validated (contains `.obsidian/` folder)
6. On successful validation, user proceeds to main app
7. Vault path is persisted for future launches

**Edge Cases**:
- No vaults detected → Show only "Browse..." button
- Invalid path selected → Show error: "Not a valid Obsidian vault"
- Multiple vaults detected → List all, let user choose

---

### Scenario 2: Changing Vault Location

**Given**: User has already configured a vault
**When**: User opens Settings panel and clicks "Change Vault"
**Then**:
1. File picker dialog opens showing current vault path
2. User navigates to new vault location
3. New path is validated
4. If valid, confirmation prompt: "Switch to [new path]? This will reload the app."
5. On confirmation, new path saved and app reloads
6. Jot list refreshes with jots from new vault

---

### Scenario 3: Auto-Detection on macOS

**Given**: User has Obsidian vaults in standard locations
**When**: Auto-detection runs
**Then**:
- Checks `~/Documents/` for folders containing `.obsidian/`
- Checks `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/` for iCloud vaults
- Returns list of detected vaults with names and paths
- Sorts by most recently modified (likely the active vault)

---

## Functional Requirements

### FR-1: Vault Path Storage

**Requirement**: System shall persistently store the user's selected vault path

**Details**:
- Store in SQLite database in `config` table
- Key: `vault_path`, Value: absolute path string
- Survive app restarts and updates
- Accessible via Tauri command: `get_vault_path()`

**Acceptance Criteria**:
- [ ] Vault path persists across app restarts
- [ ] Path retrieved within 50ms on app startup
- [ ] Invalid/missing path triggers first-run onboarding

---

### FR-2: Vault Auto-Detection

**Requirement**: System shall automatically detect Obsidian vaults in common locations

**Platform-Specific Paths**:

**macOS**:
- `~/Documents/*` (recursive, depth 2)
- `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/*`
- `~/Obsidian/*`

**Windows**:
- `%USERPROFILE%\Documents\*`
- `%USERPROFILE%\OneDrive\Documents\*`
- `%APPDATA%\Obsidian\*`

**Linux**:
- `~/Documents/*`
- `~/Obsidian/*`

**Detection Logic**:
- Check if directory contains `.obsidian/` subdirectory
- Vault name = parent directory name
- Return array of `{name: string, path: string, last_modified: timestamp}`

**Acceptance Criteria**:
- [ ] Detects vaults in all platform-specific locations
- [ ] Returns results within 2 seconds
- [ ] Handles permission errors gracefully (skip inaccessible directories)
- [ ] Detects at least 95% of standard Obsidian vault installations

---

### FR-3: Vault Path Validation

**Requirement**: System shall validate that a selected path is a valid Obsidian vault

**Validation Rules**:
1. Path exists and is a directory
2. Path contains `.obsidian/` subdirectory
3. Path is readable (user has permissions)
4. `.scribel/jots/` folder can be created (if not exists)

**Acceptance Criteria**:
- [ ] Rejects non-existent paths with clear error
- [ ] Rejects paths without `.obsidian/` folder
- [ ] Rejects paths without read permissions
- [ ] Creates `.scribel/jots/` if missing (with confirmation)
- [ ] Validation completes within 500ms

---

### FR-4: First-Run Onboarding UI

**Requirement**: Display onboarding screen on first launch to guide vault selection

**UI Components**:
- **Heading**: "Welcome to Scribel"
- **Subheading**: "Select your Obsidian vault to get started"
- **Detected Vaults List**:
  - Vault icon + name
  - Full path (truncated if too long)
  - "Most Recent" badge on top item
- **Manual Selection Button**: "Browse for Vault..."
- **Footer**: "Don't have Obsidian? Create a folder with a `.obsidian` subfolder"

**Behavior**:
- Auto-detection runs on component mount
- Loading spinner while detecting
- Click vault to select and validate
- Browse button opens native file picker

**Acceptance Criteria**:
- [ ] Onboarding appears only on first launch
- [ ] Auto-detection completes within 3 seconds
- [ ] User can select detected vault with one click
- [ ] Manual browser works on all platforms
- [ ] Clear error messages for validation failures

---

### FR-5: Settings Panel - Vault Management

**Requirement**: Provide settings UI for viewing and changing vault configuration

**UI Location**: Settings panel (new section: "Vault")

**UI Components**:
- **Current Vault**:
  - Display: Vault name + full path
  - Status indicator: "Connected" (green) or "Not Found" (red)
- **Change Vault Button**: Opens file picker
- **Reload Index Button**: Rebuilds jot index from files
- **Open in Finder/Explorer**: Opens vault folder in file manager

**Behavior**:
- Changing vault triggers confirmation dialog
- After confirmation, save new path and reload app
- Show loading state during reload
- If new vault lacks `.scribel/jots/`, offer to create it

**Acceptance Criteria**:
- [ ] Current vault always displays accurate path
- [ ] Status indicator reflects actual vault accessibility
- [ ] Vault change triggers app reload
- [ ] Reload index button refreshes jot list
- [ ] Open folder button works on all platforms

---

### FR-6: Tauri Commands (Backend API)

**Requirement**: Expose backend functionality via Tauri commands

**Commands**:

```rust
// Get current vault path (returns None if not set)
get_vault_path() -> Result<Option<String>, String>

// Set vault path (validates and persists)
set_vault_path(path: String) -> Result<(), String>

// Auto-detect vaults in common locations
detect_vaults() -> Result<Vec<VaultInfo>, String>

// Validate if path is a valid vault
validate_vault_path(path: String) -> Result<bool, String>

// Create .scribel/jots/ folder if missing
ensure_jots_folder() -> Result<(), String>
```

**VaultInfo Type**:
```rust
struct VaultInfo {
    name: String,
    path: String,
    last_modified: i64, // Unix timestamp
}
```

**Acceptance Criteria**:
- [ ] All commands callable from frontend via `invoke()`
- [ ] Errors returned as descriptive strings
- [ ] Commands complete within documented time limits
- [ ] State changes reflected immediately in database

---

## Success Criteria

### User Experience Metrics

1. **Setup Time**: 95% of users complete vault selection within 60 seconds
2. **Detection Accuracy**: Auto-detection finds vaults for 95% of Obsidian users
3. **Error Recovery**: Users can successfully change vaults after errors without app restart
4. **Cross-Platform**: Feature works identically on macOS, Windows, Linux

### Technical Metrics

1. **Performance**:
   - Auto-detection completes within 3 seconds
   - Vault path validation within 500ms
   - Path retrieval on startup within 50ms

2. **Reliability**:
   - Zero data loss when switching vaults
   - Vault path persists across 100% of app restarts
   - Permission errors handled gracefully (no crashes)

3. **Compatibility**:
   - Works with all Obsidian vault structures (v0.15+)
   - Supports vaults on network drives (with warning)
   - Handles Unicode paths correctly

---

## Dependencies

### Epic 1 (Completed)
- Epic 1.1: Project structure and database setup
- Epic 1.2: Jot storage expects `.scribel/jots/` folder in vault

### External
- Tauri file dialog API (for file picker)
- Tauri fs API (for file operations)
- SQLite (for config storage)

### Blocks
- Epic 1 currently uses hardcoded vault path
- Epic 2.2 (File Watcher) needs vault path to monitor correct location
- Epic 3 (Vault Indexing) needs vault path to index markdown files

---

## Assumptions

1. **Obsidian Structure**: All Obsidian vaults contain a `.obsidian/` folder (true since v0.8.0)
2. **Permissions**: Users have read/write access to their chosen vault location
3. **Storage**: Vault paths can be stored as absolute paths (no symlink issues)
4. **Platform**: File picker works consistently across Tauri's supported platforms
5. **Migration**: Users do not need to import settings from Epic 1 (fresh installs only)

---

## Open Questions

None. All decisions made by THE_PO (see `work/handoffs/epic-1/epic-1-f1-MASTER_TL-to-TEAMS.md`).

---

## Out of Scope (Deferred to v1.1+)

- **Multiple Vault Support** (F10 in PRD): Single vault per installation only
- **Vault Switching UI**: Must restart app to switch vaults
- **Sync Conflict Resolution**: Assumes single-user, single-device usage
- **Custom Ignore Patterns**: No UI for `.gitignore`-style exclusions
- **Vault Health Dashboard**: No detailed sync status UI

---

## Related Documents

- **PRD**: `docs/PRD.md` → Feature F2 (Jot Storage & Quick Jot Interface)
- **Constitution**: `.specify/memory/constitution.md` → Local-First & Privacy
- **THE_PO Decisions**: `work/handoffs/epic-1/epic-1-f1-MASTER_TL-to-TEAMS.md`
- **Tech Design**: `docs/TECH_DESIGN.md` → Data Layer (Markdown-First)

---

## Approval

**Specification Status**: ✅ Ready for Planning

**Next Steps**:
1. MASTER_TL & THE_PO review (this step)
2. Run `/speckit.plan` to create implementation plan
3. Generate tasks with `/speckit.tasks`
4. Assign to teams: BE_GEEKS (backend), FE_DUDES (UI)

---

**Last Reviewed**: 2026-01-19
**Approved By**: Pending MASTER_TL & THE_PO sign-off
