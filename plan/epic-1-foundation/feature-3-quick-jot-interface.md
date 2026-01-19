# Feature 1.3: Quick Jot Interface

**Status:** Pending
**PRD Reference:** F1 (Quick Jot Interface)

## Overview

Build the primary UI for rapid note capture — a single-line input with chronological jot list.

## Requirements

From PRD F1:
- Single-line input always visible at bottom
- Press Enter to create new jot
- Jots appear in reverse chronological order (newest at bottom, near input)
- Auto-timestamp on each jot
- Support for `[[wiki-links]]` with syntax highlighting
- Support for `#tags` with syntax highlighting
- Minimal UI chrome — content is the focus

## UI Components

### JotInput.tsx
```tsx
// Single-line input field
// - Auto-focus on app open
// - Enter to submit
// - Highlight [[links]] and #tags as user types
// - Clear after submission
```

### JotList.tsx
```tsx
// Scrollable list of jots
// - Reverse chronological (newest at bottom)
// - Virtualized for performance (large lists)
// - Show timestamp relative (e.g., "2 min ago")
// - Clickable [[links]] and #tags
```

### JotItem.tsx
```tsx
// Individual jot display
// - Timestamp
// - Content with highlighted links/tags
// - Hover actions (delete, promote)
```

## Implementation Tasks

1. [ ] Create `src/components/` directory structure
2. [ ] Build `JotInput` component with Enter-to-submit
3. [ ] Build `JotList` component with infinite scroll
4. [ ] Build `JotItem` component with timestamp formatting
5. [ ] Create `useJots` hook for state management
6. [ ] Implement tag/link parsing and highlighting
7. [ ] Add relative timestamp formatting (e.g., "5 min ago")
8. [ ] Style with Tailwind for clean, minimal look
9. [ ] Add delete functionality

## Acceptance Criteria

- [ ] Input field auto-focuses on app open
- [ ] Enter submits jot and clears input
- [ ] Jots appear immediately in list (optimistic UI)
- [ ] `#tags` highlighted in different color
- [ ] `[[links]]` highlighted and styled as links
- [ ] Timestamps update in real-time (relative format)
- [ ] List scrolls smoothly with 1000+ jots

## File Structure

```
src/
├── components/
│   ├── JotInput.tsx
│   ├── JotList.tsx
│   └── JotItem.tsx
├── hooks/
│   └── useJots.ts
├── utils/
│   ├── parseJot.ts      # Extract tags/links
│   └── formatTime.ts    # Relative timestamps
└── App.tsx              # Main layout
```

## UI Design

```
┌─────────────────────────────────────┐
│  Scribel                            │
├─────────────────────────────────────┤
│                                     │
│  • 2:45 PM  Meeting with [[Sarah]]  │
│  • 2:30 PM  Research #ai embeddings │
│  • 2:15 PM  Call mom                │
│  • 2:00 PM  [[Project X]] deadline  │
│                                     │
├─────────────────────────────────────┤
│  What's on your mind?           [↵] │
└─────────────────────────────────────┘
```

## Performance Target

| Metric | Target |
|--------|--------|
| Input to list update | <50ms (optimistic) |
| Scroll performance | 60fps with 1000 items |
| Initial render | <500ms |

## Dependencies

- Feature 1.2 (Jot Storage) — for persistence
- Tailwind CSS (already configured)

## Next Feature

→ [Feature 1.4: Global Hotkey](feature-4-global-hotkey.md)
