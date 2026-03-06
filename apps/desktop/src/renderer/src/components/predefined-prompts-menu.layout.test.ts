import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const predefinedPromptsMenuSource = readFileSync(new URL("./predefined-prompts-menu.tsx", import.meta.url), "utf8")

describe("predefined prompts menu layout", () => {
  it("keeps the trigger and dropdown content readable in dense desktop composer chrome", () => {
    expect(predefinedPromptsMenuSource).toContain('const triggerButtonClassName = buttonSize === "default"')
    expect(predefinedPromptsMenuSource).toContain('const menuContentClassName = "w-[min(26rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto"')
    expect(predefinedPromptsMenuSource).toContain('const entryClassName = "flex min-w-0 items-start gap-2.5 py-2 cursor-pointer"')
    expect(predefinedPromptsMenuSource).toContain('const secondaryTextClassName = "line-clamp-2 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]"')
    expect(predefinedPromptsMenuSource).toContain('aria-label="Open predefined prompts"')
    expect(predefinedPromptsMenuSource).toContain('className="h-7 w-7"')
  })

  it("shows prompt and skill previews instead of relying on single-line truncation", () => {
    expect(predefinedPromptsMenuSource).toContain('<p className={secondaryTextClassName}>{prompt.content}</p>')
    expect(predefinedPromptsMenuSource).toContain('{skill.description || "Use this skill as a reusable prompt."}')
    expect(predefinedPromptsMenuSource).toContain('className="truncate font-medium" title={prompt.name}')
    expect(predefinedPromptsMenuSource).toContain('className="truncate font-medium" title={skill.name}')
  })
})