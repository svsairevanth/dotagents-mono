# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Runtime

- Node.js v24.1.0 (via nvm)
- pnpm 9.12.1
- macOS (darwin 25.2.0, arm64)
- 16GB RAM, 10 CPU cores

## Build Dependencies

- Zig toolchain (required for OpenTUI native core, install via `brew install zig`)
- tsup (shared package bundler, CJS + ESM dual output)
- electron-vite (desktop app bundler)

## Key Config Paths

- Global agent config: `~/.agents/`
- Workspace agent config: `<workspace>/.agents/`
- App data: `~/Library/Application Support/@dotagents/desktop/`
- Conversations: stored under app data path

## Pre-existing Test Failures

8 pre-existing test failures in desktop renderer tests. These are NOT caused by this mission:
- `settings-general.langfuse-draft.test.tsx` (2 failures: forwardRef mock issues)
- `settings-loops.interval-draft.test.tsx` (3 failures: React mock issues)
- Various other settings test failures related to react mock setup

Workers should ignore these failures and only track NEW test failures.
