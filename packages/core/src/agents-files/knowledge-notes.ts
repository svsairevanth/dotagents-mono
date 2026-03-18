import fs from "fs"
import path from "path"
import type { KnowledgeNote, KnowledgeNoteContext } from "../types"
import type { AgentsLayerPaths } from "./modular-config"
import { parseFrontmatterOrBody, stringifyFrontmatterDocument } from "./frontmatter"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./safe-file"

export const AGENTS_KNOWLEDGE_DIR = "knowledge"

export type AgentsKnowledgeNoteOrigin = {
  dirPath: string
  filePath: string
  slug: string
  assetFilePaths: string[]
}

export type LoadedAgentsKnowledgeNotesLayer = {
  notes: KnowledgeNote[]
  originById: Map<string, AgentsKnowledgeNoteOrigin>
}

const VALID_CONTEXT_VALUES = new Set<KnowledgeNoteContext>(["auto", "search-only"])

function normalizeSingleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
}

function sanitizeFileComponent(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function parseListValue(raw: string | undefined): string[] {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return []

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      }
    } catch {
      // fall through to CSV
    }
  }

  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatListValue(values: string[] | undefined): string {
  const list = Array.isArray(values) ? values : []
  return list.map(normalizeSingleLine).filter(Boolean).join(", ")
}

function parseTimestamp(raw: string | undefined): number | undefined {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function hasOwn(obj: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function collectNoteAssetFilePaths(noteDir: string, noteFilePath: string): string[] {
  const assetFilePaths: string[] = []
  const canonicalNotePath = path.normalize(noteFilePath)

  const scanDirectory = (dirPath: string): void => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue

      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        scanDirectory(entryPath)
        continue
      }

      if (!entry.isFile()) continue
      if (path.normalize(entryPath) === canonicalNotePath) continue
      assetFilePaths.push(entryPath)
    }
  }

  scanDirectory(noteDir)
  return assetFilePaths.sort((a, b) => a.localeCompare(b))
}

export function getAgentsKnowledgeDir(layer: AgentsLayerPaths): string {
  return path.join(layer.agentsDir, AGENTS_KNOWLEDGE_DIR)
}

export function getAgentsKnowledgeBackupDir(layer: AgentsLayerPaths): string {
  return path.join(layer.backupsDir, AGENTS_KNOWLEDGE_DIR)
}

export function knowledgeNoteSlugToDirPath(layer: AgentsLayerPaths, slug: string): string {
  return path.join(getAgentsKnowledgeDir(layer), sanitizeFileComponent(slug))
}

export function knowledgeNoteSlugToFilePath(layer: AgentsLayerPaths, slug: string): string {
  const sanitizedSlug = sanitizeFileComponent(slug)
  return path.join(knowledgeNoteSlugToDirPath(layer, sanitizedSlug), `${sanitizedSlug}.md`)
}

export function stringifyKnowledgeNoteMarkdown(note: KnowledgeNote): string {
  const tags = formatListValue(note.tags)
  const references = formatListValue(note.references)

  const frontmatter: Record<string, string> = {
    kind: "note",
    id: note.id,
    title: normalizeSingleLine(note.title),
    context: note.context,
    updatedAt: String(note.updatedAt),
    tags,
  }

  if (typeof note.createdAt === "number" && Number.isFinite(note.createdAt)) {
    frontmatter.createdAt = String(note.createdAt)
  }

  const summary = normalizeSingleLine(note.summary ?? "")
  if (summary) frontmatter.summary = summary
  if (references) frontmatter.references = references

  return stringifyFrontmatterDocument({
    frontmatter,
    body: note.body,
  })
}

export function parseKnowledgeNoteMarkdown(
  markdown: string,
  options: { fallbackId?: string } = {},
): KnowledgeNote | null {
  const doc = parseFrontmatterOrBody(markdown)
  const fm = doc.frontmatter

  if ((fm.kind ?? "").trim() !== "note") return null

  const id = (fm.id ?? options.fallbackId ?? "").trim()
  const title = normalizeSingleLine(fm.title ?? "")
  const context = (fm.context ?? "").trim()
  const updatedAt = parseTimestamp(fm.updatedAt)

  if (!id || !title || !VALID_CONTEXT_VALUES.has(context as KnowledgeNoteContext) || typeof updatedAt !== "number") {
    return null
  }

  if (!hasOwn(fm, "tags")) return null

  const createdAt = parseTimestamp(fm.createdAt)
  const summary = normalizeSingleLine(fm.summary ?? "") || undefined
  const tags = parseListValue(fm.tags)
  const references = parseListValue(fm.references)

  return {
    id,
    title,
    context: context as KnowledgeNoteContext,
    updatedAt,
    tags,
    body: doc.body.trim(),
    summary,
    createdAt,
    references: references.length > 0 ? references : undefined,
  }
}

export function loadAgentsKnowledgeNotesLayer(layer: AgentsLayerPaths): LoadedAgentsKnowledgeNotesLayer {
  const notes: KnowledgeNote[] = []
  const originById = new Map<string, AgentsKnowledgeNoteOrigin>()

  const knowledgeDir = getAgentsKnowledgeDir(layer)

  try {
    if (!fs.existsSync(knowledgeDir) || !fs.statSync(knowledgeDir).isDirectory()) {
      return { notes, originById }
    }

    const entries = fs.readdirSync(knowledgeDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith(".")) continue

      const slug = entry.name
      const noteDir = path.join(knowledgeDir, slug)
      const noteFilePath = path.join(noteDir, `${slug}.md`)
      const raw = readTextFileIfExistsSync(noteFilePath, "utf8")
      if (raw === null) continue

      const parsed = parseKnowledgeNoteMarkdown(raw, { fallbackId: slug })
      if (!parsed) continue

      const assetFilePaths = collectNoteAssetFilePaths(noteDir, noteFilePath)
      const existing = originById.get(parsed.id)
      if (existing) {
        const existingNote = notes.find((note) => note.id === parsed.id)
        if (existingNote && existingNote.updatedAt > parsed.updatedAt) continue
        const idx = notes.findIndex((note) => note.id === parsed.id)
        if (idx >= 0) notes[idx] = parsed
      } else {
        notes.push(parsed)
      }

      originById.set(parsed.id, {
        dirPath: noteDir,
        filePath: noteFilePath,
        slug,
        assetFilePaths,
      })
    }
  } catch {
    // best-effort
  }

  return { notes, originById }
}

export function writeKnowledgeNoteFile(
  layer: AgentsLayerPaths,
  note: KnowledgeNote,
  options: { slug?: string; filePathOverride?: string; maxBackups?: number } = {},
): { dirPath: string; filePath: string } {
  const filePath = options.filePathOverride ?? knowledgeNoteSlugToFilePath(layer, options.slug ?? note.id)
  const backupDir = getAgentsKnowledgeBackupDir(layer)
  const maxBackups = options.maxBackups ?? 10
  const markdown = stringifyKnowledgeNoteMarkdown(note)

  safeWriteFileSync(filePath, markdown, {
    encoding: "utf8",
    backupDir,
    maxBackups,
  })

  return {
    dirPath: path.dirname(filePath),
    filePath,
  }
}