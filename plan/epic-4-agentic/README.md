# Epic 4: Agentic Capabilities

**Goal:** AI can read/write vault files

This Epic gives the AI agent the ability to create, edit, and organize notes on user request with confirmation and undo support.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 4.1 | AI Tool Definitions | F6 | Pending | Define Claude tools for file ops |
| 4.2 | File Operations | F6 | Pending | Implement read/write/edit handlers |
| 4.3 | Jot Promotion | F6 | Pending | Convert jots to standalone notes |

## Success Criteria

- AI can create notes from jots on request
- All write operations require user confirmation
- Undo support for all write operations
- AI can search vault and jots semantically

## Dependencies

- Epic 1: Foundation (completed)
- Epic 2: Vault Integration (file access)
- Epic 3: Intelligence (semantic search for tools)

## AI Tools

```
read_file(path)        — Read vault markdown file
write_file(path, content) — Create/overwrite file
edit_file(path, edits) — Make targeted edits
list_directory(path)   — List vault contents
search_vault(query)    — Semantic search
search_jots(query, filters) — Search jots
promote_jot(id, path)  — Convert jot to note
```

## Tech Considerations

- Use Claude's tool use feature
- Confirmation modal in frontend
- Undo stack with file snapshots
