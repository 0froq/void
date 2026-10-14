import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'
import { parsePlacementOptions } from './window-options.mjs'

/** @typedef {'right' | 'center' | 'mouse'} WindowPosition */
/** @typedef {'macos' | 'linux-x11' | 'linux-wayland' | 'windows' | 'noop'} AdapterId */

const MARGIN = 24
const RETRIES = 24
const RETRY_MS = 150

/** @type {Record<string, { macProcess: string, wmClass: string, xdotoolClass: string, appId: string }>} */
export const EDITOR_WINDOW = {
  zed: {
    macProcess: 'Zed',
    wmClass: 'zed.Zed',
    xdotoolClass: 'zed',
    appId: 'zed',
  },
  code: {
    macProcess: 'Code',
    wmClass: 'code.Code',
    xdotoolClass: 'code',
    appId: 'code',
  },
  cursor: {
    macProcess: 'Cursor',
    wmClass: 'cursor.Cursor',
    xdotoolClass: 'cursor',
    appId: 'cursor',
  },
  subl: {
    macProcess: 'Sublime Text',
    wmClass: 'sublime_text.sublime_text',
    xdotoolClass: 'sublime_text',
    appId: 'sublime_text',
  },
}

/**
 * @param {string} platform
 * @param {Record<string, string | undefined>} [env]
 * @returns {AdapterId} platform-specific placement backend id
 */
export function selectAdapter(platform, env = {}) {
  if (platform === 'darwin')
    return 'macos'
  if (platform === 'linux') {
    if (env.WAYLAND_DISPLAY)
      return 'linux-wayland'
    return 'linux-x11'
  }
  if (platform === 'win32')
    return 'windows'
  return 'noop'
}

/**
 * @param {string} editor
 */
