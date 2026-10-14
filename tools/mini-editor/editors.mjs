import { basename } from 'node:path'

/**
 * New-window argv for the editors froQ already uses.
 * None of these CLIs take a window size. After spawn, `placeWindow`
 * resizes the new window on macOS and Linux when tools are available.
 *
 * Zed (current CLI, `crates/cli`): `-n`/`--new` creates a new workspace.
 * The path argument is `path:line:column` (1-based).
 * VS Code and Cursor: `-n`/`--new-window` plus `-g`/`--goto file:line:character`.
 * Sublime: `-n`/`--new-window`, and the filename may end in `:line:column`.
 *
 * @param {string} name `zed`, `code`, `cursor`, `subl`, or an absolute path whose basename is one of those
 * @param {{ file: string, line: number, column: number }} target
 * @returns {{ editor: string, bin: string, args: string[] } | null} argv to spawn, or null when this module should not handle the name
 */
export function editorCommand(name, target) {
  const raw = name.trim()
  const family = familyOf(raw)
  if (!family)
    return null
  const spec = `${target.file}:${target.line}:${target.column}`
  return {
    editor: family.editor,
    bin: isPath(raw) ? raw : family.bin,
    args: [...family.args, spec],
  }
}

/**
 * @param {string} raw
 */
function familyOf(raw) {
  const base = basename(raw).toLowerCase().replace(/\.exe$/, '')
  switch (base) {
    case 'zed':
      return { editor: 'zed', bin: 'zed', args: ['--new'] }
    case 'code':
    case 'vscode':
    case 'vs-code':
      return { editor: 'code', bin: 'code', args: ['-n', '-g'] }
    case 'cursor':
      return { editor: 'cursor', bin: 'cursor', args: ['-n', '-g'] }
    case 'subl':
    case 'sublime':
    case 'sublime-text':
      return { editor: 'subl', bin: 'subl', args: ['-n'] }
    default:
      return null
  }
}

/**
 * @param {string} raw
 */
function isPath(raw) {
  return raw.includes('/') || raw.includes('\\')
}
