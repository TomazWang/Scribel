# Scribel Constitution

## Core Principles

### I. Performance-First Architecture

Every feature MUST meet strict performance targets before being considered complete.

**Non-Negotiable Thresholds:**
| Metric | Target |
|--------|--------|
| Cold start to first jot | <500ms |
| Jot creation latency | <50ms |
| Global hotkey response | <200ms |
| Semantic search query | <500ms |
| AI suggestions after jot | <1 second |

**Implementation Requirements:**
- Use SQLite WAL mode for concurrent access without blocking
- Async Tauri commands to prevent UI blocking
- Debounced search operations (500ms)
- Lazy loading and virtualized scrolling for large datasets
- Content hash checking to avoid unnecessary re-embedding

### II. Local-First & Privacy by Design

User data MUST remain under user control with privacy as the default.

**Requirements:**
- All markdown files remain local (never uploaded)
- Only text content sent to AI services (for embeddings and queries)
- API keys stored in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- No telemetry or analytics without explicit user opt-in
- Support for local embedding models (Ollama) as alternative to API providers

**Implementation:**
- Use Tauri's fs API (sandboxed file access) instead of Node fs
- Never log or transmit vault file paths or complete file contents
- Make cloud features opt-in with clear disclosure

### III. Obsidian Compatibility

Scribel MUST be a compatible layer on top of existing Obsidian vaults.

**Requirements:**
- Standard markdown with YAML frontmatter support
- `[[wiki-links]]` for internal linking (including `[[filename|display text]]` syntax)
- `#tags` in content
- Daily note format: `YYYY-MM-DD.md` in configurable folder
- Respect `.gitignore` and custom ignore patterns
- Never break Obsidian vault integrity

### IV. Crash Safety & Data Integrity (NON-NEGOTIABLE)

No data loss under any circumstances.

**Mandatory Practices:**
- SQLite with WAL (Write-Ahead Logging) mode mandatory
- Auto-save on every jot creation
- Undo stack for all AI write operations
- Atomic file operations (write to temp, then rename)
- All database operations use transactions
- Prepared statements for SQL queries (prevent injection)

### V. Simplicity

Start simple, follow YAGNI (You Aren't Gonna Need It) principles.

**Guidelines:**
- Avoid over-engineering; only make changes directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what was asked
- Prefer lightweight Rust crates to minimize binary size
- Bundle size target: <50MB for macOS app bundle

## Technology Constraints

| Layer | Technology |
|-------|------------|
| Frontend | React 18+, TypeScript, Tailwind CSS |
| Backend | Rust (Tauri 2.x), SQLite with sqlite-vec |
| AI | Anthropic Claude API |
| Embeddings | OpenAI API or Voyage AI (configurable) |
| Primary Platform | macOS 12+ |

**Dependency Constraints:**
- Prefer lightweight Rust crates to minimize binary size
- Avoid Node.js dependencies in Tauri backend (use Rust alternatives)
- Bundle size target: <50MB for macOS app bundle

## Development Workflow

### AI Development Teams

| Team | Role | Implements Code? |
|------|------|------------------|
| **FE_DUDES** | Frontend Development Team | Yes |
| **BE_GEEKS** | Backend Development Team | Yes |
| **AI_GODS** | AI/ML Development Team | Yes |
| **THE_PO** | Product Owner | No — decisions only |
| **MASTER_TL** | Tech Lead | No — reviews only |

### Merge Rules

- **Teams NEVER merge directly**
- Merges are coordinated by **THE_PO** and executed by the **human**
- Teams push to their branches and create handoff documents when ready

### Team File Ownership

| Team | Owns | Does NOT Touch |
|------|------|----------------|
| **FE_DUDES** | `src/**/*`, `package.json`, `tsconfig.json` | `src-tauri/**/*` |
| **BE_GEEKS** | `src-tauri/**/*`, `Cargo.toml` | `src/**/*` |
| **AI_GODS** | `src-tauri/src/ai/**/*` | Core frontend/backend |
| **THE_PO** | Product decisions | Any code |
| **MASTER_TL** | Technical reviews | Any code |

## Governance

This Constitution supersedes all other practices and guidelines. Any deviation from these principles must be:

1. **Documented** — Explain why the deviation is necessary
2. **Approved** — Reviewed by MASTER_TL for technical deviations, THE_PO for product deviations
3. **Tracked** — Recorded in Complexity Tracking section of the relevant plan.md

### Amendment Procedure

1. Propose amendment via handoff document to THE_PO
2. MASTER_TL reviews technical implications
3. Human approves and updates constitution
4. All teams pull updated constitution

### Versioning Policy

- **MAJOR**: Fundamental principle changes
- **MINOR**: New constraints or clarifications
- **PATCH**: Typo fixes, formatting

Use `CLAUDE.md` and `.AI_INSTRUCTION.md` for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-01-19 | **Last Amended**: 2025-01-19
