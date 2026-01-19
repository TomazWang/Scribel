# Specification: Feature 1.3 - Quick Jot Interface

**Epic:** Epic 1 - Foundation
**Feature:** 1.3 Quick Jot Interface
**Status:** Ready for Implementation
**PRD Reference:** F1 (Quick Jot Interface)
**Plan Reference:** [plan/epic-1-foundation/feature-3-quick-jot-interface.md](../../plan/epic-1-foundation/feature-3-quick-jot-interface.md)

---

## 1. Overview

### 1.1 Purpose
Build the primary UI for rapid note capture — a single-line input at the bottom with a chronological jot list above, supporting syntax highlighting for `#tags` and `[[wiki-links]]`.

### 1.2 Scope
- Single-line input component with Enter-to-submit
- Chronological jot list (newest at bottom, near input)
- Tag and wiki-link syntax highlighting
- Relative timestamp display
- Delete functionality
- Optimistic UI updates for instant feedback

### 1.3 Out of Scope
- Wiki-link autocomplete (Epic 5)
- Jot editing (future enhancement)
- Tag filtering/search UI (future enhancement)
- Keyboard navigation through jot list

---

## 2. UI Design

### 2.1 Layout Structure

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

### 2.2 Visual Design Principles

- **Minimal chrome:** Focus on content, not UI elements
- **Dark/Light mode:** Respect system preference
- **Typography:** Monospace for jots, sans-serif for UI
- **Colors:**
  - Tags: Blue accent (`text-blue-500`)
  - Links: Purple accent (`text-purple-500`)
  - Timestamps: Muted gray (`text-neutral-400`)

---

## 3. Component Architecture

### 3.1 Component Tree

```
App.tsx
└── JotPanel
    ├── JotList
    │   └── JotItem (repeated)
    │       └── JotContent (renders highlighted text)
    └── JotInput
```

### 3.2 File Structure

```
src/
├── components/
│   ├── JotPanel.tsx        # Main container component
│   ├── JotList.tsx         # Scrollable list container
│   ├── JotItem.tsx         # Individual jot display
│   ├── JotContent.tsx      # Text with tag/link highlighting
│   └── JotInput.tsx        # Input field component
├── hooks/
│   └── useJots.ts          # State management hook
├── utils/
│   ├── parseJot.ts         # Tag/link extraction
│   └── formatTime.ts       # Relative timestamp formatting
├── types/
│   └── jot.ts              # TypeScript types
├── api/
│   └── jots.ts             # Tauri API wrappers
└── App.tsx                 # Root component
```

---

## 4. Component Specifications

### 4.1 JotInput

**Purpose:** Single-line input for jot creation

**Props:**
```typescript
interface JotInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}
```

**Behavior:**
- Auto-focus on mount (when `autoFocus={true}`)
- Submit on Enter key (if content is non-empty)
- Clear input after successful submission
- Prevent empty submissions
- Show placeholder: "What's on your mind?"

**Implementation:**
```tsx
// src/components/JotInput.tsx

import { useState, useRef, useEffect } from "react";

interface JotInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function JotInput({ onSubmit, disabled, autoFocus = true }: JotInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="What's on your mind?"
        className="w-full px-4 py-3 rounded-lg
          border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800
          text-neutral-900 dark:text-neutral-100
          placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50"
      />
    </div>
  );
}
```

### 4.2 JotList

**Purpose:** Scrollable container for jots, newest at bottom

**Props:**
```typescript
interface JotListProps {
  jots: Jot[];
  onDelete: (id: number) => void;
  loading?: boolean;
}
```

**Behavior:**
- Display jots in chronological order (oldest at top, newest at bottom)
- Auto-scroll to bottom when new jot is added
- Show loading state while fetching
- Show empty state when no jots

