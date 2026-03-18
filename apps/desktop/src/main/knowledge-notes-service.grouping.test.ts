import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

let globalAgentsFolder = ""
let tempRoot = ""

vi.mock("./config", () => ({
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

describe("KnowledgeNotesService grouping follow-up", () => {
  beforeEach(() => {
    vi.resetModules()
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-knowledge-service-"))
    globalAgentsFolder = path.join(tempRoot, ".agents")
  })

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  it("reorganizes a flat recurring note into a grouped folder and preserves assets", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    await knowledgeNotesService.saveNote({
      id: "discord-recap-2026-03-18",
      title: "Discord recap for Mar 18",
      context: "search-only",
      updatedAt: 1770000000000,
      tags: ["discord", "summary"],
      body: "Community recap",
    })

    const originalDir = path.join(globalAgentsFolder, "knowledge", "discord-recap-2026-03-18")
    fs.writeFileSync(path.join(originalDir, "transcript.txt"), "hello")

    await knowledgeNotesService.reload()
    const result = await knowledgeNotesService.consolidateRecurringNotes()

    expect(result.reorganizedCount).toBe(1)
    expect(result.errorCount).toBe(0)

    const groupedDir = path.join(globalAgentsFolder, "knowledge", "discord", "recaps", "discord-recap-2026-03-18")
    expect(fs.existsSync(path.join(groupedDir, "discord-recap-2026-03-18.md"))).toBe(true)
    expect(fs.existsSync(path.join(groupedDir, "transcript.txt"))).toBe(true)
    expect(fs.existsSync(originalDir)).toBe(false)

    const notes = await knowledgeNotesService.getAllNotes()
    expect(notes[0]).toMatchObject({
      id: "discord-recap-2026-03-18",
      group: "discord",
      series: "recaps",
      entryType: "entry",
    })
  })
})