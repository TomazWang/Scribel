# AI/ML Development Tasks - RAG & Embeddings

**Status**: ⏳ NOT STARTED (waiting for backend foundation)
**Tech Stack**: Rust, Tauri 2.x, SQLite (sqlite-vec), Claude API, Embeddings API
**Branch**: `001-jot-storage-vault-indexing`

---

## What's Already Done ✅

### Phase 1 & 2: Foundation (COMPLETE)
- ✅ Project structure created
- ✅ SQLite database with WAL mode (includes `embeddings` table)
- ✅ Database schema for embeddings storage
- ✅ Directory structure: `src-tauri/src/ai/` (to be created)

---

## What Needs to be Done 🔨

### High Priority - Vault Indexing MVP

#### 1. Embedding Generation Module (`src-tauri/src/ai/embeddings.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 3-4 hours

Implement embedding generation:
```rust
// Generate embeddings via API
pub async fn generate_embedding(text: &str, api_key: &str) -> Result<Vec<f32>, AiError>

// Batch embedding generation
pub async fn generate_embeddings_batch(texts: &[&str], api_key: &str) -> Result<Vec<Vec<f32>>, AiError>

// Store embedding in SQLite
pub fn store_embedding(conn: &Connection, file_path: &str, embedding: &[f32]) -> Result<(), AiError>

// Retrieve embedding
pub fn get_embedding(conn: &Connection, file_path: &str) -> Result<Option<Vec<f32>>, AiError>
```

**Key Points**:
- Support OpenAI embeddings API (default)
- Support Voyage AI as alternative
- Consider local embedding option (Ollama) for privacy
- Use `sqlite-vec` for vector storage and similarity search

**Reference**:
- Schema in `src-tauri/src/db/migrations.rs` (embeddings table)
- PRD Section on embedding provider choice

---

#### 2. Vector Search Module (`src-tauri/src/ai/search.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

Implement semantic search:
```rust
// Search for similar content using vector similarity
pub fn search_similar(conn: &Connection, query_embedding: &[f32], limit: usize) -> Result<Vec<SearchResult>, AiError>

// Search with filters (date range, tags, etc.)
pub fn search_similar_filtered(conn: &Connection, query_embedding: &[f32], filters: &SearchFilters, limit: usize) -> Result<Vec<SearchResult>, AiError>

pub struct SearchResult {
    pub file_path: String,
    pub similarity: f32,
    pub snippet: String,
}
```

**Key Points**:
- Use `sqlite-vec` for efficient vector similarity
- Return top-k results with similarity scores
- Include content snippets for context

---

#### 3. Vault Watcher Integration (`src-tauri/src/ai/indexer.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

Implement incremental indexing:
```rust
// Index a single file (generate + store embedding)
pub async fn index_file(conn: &Connection, file_path: &Path, api_key: &str) -> Result<(), AiError>

// Index entire vault
pub async fn index_vault(conn: &Connection, vault_path: &Path, api_key: &str) -> Result<IndexStats, AiError>

// Re-index changed files
pub async fn reindex_changed(conn: &Connection, changed_files: &[PathBuf], api_key: &str) -> Result<IndexStats, AiError>

pub struct IndexStats {
    pub files_indexed: usize,
    pub files_skipped: usize,
    pub errors: Vec<String>,
}
```

**Key Points**:
- Coordinate with BE_GEEKS on file watcher integration
- Skip files that haven't changed (check modified timestamp)
- Handle large vaults efficiently (batch processing)

---

### Medium Priority - RAG-Powered Chat

#### 4. RAG Context Builder (`src-tauri/src/ai/rag.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 3-4 hours

Implement RAG pipeline:
```rust
// Build context from query
pub async fn build_context(conn: &Connection, query: &str, api_key: &str) -> Result<RagContext, AiError>

pub struct RagContext {
    pub relevant_notes: Vec<RelevantNote>,
    pub relevant_jots: Vec<Jot>,
    pub total_tokens: usize,
}

pub struct RelevantNote {
    pub path: String,
    pub content: String,
    pub similarity: f32,
}
```

**Key Points**:
- Retrieve top-k similar notes from vault
- Retrieve relevant jots
- Manage token budget (<100k tokens per request)
- Format context for Claude API

---

#### 5. Claude API Integration (`src-tauri/src/ai/claude.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 3-4 hours

