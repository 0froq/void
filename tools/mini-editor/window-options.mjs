/** @typedef {'right' | 'center' | 'mouse'} WindowPosition */

const SIZE_RE = /^(\d{2,5})x(\d{2,5})$/i
const POSITIONS = new Set(['right', 'center', 'mouse'])

/**
 * @param {string | undefined} raw
 * @returns {{ width: number, height: number }} parsed size, or 900×600 when the string is invalid
 */
export function parseWindowSize(raw) {
  const value = (raw || '900x600').trim()
  const match = value.match(SIZE_RE)
  if (!match)
    return { width: 900, height: 600 }
  return {
    width: Number(match[1]),
    height: Number(match[2]),
  }
}

/**
 * @param {string | undefined} raw
 * @returns {WindowPosition} `right` when the value is missing or unknown
 */
export function parseWindowPosition(raw) {
  const value = (raw || 'right').trim().toLowerCase()
  if (POSITIONS.has(value))
    return value
  return 'right'
}

/**
 * @param {{ size?: string, position?: string, place?: boolean }} [moduleOptions]
 * @param {Record<string, string | undefined>} [env]
 */
export function parsePlacementOptions(moduleOptions = {}, env = {}) {
  const disabled = moduleOptions.place === false || env.MINI_EDITOR_PLACE === '0'
  const { width, height } = parseWindowSize(moduleOptions.size || env.MINI_EDITOR_SIZE)
  const position = parseWindowPosition(moduleOptions.position || env.MINI_EDITOR_POSITION)
  return {
    enabled: !disabled,
    width,
    height,
    position,
  }
}
