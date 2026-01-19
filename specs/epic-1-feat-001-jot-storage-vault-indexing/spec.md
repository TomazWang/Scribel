# Feature Specification: Jot Storage & Quick Jot Interface

**Branch**: `001-jot-storage-vault-indexing`
**Epic**: Epic 1 - Foundation
**Features**: 1.2 Jot Storage + 1.3 Quick Jot Interface
**PRD Reference**: F1 (Quick Jot Interface), F2 (Jot Storage & Sync)

---

## Overview

This combined specification implements the core jot capture system:
1. **Backend (F1.2)**: Markdown-first storage with SQLite indexing
2. **Frontend (F1.3)**: Quick jot interface with syntax highlighting

### Goals
- Jots stored as markdown files in `.scribel/jots/` within user's vault
- SQLite used only for indexing (not primary storage)
- Single-line input interface with instant feedback
- Tag and wiki-link syntax highlighting

---

## Feature 1.2: Jot Storage (Backend)

See [plan/epic-1-foundation/specs/feature-1.2-jot-storage.md](../../plan/epic-1-foundation/specs/feature-1.2-jot-storage.md) for complete specification.

### Key Components
- **Markdown Files**: Each jot is a `.md` file with YAML frontmatter
- **SQLite Index**: Cache for fast queries, rebuild from files if corrupted
- **File Watcher**: Detect external edits in Obsidian
- **Tauri Commands**: CRUD operations for jots

### Data Model
```rust
pub struct Jot {
    pub id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub tags: Vec<String>,
    pub links: Vec<String>,
    pub promoted: bool,
    pub file_path: String,
}
```

---

## Feature 1.3: Quick Jot Interface (Frontend)

See [plan/epic-1-foundation/specs/feature-1.3-quick-jot-interface.md](../../plan/epic-1-foundation/specs/feature-1.3-quick-jot-interface.md) for complete specification.

### Key Components
- **JotInput**: Single-line input with Enter-to-submit
- **JotList**: Chronological list with auto-scroll
- **JotItem**: Individual jot display with delete action
- **JotContent**: Syntax highlighting for tags and links

### UI Layout
```
┌─────────────────────────────────────┐
│  Jot List (scrollable)              │
│  • 2:00 PM  [[Note]] text #tag      │
│  • 2:15 PM  More text                │
│  ↓ (newest at bottom)                │
├─────────────────────────────────────┤
│  Input: What's on your mind? [↵]    │
└─────────────────────────────────────┘
```

---

## Acceptance Criteria

### Backend (1.2)
- [ ] Jot files created in `.scribel/jots/` with valid YAML frontmatter
- [ ] Jots persist across app restarts
- [ ] Tags and links extracted correctly
- [ ] External edits detected and index updated
- [ ] All operations meet performance targets (<50ms create, <100ms list)

### Frontend (1.3)
- [ ] Input field auto-focuses on app open
- [ ] Enter submits jot and clears input
- [ ] New jots appear instantly (optimistic updates)
- [ ] #tags highlighted in blue, [[links]] in purple
- [ ] Delete button on hover removes jot
- [ ] Relative timestamps display correctly

---

## Dependencies

**Prerequisites:**
- Feature 1.1 Project Scaffold ✅

**Rust Crates:**
- rusqlite, serde, serde_json, serde_yaml, thiserror, regex, chrono, notify, uuid

**NPM Packages:**
- React 19, Tailwind CSS 4, @tauri-apps/api

---

## Implementation Order

1. Backend: Jot models and parser
2. Backend: File storage operations
3. Backend: SQLite index and migrations
4. Backend: Tauri commands
5. Backend: File watcher
6. Frontend: API wrappers and types
7. Frontend: Utility functions (parsing, formatting)
8. Frontend: Components (JotContent → JotItem → JotList → JotInput → JotPanel)
9. Frontend: Hooks (useJots with optimistic updates)
10. Integration: Connect frontend to backend
11. Testing: Unit and integration tests
