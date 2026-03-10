import { beforeEach, describe, expect, it, vi } from "vitest"

async function loadModule(configOverrides: Record<string, unknown> = {}) {
  vi.resetModules()

  const chat = vi.fn((model: string) => ({ provider: "openai-compatible", model }))
  const createOpenAI = vi.fn(() => ({ chat }))
  const google = vi.fn((model: string) => ({ provider: "gemini", model }))
  const createGoogleGenerativeAI = vi.fn(() => google)

  vi.doMock("@ai-sdk/openai", () => ({ createOpenAI }))
  vi.doMock("@ai-sdk/google", () => ({ createGoogleGenerativeAI }))
  vi.doMock("./debug", () => ({ isDebugLLM: () => false, logLLM: vi.fn() }))
  vi.doMock("./config", () => ({
    configStore: {
      get: () => ({
        mcpToolsProviderId: "openai",
        openaiApiKey: "openai-key",
        groqApiKey: "groq-key",
        geminiApiKey: "gemini-key",
        ...configOverrides,
      }),
    },
  }))

  const mod = await import("./ai-sdk-provider")
  return { mod, chat, createOpenAI, google, createGoogleGenerativeAI }
}

describe("ai-sdk-provider chat model sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("falls back when a Groq STT model is configured for transcript post-processing", async () => {
    const { mod, chat } = await loadModule({
      transcriptPostProcessingGroqModel: "whisper-large-v3-turbo",
    })

    const model = mod.createLanguageModel("groq", "transcript")

    expect(chat).toHaveBeenCalledWith("llama-3.1-70b-versatile")
    expect(mod.getCurrentModelName("groq", "transcript")).toBe("llama-3.1-70b-versatile")
    expect(model).toEqual({ provider: "openai-compatible", model: "llama-3.1-70b-versatile" })
  })

  it("preserves valid Groq chat models for transcript post-processing", async () => {
    const { mod, chat } = await loadModule({
      transcriptPostProcessingGroqModel: "llama-3.3-70b-versatile",
    })

    mod.createLanguageModel("groq", "transcript")

    expect(chat).toHaveBeenCalledWith("llama-3.3-70b-versatile")
    expect(mod.getCurrentModelName("groq", "transcript")).toBe("llama-3.3-70b-versatile")
  })
})