**Implementation:**
```tsx
// src/components/JotList.tsx

import { useRef, useEffect } from "react";
import type { Jot } from "../types/jot";
import { JotItem } from "./JotItem";

interface JotListProps {
  jots: Jot[];
  onDelete: (id: number) => void;
  loading?: boolean;
}

export function JotList({ jots, onDelete, loading }: JotListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(jots.length);

  // Auto-scroll to bottom when new jot added
  useEffect(() => {
    if (jots.length > prevLengthRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLengthRef.current = jots.length;
  }, [jots.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-neutral-400">Loading jots...</span>
      </div>
    );
  }

  if (jots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-neutral-400">No jots yet. Start typing below!</span>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {jots.map((jot) => (
        <JotItem
          key={jot.id}
          jot={jot}
          onDelete={() => onDelete(jot.id)}
        />
      ))}
    </div>
  );
}
```

### 4.3 JotItem

**Purpose:** Display a single jot with timestamp and actions

**Props:**
```typescript
interface JotItemProps {
  jot: Jot;
  onDelete: () => void;
}
```

**Behavior:**
- Show relative timestamp (e.g., "5 min ago")
- Show delete button on hover
- Render content with highlighted tags/links

**Implementation:**
```tsx
// src/components/JotItem.tsx

import { useState } from "react";
import type { Jot } from "../types/jot";
import { JotContent } from "./JotContent";
import { formatRelativeTime } from "../utils/formatTime";

interface JotItemProps {
  jot: Jot;
  onDelete: () => void;
}

export function JotItem({ jot, onDelete }: JotItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group flex items-start gap-3 py-2 px-3 rounded-lg
        hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Timestamp */}
      <span className="text-xs text-neutral-400 whitespace-nowrap pt-0.5 min-w-[70px]">
        {formatRelativeTime(jot.created_at)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <JotContent content={jot.content} />
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-opacity ${
        showActions ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={onDelete}
          className="p-1 text-neutral-400 hover:text-red-500 rounded"
          aria-label="Delete jot"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

### 4.4 JotContent

**Purpose:** Render jot text with highlighted tags and links

**Props:**
```typescript
interface JotContentProps {
  content: string;
}
```

**Behavior:**
- Parse content for `#tags` and `[[links]]`
- Render tags in blue
- Render links in purple
- Keep regular text unchanged

**Implementation:**
```tsx
// src/components/JotContent.tsx

import { parseJotContent, type ParsedSegment } from "../utils/parseJot";

interface JotContentProps {
  content: string;
}

export function JotContent({ content }: JotContentProps) {
  const segments = parseJotContent(content);

  return (
    <span className="text-neutral-900 dark:text-neutral-100 break-words">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "tag":
            return (
              <span
                key={index}
                className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline"
              >
                #{segment.value}
              </span>
            );
          case "link":
            return (
              <span
                key={index}
                className="text-purple-500 dark:text-purple-400 cursor-pointer hover:underline"
              >
                [[{segment.value}]]
              </span>
            );
          default:
            return <span key={index}>{segment.value}</span>;
        }
      })}
    </span>
  );
}
```

### 4.5 JotPanel

**Purpose:** Main container coordinating input and list

**Implementation:**
```tsx
// src/components/JotPanel.tsx

import { useJots } from "../hooks/useJots";
import { JotList } from "./JotList";
import { JotInput } from "./JotInput";

export function JotPanel() {
  const { jots, loading, createJot, deleteJot } = useJots();

  return (
    <div className="flex flex-col h-full">
      <JotList
        jots={jots}
        onDelete={deleteJot}
        loading={loading}
      />
      <JotInput onSubmit={createJot} />
    </div>
  );
}
```

---

## 5. Hooks

### 5.1 useJots

**Purpose:** Manage jot state with optimistic updates

