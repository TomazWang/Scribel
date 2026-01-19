# Frontend Development Tasks - Quick Jot Interface

**Status**: ⏳ NOT STARTED (waiting for backend API)
**Tech Stack**: React 19, TypeScript 5.x, Tailwind CSS 4, Tauri API
**Branch**: `001-jot-storage-vault-indexing`

---

## What's Already Done ✅

### Phase 1 & 2: Foundation (COMPLETE)
- ✅ Project structure created
- ✅ TypeScript types defined (`src/types/jot.ts`):
  - `Jot` interface
  - `CreateJotInput` interface
  - `UpdateJotInput` interface
  - `JotError` type
- ✅ Directory structure created:
  - `src/components/`
  - `src/hooks/`
  - `src/api/`
  - `src/utils/`
  - `src/__tests__/utils/`
  - `src/__tests__/components/`
- ✅ Dependencies installed (React 19, Tailwind CSS 4, @tauri-apps/api)

---

## What Needs to be Done 🔨

### Prerequisites ⚠️

**IMPORTANT**: Frontend development requires backend Tauri commands to be implemented first.

**Backend Dependencies** (check with backend team):
- ✅ Backend types defined
- ⏳ Tauri commands registered (needed for API calls)
- ⏳ Backend running and testable

**You can start with**:
1. Utility functions (parsing, formatting) - independent of backend
2. Component structure (UI only, mock data)
3. Tests for utilities

**You'll need backend ready for**:
4. API wrappers (Tauri invoke calls)
5. useJots hook (actual API integration)
6. Full component integration with real data

---

## Task Breakdown

### Phase 1: Utilities & Helpers (Independent)

#### 1. Parse Jot Content (`src/utils/parseJot.ts`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1-2 hours
**Tasks**: T066-T068

Implement these functions:
```typescript
export type SegmentType = "text" | "tag" | "link";

export interface ParsedSegment {
  type: SegmentType;
  value: string;
}

// Parse content into segments for syntax highlighting
export function parseJotContent(content: string): ParsedSegment[]

// Extract all tags from content (without # prefix)
export function extractTags(content: string): string[]

// Extract all wiki-links from content (without [[ ]])
export function extractLinks(content: string): string[]
```

**Regex Patterns**:
- Tags: `/#([a-zA-Z][a-zA-Z0-9_-]*)/g`
- Links: `/\[\[([^\]]+)\]\]/g`

**Tests** (T054-T056):
```typescript
// src/__tests__/utils/parseJot.test.ts
test('parseJotContent parses plain text')
test('parseJotContent parses tags')
test('parseJotContent parses links')
test('parseJotContent parses mixed content')
test('extractTags extracts all tags')
test('extractLinks extracts all links')
```

**Reference**: `/specs/001-jot-storage-vault-indexing/specs/feature-1.3-quick-jot-interface.md` Section 6.1

---

#### 2. Format Time (`src/utils/formatTime.ts`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour
**Tasks**: T069-T070

Implement these functions:
```typescript
// Multi-tier relative time display
export function formatRelativeTime(timestamp: number): string

// Absolute time for tooltips
export function formatAbsoluteTime(timestamp: number): string
```

**Time Tiers**:
- < 1 min: "just now"
- < 1 hour: "X min ago"
- < 24 hours: "Xh ago"
- Today: "2:30 PM"
- Yesterday: "Yesterday 2:30 PM"
- Older: "Jan 19"

**Tests** (T057):
```typescript
// src/__tests__/utils/formatTime.test.ts
test('formatRelativeTime shows "just now" for recent timestamps')
test('formatRelativeTime shows minutes for recent past')
test('formatRelativeTime shows hours for same day')
test('formatRelativeTime shows time for today')
test('formatRelativeTime shows "Yesterday" correctly')
```

**Reference**: `/specs/001-jot-storage-vault-indexing/specs/feature-1.3-quick-jot-interface.md` Section 6.2

---

### Phase 2: API Wrappers (Requires Backend)

