import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// This repo has no vitest runner. node:test is the check.
import test from 'node:test' // eslint-disable-line test/no-import-node-test
import { parsePosition, resolveProjectFile } from './position.mjs'

test('parsePosition keeps file:line:col', () => {
  assert.deepEqual(parsePosition('/src/App.vue:12:4'), {
    file: '/src/App.vue',
    line: 12,
    column: 4,
  })
  assert.deepEqual(parsePosition('/src/App.vue:12'), {
    file: '/src/App.vue',
    line: 12,
    column: 1,
  })
  assert.deepEqual(parsePosition('/src/App.vue'), {
    file: '/src/App.vue',
    line: 1,
    column: 1,
  })
})

test('resolveProjectFile stays inside the project', () => {
  const root = mkdtempSync(join(tmpdir(), 'mini-editor-'))
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'app/App.vue'), '<template></template>\n')
  writeFileSync(join(root, '.env'), 'SECRET=1\n')
  mkdirSync(join(root, 'node_modules/pkg'), { recursive: true })
  writeFileSync(join(root, 'node_modules/pkg/index.js'), 'export {}\n')
  const external = mkdtempSync(join(tmpdir(), 'mini-editor-out-'))
  writeFileSync(join(external, 'secret.txt'), 'nope\n')
  symlinkSync(external, join(root, 'linked'))

  const hit = resolveProjectFile(root, 'app/App.vue:3:2')
  assert.equal(hit.ok, true)
  if (hit.ok) {
    assert.equal(hit.relative, 'app/App.vue')
    assert.equal(hit.line, 3)
    assert.equal(hit.column, 2)
  }

  assert.equal(resolveProjectFile(root, '../../etc/passwd:1:1').ok, false)
  assert.equal(resolveProjectFile(root, '.env:1:1').reason, 'denied')
  assert.equal(resolveProjectFile(root, 'node_modules/pkg/index.js:1:1').reason, 'denied')
  assert.equal(resolveProjectFile(root, 'linked/secret.txt:1:1').reason, 'outside')
  assert.equal(resolveProjectFile(root, 'missing.ts:1:1').reason, 'missing')
})
