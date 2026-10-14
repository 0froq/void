import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import process from 'node:process'
import { editorCommand } from './editors.mjs'
import { resolveProjectFile } from './position.mjs'
import { parsePlacementOptions, placeWindow } from './window-place.mjs'

const MAX_BODY = 1_500_000

/**
 * Dev-server session shared by the Vite `/__open-in-editor` middleware
 * and Nuxt DevTools' `openInEditorHooks`. Each accepted open spawns a
 * new editor window. There is no reuse: Cmd+W should close that window.
 *
 * @param {string} rootDir
 * @param {{ editor?: string, spawn?: boolean, size?: string, position?: string, place?: boolean }} [options]
 */
export function createMiniEditor(rootDir, options = {}) {
  const editorName = options.editor || process.env.MINI_EDITOR || 'zed'
  const spawnEnabled = options.spawn ?? process.env.MINI_EDITOR_NO_SPAWN !== '1'
  const placement = parsePlacementOptions(
    { size: options.size, position: options.position, place: options.place },
    process.env,
  )
  const placementHints = new Set()
  /** @type {ReturnType<typeof resolveProjectFile> | null} */
  let last = null
  let devtoolsHook = false
  /** @type {{ spawned: boolean, reason?: string, editor?: string, command: string[], placement: ReturnType<typeof parsePlacementOptions> }} */
  let lastWindow = { spawned: false, reason: 'idle', command: [], placement }

  function markDevtoolsHook() {
    devtoolsHook = true
  }

  function status() {
    return { editor: editorName, devtoolsHook, last, window: lastWindow, placement }
  }

  /**
   * @param {string} spec
   * @returns {Promise<boolean>} true when this session spawned (or deliberately skipped) the editor
   */
  async function open(spec) {
    const target = resolveProjectFile(rootDir, spec)
    last = target
    if (!target.ok) {
      lastWindow = { spawned: false, reason: target.reason, command: [], placement }
      return false
    }
    const command = editorCommand(editorName, target)
    if (!command) {
      lastWindow = { spawned: false, reason: 'unknown-editor', editor: editorName, command: [], placement }
      return false
    }
    lastWindow = launch(command)
    return lastWindow.spawned || lastWindow.reason === 'MINI_EDITOR_NO_SPAWN'
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
    if (route === '/__mini-editor/status') {
      sendJson(res, 200, status())
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
    next()
  }

  /**
   * @param {string} spec
   */
  async function openAndDescribe(spec) {
    const handled = await open(spec)
    const target = last && last.ok ? last : null
    if (!handled || !target) {
      return {
        status: 404,
        body: { ok: false, file: spec, ...lastWindow },
      }
    }
    return {
      status: 200,
      body: {
        ok: true,
        path: target.file,
        relative: target.relative,
        line: target.line,
        column: target.column,
        ...lastWindow,
      },
    }
  }

  /**
   * @param {{ editor: string, bin: string, args: string[] }} command
   */
  function launch(command) {
    const recorded = {
      editor: command.editor,
      command: [command.bin, ...command.args],
      placement,
    }
    if (!spawnEnabled)
      return { ...recorded, spawned: false, reason: 'MINI_EDITOR_NO_SPAWN' }
    if (!binOnPath(command.bin))
      return { ...recorded, spawned: false, reason: 'not-on-path' }
    const child = spawn(command.bin, command.args, { detached: true, stdio: 'ignore' })
    child.on('error', (error) => {
      lastWindow = { ...recorded, spawned: false, reason: error.message }
    })
    child.unref()
    void placeWindow({
      editor: command.editor,
      width: placement.width,
      height: placement.height,
      position: placement.position,
      enabled: placement.enabled,
    }, {
      log: (message) => {
        if (placementHints.has(message))
          return
        placementHints.add(message)
        console.warn(message)
      },
    }).catch(() => {})
    return { ...recorded, spawned: true }
  }

  return { markDevtoolsHook, middleware, open, status }
}

/**
 * @param {string} bin
 */
function binOnPath(bin) {
  if (bin.includes('/') || bin.includes('\\'))
    return existsSync(bin)
  const found = spawnSync('which', [bin], { encoding: 'utf8' })
  return found.status === 0 && found.stdout.trim().length > 0
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
    if (size > MAX_BODY)
      throw new Error('body too large')
    chunks.push(buffer)
  }
  if (chunks.length === 0)
    return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
