/** Like `t`, but a missing or empty message is `''`, so `<Fill>` can show a placeholder. */
export function useCopy(): (key: string, params?: Record<string, unknown>) => string {
  const { t, te } = useI18n()
  return (key, params = {}) => {
    if (!te(key)) return ''
    const message = t(key, params)
    return message === key ? '' : message
  }
}
