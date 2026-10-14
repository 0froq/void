import assert from 'node:assert/strict'
// This repo has no vitest runner. node:test is the check.
import test from 'node:test' // eslint-disable-line test/no-import-node-test
import { parsePlacementOptions, parseWindowPosition, parseWindowSize } from './window-options.mjs'
import {
  buildLinuxWaylandCommands,
  buildLinuxX11Commands,
  buildMacOsScript,
  placeWindow,
  selectAdapter,
} from './window-place.mjs'

test('parseWindowSize and position defaults', () => {
  assert.deepEqual(parseWindowSize(undefined), { width: 900, height: 600 })
  assert.deepEqual(parseWindowSize('1200x800'), { width: 1200, height: 800 })
  assert.deepEqual(parseWindowSize('bad'), { width: 900, height: 600 })
  assert.equal(parseWindowPosition(undefined), 'right')
  assert.equal(parseWindowPosition('center'), 'center')
  assert.equal(parseWindowPosition('mouse'), 'mouse')
  assert.equal(parseWindowPosition('nope'), 'right')
})

test('parsePlacementOptions reads module options and env', () => {
  assert.deepEqual(parsePlacementOptions({}, {}), {
    enabled: true,
    width: 900,
    height: 600,
    position: 'right',
  })
  assert.deepEqual(parsePlacementOptions({ size: '1000x700', position: 'center' }, {}), {
    enabled: true,
    width: 1000,
    height: 700,
    position: 'center',
  })
  assert.deepEqual(parsePlacementOptions({}, { MINI_EDITOR_SIZE: '800x500', MINI_EDITOR_POSITION: 'mouse' }), {
    enabled: true,
    width: 800,
    height: 500,
    position: 'mouse',
  })
  assert.equal(parsePlacementOptions({ place: false }, {}).enabled, false)
  assert.equal(parsePlacementOptions({}, { MINI_EDITOR_PLACE: '0' }).enabled, false)
})

test('selectAdapter per platform', () => {
  assert.equal(selectAdapter('darwin'), 'macos')
  assert.equal(selectAdapter('linux', {}), 'linux-x11')
  assert.equal(selectAdapter('linux', { WAYLAND_DISPLAY: 'wayland-1' }), 'linux-wayland')
  assert.equal(selectAdapter('win32'), 'windows')
  assert.equal(selectAdapter('freebsd'), 'noop')
})

test('buildMacOsScript targets the editor process and geometry', () => {
  const script = buildMacOsScript({ editor: 'zed', width: 900, height: 600, position: 'right' })
  assert.match(script, /set appName to "Zed"/)
  assert.match(script, /set size of win to \{900, 600\}/)
  assert.match(script, /screenW - 900 - 24/)
  const cursor = buildMacOsScript({ editor: 'cursor', width: 880, height: 640, position: 'center' })
  assert.match(cursor, /set appName to "Cursor"/)
  assert.match(cursor, /\(screenW - 880\) \/ 2/)
  const mouse = buildMacOsScript({ editor: 'code', width: 800, height: 500, position: 'mouse' })
  assert.match(mouse, /mouse location/)
  assert.match(mouse, /set appName to "Code"/)
})

test('buildLinuxX11Commands prefer wmctrl and xdotool shapes', () => {
  const wm = buildLinuxX11Commands({ editor: 'zed', width: 900, height: 600, position: 'right' }, 'wmctrl')
  assert.deepEqual(wm.slice(0, 2), ['bash', '-lc'])
  assert.match(wm[2], /wmctrl -lx/)
  assert.match(wm[2], /zed\.Zed/)
  assert.match(wm[2], /wmctrl -ir "\$wid" -e 0,\$targetX,\$targetY,900,600/)
  const xdo = buildLinuxX11Commands({ editor: 'subl', width: 700, height: 500, position: 'center' }, 'xdotool')
  assert.match(xdo[2], /xdotool search --class sublime_text/)
  assert.match(xdo[2], /windowsize "\$wid" 700 500/)
})

test('buildLinuxWaylandCommands for hyprctl and swaymsg', () => {
  const hypr = buildLinuxWaylandCommands({ editor: 'cursor', width: 900, height: 600, position: 'right' }, 'hyprctl')
  assert.match(hypr[2], /hyprctl clients -j/)
  assert.match(hypr[2], /resizewindowpixel exact 900 600/)
  const sway = buildLinuxWaylandCommands({ editor: 'code', width: 800, height: 500, position: 'center' }, 'swaymsg')
  assert.match(sway[2], /swaymsg -t get_tree/)
  assert.match(sway[2], /resize set 800 500/)
})

test('placeWindow is a no-op on windows and when disabled', async () => {
  const win = await placeWindow({ editor: 'zed', width: 900, height: 600, position: 'right', enabled: false }, { platform: 'darwin' })
  assert.equal(win.skipped, true)
  assert.equal(win.reason, 'disabled')
  const windows = await placeWindow({ editor: 'zed', width: 900, height: 600, position: 'right' }, { platform: 'win32' })
  assert.equal(windows.reason, 'windows')
})

test('placeWindow logs once on wayland without tools', async () => {
  const lines = []
  const result = await placeWindow(
    { editor: 'zed', width: 900, height: 600, position: 'right' },
    { platform: 'linux', env: { WAYLAND_DISPLAY: 'wayland-0', PATH: '/nonexistent' }, log: line => lines.push(line) },
  )
  assert.equal(result.reason, 'no-wayland-tool')
  assert.equal(lines.length, 1)
  assert.match(lines[0], /Wayland/)
})
