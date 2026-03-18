import { describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import type { KnowledgeNote } from "../types"
import { getAgentsLayerPaths } from "./modular-config"
import {
  getAgentsKnowledgeBackupDir,
  getAgentsKnowledgeDir,
  knowledgeNoteSlugToFilePath,
  loadAgentsKnowledgeNotesLayer,
  parseKnowledgeNoteMarkdown,
  stringifyKnowledgeNoteMarkdown,
  writeKnowledgeNoteFile,
} from "./knowledge-notes"

function mkTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
}

describe("agents-files/knowledge-notes", () => {
  it("stringifies and parses a knowledge note markdown file (roundtrip)", () => {
    const note: KnowledgeNote = {
      id: "project-architecture",
      title: "Project\nArchitecture",
      context: "auto",
      updatedAt: 1770000000000,
      tags: ["architecture", "backend"],
      summary: "Service-oriented\nElectron app.",
      createdAt: 1760000000000,
      references: ["docs/arch.md", "https://example.com/spec"],
      body: "## Details\n\nLonger-form markdown content goes here.\n",
    }

    const md = stringifyKnowledgeNoteMarkdown(note)
    expect(md).toContain("kind: note")
    expect(md).toContain("context: auto")

    const parsed = parseKnowledgeNoteMarkdown(md)
    expect(parsed).not.toBeNull()
    expect(parsed).toEqual({
      ...note,
      title: "Project Architecture",
      summary: "Service-oriented Electron app.",
      body: "## Details\n\nLonger-form markdown content goes here.",
    })
  })

  it("parses tags and references from JSON array strings", () => {
    const md = `---
kind: note
id: project-architecture
title: Project Architecture
context: search-only
updatedAt: 1770000000000
tags: ["architecture", "backend"]
references: ["docs/arch.md", "https://example.com/spec"]
---

Body`

    const parsed = parseKnowledgeNoteMarkdown(md)
    expect(parsed).not.toBeNull()
    expect(parsed!.tags).toEqual(["architecture", "backend"])
    expect(parsed!.references).toEqual(["docs/arch.md", "https://example.com/spec"])
  })

  it("loads canonical note folders, preserves assets, and ignores malformed entries", () => {
    const dir = mkTempDir("dotagents-knowledge-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)
    const knowledgeDir = getAgentsKnowledgeDir(layer)

    writeFile(
      path.join(knowledgeDir, "project-architecture", "project-architecture.md"),
      `---
kind: note
title: Project Architecture
context: auto
updatedAt: 1770000000000
tags: architecture, backend
---

Body`,
    )
    writeFile(path.join(knowledgeDir, "project-architecture", "diagram.png"), "png")
    writeFile(path.join(knowledgeDir, "project-architecture", "assets", "db-schema.pdf"), "pdf")

    writeFile(
      path.join(knowledgeDir, "wrong-file-name", "note.md"),
      `---
kind: note
id: wrong-file-name
title: Wrong
context: auto
updatedAt: 1
tags: misc
---`,
    )

    writeFile(
      path.join(knowledgeDir, "missing-kind", "missing-kind.md"),
      `---
id: missing-kind
title: Missing Kind
context: auto
updatedAt: 1
tags: misc
---`,
    )

    const loaded = loadAgentsKnowledgeNotesLayer(layer)
    expect(loaded.notes.map((note) => note.id)).toEqual(["project-architecture"])

    const origin = loaded.originById.get("project-architecture")
    expect(origin?.filePath).toBe(path.join(knowledgeDir, "project-architecture", "project-architecture.md"))
    expect(origin?.assetFilePaths).toEqual([
      path.join(knowledgeDir, "project-architecture", "assets", "db-schema.pdf"),
      path.join(knowledgeDir, "project-architecture", "diagram.png"),
    ])
  })

  it("keeps the newest duplicate by updatedAt", () => {
    const dir = mkTempDir("dotagents-knowledge-dupes-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)
    const knowledgeDir = getAgentsKnowledgeDir(layer)

    writeFile(
      path.join(knowledgeDir, "architecture-old", "architecture-old.md"),
      `---
kind: note
id: project-architecture
title: Old
context: auto
updatedAt: 100
tags: architecture
---`,
    )

    writeFile(
      path.join(knowledgeDir, "architecture-new", "architecture-new.md"),
      `---
kind: note
id: project-architecture
title: New
context: auto
updatedAt: 200
tags: architecture
---`,
    )

    const loaded = loadAgentsKnowledgeNotesLayer(layer)
    expect(loaded.notes.find((note) => note.id === "project-architecture")?.updatedAt).toBe(200)
    expect(loaded.originById.get("project-architecture")?.filePath).toBe(
      path.join(knowledgeDir, "architecture-new", "architecture-new.md"),
    )
  })

  it("writes canonical note files with backups on overwrite", () => {
    const dir = mkTempDir("dotagents-knowledge-write-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    const base: KnowledgeNote = {
      id: "project-architecture",
      title: "Project Architecture",
      context: "search-only",
      updatedAt: 1,
      tags: ["architecture"],
      body: "V1",
    }

    writeKnowledgeNoteFile(layer, base, { maxBackups: 5 })
    const filePath = knowledgeNoteSlugToFilePath(layer, base.id)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.readFileSync(filePath, "utf8")).toContain("V1")

    writeKnowledgeNoteFile(layer, { ...base, updatedAt: 2, body: "V2" }, { maxBackups: 5 })
    expect(fs.readFileSync(filePath, "utf8")).toContain("V2")

    const backupDir = getAgentsKnowledgeBackupDir(layer)
    const backups = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak")) : []
    expect(backups.length).toBe(1)
    expect(fs.readFileSync(path.join(backupDir, backups[0]), "utf8")).toContain("V1")
  })
})