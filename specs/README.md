# Scribel Specifications

This directory contains detailed technical specifications for each feature.

## Structure

```
specs/
├── README.md                           # This file
└── epic-1/                             # Epic 1: Foundation
    ├── feature-1.2-jot-storage.md      # Jot Storage spec
    ├── feature-1.3-quick-jot-interface.md  # Quick Jot Interface spec
    └── feature-1.4-global-hotkey.md    # Global Hotkey spec
```

## Naming Convention

- Epic folders: `epic-{N}/` (matches plan/epic-{N}-{name}/)
- Spec files: `feature-{N.M}-{short-name}.md` (matches feature IDs from plan)

## Relationship to Plan

| Plan File | Spec File |
|-----------|-----------|
| `plan/epic-1-foundation/feature-2-jot-storage.md` | `specs/epic-1/feature-1.2-jot-storage.md` |
| `plan/epic-1-foundation/feature-3-quick-jot-interface.md` | `specs/epic-1/feature-1.3-quick-jot-interface.md` |
| `plan/epic-1-foundation/feature-4-global-hotkey.md` | `specs/epic-1/feature-1.4-global-hotkey.md` |

## Workflow

1. **Plan** documents define WHAT to build (high-level requirements)
2. **Spec** documents define HOW to build it (technical design)
3. Use `/speckit.implement` to generate code from specs

## Keeping Source Documents Updated

When updating or creating specs, **always check and update these source documents if needed**:

| Document | Purpose | Update When... |
|----------|---------|----------------|
| `plan/PRD.md` | Up-to-date high-level product overview | Features, requirements, or scope changes |
| `plan/TECH_DESIGN.md` | Up-to-date high-level architecture & core tech | Architecture, tech stack, or design patterns change |

These documents don't need implementation details, but must stay accurate. If implementation reveals conflicts with the documented design, update the source documents to reflect the actual decisions made.
