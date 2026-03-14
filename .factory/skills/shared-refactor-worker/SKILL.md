---
name: shared-refactor-worker
description: Consolidates shared packages, unifies types, extracts utilities, adds tests, and removes dead packages.
---

# Shared Refactor Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for features involving:
- Removing dead packages from the monorepo
- Unifying diverged type definitions into `@dotagents/shared`
- Extracting reusable utility code from apps into shared packages
- Adding tests for shared package modules
- Updating imports across desktop and mobile to use shared types

## Work Procedure

### 1. Understand the Feature

Read the feature description, preconditions, and expected behavior carefully. Identify:
- Which files need to change
- What types/utilities need to move or be unified
- What imports need updating across apps

### 2. Investigate Current State

Before making changes:
- Read the current source files involved (use Read tool)
- Grep for all usages of the types/utilities being changed across the entire monorepo
- Identify ALL import sites that will need updating
- Note any type differences between desktop and mobile versions

### 3. Write Tests First (TDD)

For new or changed shared modules:
1. Create test files in `packages/shared/src/` (e.g., `chat-utils.test.ts`)
2. Write failing tests that verify the expected behavior of the unified type or extracted utility
3. Run `pnpm --filter @dotagents/shared exec vitest run` to confirm tests fail
4. Then implement the changes to make tests pass

### 4. Implement Changes

For type unification:
1. Create/update the type in `packages/shared/src/`
2. Make it a superset — all fields from all platforms, platform-specific fields optional
3. Update `packages/shared/src/index.ts` to export the new type
4. Update `packages/shared/tsup.config.ts` if adding a new entry point
5. Update `packages/shared/package.json` exports if adding a new entry point
6. Build shared: `pnpm --filter @dotagents/shared build`

For utility extraction:
1. Move the utility to `packages/shared/src/`
2. Remove or replace the original file with a re-export from shared
3. Build shared

For dead package removal:
1. Remove the package directory
2. Remove from pnpm-workspace.yaml if needed
3. Run `pnpm install` to update lockfile
4. Grep for any remaining references

### 5. Update All Consumers

After changing shared:
1. Build shared first: `pnpm --filter @dotagents/shared build`
2. Update desktop imports to use `@dotagents/shared`
3. Update mobile imports to use `@dotagents/shared`
4. Remove local copies of extracted code (or convert to re-exports if needed for backward compat)

### 6. Verify Everything

Run ALL of these commands and report results:
1. `pnpm --filter @dotagents/shared exec vitest run` — shared tests pass
2. `pnpm --filter @dotagents/shared build` — shared builds
3. `pnpm typecheck` — full workspace typecheck
4. `pnpm --filter @dotagents/desktop exec vitest run` — desktop tests (8 pre-existing failures allowed)
5. `pnpm lint` — lint passes

### 7. Commit

Commit with a descriptive message covering what was unified/extracted/removed.

## Example Handoff

```json
{
  "salientSummary": "Unified AgentProgressUpdate/AgentProgressStep types into @dotagents/shared as a superset of desktop (15 fields) and mobile (spokenContent) versions. Updated 12 import sites in desktop and 3 in mobile. Added 8 test cases for the unified types. pnpm typecheck passes, vitest run shows 0 new failures.",
  "whatWasImplemented": "Created packages/shared/src/agent-progress-types.ts with unified AgentProgressUpdate interface covering all fields from both platforms. Updated desktop src/shared/types.ts to re-export from shared. Updated mobile openaiClient.ts to import from shared. Removed duplicate type definitions. Added comprehensive tests.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @dotagents/shared exec vitest run", "exitCode": 0, "observation": "8 tests passed, 0 failed" },
      { "command": "pnpm --filter @dotagents/shared build", "exitCode": 0, "observation": "Built CJS + ESM with types" },
      { "command": "pnpm typecheck", "exitCode": 0, "observation": "All packages typecheck clean" },
      { "command": "pnpm --filter @dotagents/desktop exec vitest run", "exitCode": 1, "observation": "482 passed, 26 failed (all 8 pre-existing failures in settings-general.langfuse-draft and settings-loops.interval-draft)" },
      { "command": "grep -r 'interface AgentProgressUpdate' packages/ apps/", "exitCode": 0, "observation": "Single definition in packages/shared/src/agent-progress-types.ts" }
    ],
    "interactiveChecks": []
  },
  "tests": {
    "added": [
      { "file": "packages/shared/src/agent-progress-types.test.ts", "cases": [
        { "name": "AgentProgressUpdate has all desktop fields as optional", "verifies": "Type compatibility with desktop" },
        { "name": "AgentProgressUpdate has spokenContent as optional", "verifies": "Type compatibility with mobile" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- A type unification creates breaking changes that can't be resolved with optional fields
- Desktop or mobile has complex type guards that break with the unified type
- Circular import issues arise from the new shared exports
- Build failures that can't be resolved within the feature scope
