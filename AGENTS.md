# AGENTS.md

Practical guidance for AI coding agents working in this repo.

## UI design principles

### Progressive one-line summaries first

For any new UI component or newly introduced information:

- Present a single line of distilled information as the default view.
- Make that line expandable or openable into a dedicated section, panel, or modal for deeper detail.
- Keep dense detail out of the default collapsed state; reveal it only on demand.

This interaction model mirrors what works well in the desktop session pane with tool calls and should be treated as the default pattern across the rest of the product unless there is a strong reason not to.

## Core gotchas

- **Use `pnpm` only.** This repo uses `pnpm-lock.yaml`; do not use npm or yarn.
- **If you change `packages/shared`, run `pnpm build:shared` before `pnpm dev`.**
- **Prefer existing patterns over new abstractions.** The codebase already has app-specific wiring.
- **Avoid circular imports.** Check dependency direction before adding imports, especially around main-process services and tool code.

## Imports and process boundaries

- **Main and renderer are separate TypeScript builds.** Do not treat them as one runtime.
- **Renderer must not import from `src/main/`.** Move shared code to `apps/desktop/src/shared/` or `packages/shared/` when needed on both sides.
- **Use existing aliases instead of deep relatives:** renderer uses `@renderer/*` or `~/*`; desktop shared code uses `@shared/*`.
- **Electron-first app:** do not assume renderer changes can be validated like a normal website.

## Types and naming

- **Desktop-only shared types** belong in `apps/desktop/src/shared/types.ts`.
- **Cross-app/package types** belong in `packages/shared/src/types.ts`.
- **Say “agent”, not “persona”.** Use `agent` in user-facing copy, comments, and new code.
- **There are no user profiles in the end-user model.** Global settings live in config and `.agents` files.

## Services and state

- **Main-process services typically use the singleton pattern.** Reuse exported singletons instead of creating ad hoc instances.
- **Use `agentSessionStateManager` for session state.** Avoid new logic against raw global `state.*` flags.
- **Always clean up session state in `finally` paths** to avoid leaks.

## `.agents` config gotchas

- **`.agents` is layered:** global `~/.agents/` plus optional workspace `.agents/`; workspace wins on conflicts.
- **Config merge is shallow by key.** Be careful when changing nested config objects.
- **Agents, tasks, skills, and memories merge by ID.** Matching workspace IDs override global ones.
- **Frontmatter is simple `key: value`, not full YAML.** Do not assume YAML features are supported.

## MCP and Electron gotchas

- **Do not hardcode sanitized MCP tool names.** Internal mapping handles provider-safe renaming.
- **Built-in tool definition schemas should stay dependency-light** to avoid circular import problems.
- **Use `WINDOWS.get(...)` for window lookup.** Do not assume the panel window exists.
- **Null-check panel window access.** Panel-specific resize and behavior are special-cased.

## Practical commands

- Dev: `pnpm dev`
- Shared package only: `pnpm build:shared`
- Mobile (Expo web): `pnpm --filter @dotagents/mobile web`
- Tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`

If you need subsystem-specific implementation details, inspect nearby files first rather than expanding this document.
