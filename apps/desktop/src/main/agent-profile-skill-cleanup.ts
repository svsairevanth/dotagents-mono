import type { AgentProfile } from "@shared/types"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"

export type SkillReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

export function cleanupInvalidSkillReferencesInProfiles(
  profiles: AgentProfile[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): { profiles: AgentProfile[] } & SkillReferenceCleanupSummary {
  const validSkillIdSet = new Set(Array.from(validSkillIds))
  const updatedProfileIds: string[] = []
  let removedReferenceCount = 0

  const nextProfiles = profiles.map((profile) => {
    const currentSkillIds = profile.skillsConfig?.enabledSkillIds ?? []
    if (currentSkillIds.length === 0) return profile

    const nextSkillIds = currentSkillIds.filter((skillId) => validSkillIdSet.has(skillId))
    if (nextSkillIds.length === currentSkillIds.length) return profile

    removedReferenceCount += currentSkillIds.length - nextSkillIds.length
    updatedProfileIds.push(profile.id)

    return {
      ...profile,
      updatedAt: now,
      skillsConfig: {
        ...profile.skillsConfig,
        enabledSkillIds: nextSkillIds,
      },
    }
  })

  return {
    profiles: nextProfiles,
    updatedProfileIds: uniqueSorted(updatedProfileIds),
    removedReferenceCount,
  }
}

export function cleanupInvalidSkillReferencesInLayers(
  layers: AgentsLayerPaths[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): SkillReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const loaded = loadAgentProfilesLayer(layer)
    const result = cleanupInvalidSkillReferencesInProfiles(loaded.profiles, validSkillIds, now)

    if (result.updatedProfileIds.length === 0) continue

    const updatedProfilesById = new Map(result.profiles.map((profile) => [profile.id, profile]))
    for (const profileId of result.updatedProfileIds) {
      const profile = updatedProfilesById.get(profileId)
      if (!profile) continue
      writeAgentsProfileFiles(layer, profile, { maxBackups: 10 })
    }

    combinedUpdatedProfileIds.push(...result.updatedProfileIds)
    removedReferenceCount += result.removedReferenceCount
  }

  return {
    updatedProfileIds: uniqueSorted(combinedUpdatedProfileIds),
    removedReferenceCount,
  }
}