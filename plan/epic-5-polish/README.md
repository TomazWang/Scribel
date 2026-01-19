# Epic 5: Polish & Enhanced Features

**Goal:** Production-ready experience

This Epic focuses on polish, performance optimization, and enhanced features to make Scribel ready for daily use.

## Features

| # | Feature | PRD Ref | Status | Description |
|---|---------|---------|--------|-------------|
| 5.1 | Wiki-Link Autocomplete | F1 | Pending | Fuzzy match vault files while typing |
| 5.2 | Smart Daily Review | F7 | Pending | AI-generated daily/weekly summaries |
| 5.3 | Bidirectional Links | F8 | Pending | Show backlinks and outgoing links |
| 5.4 | Performance Optimization | - | Pending | Meet all performance targets |
| 5.5 | Settings & Onboarding | - | Pending | Complete settings, first-run flow |

## Success Criteria

- Wiki-link autocomplete shows top 5 matches
- Daily review generates useful summaries
- Backlinks update on file change
- All performance targets met (see below)
- Smooth onboarding for new users

## Performance Targets

| Metric | Target |
|--------|--------|
| Cold start to first jot | <500ms |
| Jot creation latency | <50ms |
| Global hotkey response | <200ms |
| Semantic search query | <500ms |
| Scroll 1000 jots | 60fps |

## Dependencies

- Epic 1-4 (all prior epics)

## Tech Considerations

- Virtual scrolling for large jot lists
- Debounced autocomplete (300ms)
- Link index for bidirectional links
- Profile with Chrome DevTools
