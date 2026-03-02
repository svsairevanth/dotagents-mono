/**
 * BundleService - Export/Import agent configurations as portable .dotagents bundles.
 *
 * Phase 1: JSON-based bundle format with automatic secret stripping.
 * A .dotagents file is a JSON document containing a manifest plus embedded
 * agent profiles, MCP server configs, and skills metadata.
 */

import fs from "fs"
import path from "path"
import { dialog, BrowserWindow } from "electron"
import type { AgentProfile } from "@shared/types"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer } from "./agents-files/agent-profiles"
import { safeReadJsonFileSync } from "./agents-files/safe-file"
import { logApp } from "./debug"

// ============================================================================
// Types
// ============================================================================

export interface BundleManifest {
  version: 1
  name: string
  description?: string
  createdAt: string
  exportedFrom: string
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
  }
}

export interface BundleAgentProfile {
  id: string
  name: string
  displayName?: string
  description?: string
  enabled: boolean
  role?: string
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: string
    // Secrets stripped — no API keys, tokens, or passwords
  }
}

export interface BundleMCPServer {
  name: string
  command?: string
  args?: string[]
  transport?: string
  // URL/keys stripped
  enabled?: boolean
}

export interface BundleSkill {
  id: string
  name: string
  description?: string
  source?: string
}

export interface DotAgentsBundle {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMCPServer[]
  skills: BundleSkill[]
}

// ============================================================================
// Secret stripping
// ============================================================================

const SECRET_PATTERNS = [
  /key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /auth/i,
  /bearer/i,
]

function isSecretKey(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key))
}

function stripSecretsFromObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSecretKey(key) && typeof value === "string" && value.length > 0) {
      result[key] = "<CONFIGURE_YOUR_KEY>"
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = stripSecretsFromObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

// ============================================================================
// Export
// ============================================================================

function sanitizeAgentProfile(profile: AgentProfile): BundleAgentProfile {
  const sanitized: BundleAgentProfile = {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    enabled: profile.enabled,
    role: profile.role,
    systemPrompt: profile.systemPrompt,
    guidelines: profile.guidelines,
    connection: {
      type: profile.connection?.type || "internal",
    },
  }
  return sanitized
}

function loadMCPServers(agentsDir: string): BundleMCPServer[] {
  const layer = getAgentsLayerPaths(agentsDir)
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath)
  if (!mcpConfig) return []

  const servers: BundleMCPServer[] = []
  const mcpServers = (mcpConfig as any)?.mcpServers || mcpConfig

  if (typeof mcpServers === "object" && mcpServers !== null) {
    for (const [name, config] of Object.entries(mcpServers)) {
      if (typeof config !== "object" || config === null) continue
      const serverConfig = config as Record<string, unknown>

      // Strip secrets from the server config
      const stripped = stripSecretsFromObject(serverConfig)

      servers.push({
        name,
        command: typeof stripped.command === "string" ? stripped.command : undefined,
        args: Array.isArray(stripped.args) ? stripped.args.map(String) : undefined,
        transport: typeof stripped.transport === "string" ? stripped.transport : undefined,
        enabled: typeof stripped.disabled === "boolean" ? !stripped.disabled : true,
      })
    }
  }

  return servers
}

function loadSkillsMetadata(agentsDir: string): BundleSkill[] {
  const skillsDir = path.join(agentsDir, "skills")
  if (!fs.existsSync(skillsDir)) return []

  const skills: BundleSkill[] = []
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillMdPath = path.join(skillsDir, entry.name, "skill.md")
      if (fs.existsSync(skillMdPath)) {
        skills.push({
          id: entry.name,
          name: entry.name,
          description: `Skill from ${entry.name}`,
          source: "local",
        })
      }
    }
  } catch {
    // Skills directory not readable
  }

  return skills
}

export async function exportBundle(
  agentsDir: string,
  options?: { name?: string; description?: string }
): Promise<DotAgentsBundle> {
  const layer = getAgentsLayerPaths(agentsDir)
  const profilesResult = loadAgentProfilesLayer(layer)
  const profiles = profilesResult.profiles.map(sanitizeAgentProfile)
  const mcpServers = loadMCPServers(agentsDir)
  const skills = loadSkillsMetadata(agentsDir)

  const bundle: DotAgentsBundle = {
    manifest: {
      version: 1,
      name: options?.name || "My Agent Configuration",
      description: options?.description,
      createdAt: new Date().toISOString(),
      exportedFrom: "dotagents-desktop",
      components: {
        agentProfiles: profiles.length,
        mcpServers: mcpServers.length,
        skills: skills.length,
      },
    },
    agentProfiles: profiles,
    mcpServers,
    skills,
  }

  logApp("[bundle-service] Exported bundle", {
    profiles: profiles.length,
    mcpServers: mcpServers.length,
    skills: skills.length,
  })

  return bundle
}

export async function exportBundleToFile(
  agentsDir: string,
  options?: { name?: string; description?: string }
): Promise<string | null> {
  const bundle = await exportBundle(agentsDir, options)
  const bundleJson = JSON.stringify(bundle, null, 2)

  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showSaveDialog(win ?? undefined as any, {
    title: "Export Agent Configuration",
    defaultPath: `${bundle.manifest.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.dotagents`,
    filters: [
      { name: "DotAgents Bundle", extensions: ["dotagents"] },
      { name: "JSON", extensions: ["json"] },
    ],
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  fs.writeFileSync(result.filePath, bundleJson, "utf-8")
  logApp("[bundle-service] Bundle saved to", { filePath: result.filePath })
  return result.filePath
}

// ============================================================================
// Preview (for import)
// ============================================================================

export function previewBundle(filePath: string): DotAgentsBundle | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const bundle = JSON.parse(content) as DotAgentsBundle

    // Basic validation
    if (!bundle.manifest || bundle.manifest.version !== 1) {
      throw new Error("Invalid bundle format or unsupported version")
    }

    return bundle
  } catch (error) {
    logApp("[bundle-service] Failed to preview bundle", { filePath, error })
    return null
  }
}
