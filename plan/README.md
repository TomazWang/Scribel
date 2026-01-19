# Scribel Development Plan

This directory contains the Epic and Feature planning documents for Scribel development.

## Structure

```
plan/
├── README.md                 # This file
├── epics.md                  # All Epics overview
├── epic-1-foundation/        # Epic 1: Foundation
│   ├── README.md
│   ├── feature-1-project-scaffold.md
│   ├── feature-2-jot-storage.md
│   ├── feature-3-quick-jot-interface.md
│   └── feature-4-global-hotkey.md
├── epic-2-vault-integration/ # Epic 2: Vault Integration
├── epic-3-intelligence/      # Epic 3: Intelligence (RAG & Search)
├── epic-4-agentic/           # Epic 4: Agentic Capabilities
├── epic-5-polish/            # Epic 5: Polish & Enhanced Features
└── epic-6-advanced/          # Epic 6: Advanced Features (Future)
```

## Workflow

1. **Epic Planning**: High-level milestones defined in `epics.md`
2. **Feature Specs**: Each feature has a dedicated markdown file
3. **Speckit Integration**: Use `/specify` to generate detailed specs, plans, and tasks for each feature

## Keeping Source Documents Updated

When updating or creating specs, **always check and update these source documents if needed**:

| Document | Purpose | Update When... |
|----------|---------|----------------|
| `PRD.md` | Up-to-date high-level product overview | Features, requirements, or scope changes |
| `TECH_DESIGN.md` | Up-to-date high-level architecture & core tech | Architecture, tech stack, or design patterns change |

These documents don't need implementation details, but must stay accurate. If implementation reveals conflicts with the documented design, update the source documents to reflect the actual decisions made.

## Naming Convention

- Epic folders: `epic-N-short-name/`
- Feature files: `feature-M-short-name.md`
- PRD traceability: Reference PRD feature codes (F1-F11) in feature descriptions
