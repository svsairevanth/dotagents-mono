import type { KnowledgeNote } from "@shared/types"
import { inferKnowledgeNoteGrouping } from "@shared/knowledge-note-grouping"

export type KnowledgeNoteSeriesSection = {
  key: string
  label: string
  notes: KnowledgeNote[]
}

export type KnowledgeNoteGroupSection = {
  key: string
  label: string
  notes: KnowledgeNote[]
  seriesSections: KnowledgeNoteSeriesSection[]
}

function titleizePath(value: string): string {
  return value
    .split("/")
    .map((segment) =>
      segment
        .split(/[-_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" / ")
}

export function getKnowledgeNoteGrouping(note: KnowledgeNote): { group?: string; series?: string } {
  const grouping = inferKnowledgeNoteGrouping(note)
  return { group: grouping.group, series: grouping.series }
}

export function buildKnowledgeNoteSections(notes: KnowledgeNote[]): KnowledgeNoteGroupSection[] {
  const groups = new Map<string, { label: string; notes: KnowledgeNote[]; series: Map<string, KnowledgeNoteSeriesSection> }>()

  for (const note of notes) {
    const grouping = getKnowledgeNoteGrouping(note)
    const groupKey = grouping.group ?? "__ungrouped__"
    const groupLabel = grouping.group ? titleizePath(grouping.group) : "Ungrouped"
    const group = groups.get(groupKey) ?? { label: groupLabel, notes: [], series: new Map<string, KnowledgeNoteSeriesSection>() }

    if (grouping.series) {
      const existingSeries = group.series.get(grouping.series) ?? {
        key: `${groupKey}:${grouping.series}`,
        label: titleizePath(grouping.series),
        notes: [],
      }
      existingSeries.notes.push(note)
      group.series.set(grouping.series, existingSeries)
    } else {
      group.notes.push(note)
    }

    groups.set(groupKey, group)
  }

  return Array.from(groups.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    notes: value.notes,
    seriesSections: Array.from(value.series.values()),
  }))
}