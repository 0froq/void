export function paperTile(dark: boolean): HTMLCanvasElement {
  const tile = 160
  const spec = document.createElement('canvas')
  spec.width = tile
  spec.height = tile
  const grain = spec.getContext('2d')
  if (!grain)
    return spec

  const image = grain.createImageData(tile, tile)
  const pixels = image.data
  const ink = dark ? [242, 240, 234] : [26, 25, 23]
  for (let i = 0; i < pixels.length; i += 4) {
    const n = Math.random()
    const speck = n > 0.965 || n < 0.035
    pixels[i] = ink[0]!
    pixels[i + 1] = ink[1]!
    pixels[i + 2] = ink[2]!
    pixels[i + 3] = speck ? (dark ? 8 : 22) : 0
  }
  grain.putImageData(image, 0, 0)

  grain.lineWidth = 0.6
  grain.strokeStyle = dark ? 'rgba(242, 240, 234, 0.022)' : 'rgba(90, 70, 40, 0.07)'
  for (let i = 0; i < 18; i += 1) {
    const y = Math.random() * tile
    grain.beginPath()
    grain.moveTo(0, y)
    grain.bezierCurveTo(
      tile * 0.3,
      y + (Math.random() - 0.5) * 6,
      tile * 0.7,
      y + (Math.random() - 0.5) * 6,
      tile,
      y + (Math.random() - 0.5) * 3,
    )
    grain.stroke()
  }
  return spec
}