#### 3. Tauri API Wrappers (`src/api/jots.ts`)
**Status**: ⏳ NOT STARTED (waiting for backend commands)
**Estimated Time**: 1 hour
**Tasks**: T059-T065

Implement these functions:
```typescript
import { invoke } from "@tauri-apps/api/core";
import type { Jot } from "../types/jot";

export async function createJot(content: string): Promise<Jot>
export async function getJots(limit?: number, offset?: number): Promise<Jot[]>
export async function getJot(id: string): Promise<Jot>
export async function deleteJot(id: string): Promise<void>
export async function updateJot(id: string, content: string): Promise<Jot>
export async function searchJots(query: string, limit?: number): Promise<Jot[]>
export async function setJotPromoted(id: string, promoted: boolean): Promise<Jot>
export async function rebuildJotIndex(): Promise<number>
```

**Key Points**:
- Each function calls `invoke(command_name, args)`
- Return types match backend Tauri commands
- Errors are thrown as strings from backend

**Reference**: `/specs/001-jot-storage-vault-indexing/contracts/jot-api.md`

---

### Phase 3: React Components (Bottom-Up)

#### 4. JotContent Component (`src/components/JotContent.tsx`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour
**Task**: T071

Render jot text with syntax highlighting:
```typescript
interface JotContentProps {
  content: string;
}

export function JotContent({ content }: JotContentProps)
```

**Key Points**:
- Use `parseJotContent()` utility
- Render tags in blue (`text-blue-500`)
- Render links in purple (`text-purple-500`)
- Keep regular text unchanged

**Reference**: Section 4.4 in feature spec

---

#### 5. JotItem Component (`src/components/JotItem.tsx`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour
**Task**: T072

Display single jot with timestamp and delete button:
```typescript
interface JotItemProps {
  jot: Jot;
  onDelete: () => void;
}

export function JotItem({ jot, onDelete }: JotItemProps)
```

**Key Points**:
- Show relative timestamp using `formatRelativeTime()`
- Show delete button on hover
- Use `JotContent` component for content

**Reference**: Section 4.3 in feature spec

---

#### 6. JotList Component (`src/components/JotList.tsx`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1-2 hours
**Task**: T073

Scrollable container for jots:
```typescript
interface JotListProps {
  jots: Jot[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function JotList({ jots, onDelete, loading }: JotListProps)
```

**Key Points**:
- Display jots oldest→newest (chronological order)
- Auto-scroll to bottom when new jot added
- Show loading state
- Show empty state when no jots

**Reference**: Section 4.2 in feature spec

---

#### 7. JotInput Component (`src/components/JotInput.tsx`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour
**Task**: T074

Single-line input with Enter-to-submit:
```typescript
interface JotInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function JotInput({ onSubmit, disabled, autoFocus = true }: JotInputProps)
```

**Key Points**:
- Auto-focus on mount
- Submit on Enter (if non-empty)
- Clear input after submission
- Placeholder: "What's on your mind?"

**Tests** (T058):
```typescript
// src/__tests__/components/JotInput.test.tsx
test('calls onSubmit when Enter is pressed')
test('clears input after submission')
test('does not submit empty content')
```

**Reference**: Section 4.1 in feature spec

---

### Phase 4: State Management & Integration

#### 8. useJots Hook (`src/hooks/useJots.ts`)
**Status**: ⏳ NOT STARTED (requires backend API)
**Estimated Time**: 2-3 hours
**Task**: T075

Manage jot state with optimistic updates:
```typescript
interface UseJotsReturn {
  jots: Jot[];
  loading: boolean;
  error: string | null;
  createJot: (content: string) => Promise<void>;
  deleteJot: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useJots(): UseJotsReturn
```

**Key Points**:
- Load jots on mount (`getJots()`)
- Sort by `created_at` ascending (oldest first)
- **Optimistic updates**:
  - Add temp jot immediately (negative ID)
  - Call backend API
  - Replace temp jot on success
  - Remove temp jot on error
