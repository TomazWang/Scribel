# Handoff: epic-1-feat-001 Architecture Review & Task Assignment

**From**: MASTER_TL
**To**: BE_GEEKS, FE_DUDES
**Epic/Feature**: epic-1 / feat-001 (Jot Storage & Quick Jot Interface)
**Date**: 2026-01-19
**Status**: ✅ APPROVED - Ready for Implementation

---

## Summary

I have reviewed the complete specification for **epic-1-feat-001-jot-storage-vault-indexing** and confirmed that:

1. ✅ The feature spec is complete and well-documented
2. ✅ Backend and frontend tasks are clearly defined
3. ✅ Architecture follows constitution principles (markdown-first, performance targets)
4. ✅ API contract is well-defined with clear boundaries
5. ✅ Dependencies and execution order are properly sequenced

**Both teams are cleared to begin implementation.**

---

## Architecture Decisions

### 1. Markdown-First Storage (Backend)

**Decision**: Jots are stored as individual `.md` files with YAML frontmatter in `.scribel/jots/`.

**Rationale**:
- Obsidian compatibility (users can view/edit jots in Obsidian)
- No vendor lock-in (plain text files)
- SQLite used only for indexing (can be rebuilt from files)
- Crash safety: files survive database corruption

**Implementation Notes for BE_GEEKS**:
- Use atomic file operations (write to temp, then rename)
- SQLite WAL mode for concurrent access
- File watcher detects external edits (optional for MVP)

### 2. Optimistic UI Updates (Frontend)

**Decision**: Frontend uses optimistic updates for create/delete operations.

**Rationale**:
- Instant user feedback (<50ms perceived latency)
- Meets performance target: "Jot creation latency <50ms"
- Rollback on error maintains consistency

**Implementation Notes for FE_DUDES**:
- Create temp jot with negative ID immediately
- Call backend API asynchronously
- Replace temp jot with real jot on success
- Remove temp jot on error (show toast)

### 3. Phase-Based Implementation

**Decision**: Backend completes before frontend integration.

**Execution Order**:
1. **Phase 1-2: Foundation** (Both teams) - COMPLETE ✅
2. **Phase 3: Backend Implementation** (BE_GEEKS) - IN PROGRESS 🟡
3. **Phase 4: Frontend Implementation** (FE_DUDES) - Starts after Phase 3 ⏳
4. **Phase 5: Integration & Polish** (Both teams) - Final 🎯

---

## Team Tasks

### BE_GEEKS Tasks

**Current Status**: 40% complete (parser + storage done)

**Next Steps** (5-7 hours for MVP):

1. **SQLite Index Module** (`src-tauri/src/jots/index.rs`)
   - Tasks: T036-T040
   - Estimated: 2-3 hours
   - Priority: HIGH
   - Functions: `insert_jot`, `update_jot_index`, `delete_jot_index`, `get_jots`, `search_jots`

2. **Tauri Commands** (`src-tauri/src/commands/jots.rs`)
   - Tasks: T041-T048
   - Estimated: 3-4 hours
   - Priority: HIGH
   - 8 commands total (see API contract)

3. **Register Commands** (`src-tauri/src/lib.rs`)
   - Task: T049
   - Estimated: 15 minutes
   - Priority: HIGH

4. **File Watcher** (OPTIONAL for MVP)
   - Tasks: T050-T051
   - Estimated: 2-3 hours
   - Priority: MEDIUM
   - Can be deferred to v1.1

**Reference Document**: `work/handoffs/epic-1/epic-1-BE_GEEKS-tasks.md`

**API Contract**: `specs/epic-1-feat-001-jot-storage-vault-indexing/contracts/jot-api.md`

---

### FE_DUDES Tasks

**Current Status**: 0% complete (waiting for backend)

**Can Start Now** (5-7 hours independent work):

1. **Utilities** (Independent of backend)
   - `src/utils/parseJot.ts` - T066-T068 (1-2 hours)
   - `src/utils/formatTime.ts` - T069-T070 (1 hour)
   - Write tests first (TDD approach)

2. **Components** (Can use mock data)
   - `JotContent.tsx` - T071 (1 hour)
   - `JotItem.tsx` - T072 (1 hour)
   - `JotList.tsx` - T073 (1-2 hours)
   - `JotInput.tsx` + tests - T074, T058 (1 hour)

**Requires Backend Complete** (4-5 hours):

3. **API Integration**
   - `src/api/jots.ts` - T059-T065 (1 hour)
   - `src/hooks/useJots.ts` - T075 (2-3 hours)
   - `JotPanel.tsx` - T076 (30 min)
   - Update `App.tsx` - T077 (15 min)

