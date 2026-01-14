# Scribel — Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2025-01-14  
**Author:** Tomax Wang  
**Status:** Draft

---

## Executive Summary

Scribel is a desktop application for rapid note capture and AI-powered knowledge management. It combines the quick-jot workflow of apps like Logseq, Mem.ai, and Reflect with agentic AI capabilities similar to Claude Code. Built on local markdown files (compatible with Obsidian vaults), Scribel prioritizes speed, privacy, and seamless integration with existing knowledge bases.

**Core Philosophy:** "Jot first, organize later" — capture thoughts instantly, let AI help connect and structure them over time.

---

## Problem Statement

### Current Pain Points

1. **Friction in Capture**: Traditional note apps require too many decisions upfront (which folder? which note? what title?). This friction causes thoughts to be lost.

2. **Disconnected Knowledge**: Notes exist in silos. Users manually maintain links, but valuable connections remain undiscovered.

3. **Context Switching**: Moving between capture tools, note apps, and AI assistants breaks flow and loses context.

4. **AI Integration Gap**: Existing AI tools don't understand your personal knowledge base. They lack context about your work, projects, and thinking.

### Target Users

- Knowledge workers who capture many fragmented thoughts daily
- Obsidian/markdown users who want AI augmentation without vendor lock-in
- Developers and technical professionals comfortable with local-first tools
- Anyone who values both speed of capture and depth of organization

---

## Product Vision

### One-Liner
**Scribel is a lightning-fast jot pad with an AI companion that understands your entire knowledge base.**

### Key Differentiators

| Feature | Scribel | Traditional Note Apps | AI Chatbots |
|---------|---------|----------------------|-------------|
| Capture Speed | ⚡ Instant jot | 🐢 Choose location first | ❌ Not designed for notes |
| Local Storage | ✅ Your files, your control | ⚠️ Varies | ❌ Cloud-only |
| AI Understanding | ✅ Full vault context | ❌ None | ⚠️ Per-conversation only |
| Agentic Actions | ✅ Create, edit, organize | ❌ Manual only | ⚠️ Can't access your files |
| Obsidian Compatible | ✅ Same markdown files | ⚠️ Varies | ❌ N/A |

---

## User Personas

### Persona 1: The Prolific Thinker (Primary)

**Name:** Maya, Product Manager  
**Age:** 32  
**Tools:** Obsidian, Notion, various AI assistants

**Behaviors:**
- Has 20+ ideas/thoughts per day that need capturing
- Currently loses ~40% of thoughts due to capture friction
- Maintains an Obsidian vault but struggles to keep it organized
- Uses AI chatbots but frustrated by lack of personal context

**Goals:**
- Capture thoughts in <2 seconds
- Find related past thoughts when relevant
- Spend less time organizing, more time thinking

**Quote:** "I want to dump my brain somewhere and have it make sense later."

---

### Persona 2: The Knowledge Builder (Secondary)

**Name:** David, Software Engineer  
**Age:** 28  
**Tools:** Obsidian, VS Code, Claude

**Behaviors:**
- Takes detailed technical notes
- Values markdown and local storage
- Wants AI assistance but not at the cost of privacy
- Builds connections between concepts manually

**Goals:**
- AI that understands his technical documentation
- Automatic linking suggestions
- Code-like agentic capabilities for note management

**Quote:** "I want Claude Code, but for my notes."

---

## Feature Requirements

### P0: Core Features (MVP)

#### F1: Quick Jot Interface

**Description:** The primary UI is a rapid-fire jot input, similar to a chat interface but optimized for note capture.

**Requirements:**
- Single-line input always visible at bottom
- Press Enter to create new jot (bullet point)
- Jots appear in reverse chronological order (newest at bottom, near input)
- Auto-timestamp on each jot
- Support for `[[wiki-links]]` with fuzzy autocomplete
- Support for `#tags`
- Global hotkey to summon app (e.g., `⌘+Shift+Space`)
- Minimal UI chrome — content is the focus

**Acceptance Criteria:**
- Cold start to first jot: <500ms
- Jot creation latency: <50ms
- App summon via hotkey: <200ms

---

#### F2: Jot Storage & Sync

**Description:** Jots are stored locally and can optionally sync to vault daily notes.

**Requirements:**
- Jots stored in local SQLite database
- Each jot has: id, content, timestamp, tags[], links[]
- Optional: Auto-append jots to daily note in vault
- Optional: Manual "promote" jot to standalone note
- Vault path configurable (default: detect Obsidian vault)

**Acceptance Criteria:**
- No data loss on crash (SQLite WAL mode)
- Jots queryable by date, tag, content
- Daily note sync preserves existing content

---

#### F3: Vault Indexing

**Description:** Index the user's markdown vault for semantic search and AI context.

