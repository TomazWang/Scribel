# Scribel Epics Overview

## Epic Hierarchy

**Epic > Feature > User Story**

Each Epic represents a major milestone. Features are implemented one-by-one using Speckit.

---

## Epic 1: Foundation (MVP Core)

**Goal:** Basic jot capture and storage working

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 1.1 | Project Scaffold | - | ✅ Done |
| 1.2 | Jot Storage | F2 | Pending |
| 1.3 | Quick Jot Interface | F1 | Pending |
| 1.4 | Global Hotkey | F1 | Pending |

---

## Epic 2: Vault Integration

**Goal:** Connect to user's Obsidian vault

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 2.1 | Vault Configuration | F2 | Pending |
| 2.2 | File Watcher | F3 | Pending |
| 2.3 | Daily Note Sync | F2 | Pending |

---

## Epic 3: Intelligence (RAG & Search)

**Goal:** Semantic search and AI-powered chat

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 3.1 | Embedding Pipeline | F3 | Pending |
| 3.2 | Vector Storage | F3 | Pending |
| 3.3 | RAG Chat Interface | F4 | Pending |
| 3.4 | AI Suggestions | F5 | Pending |

---

## Epic 4: Agentic Capabilities

**Goal:** AI can read/write vault files

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 4.1 | AI Tool Definitions | F6 | Pending |
| 4.2 | File Operations | F6 | Pending |
| 4.3 | Jot Promotion | F6 | Pending |

---

## Epic 5: Polish & Enhanced Features

**Goal:** Production-ready experience

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 5.1 | Wiki-Link Autocomplete | F1 | Pending |
| 5.2 | Smart Daily Review | F7 | Pending |
| 5.3 | Bidirectional Links | F8 | Pending |
| 5.4 | Performance Optimization | - | Pending |
| 5.5 | Settings & Onboarding | - | Pending |

---

## Epic 6: Advanced Features (Future)

**Goal:** Extensibility and multi-vault

| Feature | Name | PRD Ref | Status |
|---------|------|---------|--------|
| 6.1 | MCP Integration | F9 | Pending |
| 6.2 | Multiple Vaults | F10 | Pending |

---

## Implementation Order

```
Epic 1: Foundation ← CURRENT
├── 1.1 Project Scaffold ✅
├── 1.2 Jot Storage ← NEXT
├── 1.3 Quick Jot Interface
└── 1.4 Global Hotkey

Epic 2: Vault Integration
Epic 3: Intelligence
Epic 4: Agentic Capabilities
Epic 5: Polish
Epic 6: Advanced (Future)
```

---

## PRD Feature Reference

| PRD Code | Feature Name | Epic |
|----------|--------------|------|
| F1 | Quick Jot Interface | Epic 1 |
| F2 | Jot Storage & Sync | Epic 1, 2 |
| F3 | Vault Indexing | Epic 2, 3 |
| F4 | RAG-Powered Chat | Epic 3 |
| F5 | AI Suggestions | Epic 3 |
| F6 | Agentic File Operations | Epic 4 |
| F7 | Smart Daily Review | Epic 5 |
| F8 | Bidirectional Links | Epic 5 |
| F9 | MCP Integration | Epic 6 |
| F10 | Multiple Vaults | Epic 6 |
| F11 | Mobile Companion | Future |
