// Share-image paths for a Nuxt Content page.
// Order: frontmatter `cover`, a file dropped in `public/covers/`, the generated card, then the site image.
import { isFilled } from './text'

export interface ContentCoverSource {
  /** Nuxt Content collection name: `pages`, `notes`, `changelog`, `docs`, or a derived site's own. */
  collection: string
  /** Collection path, e.g. `/en/notes/note`. */
  path: string
  /** Optional frontmatter `cover`: a `public/` path or an absolute https URL. */
  cover?: string | null
}

const ABSOLUTE_HTTPS = /^https:\/\//i

/** Locale folder from a content path (`/zh/docs/install` → `zh`). */
export function contentCoverLocale(contentPath: string): string {
  return splitContentPath(contentPath)[0] ?? ''
}

/**
 * File slug under `public/covers/<collection>/<locale>/`.
 * Drops the locale folder and, when present, the collection folder.
 * Collection roots (`/en`, `/en/docs`) become `index`.
 */
export function contentCoverSlug(collection: string, contentPath: string): string {
  const rest = splitContentPath(contentPath).slice(1)
  const after = rest[0] === collection ? rest.slice(1) : rest
  return after.join('/') || 'index'
}

export function defaultContentCoverPath(collection: string, locale: string, slug: string): string {
  return `/covers/${collection}/${locale}/${slug}.png`
}

/** Build-time card written by the og-covers module. Not committed. */
export function autoContentCoverPath(collection: string, locale: string, slug: string): string {
  return `/covers/_card/${collection}/${locale}/${slug}.png`
}

/**
 * Frontmatter `cover` if it exists (or is already https), else
 * `public/covers/<collection>/<locale>/<slug>.png` when that file exists,
 * else the generated card when that file exists, else `fallback` (site `/og.png`).
 */
export function resolveContentCover(
  source: ContentCoverSource,
  hasPublicFile: (urlPath: string) => boolean,
  fallback: string,
): string {
  const locale = contentCoverLocale(source.path)
  const slug = contentCoverSlug(source.collection, source.path)
  const candidates: string[] = []

  if (isFilled(source.cover)) {
    if (ABSOLUTE_HTTPS.test(source.cover))
      return source.cover.trim()
    const custom = publicUrlPath(source.cover)
    if (custom)
      candidates.push(custom)
  }

  if (locale && slug) {
    candidates.push(defaultContentCoverPath(source.collection, locale, slug))
    candidates.push(autoContentCoverPath(source.collection, locale, slug))
  }

  for (const candidate of candidates) {
    if (hasPublicFile(candidate))
      return candidate
  }

  return publicUrlPath(fallback) ?? '/og.png'
}

export function contentCoverSource(
  collection: string,
  page: { path: string, cover?: string | null } | null | undefined,
): ContentCoverSource | undefined {
  if (!page)
    return undefined
  return { collection, path: page.path, cover: page.cover }
}

function splitContentPath(contentPath: string): string[] {
  return contentPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
}

function publicUrlPath(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed)
    return undefined
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (path.includes('\0') || path.split('/').includes('..'))
    return undefined
  return path
}
