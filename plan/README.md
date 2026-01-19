# Scribel Development Plan

This directory contains Epic and Feature planning documents for Scribel development.

## Structure

```
plan/
├── README.md                     # This file
├── epics.md                      # Master epic list with status tracking
├── epic-1-foundation/            # Epic 1: Foundation (MVP)
│   ├── README.md                 # Epic overview
│   ├── feature-1-project-scaffold.md
│   ├── feature-2-jot-storage.md
│   ├── feature-3-quick-jot-interface.md
│   ├── feature-4-global-hotkey.md
│   └── specs/                    # Technical specifications
│       ├── feature-1.2-jot-storage.md
│       ├── feature-1.3-quick-jot-interface.md
│       └── feature-1.4-global-hotkey.md
├── epic-2-vault-integration/     # Epic 2: Vault Integration
├── epic-3-intelligence/          # Epic 3: Intelligence (RAG & Search)
├── epic-4-agentic/               # Epic 4: Agentic Capabilities
├── epic-5-polish/                # Epic 5: Polish & Enhanced Features
└── epic-6-advanced/              # Epic 6: Advanced Features (Future)
```

## Document Hierarchy

| Level | Location | Purpose |
|-------|----------|---------|
| **Product** | `docs/PRD.md` | What to build and why |
| **Architecture** | `docs/TECH_DESIGN.md` | How the system works |
| **Epic** | `plan/epic-N-*/README.md` | Milestone scope and goals |
| **Feature** | `plan/epic-N-*/feature-*.md` | Feature requirements (WHAT) |
| **Spec** | `plan/epic-N-*/specs/*.md` | Technical design (HOW) |

## Workflow

1. **Epic Planning**: Define milestones in `epics.md`
2. **Feature Planning**: Create feature files describing requirements
3. **Spec Writing**: Add detailed specs in `specs/` subfolder
4. **Implementation**: Use specs to guide code generation

## Naming Conventions

- Epic folders: `epic-N-short-name/`
- Feature files: `feature-N-short-name.md`
- Spec files: `feature-N.M-short-name.md` (in `specs/` subfolder)
- PRD traceability: Reference PRD feature codes (F1-F11)

## Keeping Documents Updated

When implementation reveals conflicts with documented design, update the source documents:

| Document | Update When... |
|----------|----------------|
| `docs/PRD.md` | Features, requirements, or scope changes |
| `docs/TECH_DESIGN.md` | Architecture, tech stack, or design patterns change |
