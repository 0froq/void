// @env node
import type { Buffer } from 'node:buffer'
import type { OgCardModel } from './og-card'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { OG_CARD_HEIGHT, OG_CARD_WIDTH, ogCardNode } from './og-card'
import { cjkFontsFor, primaryFonts } from './og-fonts'

/** Rasterize one card to a 1200×630 PNG. Fonts are embedded; nothing is rendered at request time. */
export async function renderOgCard(model: OgCardModel): Promise<Buffer> {
  const svg = await satori(ogCardNode(model) as never, {
    width: OG_CARD_WIDTH,
    height: OG_CARD_HEIGHT,
    fonts: primaryFonts(),
    loadAdditionalAsset: async (code, segment) => {
      if (code === 'emoji')
        return ''
      const fonts = cjkFontsFor(segment)
      return fonts.length ? fonts : ''
    },
  })
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_CARD_WIDTH },
    font: { loadSystemFonts: false },
  }).render().asPng()
}
