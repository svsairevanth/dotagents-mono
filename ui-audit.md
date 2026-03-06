- UI audit log

## 2026-03-06 — chunk 1: settings form responsiveness

### Sources consulted
- `apps/desktop/DEBUGGING.md`
- renderer settings pages/components under `apps/desktop/src/renderer/src/`

### Highest-value area selected
- Shared settings form rows (`components/ui/control.tsx`) used across dense settings surfaces.
- First concrete targets: `settings-general.tsx`, `settings-providers.tsx`, `settings-remote-server.tsx`.

### Issues found
- Control rows were hardcoded to a single horizontal layout with the value area capped at ~50%, which is fragile at narrow window widths and larger font scales.
- Long labels/tooltips/end descriptions could feel cramped or wrap poorly.
- Several settings selects used fixed pixel widths only (`w-[120px]`, `w-[180px]`, `w-[200px]`, etc.), increasing the chance of truncation or horizontal pressure.
- Settings pages used desktop-oriented horizontal padding and generic `overflow-auto`, making small-window behavior less polished.

### Changes made
- Updated `Control` to use a stacked-first responsive layout on small widths, switching to horizontal alignment at `sm` and preserving desktop balance.
- Allowed labels and tooltip rows to wrap cleanly with `break-words`/`flex-wrap`.
- Made `ControlGroup` end descriptions use full width on small screens and right-align only on larger widths.
- Changed the most visible fixed-width triggers/inputs in General, Providers, and Remote Server to `w-full sm:w-[...]` patterns.
- Tightened the audited settings page wrappers to `overflow-y-auto overflow-x-hidden px-4 sm:px-6` for better small-window behavior.
- Added a focused regression test for the shared `Control`/`ControlLabel` responsive class contract.

### Follow-up areas for next chunk
- Inspect the live settings sidebar + nested panel structure on `/settings/providers` for any double-panel/double-padding polish issues.
- Audit agents/settings list screens for long-name truncation and empty-state spacing.
- Check mobile/remote surfaces separately; this chunk was desktop renderer settings-focused.

---

## 2026-03-06 — chunk 2: sessions page header + onboarding

### Sources consulted
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/onboarding.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-tile.tsx`
- `apps/desktop/src/renderer/src/components/sessions-kanban.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Issues found

**Sessions active header bar (sessions.tsx)**
- The left-side action group was `flex gap-2 items-center` with no wrapping — at narrow window widths the `AgentSelector + "Start with Text" + "Start with Voice" + PredefinedPromptsMenu` buttons would overflow without clipping or wrapping.
- The button labels ("Start with Text", "Start with Voice") were always rendered, taking unnecessary horizontal space on small windows.
- The right-side "Past Sessions" button also always showed its text label.
- The `justify-between` container had no padding normalization between sides on wrap.

**Sessions EmptyState (sessions.tsx)**
- Keybind hints row used `hidden md:flex` — completely invisible on windows narrower than `md` (768 px). This hides useful information from users on typical app panel sizes.
- The recent sessions list was constrained to `max-w-md` (~448 px) which looks too narrow on large screens; the action buttons area had no max-width alignment.
- Button row used `flex gap-3` without `flex-wrap` — could overflow on very narrow widths.

**Onboarding (onboarding.tsx)**
- The outer container was `flex h-dvh items-center justify-center p-10` with no overflow handling. On short-height displays (< ~700 px), the tall `AgentStep` or `WelcomeStep` content would be clipped with no scroll.
- A `-mt-10` negative margin was used to shift the centered block upward — a fragile visual hack.

### Changes made

**sessions.tsx — active header**
- Changed the outer bar to `flex flex-wrap items-center gap-2 px-3 py-2` so the two groups reflow on wrap instead of overflowing.
- Changed the left group to `flex flex-wrap gap-1.5 items-center min-w-0 flex-1` with correct `shrink-0` on icons.
- Wrapped "Start with Text" and "Start with Voice" button labels in `<span className="hidden sm:inline">` — icon-only on narrow windows, labeled at `sm+`.
- Wrapped "Past Sessions" button label in `<span className="hidden md:inline">` — icon-only at `sm`, labeled at `md+`.
- Tightened gaps throughout to `gap-1.5/gap-1` to reduce horizontal pressure.

**sessions.tsx — EmptyState**
- Removed `hidden md:flex` from the keybind hints row; replaced with `flex flex-wrap items-center justify-center gap-3 text-xs` so hints show at all widths and wrap gracefully.
- Slightly reduced individual hint text size (already `text-xs`) and inlined key padding to `px-1.5`.
- Widened the action area and recent sessions list from `max-w-md` to `max-w-lg` for better use of space on larger windows.
- Added `flex-wrap` to the main button row so it wraps instead of overflowing.
- Standardized horizontal padding to `px-6 py-8`.

**onboarding.tsx**
- Changed outer container to `flex h-dvh overflow-y-auto` — removes the fixed vertical centering that caused clipping.
- The inner content block now uses `w-full max-w-2xl mx-auto my-auto px-6 py-10` to stay centered vertically when there's space, and scroll when there isn't.
- Removed the `p-10` on the outer container and the `-mt-10` negative margin hack.

