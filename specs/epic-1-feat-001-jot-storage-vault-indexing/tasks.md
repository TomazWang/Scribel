# Tasks: Jot Storage & Quick Jot Interface

**Branch**: `001-jot-storage-vault-indexing`
**Input**: Design documents from `/specs/001-jot-storage-vault-indexing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Tests**: Unit and integration tests are included based on the testing strategy in the spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 = Backend, US2 = Frontend)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency configuration

- [ ] T001 Add Rust dependencies to src-tauri/Cargo.toml (rusqlite, serde_yaml, thiserror, regex, chrono, notify, rand)
- [ ] T002 Create jots module structure: src-tauri/src/jots/ with mod.rs, models.rs, storage.rs, parser.rs, index.rs, watcher.rs
- [ ] T003 [P] Create db module structure: src-tauri/src/db/ with mod.rs, connection.rs, migrations.rs
- [ ] T004 [P] Create commands module: src-tauri/src/commands/ with mod.rs, jots.rs
- [ ] T005 [P] Create config module: src-tauri/src/config.rs
- [ ] T006 [P] Create frontend directories: src/components/, src/hooks/, src/api/, src/types/, src/utils/
- [ ] T007 [P] Create test directories: src-tauri/tests/ and src/__tests__/utils/, src/__tests__/components/
- [ ] T008 Run cargo build to verify Rust dependencies
- [ ] T009 Run npm install to verify frontend dependencies

**Checkpoint**: Project structure created, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Implement SQLite connection with WAL mode in src-tauri/src/db/connection.rs
- [ ] T011 Implement schema migrations (jot_index table) in src-tauri/src/db/migrations.rs
- [ ] T012 Create Jot struct with serde derives in src-tauri/src/jots/models.rs
- [ ] T013 [P] Create JotFrontmatter struct in src-tauri/src/jots/models.rs
- [ ] T014 [P] Create CreateJotInput and UpdateJotInput structs in src-tauri/src/jots/models.rs
- [ ] T015 [P] Create JotError enum with thiserror in src-tauri/src/jots/models.rs
- [ ] T016 Export jots module in src-tauri/src/jots/mod.rs
- [ ] T017 Export db module in src-tauri/src/db/mod.rs
- [ ] T018 Setup Tauri app with db initialization and state management in src-tauri/src/lib.rs
- [ ] T019 Create TypeScript Jot interface in src/types/jot.ts

**Checkpoint**: Foundation ready - database initialized, core types defined, Tauri configured

---

## Phase 3: User Story 1 - Jot Storage Backend (Priority: P1) 🎯 MVP

**Goal**: Store jots as markdown files with SQLite indexing, support CRUD operations

**Independent Test**: Create jot via Tauri command, verify file exists in `.scribel/jots/`, restart app, verify jot persists

### Tests for User Story 1

- [ ] T020 [P] [US1] Write test for extract_tags function in src-tauri/src/jots/parser.rs
- [ ] T021 [P] [US1] Write test for extract_links function in src-tauri/src/jots/parser.rs
- [ ] T022 [P] [US1] Write test for parse_jot_file function in src-tauri/src/jots/parser.rs
- [ ] T023 [P] [US1] Write test for serialize_jot function in src-tauri/src/jots/parser.rs
- [ ] T024 [P] [US1] Write integration test for create and read jot in src-tauri/tests/jot_storage.rs
- [ ] T025 [P] [US1] Write integration test for delete jot in src-tauri/tests/jot_storage.rs
- [ ] T026 [P] [US1] Write integration test for index rebuild in src-tauri/tests/jot_storage.rs

### Implementation for User Story 1

- [ ] T027 [US1] Implement extract_tags using regex in src-tauri/src/jots/parser.rs
- [ ] T028 [US1] Implement extract_links using regex in src-tauri/src/jots/parser.rs
- [ ] T029 [US1] Implement parse_jot_file (frontmatter + content parsing) in src-tauri/src/jots/parser.rs
- [ ] T030 [US1] Implement serialize_jot (Jot to markdown with frontmatter) in src-tauri/src/jots/parser.rs
- [ ] T031 [US1] Implement generate_jot_id function (timestamp + hex) in src-tauri/src/jots/storage.rs
- [ ] T032 [US1] Implement create_jot (write file + return Jot) in src-tauri/src/jots/storage.rs
- [ ] T033 [US1] Implement read_jot (parse file) in src-tauri/src/jots/storage.rs
- [ ] T034 [US1] Implement update_jot (rewrite file with new content) in src-tauri/src/jots/storage.rs
- [ ] T035 [US1] Implement delete_jot (remove file) in src-tauri/src/jots/storage.rs
- [ ] T036 [P] [US1] Implement insert_jot for SQLite index in src-tauri/src/jots/index.rs
- [ ] T037 [P] [US1] Implement update_jot_index in src-tauri/src/jots/index.rs
- [ ] T038 [P] [US1] Implement delete_jot_index in src-tauri/src/jots/index.rs
- [ ] T039 [P] [US1] Implement get_jots with pagination in src-tauri/src/jots/index.rs
- [ ] T040 [P] [US1] Implement search_jots with LIKE query in src-tauri/src/jots/index.rs
- [ ] T041 [US1] Implement create_jot Tauri command in src-tauri/src/commands/jots.rs
- [ ] T042 [US1] Implement get_jots Tauri command in src-tauri/src/commands/jots.rs
- [ ] T043 [US1] Implement get_jot Tauri command in src-tauri/src/commands/jots.rs
- [ ] T044 [US1] Implement update_jot Tauri command in src-tauri/src/commands/jots.rs
- [ ] T045 [US1] Implement delete_jot Tauri command in src-tauri/src/commands/jots.rs
- [ ] T046 [US1] Implement search_jots Tauri command in src-tauri/src/commands/jots.rs
- [ ] T047 [US1] Implement set_jot_promoted Tauri command in src-tauri/src/commands/jots.rs
- [ ] T048 [US1] Implement rebuild_jot_index Tauri command in src-tauri/src/commands/jots.rs
- [ ] T049 [US1] Register all jot commands in Tauri builder in src-tauri/src/lib.rs
- [ ] T050 [US1] Implement file watcher for jots folder in src-tauri/src/jots/watcher.rs
- [ ] T051 [US1] Integrate file watcher in Tauri setup in src-tauri/src/lib.rs
- [ ] T052 [US1] Run cargo test to verify all backend tests pass
- [ ] T053 [US1] Manually test create_jot via Tauri DevTools console

**Checkpoint**: Backend fully functional - jots can be created, read, updated, deleted via Tauri commands

---

## Phase 4: User Story 2 - Quick Jot Interface (Priority: P2)

**Goal**: Single-line input with syntax-highlighted chronological jot list

**Independent Test**: Open app, type in input, press Enter, verify jot appears with highlighted tags/links, hover and delete

### Tests for User Story 2

- [ ] T054 [P] [US2] Write test for parseJotContent in src/__tests__/utils/parseJot.test.ts
- [ ] T055 [P] [US2] Write test for extractTags in src/__tests__/utils/parseJot.test.ts
- [ ] T056 [P] [US2] Write test for extractLinks in src/__tests__/utils/parseJot.test.ts
- [ ] T057 [P] [US2] Write test for formatRelativeTime in src/__tests__/utils/formatTime.test.ts
- [ ] T058 [P] [US2] Write component test for JotInput in src/__tests__/components/JotInput.test.tsx

### Implementation for User Story 2

- [ ] T059 [P] [US2] Implement createJot API wrapper in src/api/jots.ts
- [ ] T060 [P] [US2] Implement getJots API wrapper in src/api/jots.ts
- [ ] T061 [P] [US2] Implement getJot API wrapper in src/api/jots.ts
- [ ] T062 [P] [US2] Implement deleteJot API wrapper in src/api/jots.ts
- [ ] T063 [P] [US2] Implement searchJots API wrapper in src/api/jots.ts
- [ ] T064 [P] [US2] Implement setJotPromoted API wrapper in src/api/jots.ts
- [ ] T065 [P] [US2] Implement rebuildJotIndex API wrapper in src/api/jots.ts
- [ ] T066 [US2] Implement parseJotContent with regex in src/utils/parseJot.ts
- [ ] T067 [US2] Implement extractTags in src/utils/parseJot.ts
- [ ] T068 [US2] Implement extractLinks in src/utils/parseJot.ts
- [ ] T069 [US2] Implement formatRelativeTime with multi-tier logic in src/utils/formatTime.ts
- [ ] T070 [US2] Implement formatAbsoluteTime in src/utils/formatTime.ts
- [ ] T071 [US2] Implement JotContent component with syntax highlighting in src/components/JotContent.tsx
- [ ] T072 [US2] Implement JotItem component with delete button in src/components/JotItem.tsx
- [ ] T073 [US2] Implement JotList component with auto-scroll in src/components/JotList.tsx
- [ ] T074 [US2] Implement JotInput component with Enter-to-submit in src/components/JotInput.tsx
- [ ] T075 [US2] Implement useJots hook with optimistic updates in src/hooks/useJots.ts
- [ ] T076 [US2] Implement JotPanel container component in src/components/JotPanel.tsx
- [ ] T077 [US2] Update App.tsx to use JotPanel component
- [ ] T078 [US2] Add dark mode styling to all jot components
- [ ] T079 [US2] Run npm test to verify all frontend tests pass
- [ ] T080 [US2] Manually test full user flow: create, display, delete jots

**Checkpoint**: Frontend fully functional - jots can be created and viewed with syntax highlighting

---

## Phase 5: Integration & Polish

**Purpose**: Connect frontend to backend, verify end-to-end flow, optimize

- [ ] T081 Test end-to-end flow: create jot in UI → verify file created in `.scribel/jots/`
- [ ] T082 Test persistence: create jot → close app → reopen → verify jot appears
- [ ] T083 Test external edit detection: modify jot file in editor → verify app updates
- [ ] T084 Test index rebuild: delete scribel.db → reopen app → verify jots reload from files
- [ ] T085 [P] Performance test: create 100 jots → measure create_jot latency (<50ms target)
- [ ] T086 [P] Performance test: measure get_jots latency with 50 items (<100ms target)
- [ ] T087 [P] Performance test: verify scroll smoothness with 100+ jots (60fps target)
- [ ] T088 [P] Add vault path configuration UI (temporary: hardcoded path for MVP)
- [ ] T089 [P] Add error toast notifications for failed operations
- [ ] T090 Code cleanup: remove console.logs, unused imports
- [ ] T091 Run full test suite: cargo test && npm test
- [ ] T092 Verify all acceptance criteria from spec.md

**Checkpoint**: Feature complete, tested, ready for demo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase - Backend can proceed independently
- **User Story 2 (Phase 4)**: Depends on Foundational phase AND User Story 1 completion (needs backend API)
- **Integration & Polish (Phase 5)**: Depends on both User Stories 1 and 2

### User Story Dependencies

- **User Story 1 (Backend)**: Independent - only depends on Foundational phase
- **User Story 2 (Frontend)**: Depends on User Story 1 - needs backend commands to be available

### Within Each User Story

**User Story 1 (Backend)**:
1. Tests first (T020-T026) - write tests, ensure they fail
2. Parser implementation (T027-T030) - foundation for storage
3. Storage operations (T031-T035) - file I/O
4. Index operations (T036-T040) - SQLite queries
5. Tauri commands (T041-T048) - API layer
6. File watcher (T050-T051) - background monitoring
7. Verification (T052-T053)

**User Story 2 (Frontend)**:
1. Tests first (T054-T058) - write tests, ensure they fail
2. API wrappers (T059-T065) - parallel, call backend
3. Utilities (T066-T070) - parsing and formatting
4. Components bottom-up (T071-T074) - JotContent → JotItem → JotList → JotInput
5. Hooks (T075) - state management
6. Integration (T076-T077) - wire components together
7. Polish (T078) - dark mode
8. Verification (T079-T080)

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005, T006, T007 can all run in parallel after T002

**Phase 2 (Foundational)**: T013, T014, T015 can run in parallel after T012; T016, T017, T019 can run in parallel

**User Story 1 Tests**: T020, T021, T022, T023 can run in parallel; T024, T025, T026 can run in parallel

**User Story 1 Implementation**:
- T036-T040 (index operations) can run in parallel after T035
- T041-T048 (Tauri commands) can be started in parallel after T040

**User Story 2 Tests**: T054, T055, T056, T057, T058 can all run in parallel

**User Story 2 Implementation**:
- T059-T065 (API wrappers) can all run in parallel
- T066-T070 (utilities) can run in parallel after API wrappers

**Phase 5 (Integration)**: T085, T086, T087, T088, T089 can run in parallel

---

## Parallel Example: User Story 1 (Backend)

```bash
# Launch all parser tests together:
Task: "Write test for extract_tags function in src-tauri/src/jots/parser.rs"
Task: "Write test for extract_links function in src-tauri/src/jots/parser.rs"
Task: "Write test for parse_jot_file function in src-tauri/src/jots/parser.rs"
Task: "Write test for serialize_jot function in src-tauri/src/jots/parser.rs"