4. **Polish**
   - Dark mode styling - T078 (1 hour)
   - Testing - T079-T080 (1 hour)

**Reference Document**: `work/handoffs/epic-1/epic-1-FE_DUDES-tasks.md`

**Feature Spec**: `specs/epic-1-feat-001-jot-storage-vault-indexing/spec.md`

---

## Critical Dependencies

### Backend → Frontend

Frontend CANNOT proceed with API integration until:
- ✅ All 8 Tauri commands implemented (T041-T048)
- ✅ Commands registered in lib.rs (T049)
- ✅ Backend running and testable via DevTools

**Checkpoint**: Backend team should notify frontend when commands are ready for testing.

### Foundation → Both Teams

Both teams required Phase 2 (Foundational) to be complete:
- ✅ SQLite connection with WAL mode
- ✅ Database migrations
- ✅ Core data models (Jot struct)
- ✅ TypeScript types

**Status**: Foundation is COMPLETE ✅

---

## Communication Protocol

### Between Teams

Use **code comments** for inline coordination:

```typescript
// AI-DEV-NOTE: @BE_GEEKS - Need tags array in response, not JSON string -- by @FE_DUDES
```

```rust
// AI-DEV-NOTE: @FE_DUDES - Command ready: invoke('create_jot', {content}) -- by @BE_GEEKS
```

### To MASTER_TL

Create handoff document when:
- Architecture decision needed
- Technical blocker
- Performance concern
- Pattern clarification

### To THE_PO

Create handoff document when:
- Feature scope question
- UX decision needed
- Requirements clarification
- Ready for approval/merge

---

## Performance Targets (Non-Negotiable)

| Metric | Target | Team | Measurement |
|--------|--------|------|-------------|
| Create jot latency | <50ms | BE_GEEKS | Backend only (file + index) |
| Get jots (50 items) | <100ms | BE_GEEKS | SQLite query time |
| UI perceived latency | <50ms | FE_DUDES | Optimistic update (instant) |
| Scroll performance | 60fps | FE_DUDES | Chrome DevTools FPS meter |

**Testing**: Use `performance.now()` in backend, React DevTools Profiler in frontend.

---

## Testing Strategy

### Backend (BE_GEEKS)

```bash
# Run unit tests
cd src-tauri && cargo test

# Test commands via DevTools console
cargo run
# In browser: await __TAURI__.invoke('create_jot', {content: 'test'})
```

**Test Coverage Expected**:
- ✅ Parser: 9/9 tests passing
- ✅ Storage: 7/7 tests passing
- ⏳ Index: Write tests as you implement (TDD)
- ⏳ Commands: Integration tests for each command

### Frontend (FE_DUDES)

```bash
# Run unit tests
npm test

# Test in dev mode
npm run dev
```

**Test Coverage Expected**:
- Utilities: 100% (parseJot, formatTime)
- Components: Core interactions (JotInput)
- Integration: Manual testing with real backend

---

## File Structure Reference

### Spec Location (Updated Path)

```
specs/epic-1-feat-001-jot-storage-vault-indexing/
├── spec.md              # Feature overview
├── plan.md              # Implementation plan
├── tasks.md             # Detailed task breakdown
├── data-model.md        # Database schema, file format
├── quickstart.md        # Step-by-step implementation guide
├── research.md          # Technology decisions
└── contracts/
    └── jot-api.md       # API contract (8 commands)
```

### Backend Files (BE_GEEKS Territory)

```
src-tauri/src/
├── jots/
│   ├── models.rs        ✅ DONE
│   ├── parser.rs        ✅ DONE + TESTED
│   ├── storage.rs       ✅ DONE + TESTED
│   ├── index.rs         ⏳ TODO (T036-T040)
│   └── watcher.rs       ⏳ OPTIONAL (T050-T051)
├── commands/
│   └── jots.rs          ⏳ TODO (T041-T048)
├── db/
│   ├── connection.rs    ✅ DONE
│   └── migrations.rs    ✅ DONE
└── lib.rs               ⏳ UPDATE (T049)
```

### Frontend Files (FE_DUDES Territory)

```
src/
├── types/
│   └── jot.ts           ✅ DONE
├── utils/
│   ├── parseJot.ts      ⏳ TODO (T066-T068)
│   └── formatTime.ts    ⏳ TODO (T069-T070)
├── api/
│   └── jots.ts          ⏳ TODO (T059-T065) - after backend
├── hooks/
│   └── useJots.ts       ⏳ TODO (T075) - after backend
└── components/
    ├── JotContent.tsx   ⏳ TODO (T071)
    ├── JotItem.tsx      ⏳ TODO (T072)
    ├── JotList.tsx      ⏳ TODO (T073)
    ├── JotInput.tsx     ⏳ TODO (T074)
    └── JotPanel.tsx     ⏳ TODO (T076)
```

