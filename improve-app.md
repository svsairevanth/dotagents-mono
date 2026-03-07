## Improve App Log

### Purpose
Track small, shippable product improvements. Review this file before each iteration to avoid repeating recent investigations and to keep momentum focused on high-leverage changes.

### Recently Investigated
- 2026-03-07: Initial setup. No prior investigation log existed.
- 2026-03-07: Desktop main-process session shutdown guardrails (`apps/desktop/src/main/state.ts`).
- 2026-03-07: Desktop text composer submission resilience (`apps/desktop/src/renderer/src/components/text-input-panel.tsx`).
- 2026-03-07: Desktop follow-up composer duplicate-submit guardrails (`apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`, `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`).

### 2026-03-07 — Desktop session shutdown guardrails
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop main-process session lifecycle and shutdown cleanup in `apps/desktop/src/main/state.ts`
- Why it was chosen:
  - `ui-audit.md` already covers many recent UX-polish iterations, so this pass deliberately avoided overlapping that work.
  - Session stop/cleanup is a high-leverage reliability seam because it is shared by normal session completion, manual stop flows, sub-session cancellation, and emergency-stop behavior.
- What was inspected:
  - `apps/desktop/src/main/state.ts`
  - `apps/desktop/src/main/llm-fetch.ts`
  - `apps/desktop/src/main/emergency-stop.ts`
  - usages of `agentSessionStateManager.stopSession(...)`, `cleanupSession(...)`, and `toolApprovalManager.cancelSessionApprovals(...)`
  - existing session-related tests in `apps/desktop/src/main/acp-session-state.test.ts` and `apps/desktop/src/main/acp-service.test.ts`
- Improvement made:
  - centralized session shutdown cleanup in `state.ts` so `stopSession(...)` and `cleanupSession(...)` now:
    - unregister session abort controllers from the global `llmRequestAbortManager` before aborting them
    - cancel pending tool approvals for that session instead of relying on each caller to remember
  - added focused regression coverage in `apps/desktop/src/main/state.test.ts`
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/main/state.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:node`
- Follow-up checks:
  - inspect other session-adjacent cleanup seams for the same “caller must remember” pattern, especially queue pause/resume and user-response cleanup on less common cancellation paths
  - inspect desktop composer / send flows next for a small UX or resilience improvement

### 2026-03-07 — Desktop text composer submission resilience
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop panel text composer / new-message send flow in `apps/desktop/src/renderer/src/components/text-input-panel.tsx`
  - submit orchestration in `apps/desktop/src/renderer/src/pages/panel.tsx`
- Why it was chosen:
  - the previous reliability pass explicitly called out desktop composer / send flows as the next area to inspect
  - this composer starts new desktop text sessions, so duplicate submissions or draft loss here directly affect a core user flow
- What was inspected:
  - `apps/desktop/src/renderer/src/components/text-input-panel.tsx`
  - `apps/desktop/src/renderer/src/pages/panel.tsx`
  - adjacent desktop follow-up composers in `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` and `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/session-input.tsx` (found to be currently unused)
  - mobile composer send callback in `apps/mobile/src/screens/ChatScreen.tsx` to check whether the same fix needed to be mirrored there
- Improvement made:
  - hardened the active desktop text composer so it now awaits the async submit result instead of clearing immediately
  - preserved the draft when submission is declined before the session starts (for example, if selected-agent application does not complete)
  - added a local in-flight submit guard so rapid repeat clicks / Enter presses cannot trigger duplicate sends before parent mutation state propagates
  - updated `panel.tsx` to return an explicit success boolean from `handleTextSubmit(...)` so the composer knows when it is safe to clear local state
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/text-input-panel.submit.test.tsx src/renderer/src/pages/panel.recording-layout.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:web`
- Follow-up checks:
  - inspect `overlay-follow-up-input.tsx` and `tile-follow-up-input.tsx` for similar resilience gaps around send-error feedback and queued/active-session edge states
  - decide whether the currently unused `session-input.tsx` should be removed, revived, or brought under test to avoid future drift

### 2026-03-07 — Desktop follow-up composer duplicate-submit guardrails
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop session follow-up composers in `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`
  - desktop session-tile follow-up composer in `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- Why it was chosen:
  - the previous composer-resilience pass explicitly called out these follow-up inputs as the next likely seam for the same duplicate-submit race
  - these components continue active conversations, so accidental duplicate sends degrade a core ongoing-session workflow
- What was inspected:
  - `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/agent-progress.tsx` to confirm how tile and overlay follow-up inputs are mounted, including pending-session behavior
  - `apps/mobile/src/screens/ChatScreen.tsx` for renderer/mobile parity; confirmed mobile uses a different primary-composer path rather than these desktop-specific follow-up components
- Improvement made:
  - added a local `isSubmitting` state plus `submitInFlightRef` guard to both desktop follow-up composers
  - switched both submit handlers to `mutateAsync(...)` so the guard spans the full async send lifecycle instead of depending only on React Query state propagation
  - disabled follow-up text and voice controls immediately during local submit startup, closing the rapid double-click / double-Enter race window before `isPending` re-renders
  - added focused regression coverage in `apps/desktop/src/renderer/src/components/follow-up-input.submit.test.ts`
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/follow-up-input.submit.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:web`
- Follow-up checks:
  - inspect whether these follow-up composers should surface clearer user-visible error feedback when async sends fail
  - inspect the mobile `ChatScreen` primary composer separately for similar duplicate-submit risks, since it uses a different send path and was not changed in this pass

### Iteration Template
- Date:
- Area / screen / subsystem:
- Why it was chosen:
- What was inspected:
- Improvement made:
- Tests / verification:
- Follow-up checks:

### Backlog of Areas to Inspect
- Desktop follow-up composers and queued-send edge states
- Desktop session lifecycle and error states (follow-up: queue/user-response cleanup consistency)
- Settings screens and validation UX
- Agent/task management flows
- Mobile parity gaps with desktop
- Shared utility reliability / guardrails
- Test coverage gaps around critical user flows

