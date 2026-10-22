// @env node
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Site routes for changelog entries. They have no link on the list page,
 * so the crawler would not prerender them or their share cards.
 */
export function changelogEntryRoutes(rootDir: string, defaultLocale: string): string[] {
  const contentDir = join(rootDir, 'content')
  const routes: string[] = []
  let locales: string[] = []
  try {
    locales = readdirSync(contentDir, { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? [entry.name] : [],
    )
  } catch {
    return routes
  }
  for (const locale of locales) {
    let files: string[] = []
    try {
      files = readdirSync(join(contentDir, locale, 'changelog')).filter(name =>
        name.endsWith('.md'),
      )
    } catch {
      continue
    }
    const prefix = locale === defaultLocale ? '' : `/${locale}`
    for (const file of files) routes.push(`${prefix}/changelog/${file.replace(/\.md$/i, '')}`)
  }
  return routes.sort()
}