### Verified not broken
- `session-grid.tsx`: uses ResizeObserver for dynamic tile sizing — no overflow issues found.
- `session-tile.tsx`: header uses `flex-1 min-w-0` + `truncate` on title — correct.
- `sessions-kanban.tsx`: uses `overflow-x-auto` with `min-w-[300px]` per column — correct.
- `agent-progress.tsx` tile header: icon-only action buttons, title with `truncate` — correct.

### Follow-up areas for next chunk
- Audit the panel overlay views (`panel.tsx`, `overlay-follow-up-input.tsx`) for button/input overflow on narrow floating windows.
- Audit the memories page and agent config list for long-name/description truncation.
- Check font scaling edge cases (system font size 125–200%) in agent-progress messages/tool outputs.

---

## 2026-03-06 — chunk 3: memories page layout + settings-agents toolbar + agent-progress overlay header

### Sources consulted
- `apps/desktop/src/renderer/src/pages/memories.tsx`
- `apps/desktop/src/renderer/src/pages/settings-agents.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx` (overlay/default variant header, lines ~3333-3434)
- `apps/desktop/src/renderer/src/pages/panel.tsx` (min-width constants, waveform layout)
- `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`

### Issues found

**memories.tsx — search + filter row**
- `flex items-center gap-3` outer row had no `flex-wrap` — at windows narrower than the combined width of the search box + 5 filter buttons (~650px), the filter row would overflow the container and become partially hidden under the scroll boundary.
- Filter button container `flex items-center gap-2` also lacked `flex-wrap`, so the 5 buttons (all/critical/high/medium/low) had no fallback to a second line.
- The `max-w-md` search input had `flex-1` without `min-w-0`, so at very narrow widths the input could force the layout rather than shrinking.

**memories.tsx — header action buttons**
- The `flex items-start justify-between gap-4` header row had `<div className="flex gap-2">` for the action buttons without `flex-wrap` — at ≤ 480px window widths the "Open Folder" / "Workspace" buttons could overflow.
- The title div lacked `min-w-0`, preventing proper truncation behavior.

**settings-agents.tsx — toolbar row**
- `flex items-center justify-end gap-2 mb-4` contained 5 action buttons (Import Bundle, Export Bundle, Export for Hub, Rescan Files, Add Agent) without `flex-wrap`. At settings panel widths below ~680px these would overflow or clip.

**agent-progress.tsx — overlay/default variant header (lines ~3334)**
- The outer header div had `flex items-center justify-between` with no `overflow-hidden`. The right-side metadata cluster `flex items-center gap-3` contained up to 6 elements simultaneously (profile name, ACP badge, model info, context fill bar, iteration counter, 2 icon buttons). At the panel's minimum width (~312px), all 6 elements at `gap-3` spacing would overflow by ~80–90px with no fallback.
- The iteration counter and action buttons had no `shrink-0`, so they would compress with the rest of the cluster making them inaccessible at narrow widths.

### Changes made

**memories.tsx**
- Changed outer search+filter row to `flex flex-wrap items-center gap-3`.
- Changed search `div` to `relative min-w-0 flex-1 max-w-md` (added `min-w-0`).
- Changed filter button container to `flex flex-wrap items-center gap-1.5` (was `gap-2`).
- Changed header outer `div` to `flex flex-wrap items-start justify-between gap-4`.
- Changed title child `div` to `min-w-0`.
- Changed header action button container to `flex flex-wrap gap-2 shrink-0`.

**settings-agents.tsx**
- Changed toolbar row to `flex flex-wrap items-center justify-end gap-2 mb-4` — buttons now reflow to a second line at narrow settings panel widths.

**agent-progress.tsx (overlay variant)**
- Changed outer header `div` to add `gap-2 overflow-hidden`.
- Changed left status `div` to `flex items-center gap-2 shrink-0` so status text is never compressed.
- Changed right metadata `div` from `flex items-center gap-3` to `flex min-w-0 items-center gap-1.5 overflow-hidden` so items can shrink.
- Added `shrink-0 tabular-nums` to iteration counter span.
- Added `shrink-0` to minimize button, kill button, and close button so action buttons are never hidden by compression.

### Verified not broken
- TypeScript typecheck passes (`pnpm --filter @dotagents/desktop typecheck`): exit 0.
- `overlay-follow-up-input.tsx`: Already uses compact `px-3 py-2 gap-2` row. Icon-only buttons with fixed `h-7 w-7` — at the panel minimum width the input row gracefully fills remaining space. No changes needed.
- `panel.tsx` waveform UI: Uses `ResizeObserver`-driven dynamic bar count + pixel-perfect sizing. Not affected by these changes.

### Follow-up areas for next chunk
- Font scale audit (125%–200% system font scale) on agent-progress message content and tool output `pre` blocks — verify `text-[9px]`/`text-[10px]`/`text-[11px]` sizes remain readable.
- Check `active-agents-sidebar.tsx` and `app-layout.tsx` for sidebar collapse/expand responsiveness.
- Audit `past-sessions-dialog.tsx` for long session title truncation and narrow dialog layout.
