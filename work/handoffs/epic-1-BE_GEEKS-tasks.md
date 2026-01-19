# Backend Development Tasks - Jot Storage System

**Status**: 🟡 IN PROGRESS (40% complete)
**Tech Stack**: Rust, Tauri 2.x, SQLite, rusqlite
**Branch**: `001-jot-storage-vault-indexing`

---

## What's Already Done ✅

### Phase 1 & 2: Foundation (COMPLETE)
- ✅ Project structure created
- ✅ Dependencies added to Cargo.toml (rusqlite, serde_yaml, thiserror, regex, chrono, notify, rand)
- ✅ SQLite connection with WAL mode (`src-tauri/src/db/connection.rs`)
- ✅ Database migrations with schema (`src-tauri/src/db/migrations.rs`)
- ✅ Data models defined (`src-tauri/src/jots/models.rs`):
  - `Jot` struct
  - `JotFrontmatter` struct
  - `JotError` enum with thiserror
  - `CreateJotInput` and `UpdateJotInput`

### Phase 3: Backend Implementation (PARTIAL - 50% complete)
- ✅ **Parser module** (`src-tauri/src/jots/parser.rs`) - COMPLETE
  - `extract_tags()` - Parses `#tags` from content
  - `extract_links()` - Parses `[[wiki-links]]` from content
  - `parse_jot_file()` - Parses markdown file with YAML frontmatter
  - `serialize_jot()` - Converts Jot to markdown
  - ✅ All tests passing (9/9)

- ✅ **Storage module** (`src-tauri/src/jots/storage.rs`) - COMPLETE
  - `create_jot()` - Creates new jot file in `.scribel/jots/`
  - `read_jot()` - Reads jot from file
  - `update_jot()` - Updates jot content
  - `delete_jot()` - Deletes jot file
  - `set_promoted()` - Marks jot as promoted
  - ✅ All tests passing (7/7)

---

## What Needs to be Done 🔨

### High Priority - Complete Backend MVP

#### 1. SQLite Index Module (`src-tauri/src/jots/index.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

Implement these functions:
```rust
// T036-T040
pub fn insert_jot(conn: &Connection, jot: &Jot) -> Result<(), JotError>
pub fn update_jot_index(conn: &Connection, jot: &Jot) -> Result<(), JotError>
pub fn delete_jot_index(conn: &Connection, id: &str) -> Result<(), JotError>
pub fn get_jots(conn: &Connection, limit: u32, offset: u32) -> Result<Vec<Jot>, JotError>
pub fn search_jots(conn: &Connection, query: &str, limit: u32) -> Result<Vec<Jot>, JotError>
```

**Key Points**:
- Use prepared statements (prevent SQL injection)
- Convert Jot to/from SQLite rows
- Serialize tags/links as JSON arrays
- Store timestamps as Unix milliseconds
- Order by `created_at ASC` for get_jots (oldest first)
- Use `LIKE '%query%'` for search_jots (case-insensitive)

**Reference**:
- Schema in `/specs/001-jot-storage-vault-indexing/data-model.md` Section 2.1
- Performance targets in `/specs/001-jot-storage-vault-indexing/plan.md`

---

#### 2. Tauri Commands (`src-tauri/src/commands/jots.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 3-4 hours

Implement these 8 Tauri commands (T041-T048):
```rust
#[tauri::command]
pub async fn create_jot(content: String, db: State<'_, Mutex<Connection>>, vault_path: State<'_, Mutex<String>>) -> Result<Jot, String>

#[tauri::command]
pub async fn get_jots(limit: Option<u32>, offset: Option<u32>, db: State<'_, Mutex<Connection>>) -> Result<Vec<Jot>, String>

#[tauri::command]
pub async fn get_jot(id: String, vault_path: State<'_, Mutex<String>>) -> Result<Jot, String>

#[tauri::command]
pub async fn update_jot(id: String, content: String, db: State<'_, Mutex<Connection>>, vault_path: State<'_, Mutex<String>>) -> Result<Jot, String>

#[tauri::command]
pub async fn delete_jot(id: String, db: State<'_, Mutex<Connection>>, vault_path: State<'_, Mutex<String>>) -> Result<(), String>

#[tauri::command]
pub async fn search_jots(query: String, limit: Option<u32>, db: State<'_, Mutex<Connection>>) -> Result<Vec<Jot>, String>

#[tauri::command]
pub async fn set_jot_promoted(id: String, promoted: bool, db: State<'_, Mutex<Connection>>, vault_path: State<'_, Mutex<String>>) -> Result<Jot, String>

#[tauri::command]
pub async fn rebuild_jot_index(db: State<'_, Mutex<Connection>>, vault_path: State<'_, Mutex<String>>) -> Result<u32, String>
```

**Key Points**:
- Each command calls storage + index functions
- Lock db/vault_path mutexes only when needed
- Convert `JotError` to `String` for Tauri responses
- Use `async` for all commands (non-blocking)
- Register all commands in `src-tauri/src/lib.rs`

**Reference**:
- API contract in `/specs/001-jot-storage-vault-indexing/contracts/jot-api.md`

