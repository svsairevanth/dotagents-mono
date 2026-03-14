# Architecture

Architectural decisions, patterns discovered, and conventions.

**What belongs here:** Architectural patterns, dependency rules, service patterns, module organization.

---

## Monorepo Structure

```
dotagents-mono/
├── apps/
│   ├── desktop/   (@dotagents/desktop) — Electron app
│   ├── mobile/    (@dotagents/mobile)  — Expo/React Native
│   └── cli/       (@dotagents/cli)     — Standalone TUI (new, milestone 3+)
├── packages/
│   ├── shared/    (@dotagents/shared)  — Types, constants, utilities
│   ├── core/      (@dotagents/core)    — Core agent engine (new, milestone 2+)
│   └── mcp-whatsapp/ — WhatsApp MCP server
```

## Dependency Direction

```
shared → core → apps (desktop, mobile, cli)
```

- `@dotagents/core` depends on `@dotagents/shared` only
- Apps depend on both `@dotagents/core` and `@dotagents/shared`
- NEVER: core → desktop, core → mobile, core → cli

## Build Order

1. `packages/shared` (tsup, CJS + ESM)
2. `packages/core` (tsup, CJS + ESM)
3. `apps/desktop` (electron-vite), `apps/cli` (to be defined), `apps/mobile` (Expo)

## Service Patterns

### Current (Desktop)
- All services use singleton pattern: `static getInstance()` or module-level `const export`
- No dependency injection framework
- All dependencies resolved at import time

### Target (Core)
- Lightweight service container/registry pattern
- Interfaces for platform abstractions: PathResolver, ProgressEmitter, UserInteraction, NotificationService
- Services register with container at app startup
- Apps provide platform-specific implementations

## Abstraction Interfaces

### PathResolver
Abstracts `app.getPath('appData')`, `app.getPath('userData')` from Electron.
- `getUserDataPath(): string` — base path for app data
- `getConfigPath(): string` — path for config files
- Desktop impl: uses Electron's `app.getPath()`
- CLI impl: uses `~/.dotagents/` or `$DOTAGENTS_DATA_DIR`

### ProgressEmitter
Abstracts WINDOWS + tipc renderer notifications.
- `emitAgentProgress(update: AgentProgressUpdate): void`
- `emitSessionUpdate(data): void`
- `emitQueueUpdate(conversationId, queue): void`
- Desktop impl: sends via tipc to renderer BrowserWindows
- CLI impl: updates TUI components via React state

### UserInteraction
Abstracts Electron dialog calls.
- `showError(title, message): void`
- `pickFile(options): Promise<string | null>`
- `saveFile(options): Promise<string | null>`
- `requestApproval(toolName, args): Promise<boolean>`
- `openExternal(url): Promise<void>`
- Desktop impl: uses Electron dialog, shell
- CLI impl: uses terminal prompts, system `open` command

### NotificationService
Abstracts Electron Notification.
- `showNotification(title, body): void`
- Desktop impl: Electron Notification API
- CLI impl: terminal bell or no-op

## Config System

File-based, NOT electron-store:
- `~/.agents/` directory (global)
- Workspace `.agents/` (local override)
- Layered merge: workspace wins on conflicts
- Modular `.agents` files with frontmatter format
- `agents-files/safe-file.ts` handles atomic writes
