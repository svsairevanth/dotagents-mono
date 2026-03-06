import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("acp-session-state", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("clears client token mappings even when no app session mapping exists", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpClientSessionTokenMapping("client-token-only", "acp-token-only")
    expect(sessionState.getAcpSessionForClientSessionToken("client-token-only")).toBe("acp-token-only")

    sessionState.clearAcpToAppSessionMapping("acp-token-only")

    expect(sessionState.getAcpSessionForClientSessionToken("client-token-only")).toBeUndefined()
    expect(sessionState.getAppSessionForAcpSession("acp-token-only")).toBeUndefined()
    expect(sessionState.getAppRunIdForAcpSession("acp-token-only")).toBeUndefined()
  })
})