# Launch all index operations together (after storage complete):
Task: "Implement insert_jot for SQLite index in src-tauri/src/jots/index.rs"
Task: "Implement update_jot_index in src-tauri/src/jots/index.rs"
Task: "Implement delete_jot_index in src-tauri/src/jots/index.rs"
Task: "Implement get_jots with pagination in src-tauri/src/jots/index.rs"
Task: "Implement search_jots with LIKE query in src-tauri/src/jots/index.rs"
```

---

## Parallel Example: User Story 2 (Frontend)

```bash
# Launch all API wrappers together:
Task: "Implement createJot API wrapper in src/api/jots.ts"
Task: "Implement getJots API wrapper in src/api/jots.ts"
Task: "Implement getJot API wrapper in src/api/jots.ts"
Task: "Implement deleteJot API wrapper in src/api/jots.ts"
Task: "Implement searchJots API wrapper in src/api/jots.ts"

# Launch all utility tests together:
Task: "Write test for parseJotContent in src/__tests__/utils/parseJot.test.ts"
Task: "Write test for extractTags in src/__tests__/utils/parseJot.test.ts"
Task: "Write test for formatRelativeTime in src/__tests__/utils/formatTime.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T019) - CRITICAL
3. Complete Phase 3: User Story 1 Backend (T020-T053)
4. **STOP and VALIDATE**: Test backend via Tauri DevTools, verify files created
5. Demo backend functionality

