import type { AgentProfile } from "@shared/types"

export function sortAgentsWithDefaultFirst(agents: AgentProfile[]): AgentProfile[] {
  return agents
    .map((agent, index) => ({ agent, index }))
    .sort((a, b) => {
      const defaultDelta = Number(Boolean(b.agent.isDefault)) - Number(Boolean(a.agent.isDefault))
      if (defaultDelta !== 0) return defaultDelta
      return a.index - b.index
    })
    .map(({ agent }) => agent)
}