**Requirements:**
- File watcher monitors vault for changes
- Generate embeddings for all markdown files
- Store embeddings in SQLite (sqlite-vec)
- Incremental updates (only re-embed changed files)
- Respect `.gitignore` and configurable ignore patterns

**Acceptance Criteria:**
- Initial index of 1000 files: <5 minutes
- Incremental update: <2 seconds per file
- Embedding dimension: 1536 (OpenAI) or 1024 (Voyage)

---

#### F4: RAG-Powered Chat

**Description:** Chat interface with AI that has context from your vault and jots.

**Requirements:**
- Semantic search retrieves relevant notes/jots
- Top-k results included in AI context
- Chat history maintained per session
- Clear indication of which notes were referenced
- Clickable links to open referenced notes

**Acceptance Criteria:**
- Query-to-response: <3 seconds (excluding LLM time)
- Relevant context retrieval: >80% precision (subjective)
- Token budget management: <100k tokens per request

---

#### F5: AI Suggestions (Passive)

**Description:** Non-intrusive AI suggestions while jotting.

**Requirements:**
- After jot creation, show related notes (if any)
- Suggestions appear below input, dismissible
- No blocking — suggestions load async
- Configurable: enable/disable, suggestion count

**Acceptance Criteria:**
- Suggestions appear within 1 second of jot creation
- Maximum 3 suggestions shown
- Does not interfere with jot flow

---

### P1: Enhanced Features (v1.1)

#### F6: Agentic File Operations

**Description:** AI can create, edit, and organize notes on user request.

**Requirements:**
- Tools available to AI:
  - `read_file(path)` — read vault file
  - `write_file(path, content)` — create/overwrite file
  - `edit_file(path, edits)` — make targeted edits
  - `list_directory(path)` — list vault contents
  - `search_vault(query)` — semantic search
  - `search_jots(query, filters)` — search jots
  - `promote_jot(id, path)` — convert jot to note
- Confirmation required for write operations
- Undo support for all write operations

**Acceptance Criteria:**
- User can request: "Organize my jots from today into a summary note"
- AI successfully creates note with appropriate content
- User can undo the operation

---

#### F7: Smart Daily Review

**Description:** AI-generated daily/weekly summaries from jots.

**Requirements:**
- Manual trigger: "Summarize my day/week"
- AI analyzes jots and suggests organization
- Option to auto-generate daily note from jots
- Highlight connections to existing notes

---

#### F8: Bidirectional Links

**Description:** Show backlinks and outgoing links for context.

**Requirements:**
- When viewing a note, show what links TO it
- When viewing a jot, show what it links to
- Update link index on file change

---

### P2: Advanced Features (v1.2+)

#### F9: MCP Integration

**Description:** Support Model Context Protocol for extensibility.

**Requirements:**
- Expose vault as MCP server (for other tools to access)
- Connect to external MCP servers (TickTick, calendar, etc.)
- Plugin architecture for custom tools

---

#### F10: Multiple Vaults

**Description:** Support switching between multiple vaults.

**Requirements:**
- Configure multiple vault paths
- Quick switch between vaults
- Per-vault settings and indexes

---

#### F11: Mobile Companion (Future)

**Description:** Mobile app for capture only (read-only vault access).

**Requirements:**
- iOS/Android quick capture
- Sync jots to desktop app
- Not a full note-taking app — capture only

---

## User Flows

### Flow 1: Quick Capture

```
User presses ⌘+Shift+Space
         │
         ▼
┌─────────────────────────┐
│  Scribel window appears │
│  Cursor in input field  │
└───────────┬─────────────┘
            │
            ▼
User types: "Meeting idea: weekly async standups"
            │
            ▼
User presses Enter
            │
            ▼
┌─────────────────────────┐
│  Jot saved with         │
│  timestamp              │
│                         │
│  AI suggestion appears: │
│  "Related: [[Meetings   │
│  Process]]"             │
└───────────┬─────────────┘
            │
            ▼
User continues typing or closes window
```

### Flow 2: Knowledge Chat

```
User opens Scribel (or uses ⌘+K)
            │
            ▼
User switches to Chat panel
            │
            ▼
User asks: "What were my thoughts on the Q1 roadmap?"
            │
            ▼
┌─────────────────────────┐
│  System:                │
│  1. Semantic search     │
│  2. Retrieve relevant   │
│     jots and notes      │
│  3. Send to Claude      │
│     with context        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AI Response:           │
│  "Based on your notes,  │
│  you mentioned..."      │
│                         │
│  📎 Referenced:         │
│  - [[Q1 Planning]]      │
│  - Jot from Jan 5       │
└─────────────────────────┘
```

### Flow 3: Agentic Organization

