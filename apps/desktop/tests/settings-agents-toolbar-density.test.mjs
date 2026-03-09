import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsAgentsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-agents.tsx'),
  'utf8',
)

const toolbarBlock = settingsAgentsSource.match(/\{!editing && \(([\s\S]*?)\n\s*\)\}/)?.[1] ?? ''

test('desktop settings agents keep the list toolbar in a compact wrap-safe top row', () => {
  assert.ok(toolbarBlock, 'expected to find the desktop settings agents list toolbar block')
  assert.match(toolbarBlock, /<div className="mb-3 flex flex-wrap items-center justify-end gap-1\.5">/)
  assert.match(toolbarBlock, /className="h-8 gap-1\.5 whitespace-nowrap px-2\.5"/)
})

test('desktop settings agents keep all list-toolbar actions available in compact small buttons', () => {
  assert.ok(toolbarBlock, 'expected to find the desktop settings agents list toolbar block')
  for (const label of ['Import Bundle', 'Export Bundle', 'Export for Hub', 'Rescan Files', 'Add Agent']) {
    assert.match(toolbarBlock, new RegExp(`<Button size="sm"[\\s\\S]*?${label}`))
  }
})