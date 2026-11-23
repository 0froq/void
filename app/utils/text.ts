const STOP = /^(.*?)([.!?。！？])$/s

/** Splits trailing punctuation off so a signature layer can take its place. */
export function splitStop(text: string, fallback = ''): { body: string; stop: string } {
  const match = STOP.exec(text.trim())
  return match
    ? { body: match[1] ?? '', stop: match[2] ?? '' }
    : { body: text.trim(), stop: fallback }
}

export function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function collectText(node: unknown, out: string[]): void {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node))
    node.forEach((child, index) =>
      index > 0 || typeof child !== 'string' ? collectText(child, out) : undefined,
    )
  else if (node && typeof node === 'object' && 'value' in node)
    collectText((node as { value: unknown }).value, out)
}

/** Rough reading time from a minimark body: ~200 words or ~400 CJK characters a minute. */
export function readingMinutes(body: unknown): number {
  const out: string[] = []
  collectText(body, out)
  const text = out.join(' ')
  const cjk = (text.match(/[\u3400-\u9FFF]/g) ?? []).length
  const words = text
    .replace(/[\u3400-\u9FFF]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200 + cjk / 400))
}