```typescript
// src/hooks/useJots.ts

import { useState, useEffect, useCallback } from "react";
import type { Jot } from "../types/jot";
import * as api from "../api/jots";

interface UseJotsReturn {
  jots: Jot[];
  loading: boolean;
  error: string | null;
  createJot: (content: string) => Promise<void>;
  deleteJot: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useJots(): UseJotsReturn {
  const [jots, setJots] = useState<Jot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getJots();
      // Sort by created_at ascending (oldest first, newest at bottom)
      setJots(data.sort((a, b) => a.created_at - b.created_at));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createJot = useCallback(async (content: string) => {
    // Optimistic update with temporary ID
    const tempId = -Date.now();
    const tempJot: Jot = {
      id: tempId,
      content,
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
      links: [],
      promoted: false,
    };

    setJots((prev) => [...prev, tempJot]);

    try {
      const newJot = await api.createJot(content);
      setJots((prev) =>
        prev.map((j) => (j.id === tempId ? newJot : j))
      );
    } catch (err) {
      // Rollback on error
      setJots((prev) => prev.filter((j) => j.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to create jot");
    }
  }, []);

  const deleteJot = useCallback(async (id: number) => {
    // Store for rollback
    const prevJots = [...jots];

    // Optimistic update
    setJots((prev) => prev.filter((j) => j.id !== id));

    try {
      await api.deleteJot(id);
    } catch (err) {
      // Rollback on error
      setJots(prevJots);
      setError(err instanceof Error ? err.message : "Failed to delete jot");
    }
  }, [jots]);

  return { jots, loading, error, createJot, deleteJot, refresh };
}
```

---

## 6. Utility Functions

### 6.1 parseJot.ts

```typescript
// src/utils/parseJot.ts

export type SegmentType = "text" | "tag" | "link";

export interface ParsedSegment {
  type: SegmentType;
  value: string;
}

const TAG_REGEX = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
const LINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function parseJotContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];

  // Combined regex to match both tags and links
  const combinedRegex = /(#[a-zA-Z][a-zA-Z0-9_-]*|\[\[[^\]]+\]\])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    const matched = match[0];
    if (matched.startsWith("#")) {
      segments.push({
        type: "tag",
        value: matched.slice(1), // Remove #
      });
    } else if (matched.startsWith("[[")) {
      segments.push({
        type: "link",
        value: matched.slice(2, -2), // Remove [[ and ]]
      });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return segments;
}

export function extractTags(content: string): string[] {
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(TAG_REGEX);

  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1]);
  }

  return [...new Set(tags)]; // Deduplicate
}

export function extractLinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(LINK_REGEX);

  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }

  return [...new Set(links)]; // Deduplicate
}
```

### 6.2 formatTime.ts

```typescript
// src/utils/formatTime.ts

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < MINUTE) {
    return "just now";
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} min ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }

  // For older jots, show date/time
  const date = new Date(timestamp);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  // Yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  // Older
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatAbsoluteTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
```

---

## 7. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Input to list update | < 50ms | Optimistic UI (instant) |
| Initial render | < 500ms | `performance.now()` |
| Scroll performance | 60fps | Chrome DevTools FPS meter |
| Re-render on new jot | < 16ms | React DevTools Profiler |

### 7.1 Performance Optimizations

1. **Optimistic Updates:** Show jot immediately, sync in background
2. **Memoization:** Use `React.memo` for JotItem to prevent unnecessary re-renders
3. **Virtual Scrolling:** Add for 500+ jots (future enhancement)
4. **Debounced Timestamps:** Update relative times every minute, not every render

---

## 8. Accessibility

### 8.1 Keyboard Navigation
- Tab to input field
- Enter to submit
- Escape to clear input (future)

### 8.2 ARIA Labels
- Input: `aria-label="Create new jot"`
- Delete button: `aria-label="Delete jot"`
- List: `role="list"`, items: `role="listitem"`

### 8.3 Screen Reader Support
- Announce "Jot created" on submission
- Announce "Jot deleted" on removal

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// src/utils/__tests__/parseJot.test.ts

import { parseJotContent, extractTags, extractLinks } from "../parseJot";

describe("parseJotContent", () => {
  it("parses plain text", () => {
    const result = parseJotContent("Hello world");
    expect(result).toEqual([{ type: "text", value: "Hello world" }]);
  });

  it("parses tags", () => {
    const result = parseJotContent("Hello #world");
    expect(result).toEqual([
      { type: "text", value: "Hello " },
      { type: "tag", value: "world" },
    ]);
  });

  it("parses links", () => {
    const result = parseJotContent("See [[My Note]]");
    expect(result).toEqual([
      { type: "text", value: "See " },
      { type: "link", value: "My Note" },
    ]);
  });

  it("parses mixed content", () => {
    const result = parseJotContent("Check #todo for [[Project]]");
    expect(result).toHaveLength(4);
    expect(result[1]).toEqual({ type: "tag", value: "todo" });
    expect(result[3]).toEqual({ type: "link", value: "Project" });
  });
});

