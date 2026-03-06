import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetAgentInstance = vi.fn()
const mockGetOrCreateSession = vi.fn()
const mockSendPrompt = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()
const mockEmitAgentProgress = vi.fn(() => Promise.resolve())
const mockLoadConversation = vi.fn()

vi.mock("./acp-service", () => ({
  acpService: {
    getAgentInstance: mockGetAgentInstance,
    getOrCreateSession: mockGetOrCreateSession,
    sendPrompt: mockSendPrompt,
    on: mockOn,
    off: mockOff,
  },
}))

vi.mock("./acp-session-state", () => ({
  getSessionForConversation: vi.fn(() => undefined),
  setSessionForConversation: vi.fn(),
  clearSessionForConversation: vi.fn(),
  touchSession: vi.fn(),
  setAcpToSpeakMcpSessionMapping: vi.fn(),
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: mockEmitAgentProgress,
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    loadConversation: mockLoadConversation,
  },
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("acp-main-agent", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockLoadConversation.mockResolvedValue(undefined)
    mockGetOrCreateSession.mockResolvedValue("acp-session-1")
    mockSendPrompt.mockResolvedValue({ success: true, response: "done" })
    mockGetAgentInstance.mockReturnValue({
      agentInfo: { name: "test-agent", title: "Test Agent", version: "1.0.0" },
      sessionInfo: {
        configOptions: [
          {
            id: "model",
            name: "Model",
            type: "select",
            currentValue: "sonnet",
            options: [{ value: "sonnet", name: "Claude Sonnet" }],
          },
          {
            id: "mode",
            name: "Mode",
            type: "select",
            currentValue: "code",
            options: [{ value: "code", name: "Code" }],
          },
        ],
      },
    })
  })

  it("falls back to matching config option ids when categories are missing", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ acpSessionInfo?: Record<string, unknown> }> = []

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: "done",
      acpSessionId: "acp-session-1",
    }))
    expect(updates[0]?.acpSessionInfo).toEqual(expect.objectContaining({
      currentModel: "Claude Sonnet",
      currentMode: "Code",
      availableModels: [expect.objectContaining({ id: "sonnet", name: "Claude Sonnet" })],
      availableModes: [expect.objectContaining({ id: "code", name: "Code" })],
    }))
  })
})