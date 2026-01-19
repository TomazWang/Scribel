# Epic 2: Vault Integration - Planning Complete

**Date**: 2026-01-19
**Status**: ✅ PLANNING COMPLETE - READY FOR IMPLEMENTATION

---

## Summary

Epic 2 planning is complete. All specifications, plans, tasks, and team handoff notes have been created and approved by both THE_PO and MASTER_TL.

---

## Deliverables Created

### Specifications

✅ **Feature 001: Vault Configuration**
- Location: `specs/epic-2-feat-001-vault-config/spec.md`
- Status: Approved by THE_PO & MASTER_TL
- Goal: Replace hardcoded vault path with user configuration
- Priority: P0 (MVP Blocker)

✅ **Feature 002: File Watcher - Jots Folder**
- Location: `specs/epic-2-feat-002-file-watcher-jots/spec.md`
- Status: Approved by THE_PO & MASTER_TL
- Goal: Auto-detect external changes to jot files
- Priority: P0 (Foundation for Epic 3)

### Implementation Plans

✅ **Feature 001 Plan**
- Location: `specs/epic-2-feat-001-vault-config/plan.md`
- Phases: 5 (Backend foundation, detection, commands, FE onboarding, FE settings)
- Estimated Duration: 4-5 days (with parallel work)

✅ **Feature 002 Plan**
- Location: `specs/epic-2-feat-002-file-watcher-jots/plan.md`
- Phases: 5 (Setup, watcher core, event handlers, commands, FE integration)
- Estimated Duration: 4-5 days (after Feature 001)

### Task Lists

✅ **Feature 001 Tasks**
- Location: `specs/epic-2-feat-001-vault-config/tasks.md`
- Total Tasks: 36
  - BE_GEEKS: 18 implementation + 5 testing = 23 tasks
  - FE_DUDES: 12 implementation + 1 testing = 13 tasks
  - Both Teams: 3 integration testing tasks

✅ **Feature 002 Tasks**
- Location: `specs/epic-2-feat-002-file-watcher-jots/tasks.md`
- Total Tasks: 36
  - BE_GEEKS: 22 implementation + 10 testing = 32 tasks
  - FE_DUDES: 3 implementation + 1 testing = 4 tasks
  - Both Teams: 1 manual testing task

### Team Handoff Notes

✅ **BE_GEEKS Handoff**
- Location: `work/handoffs/epic-2/epic-2-BE_GEEKS-tasks.md`
- Content: Comprehensive task breakdown, code examples, testing strategy, build commands
- Duration: 5-7 days total

✅ **FE_DUDES Handoff**
- Location: `work/handoffs/epic-2/epic-2-FE_DUDES-tasks.md`
- Content: UI mockups, component structure, mocking strategy, integration points
- Duration: 3-4 days total

### Reviews & Approvals

✅ **THE_PO Specification Review**
- Location: `work/handoffs/epic-2/epic-2-MASTER_TL-spec-review.md`
- Status: Approved (both features)
- Key Decisions: P0/P1 priorities, MVP scope, phased implementation

✅ **MASTER_TL Technical Review**
- Location: `work/handoffs/epic-2/epic-2-MASTER_TL-spec-review.md`
- Status: Approved (both features)
- Key Decisions: Architecture patterns, risk mitigations, performance targets

✅ **Plan Approvals**
- Location: `work/handoffs/epic-2/epic-2-plan-approvals.md`
- THE_PO: ✅ Approved
- MASTER_TL: ✅ Approved

---

## Implementation Timeline

### Week 1: Feature 001 (Vault Configuration)

**Day 1-2: Backend (BE_GEEKS)**
- Phase 1: Config storage (T001-T005)
- Phase 2: Vault detection (T006-T011)

**Day 2-3: Tauri Commands (BE_GEEKS)**
- Phase 3: Commands (T012-T018)

**Day 1-3: Frontend (FE_DUDES) - Can start with mocks**
- Phase 4: Onboarding UI (T019-T024)
- Phase 5: Settings panel (T025-T030) - after backend complete

**Day 3: Integration (Both Teams)**
- Testing (T031-T036)

---

### Week 2: Feature 002 (File Watcher)

**Prerequisite**: Feature 001 must be complete

**Day 4: Backend Setup (BE_GEEKS)**
- Phase 1: Dependencies & setup (T001-T005)
- Phase 2: Watcher core (T006-T009)