- Same pattern for delete (remove first, rollback on error)

**Reference**: Section 5.1 in feature spec

---

#### 9. JotPanel Container (`src/components/JotPanel.tsx`)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 30 minutes
**Task**: T076

Main container coordinating input and list:
```typescript
export function JotPanel()
```

**Key Points**:
- Use `useJots()` hook
- Pass data to `JotList` and `JotInput`
- Handle create and delete actions

**Reference**: Section 4.5 in feature spec

---

#### 10. Update App.tsx (T077)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 15 minutes

Wire JotPanel into main app:
```typescript
import { JotPanel } from './components/JotPanel';

function App() {
  return (
    <div className="h-screen flex flex-col">
      <header>...</header>
      <main className="flex-1 overflow-hidden">
        <JotPanel />
      </main>
    </div>
  );
}
```

---

### Phase 5: Polish & Testing

#### 11. Dark Mode Styling (T078)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour

Add dark mode classes to all components:
- Use Tailwind's `dark:` prefix
- Test both light and dark modes
- Respect system preference

---

#### 12. Run Tests & Manual Testing (T079-T080)
**Status**: ⏳ NOT STARTED
**Estimated Time**: 1 hour

```bash
# Run all tests
npm test

# Manual testing
npm run dev

# Test flow:
# 1. Type in input
# 2. Press Enter
# 3. Verify jot appears with highlighted tags/links
# 4. Hover over jot
# 5. Click delete
# 6. Verify jot disappears
```

---

## UI Design Reference

```
┌─────────────────────────────────────────────────────┐
│  Scribel                                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                              │   │
│  │  • 2:00 PM  [[Project X]] deadline tomorrow  │   │
│  │  • 2:15 PM  Call mom about dinner            │   │
│  │  • 2:30 PM  Research #ai embeddings for app  │   │
│  │  • 2:45 PM  Meeting with [[Sarah]] at 3pm    │   │
│  │                     ↓ (newest at bottom)     │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ What's on your mind?                      [↵] │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Colors**:
- Tags: Blue (`text-blue-500 dark:text-blue-400`)
- Links: Purple (`text-purple-500 dark:text-purple-400`)
- Timestamps: Muted gray (`text-neutral-400`)

---

## Build & Run

```bash
# From project root

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type check
npm run type-check
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Input to list update | <50ms | Optimistic UI (instant) |
| Initial render | <500ms | `performance.now()` |
| Scroll performance | 60fps | Chrome DevTools FPS meter |
| Re-render on new jot | <16ms | React DevTools Profiler |

---

## File Structure

```
src/
├── types/
│   └── jot.ts                      ✅ Complete
├── utils/
│   ├── parseJot.ts                 ⏳ TODO - Tag/link parsing
│   └── formatTime.ts               ⏳ TODO - Relative timestamps
├── api/
│   └── jots.ts                     ⏳ TODO - Tauri API wrappers
├── hooks/
│   └── useJots.ts                  ⏳ TODO - State management
├── components/
│   ├── JotContent.tsx              ⏳ TODO - Syntax highlighting
│   ├── JotItem.tsx                 ⏳ TODO - Individual jot
│   ├── JotList.tsx                 ⏳ TODO - Scrollable list
│   ├── JotInput.tsx                ⏳ TODO - Input field
│   └── JotPanel.tsx                ⏳ TODO - Main container
├── __tests__/
│   ├── utils/
│   │   ├── parseJot.test.ts        ⏳ TODO - Parsing tests
│   │   └── formatTime.test.ts      ⏳ TODO - Time formatting tests
│   └── components/
│       └── JotInput.test.tsx       ⏳ TODO - Component tests
├── App.tsx                         ⏳ TODO - Update to use JotPanel
├── main.tsx                        ✅ Complete
└── index.css                       ✅ Complete (Tailwind)
```

---

## Implementation Order (Recommended)

### Week 1: Utilities & Components (Independent of Backend)