**This gives you a working jot storage system without UI**

### Full Feature (Both User Stories)

1. Complete Setup + Foundational (T001-T019)
2. Complete User Story 1: Backend (T020-T053)
3. Complete User Story 2: Frontend (T054-T080)
4. Complete Integration & Polish (T081-T092)
5. **Each phase is independently testable**

### Sequential Execution (Single Developer)

1. Phase 1: Setup (1-2 hours)
2. Phase 2: Foundational (2-3 hours)
3. Phase 3: User Story 1 Backend (1 day)
4. Phase 4: User Story 2 Frontend (1 day)
5. Phase 5: Integration & Polish (4-6 hours)

**Total: 2-4 days**

### Parallel Team Strategy

With 2 developers after Foundational phase:
- Developer A: User Story 1 (Backend) - T020-T053
- Developer B: Start User Story 2 prep (tests, utilities) - T054-T070

Once US1 complete, Developer B can finish US2 (components, integration).

---

## Task Summary

- **Total Tasks**: 92
- **Setup Phase**: 9 tasks
- **Foundational Phase**: 10 tasks (BLOCKING)
- **User Story 1 (Backend)**: 34 tasks
  - Tests: 7 tasks
  - Implementation: 27 tasks
- **User Story 2 (Frontend)**: 27 tasks
  - Tests: 5 tasks
  - Implementation: 22 tasks
- **Integration & Polish**: 12 tasks

**Parallelizable Tasks**: 41 tasks marked with [P]

**Independent Test Criteria**:
- **US1**: Create jot via command → file exists → restart → jot persists
- **US2**: Type in UI → press Enter → jot appears → delete works

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (Backend only, no UI)
**Full Feature Scope**: All phases (T001-T092)

---

## Notes

- Tests are written FIRST (TDD approach) - verify they fail before implementation
- [P] tasks can run in parallel (different files, no dependencies)
- [US1] and [US2] labels map tasks to their user stories
- Commit after each logical group of tasks
- Run tests frequently: cargo test (backend), npm test (frontend)
- Stop at any checkpoint to validate independently
- Backend (US1) can be demoed without frontend
- Frontend (US2) requires backend (US1) to be complete
