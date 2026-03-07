const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('exposes the chat composer send control as an accessible button', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?accessibilityLabel="Send message"/);
  assert.match(screenSource, /accessibilityHint="Sends the current message to the selected agent\."/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: !composerHasContent \}\}/);
});

test('keeps the chat composer send control at a mobile-friendly minimum touch target', () => {
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*64,/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',/);
});