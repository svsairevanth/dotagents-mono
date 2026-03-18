import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AgentProfile, AgentProfileRole } from "../shared/types"

const mockAgentProfileService = {
  getByRole: vi.fn((_role: AgentProfileRole) => [] as AgentProfile[]),
  getCurrentProfile: vi.fn(() => undefined as AgentProfile | undefined),
}

// Avoid pulling in real ACP/services (can have side effects / require Electron runtime)
vi.mock("./acp/acp-smart-router", () => ({
  acpSmartRouter: {
    generateDelegationPromptAddition: () => "",
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    getAgents: () => [],
  },
}))

vi.mock("./acp/internal-agent", () => ({
  getInternalAgentInfo: () => ({
    maxRecursionDepth: 1,
    maxConcurrent: 1,
  }),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: mockAgentProfileService,
}))

describe("constructSystemPrompt", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockAgentProfileService.getByRole.mockReturnValue([])
    mockAgentProfileService.getCurrentProfile.mockReturnValue(undefined)
  })

  it("injects skillsInstructions only once", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const skills = "SKILLS_BLOCK_UNIQUE_12345"
    const prompt = constructSystemPrompt([], undefined, true, undefined, undefined, skills)

    expect(prompt.split(skills).length - 1).toBe(1)
  })

  it("teaches the knowledge note storage contract in the default prompt", async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts")

    expect(DEFAULT_SYSTEM_PROMPT).toContain("~/.agents/knowledge/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("./.agents/knowledge/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("human-readable slug")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: search-only")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: auto")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("direct file editing")
  })

  it("replaces save_memory guidance with note-first durable knowledge guidance", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)

    expect(prompt).toContain("KNOWLEDGE NOTES (durable context)")
    expect(prompt).toContain("Prefer direct file editing there over special-purpose note tools")
    expect(prompt).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(prompt).not.toContain("Use save_memory")
  })

  it("preserves knowledge note guidance in the minimal fallback prompt", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("~/.agents/knowledge/")
    expect(prompt).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(prompt).toContain("context: search-only")
    expect(prompt).toContain("context: auto")
  })

  it("formats injected working notes from knowledge notes", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, false, undefined, undefined, undefined, undefined, [
      {
        id: "project-architecture",
        title: "Project Architecture",
        context: "auto",
        updatedAt: 2,
        tags: ["architecture"],
        summary: "Layered Electron app with workspace-overrides-global note loading.",
        body: "Longer details here.",
      } as any,
      {
        id: "release-plan",
        title: "Release Plan",
        context: "auto",
        updatedAt: 1,
        tags: ["release"],
        body: "# Milestones\nShip the staged rollout next week.",
      } as any,
    ])

    expect(prompt).toContain("WORKING NOTES")
    expect(prompt).toContain("context: auto")
    expect(prompt).toContain("[project-architecture] Layered Electron app with workspace-overrides-global note loading.")
    expect(prompt).toContain("[release-plan] Release Plan: Milestones Ship the staged rollout next week.")
    expect(prompt).not.toContain("KNOWLEDGE FROM PREVIOUS SESSIONS")
  })

  it("prefers direct execution over mandatory delegation for simple tasks", async () => {
    mockAgentProfileService.getByRole.mockReturnValue([
      {
        id: "augustus",
        name: "augustus",
        enabled: true,
        displayName: "augustus",
        description: "Augment Code's AI coding assistant with native ACP support",
        connection: { type: "internal" },
        createdAt: 0,
        updatedAt: 0,
      },
    ])

    const { getAgentsPromptAddition } = await import("./system-prompts")

    const prompt = getAgentsPromptAddition()

    expect(prompt).toContain("Prefer doing the work directly")
    expect(prompt).toContain("Delegate when the user explicitly asks for a specific agent")
    expect(prompt).toContain("incorporate the result into a complete answer")
    expect(prompt).not.toContain("ALWAYS delegate")
    expect(prompt).not.toContain("Only respond directly if NO agent matches")
  })
})