```
User asks: "Organize my jots from this week into themes"
            │
            ▼
┌─────────────────────────────────────────┐
│  AI analyzes jots, proposes structure:  │
│                                         │
│  "I found 23 jots. I suggest:           │
│  - Work (12 jots) → [[Work Log W3]]     │
│  - Project X (5 jots) → [[Project X]]   │
│  - Random (6 jots) → keep as jots       │
│                                         │
│  Should I create these notes?"          │
└───────────────────┬─────────────────────┘
                    │
                    ▼
User confirms: "Yes, do it"
                    │
                    ▼
┌─────────────────────────────────────────┐
│  AI executes:                           │
│  1. create_file("Work Log W3.md", ...)  │
│  2. create_file("Project X.md", ...)    │
│  3. Mark jots as "promoted"             │
│                                         │
│  "Done! Created 2 notes. Undo?"         │
└─────────────────────────────────────────┘
```

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| App cold start | <1 second |
| Jot creation | <50ms |
| Hotkey response | <200ms |
| Search query | <500ms |
| AI response start | <2 seconds |

### Privacy & Security

- All data stored locally by default
- Embeddings can use local models (Ollama) or API
- API keys stored in system keychain
- No telemetry without explicit opt-in
- Vault files never uploaded (only embeddings/queries sent to AI)

### Reliability

- SQLite with WAL mode for crash safety
- Auto-save on every jot
- Undo stack for AI operations
- Graceful degradation if AI unavailable

### Compatibility

- macOS 12+ (primary)
- Windows 10+ (secondary)
- Linux (community support)
- Obsidian vault format compatible

---

## Success Metrics

### North Star Metric
**Daily Active Jots** — Number of jots created per day per user

### Supporting Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Daily active users | 1,000 |
| Jots per user per day | 10+ |
| AI queries per user per day | 5+ |
| Vault files indexed (avg) | 500+ |
| User retention (30-day) | 40% |

### Qualitative Success
- Users report capturing more thoughts than before
- Users discover connections they wouldn't have found manually
- Users spend less time organizing, more time creating

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI costs too high | High | Medium | Local embedding option, caching, token optimization |
| Performance issues with large vaults | Medium | Medium | Pagination, lazy loading, incremental indexing |
| User data loss | Critical | Low | WAL mode, auto-backup, sync verification |
| Obsidian compatibility breaks | Medium | Low | Minimal file modifications, test against Obsidian updates |
| Tauri/Rust learning curve | Medium | Medium | Start with minimal Rust, most logic in TypeScript |

---

## Timeline & Milestones

### Phase 1: Foundation (Weeks 1-4)
- [ ] Tauri + React project setup
- [ ] Basic jot UI (input, list, storage)
- [ ] SQLite schema and operations
- [ ] File watcher for vault

### Phase 2: Intelligence (Weeks 5-8)
- [ ] Embedding generation pipeline
- [ ] Vector search implementation
- [ ] RAG chat interface
- [ ] AI suggestions on jot

### Phase 3: Agency (Weeks 9-12)
- [ ] Tool definitions for Claude
- [ ] File operations with confirmation
- [ ] Undo system
- [ ] Daily review feature

### Phase 4: Polish (Weeks 13-16)
- [ ] Performance optimization
- [ ] Settings and configuration
- [ ] Onboarding flow
- [ ] Beta testing

---

## Open Questions

1. **Embedding provider default**: OpenAI (better quality) vs Voyage (better price) vs local (privacy)?

2. **Jot vs Note distinction**: Should jots eventually "graduate" to notes, or remain separate forever?

3. **Daily note format**: Match Obsidian daily notes plugin format, or create Scribel-specific format?

4. **Pricing model**: Free with API BYO? Freemium with hosted AI? One-time purchase?

5. **Sync strategy**: Should Scribel handle sync between devices, or defer to existing tools (iCloud, Syncthing)?

---

## Appendix

### Competitive Analysis

| App | Capture Speed | AI | Local Storage | Agentic |
|-----|--------------|-----|---------------|---------|
| Obsidian | Medium | Plugin | ✅ | ❌ |
| Logseq | Fast | Limited | ✅ | ❌ |
| Mem.ai | Fast | ✅ | ❌ | ❌ |
| Reflect | Fast | ✅ | ❌ | ❌ |
| Notion AI | Slow | ✅ | ❌ | ❌ |
| **Scribel** | **Fast** | **✅** | **✅** | **✅** |

### Glossary

- **Jot**: A quick, timestamped note fragment. The atomic unit of capture in Scribel.
- **Vault**: A folder of markdown files, compatible with Obsidian.
- **RAG**: Retrieval-Augmented Generation. Using search results to provide context to AI.
- **MCP**: Model Context Protocol. A standard for AI tool integration.
- **Embedding**: A numerical representation of text for semantic similarity search.

---

*End of PRD*