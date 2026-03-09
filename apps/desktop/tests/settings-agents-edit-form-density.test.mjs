import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsAgentsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-agents.tsx'),
  'utf8',
)

const renderEditFormBlock = settingsAgentsSource.match(/function renderEditForm\(\) \{([\s\S]*?)\n  \}\n\}/)?.[1] ?? ''

test('desktop settings agents cap the edit form width instead of stretching full-panel on wide settings windows', () => {
  assert.ok(renderEditFormBlock, 'expected to find the desktop settings agents edit form block')
  assert.match(renderEditFormBlock, /<Card className="max-w-5xl">/)
})

test('desktop settings agents keep the edit-form shell compact with tighter header and tab spacing', () => {
  assert.ok(renderEditFormBlock, 'expected to find the desktop settings agents edit form block')
  assert.match(renderEditFormBlock, /<CardHeader className="pb-3">/)
  assert.match(renderEditFormBlock, /<CardTitle className="text-lg">\{isCreating \? "Create Agent" : `Edit: \$\{editing\.displayName\}`\}<\/CardTitle>/)
  assert.match(renderEditFormBlock, /<CardContent className="space-y-4">/)
  assert.match(renderEditFormBlock, /<TabsList className="mb-3 h-auto flex-wrap gap-1">/)
})