export function editorWindowMeta(editor) {
  return EDITOR_WINDOW[editor] || EDITOR_WINDOW.zed
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @returns {string} AppleScript passed to `osascript -e`
 */
export function buildMacOsScript(input) {
  const app = editorWindowMeta(input.editor).macProcess
  const width = Math.round(input.width)
  const height = Math.round(input.height)
  const positionBlock = macPositionBlock(input.position, width, height)

  return `${positionBlock}

tell application "System Events"
  set appName to "${app}"
  repeat with attempt from 1 to ${RETRIES}
    if exists process appName then
      tell process appName
        set frontmost to true
        repeat with w from (count of windows) to 1 by -1
          try
            set win to window w
            set position of win to {targetX, targetY}
            set size of win to {${width}, ${height}}
            perform action "AXRaise" of win
            exit repeat
          end try
        end repeat
      end tell
      exit repeat
    end if
    delay ${RETRY_MS / 1000}
  end repeat
end tell`
}

/**
 * @param {WindowPosition} position
 * @param {number} width
 * @param {number} height
 */
function macPositionBlock(position, width, height) {
  if (position === 'mouse') {
    return `tell application "System Events"
  set mousePos to mouse location
  set targetX to (item 1 of mousePos) - (${width} / 2)
  set targetY to (item 2 of mousePos) - (${height} / 2)
end tell`
  }
  if (position === 'center') {
    return `tell application "Finder"
  set desktopBounds to bounds of window of desktop
end tell
set screenX to item 1 of desktopBounds
set screenY to item 2 of desktopBounds
set screenW to (item 3 of desktopBounds) - screenX
set screenH to (item 4 of desktopBounds) - screenY
set targetX to screenX + ((screenW - ${width}) / 2)
set targetY to screenY + ((screenH - ${height}) / 2)`
  }
  return `tell application "Finder"
  set desktopBounds to bounds of window of desktop
end tell
set screenX to item 1 of desktopBounds
set screenY to item 2 of desktopBounds
set screenW to (item 3 of desktopBounds) - screenX
set screenH to (item 4 of desktopBounds) - screenY
set targetX to screenX + screenW - ${width} - ${MARGIN}
set targetY to screenY + ((screenH - ${height}) / 2)`
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @param {'wmctrl' | 'xdotool'} tool
 * @returns {string[]} argv for `spawn` (`bash -lc` plus the shell body)
 */
export function buildLinuxX11Commands(input, tool) {
  const meta = editorWindowMeta(input.editor)
  const width = Math.round(input.width)
  const height = Math.round(input.height)
  const shell = tool === 'wmctrl'
    ? buildWmctrlShell(meta.wmClass, width, height, input.position)
    : buildXdotoolShell(meta.xdotoolClass, width, height, input.position)
  return ['bash', '-lc', shell]
}

/**
 * @param {string} wmClass
 * @param {number} width
 * @param {number} height
 * @param {WindowPosition} position
 */
function buildWmctrlShell(wmClass, width, height, position) {
  const pos = shellPositionVars(position, width, height)
  return `for i in $(seq 1 ${RETRIES}); do
  wid=$(wmctrl -lx | awk '/${wmClass}/ {print $1; exit}')
  if [ -n "$wid" ]; then
    ${pos}
    wmctrl -ir "$wid" -e 0,$targetX,$targetY,${width},${height}
    wmctrl -ia "$wid"
    exit 0
  fi
  sleep ${RETRY_MS / 1000}
done
exit 1`
}

/**
 * @param {string} className
 * @param {number} width
 * @param {number} height
 * @param {WindowPosition} position
 */
function buildXdotoolShell(className, width, height, position) {
  const pos = shellPositionVars(position, width, height)
  return `for i in $(seq 1 ${RETRIES}); do
  wid=$(xdotool search --class ${className} 2>/dev/null | tail -n 1)
  if [ -n "$wid" ]; then
    ${pos}
    xdotool windowsize "$wid" ${width} ${height}
    xdotool windowmove "$wid" $targetX $targetY
    xdotool windowactivate "$wid"
    exit 0
  fi
  sleep ${RETRY_MS / 1000}
done
exit 1`
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @param {'hyprctl' | 'swaymsg'} tool
 * @returns {string[]} argv for `spawn` (`bash -lc` plus the shell body)
 */
export function buildLinuxWaylandCommands(input, tool) {
  const meta = editorWindowMeta(input.editor)
  const width = Math.round(input.width)
  const height = Math.round(input.height)
  const pos = shellPositionVars(input.position, width, height)
  if (tool === 'hyprctl') {
    return [
      'bash',
      '-lc',
      `for i in $(seq 1 ${RETRIES}); do
  addr=$(hyprctl clients -j | node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync(0,'utf8'));const m=c.filter(x=>String(x.class||'').toLowerCase().includes('${meta.appId}'));const w=m[m.length-1];if(w)process.stdout.write('0x'+w.address.toString(16));")
  if [ -n "$addr" ]; then
    ${pos}
    hyprctl dispatch resizewindowpixel exact ${width} ${height},address:$addr
    hyprctl dispatch movewindowpixel exact $targetX $targetY,address:$addr
    hyprctl dispatch focuswindow address:$addr
    exit 0
  fi
  sleep ${RETRY_MS / 1000}
done
exit 1`,
    ]
  }
  return [
    'bash',
    '-lc',
    `for i in $(seq 1 ${RETRIES}); do
  id=$(swaymsg -t get_tree | node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));const out=[];function walk(n){if(n.app_id==='${meta.appId}'&&n.type==='con')out.push(n.id);(n.nodes||[]).forEach(walk);(n.floating_nodes||[]).forEach(walk)}walk(j);if(out.length)process.stdout.write(String(out[out.length-1]));")
  if [ -n "$id" ]; then
    ${pos}
    swaymsg "[con_id=$id] resize set ${width} ${height}, move position $targetX $targetY, focus"
    exit 0
  fi
  sleep ${RETRY_MS / 1000}
done
exit 1`,
  ]
}

/**
 * @param {WindowPosition} position
 * @param {number} width
 * @param {number} height
 */
function shellPositionVars(position, width, height) {
  if (position === 'mouse') {
    return `read -r mx my _ < <(xdotool getmouselocation --shell 2>/dev/null | awk -F= '/^X=/{x=$2} /^Y=/{y=$2} END{print x,y}')
targetX=\${mx:-100}
targetY=\${my:-100}`
  }
  if (position === 'center') {
    return `read -r screenW screenH < <(xdotool getdisplaygeometry 2>/dev/null || echo 1920 1080)
targetX=$(( (screenW - ${width}) / 2 ))
targetY=$(( (screenH - ${height}) / 2 ))`
  }
  return `read -r screenW screenH < <(xdotool getdisplaygeometry 2>/dev/null || echo 1920 1080)
targetX=$(( screenW - ${width} - ${MARGIN} ))
targetY=$(( (screenH - ${height}) / 2 ))`
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition, enabled?: boolean }} input
 * @param {{ platform?: string, env?: Record<string, string | undefined>, log?: (message: string) => void, run?: typeof runCommand }} [deps]
 */
export async function placeWindow(input, deps = {}) {
  if (input.enabled === false)
    return { ok: true, skipped: true, reason: 'disabled' }
  const platform = deps.platform ?? process.platform
  const env = deps.env ?? process.env
  const log = deps.log ?? (() => {})
  const run = deps.run ?? runCommand
  const adapter = selectAdapter(platform, env)

  if (adapter === 'windows' || adapter === 'noop')
    return { ok: true, skipped: true, reason: adapter }

  try {
    if (adapter === 'macos')
      return await placeMacOs(input, run, log)
    if (adapter === 'linux-x11')
      return await placeLinuxX11(input, env, run, log)
    return await placeLinuxWayland(input, env, run, log)
  }
  catch {
    return { ok: false, skipped: true, reason: 'error' }
  }
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @param {typeof runCommand} run
 * @param {(message: string) => void} log
 */
async function placeMacOs(input, run, log) {
  const script = buildMacOsScript(input)
  const result = await run('osascript', ['-e', script])
  if (result.ok)
    return { ok: true, adapter: 'macos' }
  log('[mini-editor] Could not resize the editor window. On macOS, grant Accessibility to the app running `pnpm dev` (Terminal, iTerm, or Cursor).')
  return { ok: false, skipped: true, reason: 'osascript', detail: result.error }
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @param {Record<string, string | undefined>} env
 * @param {typeof runCommand} run
 * @param {(message: string) => void} log
 */
async function placeLinuxX11(input, env, run, log) {
  const tool = which('wmctrl', env) ? 'wmctrl' : which('xdotool', env) ? 'xdotool' : null
  if (!tool) {
    log('[mini-editor] Install wmctrl or xdotool to resize editor windows on X11.')
    return { ok: false, skipped: true, reason: 'no-x11-tool' }
  }
  const result = await run(...buildLinuxX11Commands(input, tool))
  if (result.ok)
    return { ok: true, adapter: 'linux-x11', tool }
  log(`[mini-editor] ${tool} could not find or resize the editor window.`)
  return { ok: false, skipped: true, reason: tool, detail: result.error }
}

/**
 * @param {{ editor: string, width: number, height: number, position: WindowPosition }} input
 * @param {Record<string, string | undefined>} env
 * @param {typeof runCommand} run
 * @param {(message: string) => void} log
 */
async function placeLinuxWayland(input, env, run, log) {
  const tool = which('hyprctl', env) ? 'hyprctl' : which('swaymsg', env) ? 'swaymsg' : null
  if (!tool) {
    log('[mini-editor] On Wayland, install hyprctl (Hyprland) or swaymsg (Sway), or run the dev server under X11. Skipping window placement.')
    return { ok: false, skipped: true, reason: 'no-wayland-tool' }
  }
  const result = await run(...buildLinuxWaylandCommands(input, tool))
  if (result.ok)
    return { ok: true, adapter: 'linux-wayland', tool }
  log(`[mini-editor] ${tool} could not find or resize the editor window.`)
  return { ok: false, skipped: true, reason: tool, detail: result.error }
}

/**
 * @param {string} bin
 * @param {Record<string, string | undefined>} env
 */
function which(bin, env) {
  const path = env.PATH || process.env.PATH || ''
  const found = spawnSync('which', [bin], { encoding: 'utf8', env: { ...process.env, ...env, PATH: path } })
  return found.status === 0 && found.stdout.trim().length > 0
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'ignore' })
    child.on('error', error => resolve({ ok: false, error: error.message }))
    child.on('close', code => resolve({ ok: code === 0, error: code === 0 ? undefined : `exit ${code}` }))
  })
}

export { parsePlacementOptions }