**Day 1-2**: Utilities
1. ✅ Setup complete
2. Implement `parseJot.ts` + tests
3. Implement `formatTime.ts` + tests

**Day 2-3**: Components (with mock data)
4. Implement `JotContent` (uses parseJot)
5. Implement `JotItem` (uses JotContent, formatTime)
6. Implement `JotList` (uses JotItem)
7. Implement `JotInput` + tests

**Result**: UI components functional with hardcoded/mock data

### Week 2: Integration (Requires Backend Complete)

**Day 4**: API Layer
8. Implement `src/api/jots.ts` (requires backend Tauri commands)
9. Test API calls in browser console

**Day 5**: State Management
10. Implement `useJots` hook (optimistic updates)
11. Implement `JotPanel` container
12. Update `App.tsx`

**Day 6**: Polish
13. Add dark mode styling
14. Run all tests
15. Manual testing & bug fixes

---

## Testing Strategy

### Unit Tests
```bash
# Run tests for utilities
npm test parseJot
npm test formatTime

# Run tests for components
npm test JotInput
```

### Integration Testing (with backend)
```bash
# Start backend
cd src-tauri && cargo run

# Start frontend in another terminal
npm run dev

# Test in browser
```

### Manual Test Checklist
- [ ] Input field auto-focuses
- [ ] Enter submits jot
- [ ] Input clears after submit
- [ ] Jot appears immediately (optimistic)
- [ ] Tags highlighted in blue
- [ ] Links highlighted in purple
- [ ] Timestamps show correctly
- [ ] Delete button appears on hover
- [ ] Delete removes jot immediately
- [ ] Dark mode works correctly
- [ ] Scroll performance is smooth

---

## Resources

### Documentation
- **Feature Spec**: `/specs/001-jot-storage-vault-indexing/specs/feature-1.3-quick-jot-interface.md`
- **API Contract**: `/specs/001-jot-storage-vault-indexing/contracts/jot-api.md`
- **Type Definitions**: `src/types/jot.ts`

### External Docs
- **React 19**: https://react.dev/
- **Tailwind CSS 4**: https://tailwindcss.com/docs
- **Tauri API**: https://tauri.app/v2/api/js/

---

## Communication with Backend Team

### You'll Need from Backend:
1. ✅ Confirmation that Tauri commands are implemented
2. ✅ Backend running and accessible (`cargo run`)
3. ✅ Example command invocations (test in DevTools)

### You'll Provide to Backend:
1. UI mockups/screenshots (for UX feedback)
2. Performance metrics (render times, scroll FPS)
3. Edge cases discovered during testing

### Sync Points:
- **Before API implementation**: Verify backend commands work via DevTools
- **During integration**: Test optimistic updates with real data
- **Before final testing**: Coordinate end-to-end testing session

---

## Next Steps for Frontend Team

### Start Now (Independent):
1. **Implement parseJot.ts** (T066-T068) - 1-2 hours
   - Write tests first (TDD)
   - Test with various content patterns

2. **Implement formatTime.ts** (T069-T070) - 1 hour
   - Write tests first (TDD)
   - Test all time tiers

3. **Build JotContent component** (T071) - 1 hour
   - Use parseJot utility
   - Test with sample content

4. **Build JotItem component** (T072) - 1 hour
   - Mock Jot data for now
   - Test hover states

5. **Build JotInput component** (T074) - 1 hour
   - Write tests (T058)
   - Test Enter behavior

### Wait for Backend:
6. **API wrappers** (T059-T065) - after backend commands ready
7. **useJots hook** (T075) - after API wrappers work
8. **Full integration** (T076-T080) - after backend complete

**Independent Work Estimate**: 5-7 hours (can start immediately)
**Integration Work Estimate**: 4-5 hours (requires backend)

---

## Questions? Issues?

- Check feature spec for detailed component designs
- Review API contract for command signatures
- Test backend commands in DevTools first before implementing API wrappers
- Use React DevTools Profiler to measure performance

**Last Updated**: 2026-01-19
**Status**: Ready for independent utility/component development
