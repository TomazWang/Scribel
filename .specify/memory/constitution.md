<!--
  Sync Impact Report - Constitution v1.0.0
  ========================================
  Version Change: Initial constitution (no prior version)
  Ratified: 2026-01-14

  New Principles:
  - I. Performance-First Architecture
  - II. Local-First & Privacy by Design
  - III. Obsidian Compatibility
  - IV. Crash Safety & Data Integrity
  - V. Testing Strategy

  New Sections:
  - Performance Standards
  - Technology Stack Requirements

  Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - Success criteria includes performance metrics
  ✅ tasks-template.md - Task organization supports independent testing

  Follow-up TODOs: None
-->

# Scribel Constitution

> **See also:** [.AI_INSTRUCTION.md](../../.AI_INSTRUCTION.md) for core AI guidance, performance targets, and data schemas shared across all AI tooling.

## Core Principles

### I. Performance-First Architecture

Every feature MUST meet strict performance targets before being considered complete.
These are non-negotiable thresholds that define the user experience:

- Cold start to first jot: <500ms
- Jot creation latency: <50ms
- Global hotkey response: <200ms
- Semantic search query: <500ms
- AI suggestions after jot: <1 second

**Rationale**: The core philosophy "Jot first, organize later" depends on zero-friction
capture. Performance degradation directly undermines the product value proposition.

**Implementation Requirements**:
- Use SQLite WAL mode for concurrent access without blocking
- Async Tauri commands to prevent UI blocking
- Debounced search operations (500ms)
- Lazy loading and virtualized scrolling for large datasets
- Content hash checking to avoid unnecessary re-embedding

### II. Local-First & Privacy by Design

User data MUST remain under user control with privacy as the default, not an option:

- All markdown files remain local (never uploaded to external services)
- Only text content sent to AI services (for embeddings and queries)
- API keys stored in system keychain (macOS Keychain, Windows Credential Manager,
  Linux Secret Service)
- No telemetry or analytics without explicit user opt-in
- Support for local embedding models (Ollama) as alternative to API providers

**Rationale**: Target users (Obsidian users, technical professionals) value data ownership
and privacy. Violating this principle would exclude the primary user base.

**Implementation Requirements**:
- Use Tauri's fs API (sandboxed file access) instead of Node fs
- Never log or transmit vault file paths or complete file contents
- Make cloud features opt-in with clear disclosure
- Provide local-only alternatives for all AI features

### III. Obsidian Compatibility

Scribel MUST be a compatible layer on top of existing Obsidian vaults, not a replacement:

- Standard markdown with YAML frontmatter support
- `[[wiki-links]]` for internal linking (including `[[filename|display text]]` syntax)
- `#tags` in content
- Daily note format: `YYYY-MM-DD.md` in configurable folder
- Respect `.gitignore` and custom ignore patterns
- Minimal file modifications (never break Obsidian vault integrity)

**Rationale**: Users have existing knowledge bases in Obsidian. Requiring migration or
creating vendor lock-in contradicts the "local-first" principle and creates friction.

**Implementation Requirements**:
- File watcher must monitor vault for external changes (Obsidian edits)
- Write operations require user confirmation
- Test against actual Obsidian vaults during development
- Never create proprietary file formats or metadata

### IV. Crash Safety & Data Integrity (NON-NEGOTIABLE)

No data loss under any circumstances - crashes, power failures, or concurrent access:

- SQLite with WAL (Write-Ahead Logging) mode mandatory
- Auto-save on every jot creation
- Undo stack for all AI write operations
- Atomic file operations (write to temp, then rename)
- Daily note sync MUST preserve existing content

**Rationale**: Knowledge capture is worthless if thoughts are lost. Data loss destroys
user trust and undermines the entire product.

**Implementation Requirements**:
- All database operations use transactions
- Prepared statements for SQL queries (prevent injection)
- File operations verify write success before confirming to user
- Background processes must handle termination gracefully
- Test crash scenarios in integration tests

### V. Testing Strategy

Features MUST be testable at three levels with clear boundaries:

