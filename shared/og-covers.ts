// @env node
import type { OgTheme } from './og-card'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import slugify from 'slugify'
import { parse as parseYaml } from 'yaml'
import { autoContentCoverPath, contentCoverLocale, contentCoverSlug } from '../app/utils/cover'
import { countCardWords, ogCardModel } from './og-card'
import { renderOgCard } from './og-render'

const SEMVER = /^\d+(?:\.\d+)*(?:\.x)?$/

export interface OgCoverPage {
  urlPath: string
  title: string
  evergreen: boolean
  created?: string
  updated?: string
  words: number
}

export async function generateOgCovers(options: {
  rootDir: string
  fallbackTitle: string
  theme: OgTheme
}): Promise<string[]> {
  const pages = await collectOgPages(options.rootDir, options.fallbackTitle)
  const outDir = join(options.rootDir, 'public/covers/_card')
  await rm(outDir, { recursive: true, force: true })
  for (const page of pages) {
    const png = await renderOgCard(ogCardModel({ ...page, theme: options.theme }))
    const file = join(options.rootDir, 'public', page.urlPath.slice(1))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, png)
  }
  return pages.map(page => page.urlPath)
}

/** Every content markdown file, plus the notes and changelog list routes. */
export async function collectOgPages(rootDir: string, fallbackTitle: string): Promise<OgCoverPage[]> {
  const contentDir = join(rootDir, 'content')
  const files = await walkMarkdown(contentDir)
  const pages: OgCoverPage[] = []
  const seen = new Set<string>()
  const locales = new Set<string>()

  for (const file of files) {
    const rel = relative(contentDir, file).split(sep).join('/')
    const collection = collectionOf(rel)
    const contentPath = contentPathFromFile(rel)
    const locale = contentCoverLocale(contentPath)
    if (locale)
      locales.add(locale)
    const slug = contentCoverSlug(collection, contentPath)
    const urlPath = autoContentCoverPath(collection, locale, slug)
    if (!locale || seen.has(urlPath))
      continue
    seen.add(urlPath)
    const raw = await readFile(file, 'utf8')
    const frontmatter = readFrontmatter(raw)
    pages.push({
      urlPath,
      title: filled(frontmatter.title) ?? fallbackTitle,
      evergreen: frontmatter.evergreen === true || frontmatter.kind === 'evergreen',
      created: filled(frontmatter.created) ?? filled(frontmatter.date),
      updated: filled(frontmatter.last_modified) ?? filled(frontmatter.updated),
      words: countCardWords(raw),
    })
  }

  for (const locale of locales) {
    for (const collection of ['notes', 'changelog'] as const) {
      const urlPath = autoContentCoverPath(collection, locale, 'index')
      if (seen.has(urlPath))
        continue
      seen.add(urlPath)
      const label = await localeLabel(rootDir, locale, collection)
      pages.push({
        urlPath,
        title: label ?? fallbackTitle,
        evergreen: false,
        words: 0,
      })
    }
  }

  pages.sort((a, b) => a.urlPath.localeCompare(b.urlPath))
  return pages
}

/**
 * Site routes for content that has a page: pages, notes, and docs.
 * Changelog entries have a card and no route. Default locale drops its prefix.
 */
export async function collectContentRoutes(rootDir: string, defaultLocale: string): Promise<string[]> {
  const contentDir = join(rootDir, 'content')
  const files = await walkMarkdown(contentDir)
  const routes = new Set<string>()
  for (const file of files) {
    const rel = relative(contentDir, file).split(sep).join('/')
    if (collectionOf(rel) === 'changelog')
      continue
    const route = siteRoute(contentPathFromFile(rel), defaultLocale)
    if (route)
      routes.add(route)
  }
  return [...routes].sort()
}

function siteRoute(contentPath: string, defaultLocale: string): string | undefined {
  const parts = contentPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const locale = parts[0]
  if (!locale)
    return undefined
  const rest = parts.slice(1)
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  if (rest.length === 0)
    return prefix || '/'
  return `${prefix}/${rest.join('/')}`
}

function collectionOf(relativeFile: string): string {
  const parts = relativeFile.split('/')
  const folder = parts[1]
  if (folder === 'notes' && parts.length === 3)
    return 'notes'
  if (folder === 'changelog' && parts.length === 3)
    return 'changelog'
  if (folder === 'docs')
    return 'docs'
  return 'pages'
}

/** Same path rules as Nuxt Content's path-meta transformer. */
export function contentPathFromFile(relativeFile: string): string {
  const noExt = relativeFile.replace(/\.md$/i, '')
  const parts = noExt.split('/').flatMap((part) => {
    let name = part.split(/[/:]/).pop() ?? ''
    if (!SEMVER.test(name)) {
      name = name
        .replace(/(\d+\.)?(.*)/, '$2')
        .replace(/^index(?:\.draft)?$/, '')
        .replace(/\.draft$/, '')
    }
    const slug = slugify(name, { lower: true })
    return slug ? [slug] : []
  })
  return `/${parts.join('/')}`
}

function readFrontmatter(raw: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!match?.[1])
    return {}
  const parsed = parseYaml(match[1])
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    return {}
  return parsed as Record<string, unknown>
}

function filled(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

async function localeLabel(rootDir: string, locale: string, collection: 'notes' | 'changelog'): Promise<string | undefined> {
  try {
    const raw = await readFile(join(rootDir, 'i18n/locales', `${locale}.json`), 'utf8')
    const json = JSON.parse(raw) as { notes?: { label?: string }, changelog?: { label?: string } }
    return filled(json[collection]?.label)
  }
  catch {
    return undefined
  }
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries: Array<{ name: string, isDirectory: () => boolean }>
  try {
    entries = await readdir(dir, { withFileTypes: true })
  }
  catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory())
      out.push(...await walkMarkdown(full))
    else if (entry.name.endsWith('.md'))
      out.push(full)
  }
  return out
}
