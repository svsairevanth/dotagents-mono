import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-start gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0 cursor-pointer"'
    )
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-start gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"')
  })

  it("wraps the tile footer metadata row and preserves trailing status visibility", () => {
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"')
    expect(agentProgressSource).toContain('<ACPSessionBadge info={acpSessionInfo} className="min-w-0 max-w-full" />')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap">Step')
  })

  it("caps ACP session badges to the available tile width and truncates long labels", () => {
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain('className="truncate"')
  })
})