Implement Claude API wrapper:
```rust
// Send chat message with RAG context
pub async fn chat_with_context(
    messages: &[ChatMessage],
    context: &RagContext,
    api_key: &str,
) -> Result<ChatResponse, AiError>

// Stream response
pub async fn chat_stream(
    messages: &[ChatMessage],
    context: &RagContext,
    api_key: &str,
    on_chunk: impl Fn(&str),
) -> Result<(), AiError>

pub struct ChatMessage {
    pub role: String,  // "user" | "assistant"
    pub content: String,
}

pub struct ChatResponse {
    pub content: String,
    pub usage: TokenUsage,
}
```

**Key Points**:
- Support streaming responses
- Include tool definitions for agentic actions
- Handle rate limiting and errors gracefully

---

### Lower Priority - AI Suggestions

#### 6. Passive Suggestions (`src-tauri/src/ai/suggestions.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

Implement passive AI suggestions after jot creation:
```rust
// Generate suggestions for a jot
pub async fn suggest_for_jot(conn: &Connection, jot: &Jot, api_key: &str) -> Result<Suggestions, AiError>

pub struct Suggestions {
    pub related_notes: Vec<String>,  // Paths to related notes
    pub suggested_tags: Vec<String>,
    pub suggested_links: Vec<String>,
}
```

**Key Points**:
- Run after jot creation (non-blocking)
- Find related notes via semantic search
- Suggest tags based on content analysis
- Suggest wiki-links to existing notes

---

## Testing & Verification

### Run Tests
```bash
cd src-tauri
cargo test ai::
```

### Manual Testing
```bash
# Test embedding generation
await __TAURI__.invoke('generate_embedding', { text: 'Test content' });

# Test semantic search
await __TAURI__.invoke('search_vault', { query: 'project ideas' });

# Test RAG chat
await __TAURI__.invoke('chat', { message: 'What are my recent project ideas?' });
```

---

## Performance Targets

| Operation | Target | Implementation Notes |
|-----------|--------|---------------------|
| Embedding generation | <500ms | API call, batch when possible |
| Semantic search | <500ms | sqlite-vec optimized |
| RAG context build | <1s | Retrieve + format |
| Chat response start | <2s | Streaming preferred |

---

## File Structure

```
src-tauri/
├── src/
│   ├── ai/
│   │   ├── mod.rs                  ⏳ TODO - Module exports
│   │   ├── embeddings.rs           ⏳ TODO - Embedding generation
│   │   ├── search.rs               ⏳ TODO - Vector search
│   │   ├── indexer.rs              ⏳ TODO - Vault indexing
│   │   ├── rag.rs                  ⏳ TODO - RAG pipeline
│   │   ├── claude.rs               ⏳ TODO - Claude API
│   │   └── suggestions.rs          ⏳ TODO - Passive suggestions
│   └── commands/
│       └── ai.rs                   ⏳ TODO - Tauri commands for AI
└── Cargo.toml                      ⏳ TODO - Add AI dependencies
```

---

## Dependencies to Add

```toml
# Cargo.toml additions
reqwest = { version = "0.11", features = ["json"] }
sqlite-vec = "0.1"  # or appropriate version
tiktoken-rs = "0.5"  # Token counting
```

---

## Coordination with Other Teams

### From BE_GEEKS (Dependencies)
- ✅ SQLite database setup (WAL mode)
- ✅ Embeddings table schema
- ⏳ File watcher events (notify AI module of changes)
- ⏳ Jot storage integration

### To FE_DUDES (What You Provide)
- Chat API commands
- Search API commands
- Suggestion data format

### To THE_PO (Decisions Needed)
- Default embedding provider (OpenAI vs Voyage vs Local)
- Token budget for RAG context
- Suggestion frequency and triggers

---

## Resources

### Documentation
- **PRD AI Features**: `docs/PRD.md` Sections F3-F5
- **Data Model**: `specs/001-jot-storage-vault-indexing/data-model.md`

### External Docs
- **Claude API**: https://docs.anthropic.com/
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **sqlite-vec**: https://github.com/asg017/sqlite-vec

---

## Next Steps for AI Team

1. **Coordinate with BE_GEEKS** on file watcher integration
2. **Set up AI module structure** (`src-tauri/src/ai/`)
3. **Add dependencies** to Cargo.toml
4. **Implement embeddings.rs** (start with OpenAI API)
5. **Implement search.rs** (sqlite-vec integration)
6. **Test with sample vault data**

**Note**: AI features depend on BE_GEEKS completing the file watcher and basic jot storage. Start with embeddings module design while waiting.

---

**Last Updated**: 2026-01-19
**Status**: Ready for planning, waiting for backend dependencies
