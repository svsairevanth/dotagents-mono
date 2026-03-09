import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const capabilitiesPageSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-capabilities.tsx'),
  'utf8',
)

const skillsPageSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-skills.tsx'),
  'utf8',
)

test('desktop capabilities tab keeps the Skills label in the shared tab bar', () => {
  assert.match(capabilitiesPageSource, /\{ id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" \}/)
  assert.match(capabilitiesPageSource, /\{activeTab === "skills" && <SkillsPage \/>\}/)
})

test('desktop skills page avoids a redundant Agent Skills hero header above the actions', () => {
  assert.doesNotMatch(skillsPageSource, /<h2 className="text-lg font-semibold">Agent Skills<\/h2>/)
  assert.match(skillsPageSource, /<div className="flex flex-wrap justify-end gap-2">[\s\S]*?Open Folder[\s\S]*?Scan Folder[\s\S]*?New Skill/)
  assert.match(skillsPageSource, /<p className="text-sm text-muted-foreground">[\s\S]*?Skills are specialized instructions that improve AI performance on specific tasks\./)
})