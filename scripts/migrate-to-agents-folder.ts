#!/usr/bin/env npx tsx
/**
 * One-time migration script: Transfer existing agent profiles and loops
 * from legacy storage into the modular .agents/ folder.
 *
 * Usage: npx tsx scripts/migrate-to-agents-folder.ts
 *
 * What it does:
 * 1. Reads profiles.json → writes .agents/agents/<id>/agent.md
 * 2. Reads config.json loops → writes .agents/tasks/<id>/task.md
 *
 * Safe to run multiple times (only writes if files don't already exist).
 */

import fs from "fs"
import path from "path"
import os from "os"

// Resolve paths
const appDataDir = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "app.dotagents"
)
const globalAgentsDir = path.join(os.homedir(), ".agents")
const profilesJsonPath = path.join(appDataDir, "profiles.json")
const configJsonPath = path.join(appDataDir, "config.json")

// ---- Minimal frontmatter serializer (no dependency on app code) ----

function toFrontmatter(fields: Record<string, string>, body: string): string {
  const lines = ["---"]
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") {
      // Quote values that contain colons or special chars
      const needsQuote = value.includes(":") || value.includes("#")
      lines.push(`${key}: ${needsQuote ? `"${value}"` : value}`)
    }
  }
  lines.push("---")
  if (body.trim()) {
    lines.push("")
    lines.push(body.trim())
  }
  lines.push("")
  return lines.join("\n")
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

// ---- Migrate Profiles ----

function migrateProfiles(): number {
  if (!fs.existsSync(profilesJsonPath)) {
    console.log("  No profiles.json found — skipping agent profiles migration")
    return 0
  }

  const data = JSON.parse(fs.readFileSync(profilesJsonPath, "utf8"))
  const profiles: any[] = data.profiles || []
  let count = 0

  for (const p of profiles) {
    const id = p.id || p.name
    const agentDir = path.join(globalAgentsDir, "agents", sanitize(id))
    const agentMdPath = path.join(agentDir, "agent.md")

    if (fs.existsSync(agentMdPath)) {
      console.log(`  ⏭  ${p.name} (${id}) — already exists, skipping`)
      continue
    }

    fs.mkdirSync(agentDir, { recursive: true })

    const frontmatter: Record<string, string> = {
      kind: "agent",
      id,
      name: p.name || id,
      displayName: p.name || id,
      "connection-type": "internal",
      role: "user-profile",
      enabled: "true",
      createdAt: String(p.createdAt || Date.now()),
      updatedAt: String(p.updatedAt || Date.now()),
    }
    if (p.isDefault) frontmatter.isDefault = "true"
    if (p.guidelines) frontmatter.guidelines = p.guidelines.replace(/\n/g, " ").trim()

    const body = p.systemPrompt || ""
    fs.writeFileSync(agentMdPath, toFrontmatter(frontmatter, body), "utf8")

    // Write config.json if there's model/tool config
    if (p.modelConfig || p.mcpServerConfig || p.skillsConfig) {
      const configJson: any = {}
      if (p.modelConfig) configJson.modelConfig = p.modelConfig
      if (p.mcpServerConfig) configJson.toolConfig = p.mcpServerConfig
      if (p.skillsConfig) configJson.skillsConfig = p.skillsConfig
      fs.writeFileSync(
        path.join(agentDir, "config.json"),
        JSON.stringify(configJson, null, 2),
        "utf8"
      )
    }

    console.log(`  ✅ ${p.name} (${id})`)
    count++
  }
  return count
}

// ---- Migrate Loops ----

function migrateLoops(): number {
  if (!fs.existsSync(configJsonPath)) {
    console.log("  No config.json found — skipping loops migration")
    return 0
  }

  const config = JSON.parse(fs.readFileSync(configJsonPath, "utf8"))
  const loops: any[] = config.loops || []
  let count = 0

  for (const loop of loops) {
    const id = loop.id
    const taskDir = path.join(globalAgentsDir, "tasks", sanitize(id))
    const taskMdPath = path.join(taskDir, "task.md")

    if (fs.existsSync(taskMdPath)) {
      console.log(`  ⏭  ${loop.name} (${id}) — already exists, skipping`)
      continue
    }

    fs.mkdirSync(taskDir, { recursive: true })

    const frontmatter: Record<string, string> = {
      kind: "task",
      id,
      name: loop.name,
      intervalMinutes: String(loop.intervalMinutes || 60),
      enabled: String(loop.enabled ?? true),
    }
    if (loop.profileId) frontmatter.profileId = loop.profileId
    if (loop.runOnStartup) frontmatter.runOnStartup = "true"
    if (loop.lastRunAt) frontmatter.lastRunAt = String(loop.lastRunAt)

    fs.writeFileSync(taskMdPath, toFrontmatter(frontmatter, loop.prompt || ""), "utf8")
    console.log(`  ✅ ${loop.name} (${id})`)
    count++
  }
  return count
}

// ---- Main ----

console.log(`\n🔄 Migrating to ${globalAgentsDir}\n`)

console.log("📋 Agent Profiles (from profiles.json):")
const profileCount = migrateProfiles()

console.log("\n⏰ Repeat Tasks (from config.json loops):")
const loopCount = migrateLoops()

console.log(`\n✨ Done! Migrated ${profileCount} profile(s) and ${loopCount} task(s).\n`)

// Show result
console.log("📁 Result:")
if (fs.existsSync(path.join(globalAgentsDir, "agents"))) {
  const agents = fs.readdirSync(path.join(globalAgentsDir, "agents"))
  console.log(`  agents/ (${agents.length} entries): ${agents.join(", ")}`)
}
if (fs.existsSync(path.join(globalAgentsDir, "tasks"))) {
  const tasks = fs.readdirSync(path.join(globalAgentsDir, "tasks"))
  console.log(`  tasks/ (${tasks.length} entries): ${tasks.join(", ")}`)
}
console.log()

