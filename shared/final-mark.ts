// Wraps the full stop that ends a markdown body in the anchor the paper blooms, at parse
// time, so the server and client render the same element.

const TRAILING = /^(.*?)([.!?。！？])\s*$/s
const MARK = { 'class': 'l-mark', 'data-anchor': 'final-mark' }

type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

interface AstNode {
  type: string
  tag?: string
  value?: string
  props?: Record<string, unknown>
  children?: AstNode[]
}

function splitMinimark(paragraph: MinimarkNode[]): void {
  const last = paragraph.at(-1)
  const match = typeof last === 'string' ? TRAILING.exec(last) : null
  if (!match) return
  paragraph.splice(-1, 1, ...(match[1] ? [match[1]] : []), ['span', { ...MARK }, match[2] ?? ''])
}

function splitAst(paragraph: AstNode): void {
  const last = paragraph.children?.at(-1)
  const match = last?.type === 'text' ? TRAILING.exec(last.value ?? '') : null
  if (!paragraph.children || !match) return
  paragraph.children.splice(-1, 1, ...(match[1] ? [{ type: 'text', value: match[1] }] : []), {
    type: 'element',
    tag: 'span',
    props: { ...MARK },
    children: [{ type: 'text', value: match[2] ?? '' }],
  })
}

/**
 * Only a body that ends on a paragraph gets a mark; one ending on code or a list does not.
 * Highlighting appends a `style` node, which does not count as the end of the text.
 */
export function markFinalStop(body: unknown): void {
  if (!body || typeof body !== 'object') return
  if ('value' in body && Array.isArray(body.value)) {
    const last = (body.value as MinimarkNode[]).findLast(
      node => !Array.isArray(node) || node[0] !== 'style',
    )
    if (Array.isArray(last) && last[0] === 'p') splitMinimark(last as MinimarkNode[])
  } else if ('children' in body && Array.isArray(body.children)) {
    const last = (body.children as AstNode[]).findLast(node => node.tag !== 'style')
    if (last?.tag === 'p') splitAst(last)
  }
}
