/** Production origin. Matches the site URL in README. */
export const SITE_ORIGIN = 'https://void.froq.me'

export const OG_IMAGE_PATH = '/og.png'
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

/** Absolute canonical URL for a route path (`/` or `/zh/docs`). */
export function canonicalUrl(path: string): string {
  if (!path || path === '/')
    return SITE_ORIGIN
  return `${SITE_ORIGIN}${path.replace(/\/+$/, '')}`
}
