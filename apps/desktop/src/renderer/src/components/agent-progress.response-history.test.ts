import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress response history", () => {
  it("keeps response-history TTS generation single-flight and ignores stale completions", () => {
    expect(agentProgressSource).toContain('const ttsGenerationIdRef = useRef(0)')
    expect(agentProgressSource).toContain('if (state === "generating") {')
    expect(agentProgressSource).toContain('const generationId = ++ttsGenerationIdRef.current')
    expect(agentProgressSource).toContain('ttsGenerationIdRef.current !== generationId ||')
    expect(agentProgressSource).toContain('latestTtsSourceRef.current !== generationSource')
    expect(agentProgressSource).toContain('disabled={state === "generating"}')
  })

  it("assigns unique keys to current and repeated past responses", () => {
    expect(agentProgressSource).toContain('key: `current-${fingerprint(currentResponse)}`')
    expect(agentProgressSource).toContain('key: `past-${originalIndex}-${fingerprint(response)}`')
    expect(agentProgressSource).toContain('responseNumber: originalIndex + 1')
  })
})