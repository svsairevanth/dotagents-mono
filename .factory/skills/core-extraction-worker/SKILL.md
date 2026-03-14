---
name: core-extraction-worker
description: Extracts services from the desktop Electron app into packages/core, introducing abstraction interfaces and a service container.
---

# Core Extraction Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for features involving:
- Creating the @dotagents/core package structure
- Defining abstraction interfaces (PathResolver, ProgressEmitter, UserInteraction, NotificationService)
- Implementing the service container/registry
- Extracting individual services from apps/desktop/src/main/ to packages/core/src/
- Refactoring desktop to import from @dotagents/core
- Creating Electron-specific adapter implementations in desktop

## Work Procedure

### 1. Understand the Feature

Read the feature description carefully. Identify:
- Which service files are being extracted
- What Electron dependencies they have (grep for `from 'electron'`, `app.getPath`, `WINDOWS`, `tipc`, `dialog`, `BrowserWindow`, `Notification`)
- What other services they depend on (check imports)
- Whether dependent services are already extracted to core

### 2. Investigate the Service

Before extracting:
- Read the full source file in apps/desktop/src/main/
- List all imports — categorize as: (a) Electron-specific, (b) other desktop-local, (c) external packages, (d) already-in-core
- Read associated test files if they exist
- Check if the service uses singleton pattern (getInstance() or module-level export)

### 3. Write Tests First (TDD)

For each extracted service:
1. Create test file in packages/core/src/ alongside the service
2. Write tests that verify the service works with mock/stub implementations of abstraction interfaces
3. If migrating existing tests, adapt them to use the service container and stub interfaces
4. Run `pnpm --filter @dotagents/core exec vitest run` to confirm tests fail
5. Then extract the service to make tests pass

### 4. Extract the Service

Step by step:
1. **Copy** the file from `apps/desktop/src/main/` to `packages/core/src/`
2. **Replace Electron imports**:
   - `app.getPath('appData')` / `app.getPath('userData')` → `pathResolver.getUserDataPath()` (from service container)
   - `dialog.showOpenDialog()` / `dialog.showSaveDialog()` → `userInteraction.pickFile()` / `userInteraction.saveFile()`
   - `WINDOWS.get(...)` + `tipc.*.broadcast()` → `progressEmitter.emit*()`
   - `Notification` → `notificationService.showNotification()`
   - `shell.openExternal()` → `userInteraction.openExternal()`
3. **Replace singleton pattern**: Change `static getInstance()` or module-level export to use the service container for dependency resolution
4. **Update internal imports**: Change references to other extracted services to import from core
5. **Export from index.ts**: Add the service to `packages/core/src/index.ts`
6. **Build core**: `pnpm --filter @dotagents/core build`

### 5. Update Desktop to Use Core

1. **Replace the local file** in `apps/desktop/src/main/`:
   - Either delete the file and update all imports to `@dotagents/core`
   - Or convert the file to a thin re-export: `export { ServiceName } from '@dotagents/core'`
2. **Create Electron adapter** if needed (e.g., `electron-path-resolver.ts` implementing `PathResolver`)
3. **Register with container** in desktop's startup code: `container.register(PathResolver, new ElectronPathResolver())`
4. **Build desktop**: `pnpm --filter @dotagents/desktop build` or just `pnpm build`

### 6. Verify Everything

Run ALL of these commands and report results:
1. `pnpm --filter @dotagents/core exec vitest run` — core tests pass
2. `pnpm --filter @dotagents/core build` — core builds
3. `pnpm typecheck` — full workspace typecheck passes
4. `pnpm --filter @dotagents/desktop exec vitest run` — desktop tests (8 pre-existing failures allowed)
5. `grep -r "from 'electron'" packages/core/src/` — must return 0 matches
6. `grep -r "BrowserWindow\|dialog\|shell\|ipcMain" packages/core/src/` — must return 0 matches (in actual code, not type declarations)

### 7. Commit

Commit with message: `refactor: extract [service-name] to @dotagents/core`

## Critical Rules

- **NEVER import from 'electron' in packages/core/** — this is the #1 invariant
- **NEVER import from apps/desktop/ in packages/core/** — dependency flows one way
- **Always build core before testing desktop** — desktop depends on core's build output
- **Keep the service's public API identical** — callers should not need to change how they call the service, only where they import from
- **Preserve all existing tests** — migrate them to core or ensure they still pass in desktop

## Example Handoff

```json
{
  "salientSummary": "Extracted config.ts to packages/core with PathResolver abstraction replacing app.getPath(). Created ElectronPathResolver in desktop. Registered in desktop startup. 3 config tests migrated to core, all pass. pnpm typecheck passes. grep confirms 0 electron imports in core.",
  "whatWasImplemented": "Moved config.ts from apps/desktop/src/main/ to packages/core/src/config.ts. Replaced 4 app.getPath() calls with pathResolver.getUserDataPath() and pathResolver.getConfigPath(). Created PathResolver interface in packages/core/src/interfaces/path-resolver.ts. Created ElectronPathResolver in apps/desktop/src/main/adapters/electron-path-resolver.ts. Updated desktop index.ts to register ElectronPathResolver with service container. Updated 15 import sites in desktop to use @dotagents/core.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @dotagents/core exec vitest run", "exitCode": 0, "observation": "12 tests passed, 0 failed" },
      { "command": "pnpm --filter @dotagents/core build", "exitCode": 0, "observation": "Built successfully" },
      { "command": "pnpm typecheck", "exitCode": 0, "observation": "All packages clean" },
      { "command": "pnpm --filter @dotagents/desktop exec vitest run", "exitCode": 1, "observation": "Same 8 pre-existing failures, no new failures" },
      { "command": "grep -r \"from 'electron'\" packages/core/src/", "exitCode": 1, "observation": "No matches — zero Electron imports in core" },
      { "command": "grep -r '@dotagents/desktop' packages/core/src/", "exitCode": 1, "observation": "No matches — no reverse dependency" }
    ],
    "interactiveChecks": []
  },
  "tests": {
    "added": [
      { "file": "packages/core/src/config.test.ts", "cases": [
        { "name": "resolves data folder using PathResolver", "verifies": "PathResolver abstraction works" },
        { "name": "reads config from agents files", "verifies": "Config loading works without Electron" },
        { "name": "persists config changes to disk", "verifies": "Config writing works" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- A service has deep Electron dependencies that can't be cleanly abstracted (more than path resolution + progress emission)
- Circular dependency detected between core and desktop
- A service depends on another service that hasn't been extracted yet and isn't in the preconditions
- Existing tests break in ways that indicate behavioral changes (not just import path changes)
- The service container doesn't exist yet but the feature requires it
