import { afterEach, describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import type { KnowledgeNote } from "@dotagents/core"
import { loadWorkingKnowledgeNotesForPrompt } from "./working-notes-runtime"

const tempDirs: string[] = []

function mkTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function writeNote(agentsDir: string, note: KnowledgeNote): void {
  const noteDir = path.join(agentsDir, "knowledge", note.id)
  const frontmatter = [
    "---",
    "kind: note",
    `id: ${note.id}`,
    `title: ${note.title}`,
    `context: ${note.context}`,
    `updatedAt: ${note.updatedAt}`,
    `tags: ${note.tags.join(", ")}`,
    ...(note.summary ? [`summary: ${note.summary}`] : []),
    "---",
    "",
    note.body,
  ].join("\n")

  fs.mkdirSync(noteDir, { recursive: true })
  fs.writeFileSync(path.join(noteDir, `${note.id}.md`), frontmatter, "utf8")
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe("working-notes-runtime", () => {
  it("layers workspace notes over global by id before filtering working notes", () => {
    const globalAgentsDir = path.join(mkTempDir("dotagents-global-"), ".agents")
    const workspaceAgentsDir = path.join(mkTempDir("dotagents-workspace-"), ".agents")

    writeNote(globalAgentsDir, {
      id: "project-architecture",
      title: "Project Architecture",
      context: "auto",
      updatedAt: 10,
      tags: ["architecture"],
      summary: "Global architecture summary.",
      body: "Global body",
    })
    writeNote(globalAgentsDir, {
      id: "release-plan",
      title: "Release Plan",
      context: "auto",
      updatedAt: 5,
      tags: ["release"],
      body: "Global release plan body.",
    })

    writeNote(workspaceAgentsDir, {
      id: "project-architecture",
      title: "Project Architecture",
      context: "search-only",
      updatedAt: 99,
      tags: ["architecture"],
      body: "Workspace override removes this from auto injection.",
    })
    writeNote(workspaceAgentsDir, {
      id: "workspace-rules",
      title: "Workspace Rules",
      context: "auto",
      updatedAt: 20,
      tags: ["workspace"],
      summary: "Workspace-specific rules.",
      body: "Workspace rules body.",
    })

    const notes = loadWorkingKnowledgeNotesForPrompt({
      globalAgentsDir,
      workspaceAgentsDir,
      maxNotes: 10,
    })

    expect(notes.map((note) => note.id)).toEqual([
      "workspace-rules",
      "release-plan",
    ])
  })

  it("keeps the injected subset intentionally tiny via maxNotes", () => {
    const globalAgentsDir = path.join(mkTempDir("dotagents-global-"), ".agents")

    writeNote(globalAgentsDir, {
      id: "n1",
      title: "Note 1",
      context: "auto",
      updatedAt: 1,
      tags: [],
      body: "First",
    })
    writeNote(globalAgentsDir, {
      id: "n2",
      title: "Note 2",
      context: "auto",
      updatedAt: 2,
      tags: [],
      body: "Second",
    })
    writeNote(globalAgentsDir, {
      id: "n3",
      title: "Note 3",
      context: "auto",
      updatedAt: 3,
      tags: [],
      body: "Third",
    })

    const notes = loadWorkingKnowledgeNotesForPrompt({
      globalAgentsDir,
      maxNotes: 2,
    })

    expect(notes.map((note) => note.id)).toEqual(["n3", "n2"])
  })
})