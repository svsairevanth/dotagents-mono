# Knowledge & Working Notes Spec

Status: Draft
Related issue: `#152` — Unify memories and working notes into a single local-file knowledge system

## Summary

DotAgents should replace first-class "memories" with a unified file-based knowledge system.
The top-level container is `knowledge`, markdown text artifacts are `notes`, and the
small runtime-injected subset of notes are referred to as `working notes`.

This model must support both markdown notes and non-markdown assets such as images,
documents, and other files inside the same knowledge workspace.

## Terminology

- **Knowledge**: the mixed-content workspace under `.agents/knowledge/`
- **Note**: a markdown knowledge item with frontmatter and markdown body
- **Working note**: a note whose frontmatter makes it eligible for automatic runtime injection
- **Asset**: any non-markdown file stored alongside a note inside the same note folder
- **Memory / memories**: legacy term to remove from the target product and protocol model

## Goals

- Replace first-class memories with a unified knowledge workspace
- Make working notes part of the default system behavior
- Keep the injected runtime subset intentionally tiny and explicit
- Store notes in plain markdown with simple frontmatter
- Support note-local assets such as images and documents
- Prefer direct file editing over special-purpose memory tools
- Align app implementation and protocol/docs around the same model

## Non-Goals

- Migrating existing `.agents/memories/*.md` content in this phase
- Preserving the current memory-first product model
- Requiring a fixed asset subfolder such as `assets/`

## Canonical Storage Model

Knowledge is layered the same way as the rest of `.agents`:

- Global: `~/.agents/knowledge/`
- Workspace: `./.agents/knowledge/`

Workspace knowledge overrides global knowledge by note `id` when both exist.

### Canonical note layout

Each note lives in its own human-readable slug folder.

```text
.agents/
└── knowledge/
    └── project-architecture/
        ├── project-architecture.md
        ├── diagram.png
        └── db-schema.pdf
```

Rules:

- Folder name should be a human-readable slug
- Markdown filename should use the same slug as the folder
- Slugs should not be hashes or opaque numeric IDs by default
- Assets may live anywhere inside the note folder
- No fixed subfolder name is required for assets

## Canonical Note Format

Notes are markdown files with simple `key: value` frontmatter.
This is not full YAML.

### Required frontmatter

- `kind: note`
- `id`: stable, human-readable slug
- `title`: human-readable title
- `context`: `auto` or `search-only`
- `updatedAt`: timestamp
- `tags`: comma-separated tags or JSON array

### Optional frontmatter

- `summary`: short compact summary for runtime injection
- `createdAt`: timestamp
- `references`: related files, paths, or external references

### Example

```markdown
---
kind: note
id: project-architecture
title: Project Architecture
context: auto
updatedAt: 1770000000000
tags: architecture, backend
summary: Service-oriented Electron app with layered .agents config.
---

## Details

Longer-form markdown content goes here.
```

## Runtime Semantics

Runtime behavior is determined explicitly by the `context` field.

- `context: auto`
  - eligible for automatic system-prompt injection
  - intended only for a tiny curated subset of high-signal notes
- `context: search-only`
  - not injected by default
  - discoverable through file search and semantic search

### Important constraint

`importance` alone must not control prompt injection.
Injection eligibility is a separate concern from importance.

## Default System Prompt Contract

The default system prompt should teach agents that:

- durable project/user knowledge lives in `~/.agents/knowledge/` and `./.agents/knowledge/`
- notes are stored in `.agents/knowledge/<slug>/<slug>.md`
- slugs should be human-readable
- related files such as images or documents may live in the same note folder
- most notes should default to `context: search-only`
- only a very small curated subset should use `context: auto`
- direct file editing is the default way to create and update notes

## Product Model Changes

The target product model should:

- remove first-class "memory" as the primary concept
- stop presenting memories as a separate durable store
- replace memory-centric wording in UI, docs, and prompts with knowledge/notes language
- treat working notes as a behavior of notes, not a separate storage system

## Tooling Direction

The target model should prefer normal file tools over dedicated memory CRUD tools.

Implications:

- `save_memory`, `list_memories`, and `delete_memories` should not be the long-term default model
- agents should read and write `.agents/knowledge/` directly
- automatic runtime loading should source from notes marked `context: auto`

## Protocol / Docs Direction

The `.agents` protocol and DotAgents docs should move from:

- `memories/` as the canonical container
- flat memory files as the main example

to:

- `knowledge/` as the mixed-content container
- note folders containing markdown plus optional assets
- notes as the canonical text artifact
- working notes as the runtime-injected subset

## Out of Scope for This Spec

- legacy memory migration strategy
- backward-compatibility details for memory APIs and UI
- bundle export/import policy for knowledge assets
- note conflict resolution beyond normal layered merge by `id`

## Recommended Implementation Phases

1. Update protocol/docs terminology and examples
2. Add core `knowledge` filesystem loader/writer support
3. Update system prompt and runtime injection to use notes
4. Remove memory-first runtime and tool assumptions
5. Rename/reframe UI and docs around knowledge and notes

## Decision Summary

- Container name: `knowledge`
- Text artifact name: `note`
- Runtime-injected subset name: `working note`
- Canonical path: `.agents/knowledge/<slug>/<slug>.md`
- Asset placement: inside the note folder, no fixed subfolder required
- Runtime field: `context: auto | search-only`
- Default write path: direct file editing
- Legacy memories: out of scope for this phase