# Epic 3: Intelligence (RAG & Search)

**Goal:** Semantic search and AI-powered chat

This Epic adds the AI brain to Scribel — embedding generation, vector search, RAG-powered chat, and intelligent suggestions.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 3.1 | Embedding Pipeline | F3 | Pending | Generate embeddings for vault files |
| 3.2 | Vector Storage | F3 | Pending | sqlite-vec for similarity search |
| 3.3 | RAG Chat Interface | F4 | Pending | Chat with context from vault |
| 3.4 | AI Suggestions | F5 | Pending | Passive suggestions after jot creation |

## Success Criteria

- Initial index of 1000 files: <5 minutes
- Incremental update: <2 seconds per file
- Semantic search query: <500ms
- AI suggestions appear within 1 second
- Query-to-response: <3 seconds (excluding LLM time)

## Dependencies

- Epic 1: Foundation (completed)
- Epic 2: Vault Integration (file watcher for indexing)

## Tech Considerations

- Embedding providers: OpenAI (1536D) or Voyage (1024D)
- sqlite-vec extension for vector similarity
- Claude API for chat responses
- API keys stored in system keychain