**Day 5: Backend Handlers (BE_GEEKS)**
- Phase 3: Event handlers (T010-T015)

**Day 6: Backend Commands (BE_GEEKS)**
- Phase 4: Tauri commands (T016-T022)

**Day 6-7: Frontend (FE_DUDES)**
- Phase 5: Event listeners (T023-T025)

**Day 7: Testing (Both Teams)**
- Integration & performance testing (T026-T036)

---

## Success Criteria

### Feature 001 (Vault Configuration)
- [ ] 95% of users complete vault selection within 60 seconds
- [ ] Auto-detection finds vaults for 95% of Obsidian users
- [ ] Vault path persists across app restarts
- [ ] All performance targets met (<3s detection, <500ms validation)

### Feature 002 (File Watcher)
- [ ] 95% of external edits reflected in UI within 2 seconds
- [ ] Index matches file system 100% of the time
- [ ] CPU usage <1% when idle
- [ ] No memory leaks over 1000+ events

---

## Team Coordination

### Work Strategy

**Parallel Work Opportunities**:
- BE_GEEKS and FE_DUDES can work in parallel on Feature 001
- FE_DUDES can use mocked commands to start UI work early
- Integrate real commands once backend is ready

**Sequential Dependencies**:
- Feature 002 **BLOCKS** on Feature 001 completion
- Cannot start file watcher until vault path configuration exists

### Communication Protocols

**Code Comments**:
```typescript
// AI-DEV-NOTE: @BE_GEEKS - Need VaultInfo type exported -- by @FE_DUDES
```

**Handoff Documents**:
- `epic-2-f1-BE_GEEKS-to-FE_DUDES.md` - After Feature 001 backend complete
- `epic-2-f1-TEAM-to-THE_PO.md` - When Feature 001 ready for review
- `epic-2-f2-TEAM-to-THE_PO.md` - When Feature 002 ready for review

---

## Documentation Index

### For BE_GEEKS

**Your Handoff**: `work/handoffs/epic-2/epic-2-BE_GEEKS-tasks.md`

**Key Documents**:
- Feature 001 Spec: `specs/epic-2-feat-001-vault-config/spec.md`
- Feature 001 Plan: `specs/epic-2-feat-001-vault-config/plan.md`
- Feature 001 Tasks: `specs/epic-2-feat-001-vault-config/tasks.md`
- Feature 002 Spec: `specs/epic-2-feat-002-file-watcher-jots/spec.md`
- Feature 002 Plan: `specs/epic-2-feat-002-file-watcher-jots/plan.md`
- Feature 002 Tasks: `specs/epic-2-feat-002-file-watcher-jots/tasks.md`

**Build Commands**:
```bash
cd src-tauri
cargo test
cargo clippy
cargo tauri dev
```

---

### For FE_DUDES

**Your Handoff**: `work/handoffs/epic-2/epic-2-FE_DUDES-tasks.md`

**Key Documents**:
- Feature 001 Spec: `specs/epic-2-feat-001-vault-config/spec.md`
- Feature 002 Spec: `specs/epic-2-feat-002-file-watcher-jots/spec.md`

**Build Commands**:
```bash
npm install
npm run dev
npm test
npm run type-check
```

---

## Next Steps

1. ✅ Epic 2 planning complete
2. ⏭️ **BE_GEEKS**: Start Feature 001, Phase 1 (config storage)
3. ⏭️ **FE_DUDES**: Start Feature 001, Phase 4 (onboarding with mocks)
4. ⏭️ Both teams coordinate after backend commands ready
5. ⏭️ Complete Feature 001, then start Feature 002

---

## Notes

- **Epic 1** is currently in progress (backend 40%, frontend 0%)
- **Epic 2** can start immediately (no blockers from Epic 1)
- **Epic 3** (AI/RAG) requires Epic 2 completion (needs vault path and file watcher)

---

**Planning Completed By**: MASTER_TL
**Planning Approved By**: THE_PO, MASTER_TL
**Ready For**: Implementation (both teams)
**Date**: 2026-01-19

---

## Contact

**Questions for THE_PO**: Product decisions, scope, priorities
**Questions for MASTER_TL**: Technical architecture, patterns, performance

**Communication**: Use handoff documents and AI-DEV-NOTE comments

---

🎉 **Epic 2 is ready for squad implementation!**