describe("formatRelativeTime", () => {
  it("shows 'just now' for recent timestamps", () => {
    const result = formatRelativeTime(Date.now() - 30000);
    expect(result).toBe("just now");
  });

  it("shows minutes for recent past", () => {
    const result = formatRelativeTime(Date.now() - 5 * 60 * 1000);
    expect(result).toBe("5 min ago");
  });
});
```

### 9.2 Component Tests

```typescript
// src/components/__tests__/JotInput.test.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import { JotInput } from "../JotInput";

describe("JotInput", () => {
  it("calls onSubmit when Enter is pressed", () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    fireEvent.change(input, { target: { value: "Test jot" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledWith("Test jot");
  });

  it("clears input after submission", () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test jot" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input.value).toBe("");
  });

  it("does not submit empty content", () => {
    const onSubmit = vi.fn();
    render(<JotInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What's on your mind?");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

---

## 10. Acceptance Criteria

- [ ] Input field visible at bottom of screen
- [ ] Input field auto-focuses on app open
- [ ] Enter submits jot and clears input
- [ ] Empty input does not submit
- [ ] New jot appears at bottom of list immediately (optimistic)
- [ ] Jots display in chronological order (oldest top, newest bottom)
- [ ] `#tags` highlighted in blue
- [ ] `[[links]]` highlighted in purple
- [ ] Relative timestamps display correctly ("5 min ago", "2h ago")
- [ ] Delete button appears on hover
- [ ] Delete removes jot from list immediately
- [ ] Loading state shown while fetching initial jots
- [ ] Empty state shown when no jots exist
- [ ] List scrolls smoothly with 100+ jots
- [ ] Dark mode styling works correctly

---

## 11. Dependencies

### 11.1 Prerequisites
- Feature 1.2 Jot Storage (backend CRUD operations)

### 11.2 NPM Packages (already available)
- React 19
- Tailwind CSS 4
- @tauri-apps/api

### 11.3 Dependents
- Feature 1.4 Global Hotkey (needs input ref for auto-focus)

---

## 12. Implementation Tasks

1. [ ] Create `src/types/jot.ts` with TypeScript interfaces
2. [ ] Create `src/api/jots.ts` with Tauri invoke wrappers
3. [ ] Create `src/utils/parseJot.ts` with parsing logic
4. [ ] Create `src/utils/formatTime.ts` with time formatting
5. [ ] Create `src/components/JotContent.tsx` with highlighting
6. [ ] Create `src/components/JotItem.tsx` with delete action
7. [ ] Create `src/components/JotList.tsx` with auto-scroll
8. [ ] Create `src/components/JotInput.tsx` with submit handling
9. [ ] Create `src/components/JotPanel.tsx` as container
10. [ ] Create `src/hooks/useJots.ts` with optimistic updates
11. [ ] Update `src/App.tsx` to use JotPanel
12. [ ] Write unit tests for parseJot utility
13. [ ] Write unit tests for formatTime utility
14. [ ] Write component tests for JotInput
15. [ ] Add dark mode styling
16. [ ] Test with 100+ jots for performance

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scroll performance with many jots | Medium | Medium | Virtual scrolling (future), pagination |
| Timestamp updates causing re-renders | Low | Low | Memo components, debounce updates |
| Regex edge cases in parsing | Medium | Low | Comprehensive tests, graceful fallback |

---

## 14. Future Enhancements

- **Virtual Scrolling:** React Virtual for 1000+ jots
- **Keyboard Navigation:** Arrow keys to navigate jot list
- **Jot Editing:** Click to edit existing jots
- **Tag/Link Click Handlers:** Filter by tag, open linked note
- **Animations:** Fade in new jots, slide out deleted
