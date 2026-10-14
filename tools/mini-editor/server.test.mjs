import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
// This repo has no vitest runner. node:test is the check.
import test from 'node:test' // eslint-disable-line test/no-import-node-test
import { createMiniEditor } from './server.mjs'

test('open records zed --new and does not spawn when spawn is off', async () => {
  const root = project()
  const session = createMiniEditor(root, { editor: 'zed', spawn: false })
  const handled = await session.open('app/App.vue:10:4')
  assert.equal(handled, true)
  const window = session.status().window
  assert.equal(window.editor, 'zed')
  assert.equal(window.windowSize, false)
  assert.equal(window.reason, 'MINI_EDITOR_NO_SPAWN')
  assert.equal(window.command[0], 'zed')
  assert.equal(window.command[1], '--new')
  assert.match(window.command[2], /\/app\/App\.vue:10:4$/)
})

test('a missing editor falls through', async () => {
  const session = createMiniEditor(project(), { editor: '/no/such/zed', spawn: true })
  assert.equal(await session.open('app/App.vue:1:1'), false)
  assert.equal(session.status().window.reason, 'not-on-path')
  assert.equal(session.status().window.command[1], '--new')
})

test('an unknown editor falls through', async () => {
  const session = createMiniEditor(project(), { editor: 'emacs', spawn: true })
  assert.equal(await session.open('app/App.vue:1:1'), false)
  assert.equal(session.status().window.reason, 'unknown-editor')
})

test('refused paths are not spawned', async () => {
  const { bin, log } = fakeZed()
  const session = createMiniEditor(project(), { editor: bin, spawn: true })
  assert.equal(await session.open('../../etc/passwd:1:1'), false)
  assert.equal(session.status().window.reason, 'outside')
  assert.equal(existsSync(log), false)
})

test('each open spawns zed --new file:line:col again', async () => {
  const { bin, log } = fakeZed()
  const session = createMiniEditor(project(), { editor: bin, spawn: true })
  assert.equal(await session.open('app/App.vue:3:2'), true)
  assert.equal(await session.open('app/App.vue:8:1'), true)
  const lines = (await readLog(log)).map(line => JSON.parse(line))
  assert.equal(lines.length, 2)
  assert.ok(lines.every(args => args[0] === '--new'))
  const specs = lines.map(args => args[1]).sort()
  assert.match(specs[0], /App\.vue:3:2$/)
  assert.match(specs[1], /App\.vue:8:1$/)
})

test('GET /__open-in-editor returns the command', async () => {
  const root = project()
  const session = createMiniEditor(root, { editor: 'cursor', spawn: false })
  const result = await call(session, 'GET', '/__open-in-editor?file=app%2FApp.vue%3A6%3A5')
  assert.equal(result.status, 200)
  assert.equal(result.next, false)
  assert.deepEqual(result.body.command.slice(0, 3), ['cursor', '-n', '-g'])
  assert.match(result.body.command[3], /App\.vue:6:5$/)
  assert.equal(result.body.line, 6)
  assert.equal(result.body.column, 5)
  assert.equal(result.body.windowSize, false)
})

test('POST /__mini-editor/open and a refused file do not call next', async () => {
  const session = createMiniEditor(project(), { editor: 'subl', spawn: false })
  const opened = await call(session, 'POST', '/__mini-editor/open', { file: 'app/App.vue:2:2' })
  assert.equal(opened.status, 200)
  assert.deepEqual(opened.body.command.slice(0, 2), ['subl', '-n'])
  const refused = await call(session, 'GET', '/__open-in-editor?file=.env%3A1%3A1')
  assert.equal(refused.status, 404)
  assert.equal(refused.body.reason, 'denied')
  assert.equal(refused.next, false)
})

function project() {
  const root = mkdtempSync(join(tmpdir(), 'mini-editor-'))
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'app/App.vue'), '<template></template>\n')
  writeFileSync(join(root, '.env'), 'SECRET=1\n')
  return root
}

function fakeZed() {
  const dir = mkdtempSync(join(tmpdir(), 'mini-editor-bin-'))
  const log = join(dir, 'args')
  const bin = join(dir, 'zed')
  writeFileSync(bin, `#!/usr/bin/env node
const { appendFileSync } = require('node:fs')
appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + '\\n')
`)
  chmodSync(bin, 0o755)
  return { bin, log }
}

/**
 * @param {string} log
 */
async function readLog(log) {
  const started = Date.now()
  while (Date.now() - started < 2000) {
    if (existsSync(log)) {
      const text = readFileSync(log, 'utf8').trim()
      if (text.split('\n').length >= 2)
        return text.split('\n')
    }
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error(`editor did not write ${log}`)
}

/**
 * @param {ReturnType<typeof createMiniEditor>} session
 * @param {string} method
 * @param {string} url
 * @param {unknown} [json]
 */
function call(session, method, url, json) {
  const req = Readable.from(json === undefined ? [] : [Buffer.from(JSON.stringify(json))])
  req.method = method
  req.url = url
  /** @type {Buffer[]} */
  const chunks = []
  let settled = false
  return new Promise((resolve) => {
    const res = {
      statusCode: 0,
      headersSent: false,
      setHeader() {},
      end(body) {
        if (settled)
          return
        settled = true
        this.headersSent = true
        if (body)
          chunks.push(Buffer.from(body))
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve({
          status: this.statusCode,
          next: false,
          body: raw ? JSON.parse(raw) : {},
        })
      },
    }
    session.middleware(req, res, () => {
      if (!settled)
        resolve({ status: 0, next: true, body: {} })
    })
  })
}
