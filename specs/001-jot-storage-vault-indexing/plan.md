# Implementation Plan: Jot Storage & Quick Jot Interface

**Branch**: `001-jot-storage-vault-indexing` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-jot-storage-vault-indexing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement markdown-first jot storage (backend) and quick capture interface (frontend). Jots are stored as individual `.md` files with YAML frontmatter in the user's Obsidian vault (`.scribel/jots/` folder). SQLite is used only for indexing and fast queries. The frontend provides a single-line input with syntax highlighting for `#tags` and `[[wiki-links]]`, displaying jots chronologically with optimistic updates.

## Technical Context

**Language/Version**: Rust 1.75+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**:
  - Backend: Tauri 2.x, rusqlite 0.32, serde, chrono, notify (file watcher), regex
  - Frontend: React 19, Tailwind CSS 4, @tauri-apps/api
**Storage**: Markdown files (primary) + SQLite (index cache)
**Testing**: cargo test (Rust), vitest (TypeScript/React)
**Target Platform**: macOS (primary), Windows/Linux (future)
**Project Type**: Desktop application (Tauri hybrid)
**Performance Goals**:
  - Create jot: <50ms (file write + index update)
  - Get jots (50 items): <100ms (index query)
  - Search: <500ms (SQLite LIKE)
  - UI responsiveness: 60fps scrolling
**Constraints**:
  - Obsidian compatibility (files must be valid markdown)
  - File-first architecture (SQLite is cache only)
  - No network dependencies for core features
**Scale/Scope**:
  - Expected: 100-1000 jots per user
  - Must handle: 10,000+ jots gracefully
  - Vault size: up to 100,000 markdown files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No constitution gates defined yet (constitution.md is template).

**General Quality Gates**:
- ✅ Architecture follows PRD requirements (markdown-first, SQLite for indexing)
- ✅ Performance targets are specific and measurable
- ✅ Testing strategy includes unit and integration tests
- ✅ No unnecessary complexity (file-first is simpler than DB-first)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src-tauri/                  # Rust backend (Tauri)
├── src/
│   ├── jots/              # NEW: Jot storage module
│   │   ├── mod.rs
│   │   ├── models.rs      # Jot struct, frontmatter
│   │   ├── storage.rs     # File read/write
│   │   ├── parser.rs      # Tag/link extraction
│   │   ├── index.rs       # SQLite operations
│   │   └── watcher.rs     # File change detection
│   ├── db/                # NEW: Database module
│   │   ├── mod.rs
│   │   ├── connection.rs  # SQLite setup (WAL mode)
│   │   └── migrations.rs  # Schema creation
│   ├── commands/          # NEW: Tauri commands
│   │   ├── mod.rs
│   │   └── jots.rs        # Command handlers
│   ├── config.rs          # NEW: Vault path config
│   ├── lib.rs             # App entry, command registration
│   └── main.rs            # Desktop entry point
├── Cargo.toml
└── tests/                 # NEW: Integration tests
    └── jot_storage.rs

src/                        # React frontend
├── components/            # NEW: UI components
│   ├── JotPanel.tsx       # Main container
│   ├── JotList.tsx        # Scrollable list
│   ├── JotItem.tsx        # Individual jot
│   ├── JotContent.tsx     # Syntax highlighting
│   └── JotInput.tsx       # Input field
├── hooks/                 # NEW: React hooks
│   └── useJots.ts         # State management
├── api/                   # NEW: Tauri wrappers
│   └── jots.ts            # invoke() calls
├── types/                 # NEW: TypeScript types
│   └── jot.ts
├── utils/                 # NEW: Utilities
│   ├── parseJot.ts        # Tag/link parsing
│   └── formatTime.ts      # Relative timestamps
├── App.tsx                # MODIFY: Use JotPanel
├── main.tsx
└── index.css

src/__tests__/             # NEW: Frontend tests
├── utils/
│   ├── parseJot.test.ts
│   └── formatTime.test.ts
└── components/
    └── JotInput.test.tsx
```

**Structure Decision**: Tauri hybrid architecture with Rust backend (file + SQLite operations) and React frontend (UI components). All jot-related code grouped in `src-tauri/src/jots/` module for backend, `src/components/` for frontend.

## Complexity Tracking

No violations detected. N/A.
