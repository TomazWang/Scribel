# CLAUDE.md

This file provides runtime guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **See also:** [.AI_INSTRUCTION.md](.AI_INSTRUCTION.md) for core principles, performance targets, and data schemas shared across all AI tooling.

## Key Architecture Concepts

### Data Layer
- **Jots**: Ephemeral, timestamped note fragments stored in SQLite with schema: `id, content, timestamp, tags[], links[]`
- **Vault**: User's markdown files (Obsidian-compatible) monitored via file watcher
- **Embeddings**: Vector representations stored in SQLite using sqlite-vec extension
- **SQLite WAL Mode**: Ensures crash safety and concurrent read access

### Component Architecture
1. **Frontend (React + TypeScript)**: Jot interface, chat UI, settings panel
2. **Backend (Tauri + Rust)**: File system operations, SQLite access, system integrations
3. **AI Layer**: Claude API with RAG (Retrieval-Augmented Generation) using semantic search
4. **Indexing Pipeline**: File watcher → embedding generation → vector storage

## Tauri-Specific Conventions

### Command Structure
Tauri commands (Rust backend) handle:
- SQLite operations (jot CRUD, vector search)
- File system access (vault monitoring, markdown I/O)
- System integrations (global hotkey, keychain for API keys)
- Embedding generation (via API or local models)

Frontend communicates via `invoke()` for all backend operations.

### State Management
- Frontend state: React hooks for UI state, jot list, chat history
- Backend state: Vault path config, file watcher state, embedding cache
- Cross-boundary: Tauri events for file changes, AI suggestions

## AI Integration Patterns

### RAG Flow
1. User query → generate embedding
2. Vector search in SQLite (top-k similar notes/jots)
3. Construct context: retrieved content + chat history
4. Send to Claude API with tool definitions
5. Stream response to UI

### Agentic Tools
The AI has access to:
- `read_file(path)` — read vault markdown file
- `write_file(path, content)` — create/overwrite note
- `edit_file(path, edits)` — targeted edits (diff-based)
- `list_directory(path)` — explore vault structure
- `search_vault(query)` — semantic search
- `search_jots(query, filters)` — jot search by date/tag/content
- `promote_jot(id, path)` — convert jot to standalone note

All write operations require user confirmation and support undo.

## Obsidian Compatibility

### Vault Detection
1. Search for `.obsidian/` folder in common locations
2. Fall back to user configuration
3. Respect `.gitignore` and custom ignore patterns

### Daily Note Sync
When enabled, jots auto-append to daily note:
```markdown
## Jots
- 14:32 Meeting idea: weekly async standups
- 15:45 Research [[AI Embeddings]] for [[Project X]]
```

## Open Questions (Per PRD)

1. **Embedding provider**: Default to OpenAI (quality) or Voyage (cost) or local (privacy)?
2. **Jot lifecycle**: Should jots auto-archive or remain indefinitely?
3. **Daily note format**: Match Obsidian plugin exactly or create Scribel-specific variant?

## Phase 1 MVP Scope

Focus on core features (P0 from PRD):
- F1: Quick Jot Interface (input, list, timestamps, wiki-links, tags)
- F2: Jot Storage (SQLite with WAL mode)
- F3: Vault Indexing (file watcher, embeddings, sqlite-vec)
- F4: RAG-Powered Chat (semantic search → Claude API)
- F5: AI Suggestions (passive, after jot creation)

Defer to v1.1: agentic file operations, daily review, bidirectional links.

## Critical Path for First Implementation

1. ✅ Set up Tauri + React project scaffold
2. Implement SQLite schema and basic jot CRUD
3. Build JotInput and JotList components
4. Add file watcher for vault (no indexing yet)
5. Integrate embedding API and sqlite-vec
6. Implement semantic search
7. Build ChatPanel with Claude API integration
8. Add passive AI suggestions after jot creation
9. Configure global hotkey

## Project Structure

```
scribel/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Desktop entry point
│   │   ├── lib.rs      # Tauri app entry
│   │   ├── db/         # SQLite operations (to be created)
│   │   ├── vault/      # File watcher, markdown parsing (to be created)
│   │   ├── ai/         # Embedding generation, Claude API (to be created)
│   │   └── commands/   # Tauri commands (to be created)
│   └── Cargo.toml
├── src/                # React frontend
│   ├── components/     # UI components (to be created)
│   ├── hooks/          # React hooks (to be created)
│   ├── utils/          # Utilities (to be created)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── plan/               # Epic and feature planning
├── package.json
└── tauri.conf.json
```

## Documentation & Planning

### Key Documents
| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, features F1-F11, user personas, success metrics |
| `TECH_DESIGN.md` | Technical architecture, data flow, API design |
| `.AI_INSTRUCTION.md` | Core AI guidance, principles, schemas |
| `.specify/memory/constitution.md` | Non-negotiable principles, governance |

### Planning Structure
| Location | Content |
|----------|---------|
| `plan/epics.md` | Master epic list with PRD traceability |
| `plan/epic-N-*/` | Epic overviews and feature plans |
| `specs/` | Speckit-generated feature specs (spec.md, plan.md, tasks.md) |

## Notes for Claude Code

- When implementing file operations, always use Tauri's fs API (not Node fs)
- SQLite queries must use prepared statements (avoid SQL injection)
- Never block the UI thread; use async Tauri commands
- Test global hotkey on macOS first (primary platform)
- Respect user's vault structure; never modify files without confirmation
- Token budget for Claude API: aim for <100k tokens per request
- When adding dependencies, prefer lightweight crates (minimize bundle size)
- Check `plan/epics.md` for current implementation status
- Reference `PRD.md` for feature requirements (F1-F11)