---

## Quality Gates

### Backend Completion Criteria

- [ ] All 8 Tauri commands implemented
- [ ] Commands testable via `__TAURI__.invoke()` in DevTools
- [ ] All unit tests passing (`cargo test`)
- [ ] Performance targets met (<50ms create, <100ms get)
- [ ] Files created in `.scribel/jots/` with valid YAML frontmatter

### Frontend Completion Criteria

- [ ] Input submits on Enter, clears after submission
- [ ] Jots appear immediately (optimistic updates)
- [ ] Tags highlighted in blue, links in purple
- [ ] Relative timestamps display correctly
- [ ] Delete button works (hover → click → remove)
- [ ] Dark mode styling complete
- [ ] All tests passing (`npm test`)
- [ ] 60fps scroll performance

### Integration Completion Criteria

- [ ] End-to-end flow: type → submit → file created → app restart → jot persists
- [ ] External edit detected (modify file in editor → UI updates)
- [ ] Performance: create_jot <50ms, UI update <50ms perceived
- [ ] Error handling: network errors, validation errors, file errors

---

## Branch & Naming Convention

**Branch**: `feature/epic-1-f1-be-jot-storage` (BE_GEEKS)
**Branch**: `feature/epic-1-f1-fe-jot-input` (FE_DUDES)
**Base**: `main`

**Spec Path**: `specs/epic-1-feat-001-jot-storage-vault-indexing/`

This follows our new naming convention from constitution v1.1.0.

---

## Next Steps

### For BE_GEEKS:
1. Read `epic-1-BE_GEEKS-tasks.md` in detail
2. Start with index.rs (T036-T040)
3. Implement commands (T041-T048)
4. Test via DevTools console
5. Create handoff to FE_DUDES when commands ready
6. Create handoff to THE_PO when complete

### For FE_DUDES:
1. Read `epic-1-FE_DUDES-tasks.md` in detail
2. Start with utilities (T066-T070) - independent work
3. Build components with mock data (T071-T074)
4. Wait for BE_GEEKS handoff confirming commands ready
5. Implement API integration (T059-T065, T075-T077)
6. Polish and test (T078-T080)
7. Create handoff to THE_PO when complete

### For MASTER_TL (Me):
- Monitor progress in both worktrees
- Answer architecture questions
- Review code patterns
- Coordinate integration phase
- Final technical review before THE_PO approval

---

## Resources

### Key Documents
- **Epic Overview**: `plan/epics.md` → Epic 1: Foundation
- **Feature Spec**: `specs/epic-1-feat-001-jot-storage-vault-indexing/spec.md`
- **API Contract**: `specs/epic-1-feat-001-jot-storage-vault-indexing/contracts/jot-api.md`
- **Data Model**: `specs/epic-1-feat-001-jot-storage-vault-indexing/data-model.md`
- **Quickstart**: `specs/epic-1-feat-001-jot-storage-vault-indexing/quickstart.md`

### Constitution Reference
- **Performance Thresholds**: `.specify/memory/constitution.md` Section I
- **Naming Conventions**: `.specify/memory/constitution.md` Section "Naming Conventions"
- **Team File Ownership**: `.specify/memory/constitution.md` Section "Team File Ownership"

### External Docs
- Tauri Commands: https://tauri.app/v2/guides/features/command/
- rusqlite: https://docs.rs/rusqlite/latest/rusqlite/
- React 19: https://react.dev/
- Tailwind CSS 4: https://tailwindcss.com/docs

---

## Questions or Blockers?

**For Architecture/Technical**:
- Create handoff to MASTER_TL

**For Product/Scope**:
- Create handoff to THE_PO

**For Team Coordination**:
- Use AI-DEV-NOTE comments in code
- Update handoff notes in `work/handoffs/epic-1/`

---

## Sign-Off

✅ **Architecture Approved**: This implementation plan follows all constitution principles:
- ✅ Performance-First Architecture (targets defined)
- ✅ Local-First & Privacy by Design (markdown files, no cloud)
- ✅ Obsidian Compatibility (YAML frontmatter, wiki-links)
- ✅ Crash Safety & Data Integrity (WAL mode, atomic operations)
- ✅ Simplicity (YAGNI, no over-engineering)

✅ **Teams Cleared to Proceed**

---

**MASTER_TL**
*Technical Lead - Scribel Project*
*2026-01-19*
