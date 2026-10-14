import assert from 'node:assert/strict'
// This repo has no vitest runner. node:test is the check.
import test from 'node:test' // eslint-disable-line test/no-import-node-test
import { editorCommand } from './editors.mjs'

const target = { file: '/work/app/app.vue', line: 10, column: 4 }
const spec = '/work/app/app.vue:10:4'

test('zed opens a new window at file:line:col', () => {
  assert.deepEqual(editorCommand('zed', target), {
    editor: 'zed',
    bin: 'zed',
    args: ['--new', spec],
    windowSize: false,
  })
  assert.equal(editorCommand('/usr/local/bin/zed', target)?.bin, '/usr/local/bin/zed')
  assert.deepEqual(editorCommand('/usr/local/bin/zed', target)?.args, ['--new', spec])
})

test('VS Code and Cursor use -n -g', () => {
  for (const name of ['code', 'vscode', 'vs-code']) {
    assert.deepEqual(editorCommand(name, target), {
      editor: 'code',
      bin: 'code',
      args: ['-n', '-g', spec],
      windowSize: false,
    })
  }
  assert.deepEqual(editorCommand('cursor', target), {
    editor: 'cursor',
    bin: 'cursor',
    args: ['-n', '-g', spec],
    windowSize: false,
  })
  assert.equal(editorCommand('/opt/cursor/Cursor', target)?.bin, '/opt/cursor/Cursor')
})

test('Sublime uses -n and the position suffix', () => {
  for (const name of ['subl', 'sublime', 'sublime-text']) {
    assert.deepEqual(editorCommand(name, target), {
      editor: 'subl',
      bin: 'subl',
      args: ['-n', spec],
      windowSize: false,
    })
  }
})

test('an unknown editor is left to launch-editor', () => {
  assert.equal(editorCommand('emacs', target), null)
  assert.equal(editorCommand('', target), null)
})
