// @env node
import type { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

const SERIF = 'Instrument Serif'
const MONO = 'Geist Mono'
const CJK = 'Noto Serif SC'

function pkgFile(pkg: string, file: string): string {
  return join(dirname(require.resolve(`${pkg}/package.json`)), file)
}

function readFont(pkg: string, file: string): Buffer {
  return readFileSync(pkgFile(pkg, file))
}

export interface OgFont {
  name: string
  data: Buffer
  weight: 400
  style: 'normal' | 'italic'
}

let primary: OgFont[] | undefined

/** Instrument Serif (title, evergreen, froQ) and Geist Mono (meta). */
export function primaryFonts(): OgFont[] {
  if (primary)
    return primary
  const serif = '@fontsource/instrument-serif'
  // Static woff from @fontsource/geist-mono 5.2.7. Later releases are variable woff2, which satori cannot parse.
  const mono = '@fontsource/geist-mono'
  primary = [
    face(SERIF, readFont(serif, 'files/instrument-serif-latin-400-normal.woff'), 'normal'),
    face(SERIF, readFont(serif, 'files/instrument-serif-latin-ext-400-normal.woff'), 'normal'),
    face(SERIF, readFont(serif, 'files/instrument-serif-latin-400-italic.woff'), 'italic'),
    face(SERIF, readFont(serif, 'files/instrument-serif-latin-ext-400-italic.woff'), 'italic'),
    face(MONO, readFont(mono, 'files/geist-mono-latin-400-normal.woff'), 'normal'),
    face(MONO, readFont(mono, 'files/geist-mono-latin-ext-400-normal.woff'), 'normal'),
  ]
  return primary
}

interface Face {
  file: string
  ranges: Array<[number, number]>
}

let cjkFaces: Face[] | undefined
const cjkBuffers = new Map<string, Buffer>()

/**
 * Noto Serif SC slices that cover `text`. Satori asks for these when a title
 * has Han characters Instrument Serif does not.
 */
export function cjkFontsFor(text: string): OgFont[] {
  const faces = loadCjkFaces()
  const files = new Set<string>()
  for (const char of text) {
    const code = char.codePointAt(0)
    if (code == null)
      continue
    const faceFile = faces.find(item => item.ranges.some(([start, end]) => code >= start && code <= end))?.file
    if (faceFile)
      files.add(faceFile)
  }
  const fonts: OgFont[] = []
  for (const file of files) {
    let data = cjkBuffers.get(file)
    if (!data) {
      data = readFileSync(file)
      cjkBuffers.set(file, data)
    }
    // One family name would collapse every slice to a single file. Each slice needs its own name.
    fonts.push(face(`${CJK} ${basename(file, '.woff')}`, data, 'normal'))
  }
  return fonts
}

function loadCjkFaces(): Face[] {
  if (cjkFaces)
    return cjkFaces
  const cssPath = require.resolve('@fontsource/noto-serif-sc/400.css')
  const root = dirname(cssPath)
  const css = readFileSync(cssPath, 'utf8')
  const faces: Face[] = []
  for (const block of css.split('@font-face').slice(1)) {
    const range = /unicode-range:([^;]+);/.exec(block)?.[1]?.trim()
    const woff = /url\((\.\/files\/[^)]+?\.woff)\)/.exec(block)?.[1]
    if (!range || !woff)
      continue
    const ranges = range.split(',').flatMap((token) => {
      const parsed = parseUnicodeToken(token)
      return parsed ? [parsed] : []
    })
    if (ranges.length)
      faces.push({ file: join(root, woff), ranges })
  }
  cjkFaces = faces
  return faces
}

function parseUnicodeToken(token: string): [number, number] | undefined {
  const match = /^U\+([0-9A-F?]+)(?:-([0-9A-F?]+))?$/i.exec(token.trim())
  if (!match?.[1])
    return undefined
  const start = expandHex(match[1], false)
  const end = expandHex(match[2] ?? match[1], true)
  if (start == null || end == null)
    return undefined
  return [start, end]
}

function expandHex(hex: string, end: boolean): number | undefined {
  const filled = hex.replaceAll('?', end ? 'F' : '0')
  const value = Number.parseInt(filled, 16)
  return Number.isNaN(value) ? undefined : value
}

function face(name: string, data: Buffer, style: 'normal' | 'italic'): OgFont {
  return { name, data, weight: 400, style }
}
