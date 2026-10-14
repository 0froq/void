import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { resolveProjectFile } from './position.mjs'

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
const MAX_BODY = 1_500_000

/**
 * Dev-server session: one editor window, many open requests.
 * The Vite middleware and Nuxt DevTools' openInEditor hook share it.
 *
 * @param {string} rootDir
 */
export function createMiniEditor(rootDir) {
  /** @type {Set<import('node:http').ServerResponse>} */
  const clients = new Set()
  /** @type {ReturnType<typeof resolveProjectFile> | null} */
  let last = null
  let port = 3000
  let spawnedAt = 0
  let devtoolsHook = false
  /** @type {{ spawned: boolean, reused: boolean, reason?: string, browser?: string }} */
  let lastWindow = { spawned: false, reused: false, reason: 'idle' }

  function markDevtoolsHook() {
    devtoolsHook = true
  }

  /**
   * @param {import('vite').ViteDevServer} server
   */
  function attach(server) {
    const httpServer = server.httpServer
    if (!httpServer)
      return
    const read = () => {
      const address = httpServer.address()
      if (address && typeof address === 'object')
        port = address.port
    }
    httpServer.on('listening', read)
    read()
  }

  /**
   * @param {string} spec
   * @returns {Promise<boolean>} true when this session handled the file
   */
  async function open(spec) {
    const target = resolveProjectFile(rootDir, spec)
    if (!target.ok) {
      lastWindow = { spawned: false, reused: false, reason: target.reason }
      return false
    }
    last = target
    broadcast(target)
    const alive = clients.size > 0 || Date.now() - spawnedAt < 2500
    if (alive) {
      lastWindow = { spawned: false, reused: true }
      return true
    }
    lastWindow = launchWindow(target)
    if (lastWindow.spawned)
      spawnedAt = Date.now()
    return true
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {() => void} next
   */
  function middleware(req, res, next) {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const route = url.pathname
    if (route === '/__open-in-editor') {
      void respond(res, () => openAndDescribe(url.searchParams.get('file') || ''))
      return
    }
    if (!route.startsWith('/__mini-editor')) {
      next()
      return
    }
    if (route === '/__mini-editor' || route === '/__mini-editor/') {
      res.statusCode = 200
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(html.replace('__MINI_EDITOR_ENTRY__', `/_nuxt${rootDir}/tools/mini-editor/src/main.ts`))
      return
    }
    if (route === '/__mini-editor/status') {
      sendJson(res, 200, {
        port,
        clients: clients.size,
        last,
        window: lastWindow,
        devtoolsHook,
      })
      return
    }
    if (route === '/__mini-editor/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
      })
      res.write('\n')
      clients.add(res)
      req.on('close', () => clients.delete(res))
      return
    }
    if (route === '/__mini-editor/bye') {
      clients.delete(res)
      spawnedAt = 0
      sendJson(res, 200, { ok: true })
      return
    }
    if (route === '/__mini-editor/open') {
      void respond(res, async () => {
        const body = await readJson(req)
        const spec = typeof body.file === 'string' ? body.file : ''
        return openAndDescribe(spec)
      })
      return
    }
    if (route === '/__mini-editor/file' && req.method === 'GET') {
      void respond(res, async () => {
        const target = resolveProjectFile(rootDir, url.searchParams.get('path') || url.searchParams.get('file') || '')
        if (!target.ok)
          return { status: 404, body: target }
        const text = await readFile(target.file, 'utf8')
        if (text.includes('\0'))
          return { status: 415, body: { ok: false, reason: 'binary' } }
        return { status: 200, body: { ...target, path: target.file, text } }
      })
      return
    }
    if (route === '/__mini-editor/file' && (req.method === 'PUT' || req.method === 'POST')) {
      void respond(res, async () => {
        const body = await readJson(req)
        const spec = typeof body.path === 'string' ? body.path : ''
        const text = typeof body.text === 'string' ? body.text : null
        const target = resolveProjectFile(rootDir, spec)
        if (!target.ok)
          return { status: 400, body: target }
        if (text == null)
          return { status: 400, body: { ok: false, reason: 'text' } }
        if (Buffer.byteLength(text) > MAX_BODY)
          return { status: 413, body: { ok: false, reason: 'too-large' } }
        await writeFile(target.file, text)
        return { status: 200, body: { ok: true, path: target.file, relative: target.relative } }
      })
      return
    }
    next()
  }

  /**
   * @param {string} spec
   */
  async function openAndDescribe(spec) {
    const handled = await open(spec)
    const target = last && last.ok ? last : null
    if (!handled || !target)
      return { status: 404, body: { ok: false, ...lastWindow, file: spec } }
    return {
      status: 200,
      body: {
        ok: true,
        path: target.file,
        relative: target.relative,
        line: target.line,
        column: target.column,
        url: editorUrl(target),
        ...lastWindow,
      },
    }
  }

  /**
   * @param {{ file: string, line: number, column: number }} target
   */
  function editorUrl(target) {
    const query = new URLSearchParams({
      path: target.file,
      line: String(target.line),
      col: String(target.column),
    })
    return `http://localhost:${port}/__mini-editor?${query}`
  }

  /**
   * @param {{ file: string, relative: string, line: number, column: number }} target
   */
  function broadcast(target) {
    const payload = `data: ${JSON.stringify({
      path: target.file,
      relative: target.relative,
      line: target.line,
      column: target.column,
    })}\n\n`
    for (const client of clients)
      client.write(payload)
  }

  /**
   * @param {{ file: string, line: number, column: number }} target
   */
  function launchWindow(target) {
    if (process.env.MINI_EDITOR_NO_SPAWN === '1')
      return { spawned: false, reused: false, reason: 'MINI_EDITOR_NO_SPAWN' }
    const browser = findBrowser()
    if (!browser)
      return { spawned: false, reused: false, reason: 'no-browser' }
    const profile = join(tmpdir(), 'void-mini-editor-chrome')
    mkdirSync(profile, { recursive: true })
    const child = spawn(browser, [
      `--app=${editorUrl(target)}`,
      '--window-size=880,640',
      '--window-position=96,72',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-sync',
      '--new-window',
    ], { detached: true, stdio: 'ignore' })
    child.on('error', (error) => {
      lastWindow = { spawned: false, reused: false, reason: error.message, browser }
    })
    child.unref()
    return { spawned: true, reused: false, browser }
  }

  return { attach, markDevtoolsHook, middleware, open }
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {() => Promise<{ status: number, body: unknown }>} run
 */
async function respond(res, run) {
  try {
    const result = await run()
    sendJson(res, result.status, result.body)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'error'
    if (!res.headersSent)
      sendJson(res, 500, { ok: false, reason: message })
  }
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

/**
 * @param {import('node:http').IncomingMessage} req
 */
async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    size += buffer.length
    if (size > MAX_BODY + 1024)
      throw new Error('body too large')
    chunks.push(buffer)
  }
  if (chunks.length === 0)
    return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function findBrowser() {
  const override = process.env.MINI_EDITOR_BROWSER
  if (override)
    return override
  if (process.platform === 'darwin') {
    const mac = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Arc.app/Contents/MacOS/Arc',
    ]
    return mac.find(path => existsSync(path))
  }
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const found = spawnSync('which', [name], { encoding: 'utf8' })
    if (found.status === 0)
      return found.stdout.trim()
  }
  return undefined
}
