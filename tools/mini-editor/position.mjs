import { existsSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

/** Same trailing pattern launch-editor uses: `file:line` or `file:line:col`. */
const POSITION = /:(\d+)(?::(\d+))?$/

/**
 * @param {string} spec `file`, `file:line`, or `file:line:col`
 * @returns {{ file: string, line: number, column: number }} Line and column are 1-based. A missing or zero column becomes 1.
 */
export function parsePosition(spec) {
  const match = spec.match(POSITION)
  const file = match ? spec.slice(0, match.index) : spec
  const line = match ? Number(match[1]) : 1
  const column = match?.[2] ? Number(match[2]) : 1
  return {
    file,
    line: line > 0 ? line : 1,
    column: column > 0 ? column : 1,
  }
}

/**
 * Map an inspector spec onto a real file inside `rootDir`.
 * Relative specs resolve from the project root. `..`, `node_modules`,
 * `.git`, and `.env*` are refused. The caller must not write the path
 * the client invented without passing it through here again.
 *
 * @param {string} rootDir
 * @param {string} spec path, `path:line`, or `path:line:col`
 */
export function resolveProjectFile(rootDir, spec) {
  const parsed = parsePosition(spec.trim())
  if (!parsed.file || parsed.file.includes('\0'))
    return { ok: false, reason: 'empty' }

  let root
  try {
    root = realpathSync(rootDir)
  }
  catch {
    return { ok: false, reason: 'root' }
  }

  const abs = resolve(root, parsed.file)
  if (!existsSync(abs))
    return { ok: false, reason: 'missing', file: abs }

  let real
  try {
    real = realpathSync(abs)
  }
  catch {
    return { ok: false, reason: 'missing', file: abs }
  }

  const rel = relative(root, real)
  if (!rel || rel.startsWith('..') || isAbsolute(rel))
    return { ok: false, reason: 'outside' }

  const parts = rel.split(sep)
  if (parts.includes('node_modules') || parts.includes('.git'))
    return { ok: false, reason: 'denied' }
  if (parts.some(part => part === '.env' || part.startsWith('.env.')))
    return { ok: false, reason: 'denied' }

  const stat = statSync(real)
  if (!stat.isFile())
    return { ok: false, reason: 'not-file' }
  if (stat.size > 1_500_000)
    return { ok: false, reason: 'too-large' }

  return {
    ok: true,
    file: real,
    relative: rel.split(sep).join('/'),
    line: parsed.line,
    column: parsed.column,
  }
}
