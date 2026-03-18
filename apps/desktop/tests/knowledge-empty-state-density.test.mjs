import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const knowledgeSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/knowledge.tsx'),
  'utf8',
)

const emptyStateMatch = knowledgeSource.match(/filteredKnowledgeNotes\.length === 0 \? ([\s\S]*?) : <div className="space-y-3">/)

assert.ok(emptyStateMatch, 'expected to find the desktop knowledge empty state block')

const emptyStateSource = emptyStateMatch[1]

test('desktop knowledge empty state avoids oversized hero chrome', () => {
  assert.doesNotMatch(emptyStateSource, /flex flex-col items-center justify-center py-12 text-center/)
  assert.doesNotMatch(emptyStateSource, /<Brain className="h-12 w-12 text-muted-foreground\/50 mb-4" \/>/)
  assert.match(emptyStateSource, /rounded-lg border border-dashed bg-muted\/20 px-5 py-6 text-center sm:px-6/)
  assert.match(emptyStateSource, /<h3 className="text-base font-medium">No notes yet<\/h3>/)
  assert.match(emptyStateSource, /mx-auto mt-1 max-w-sm text-sm text-muted-foreground/)
})

test('desktop knowledge empty state keeps both empty and search-miss orientation copy', () => {
  assert.match(emptyStateSource, /No notes yet/)
  assert.match(emptyStateSource, /No notes match your search\. Try a different query\./)
  assert.match(emptyStateSource, /Save notes from agent sessions to build your knowledge workspace\./)
})