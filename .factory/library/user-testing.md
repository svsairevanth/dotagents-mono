# User Testing

Testing surface, validation tools, and resource cost classification.

**What belongs here:** How to test the apps, what tools to use, setup requirements, concurrency limits.

---

## Validation Surface

### Desktop App (Electron)
- **Tool:** agent-browser (CDP connection)
- **Setup:** Desktop must be running with `REMOTE_DEBUGGING_PORT=9222 pnpm dev`
- **Connection:** `agent-browser connect 9222`
- **Port:** 9222 (debug), 3210 (remote server)
- **What to test:** Chat interface, settings page, agent profile switching, tool approval, agent progress display

### CLI App (Terminal TUI)
- **Tool:** Terminal commands and output inspection (tuistory not available)
- **Setup:** Build CLI, then run from terminal
- **What to test:** TUI renders, chat works, streaming, tool approval, conversation management, settings panels
- **Limitation:** No tuistory available — validate via build + test + manual smoke checks

### Mobile App (Expo)
- **Tool:** Typecheck only (no simulator available for automated testing)
- **What to test:** Types resolve, build succeeds
- **Limitation:** Cannot run mobile app for validation — rely on typecheck and build

## Validation Concurrency

### agent-browser surface (desktop)
- **Max concurrent validators:** 3
- **Rationale:** Electron app + agent-browser session = ~500MB each. 3 instances = 1.5GB. Machine has 16GB with ~8.4GB usable headroom (70% of free memory). Well within budget.
- **Note:** All validators share the same Electron app instance (same CDP port), so they must coordinate to avoid conflicting interactions.

### CLI surface
- **Max concurrent validators:** 3
- **Rationale:** Each CLI instance = ~200MB (conservative estimate for OpenTUI + Zig native). 3 instances = 600MB. Within budget.
- **Note:** Each validator needs its own terminal session and potentially its own config directory to avoid state conflicts.

## Pre-existing Issues

- 8 pre-existing desktop test failures in renderer tests (settings-general.langfuse-draft, settings-loops.interval-draft) — unrelated to this mission
- Desktop app must be restarted with REMOTE_DEBUGGING_PORT=9222 for agent-browser validation