**Unit Tests**:
- Rust: Database operations, file parsing, embedding generation
- TypeScript: React components, hooks, utilities
- Mock external dependencies (AI APIs, file system)

**Integration Tests**:
- Tauri command invocation from frontend
- File watcher → embedding pipeline flow
- RAG retrieval accuracy (precision/recall validation)
- SQLite concurrent access patterns

**E2E Tests**:
- Jot creation → storage → retrieval
- Vault indexing → semantic search
- AI chat with tool use (mocked AI responses)

**Rationale**: The application spans Rust backend, TypeScript frontend, and external
services. Each layer must be independently verifiable to isolate failures.

## Performance Standards

Performance targets are binding requirements, not aspirational goals. Before any release:

1. **Measure**: Profile actual performance on reference hardware (2019 MacBook Pro baseline)
2. **Validate**: Automated tests MUST fail if targets exceeded
3. **Optimize**: If target missed, feature is not complete
4. **Document**: Performance test results included in PR description

### Performance Testing Requirements

- Jot creation: Measure from keypress to UI update
- Search latency: Measure from query submission to first result
- Indexing throughput: Track embeddings per second, memory usage
- Concurrent access: Verify SQLite WAL handles multiple read/write clients

### Acceptable Degradation

Performance MAY degrade under documented extreme conditions:

- Vaults >10,000 files: Incremental indexing required, initial index time excluded
- Jot history >100,000 items: Pagination mandatory
- Concurrent AI requests: Queue with user feedback, not hard block

## Technology Stack Requirements

The following stack decisions are locked for consistency and maintenance:

**Frontend**: React 18+, TypeScript, Tailwind CSS
- Rationale: Modern, type-safe, fast development, good Tauri integration

**Backend**: Rust (Tauri 2.x), SQLite with sqlite-vec extension
- Rationale: Native performance, cross-platform, single binary distribution, Rust safety

**AI Integration**: Anthropic Claude API (required), OpenAI/Voyage embeddings (configurable)
- Rationale: Claude for agentic capabilities, flexible embedding providers for cost/privacy

**Platform Support**: macOS 12+ (primary), Windows 10+ (secondary), Linux (community)
- Rationale: macOS is primary target user platform, others supported best-effort

### Dependency Constraints

- Prefer lightweight Rust crates to minimize binary size
- Avoid Node.js dependencies in Tauri backend (use Rust alternatives)
- Bundle size target: <50MB for macOS app bundle
- Startup time: No lazy loading of critical dependencies

## Governance

This constitution defines the non-negotiable principles for Scribel development. All
design decisions, code reviews, and feature specifications MUST align with these principles.

### Amendment Procedure

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: All changes require technical review and user impact assessment
3. **Migration**: Breaking changes require migration guide and backward compatibility plan
4. **Versioning**: Constitution follows semantic versioning (MAJOR.MINOR.PATCH)

### Constitution Versioning

- **MAJOR**: Principle removal or redefinition that invalidates prior designs
- **MINOR**: New principle added or existing principle materially expanded
- **PATCH**: Clarifications, examples, wording improvements without semantic change

### Compliance Enforcement

- All PRs MUST reference constitution principles in design justification
- Code reviews MUST verify performance targets for performance-sensitive code
- Plan documents (plan.md) MUST include "Constitution Check" section
- Complexity violations MUST be justified in "Complexity Tracking" section

### Runtime Guidance

For implementation details and coding patterns, refer to `CLAUDE.md` (runtime development
guidance). The constitution defines WHAT we must achieve; CLAUDE.md guides HOW to implement.

### Documentation Structure

| Document | Location | Purpose |
|----------|----------|---------|
| PRD | `PRD.md` | Product requirements, features F1-F11 |
| Tech Design | `TECH_DESIGN.md` | Architecture and design decisions |
| AI Instructions | `.AI_INSTRUCTION.md` | Core AI guidance and schemas |
| Epic Plans | `plan/` | Epic and feature planning |
| Feature Specs | `specs/` | Speckit-generated specifications |

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-19