---

#### 3. Register Commands in lib.rs (T049)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 15 minutes

Update `src-tauri/src/lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    greet, // existing
    commands::jots::create_jot,
    commands::jots::get_jots,
    commands::jots::get_jot,
    commands::jots::update_jot,
    commands::jots::delete_jot,
    commands::jots::search_jots,
    commands::jots::set_jot_promoted,
    commands::jots::rebuild_jot_index,
])
```

---

### Medium Priority - File Watcher (Optional for MVP)

#### 4. File Watcher Module (`src-tauri/src/jots/watcher.rs`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

Implement file watcher for external edits (T050-T051):
```rust
pub fn watch_jots_folder(jots_path: &Path, on_change: impl Fn(Event) + Send + 'static) -> Result<impl Watcher>
```

**Key Points**:
- Use `notify` crate with `recommended_watcher`
- Watch `.scribel/jots/` folder only (non-recursive)
- Detect Create, Modify, Remove events
- Re-parse changed files and update index
- Integrate in Tauri setup hook

**Reference**:
- Research decision in `/specs/001-jot-storage-vault-indexing/research.md` Section 3
- Implementation guide in `/specs/001-jot-storage-vault-indexing/quickstart.md` Phase 4

---

## Testing & Verification

### Run Tests
```bash
cd src-tauri
cargo test
```

**Current Status**:
- ✅ Parser tests: 9/9 passing
- ✅ Storage tests: 7/7 passing
- ⏳ Index tests: 0/0 (not written yet)
- ⏳ Integration tests: 0/0 (not written yet)

### Manual Testing (after commands implemented)
```bash
# Build and run
cargo run

# In browser DevTools console:
await __TAURI__.invoke('create_jot', { content: 'Test #tag [[Link]]' });
await __TAURI__.invoke('get_jots', { limit: 10, offset: 0 });
```

---

## Build & Run

```bash
# From project root
cd src-tauri

# Build
cargo build

# Run in dev mode
cargo run

# Run tests
cargo test

# Check for compilation errors
cargo check
```

---

## Performance Targets

| Operation | Target | Implementation Notes |
|-----------|--------|---------------------|
| `create_jot` | <50ms | File write + index insert |
| `get_jots` (50 items) | <100ms | Index query only |
| `get_jot` | <30ms | Single file read |
| `search_jots` | <500ms | SQLite LIKE query |

---

## File Structure

```
src-tauri/
├── src/
│   ├── lib.rs                      ✅ Updated with setup
│   ├── config.rs                   ✅ Placeholder
│   ├── db/
│   │   ├── mod.rs                  ✅ Complete
│   │   ├── connection.rs           ✅ Complete (WAL mode)
│   │   └── migrations.rs           ✅ Complete (schema)
│   ├── jots/
│   │   ├── mod.rs                  ✅ Complete
│   │   ├── models.rs               ✅ Complete (all types)
│   │   ├── parser.rs               ✅ Complete + tested
│   │   ├── storage.rs              ✅ Complete + tested
│   │   ├── index.rs                ⏳ TODO - SQLite operations
│   │   └── watcher.rs              ⏳ TODO - File watching
│   └── commands/
│       ├── mod.rs                  ✅ Complete
│       └── jots.rs                 ⏳ TODO - Tauri commands
└── Cargo.toml                      ✅ All dependencies added
```

---

## Resources

### Documentation
- **Implementation Plan**: `/specs/001-jot-storage-vault-indexing/plan.md`
- **Data Model**: `/specs/001-jot-storage-vault-indexing/data-model.md`
- **API Contract**: `/specs/001-jot-storage-vault-indexing/contracts/jot-api.md`
- **Quickstart Guide**: `/specs/001-jot-storage-vault-indexing/quickstart.md`
- **Research Decisions**: `/specs/001-jot-storage-vault-indexing/research.md`

### Key References
- **Tauri Docs**: https://tauri.app/v2/guides/
- **rusqlite Docs**: https://docs.rs/rusqlite/latest/rusqlite/
- **notify Docs**: https://docs.rs/notify/latest/notify/

---

## Next Steps for Backend Team

1. **Implement index.rs** (T036-T040) - 2-3 hours
   - Start with `insert_jot` and `get_jots`
   - Write tests as you go
   - Use prepared statements

2. **Implement commands/jots.rs** (T041-T048) - 3-4 hours
   - Start with `create_jot` and `get_jots`
   - Test with Tauri DevTools console
   - Register commands in lib.rs

3. **Optional: File watcher** (T050-T051) - 2-3 hours
   - Can be deferred to v1.1
   - MVP works without it

**Total Estimated Time**: 5-7 hours for MVP (without file watcher)

---

## Questions? Issues?

- Check `/specs/001-jot-storage-vault-indexing/quickstart.md` for detailed implementation guide
- Review test examples in existing modules (parser.rs, storage.rs)
- SQLite schema is in `src-tauri/src/db/migrations.rs`

**Last Updated**: 2026-01-19
**Status**: Ready for index + commands implementation
