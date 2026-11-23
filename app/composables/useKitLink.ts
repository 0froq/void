const EXTERNAL = /^[a-z][a-z\d+.-]*:/i

/** Resolves a locale-free path such as `/#pricing` for the current locale; URLs pass through. */
export function useKitLink(): (to: string) => string {
  const localePath = useLocalePath()
  return to => {
    if (EXTERNAL.test(to)) return to
    const [path = '/', hash] = to.split('#')
    const resolved = localePath(path || '/')
    return hash ? `${resolved}#${hash}` : resolved
  }
}

/** Content paths are prefixed with the locale folder: `/en/notes/x`. */
export function useContentPath(): (path?: string) => string {
  const { locale } = useI18n()
  return (path = '') => `/${locale.value}${path === '/' ? '' : path}`.replace(/\/$/, '')
}
