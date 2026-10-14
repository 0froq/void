import type { MaybeRefOrGetter } from 'vue'
import type { ContentCoverSource } from '~/utils/cover'
import { resolveContentCover } from '~/utils/cover'
import { absoluteImageUrl, canonicalUrl, OG_IMAGE_HEIGHT, OG_IMAGE_PATH, OG_IMAGE_WIDTH } from '~/utils/site'

export interface ShareMetaInput {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<'website' | 'article' | undefined>
  /** Content page. Omitted routes (the error page) use `/og.png`. */
  cover?: MaybeRefOrGetter<ContentCoverSource | null | undefined>
}

function filled(value: string | undefined, fallback: string): string {
  const text = value?.trim()
  return text || fallback
}

/**
 * Open Graph / Twitter tags for the current route.
 * Image order: frontmatter `cover`, `public/covers/<collection>/<locale>/<slug>.png`,
 * the generated card, then `/og.png`. Image URLs use the Worker origin.
 */
export function useShareMeta(input: ShareMetaInput = {}): void {
  const route = useRoute()
  const { t } = useI18n()
  const { product } = useAppConfig()
  const config = useRuntimeConfig()

  const title = computed(() => filled(toValue(input.title), t('site.title')))
  const description = computed(() => filled(toValue(input.description), t('site.description')))
  const type = computed(() => toValue(input.type) ?? 'website')
  const url = computed(() => canonicalUrl(route.path))
  const image = computed(() => {
    const source = toValue(input.cover)
    const files = config.public.publicFiles
    const hasPublicFile = (urlPath: string): boolean => Array.isArray(files) && files.includes(urlPath)
    const path = source
      ? resolveContentCover(source, hasPublicFile, OG_IMAGE_PATH)
      : OG_IMAGE_PATH
    return absoluteImageUrl(path)
  })

  useSeoMeta({
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogUrl: () => url.value,
    ogType: () => type.value,
    ogSiteName: product.name,
    ogImage: () => image.value,
    ogImageType: 'image/png',
    ogImageWidth: OG_IMAGE_WIDTH,
    ogImageHeight: OG_IMAGE_HEIGHT,
    ogImageAlt: () => title.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value,
    twitterImageAlt: () => title.value,
  })

  useHead({
    link: [{ rel: 'canonical', href: () => url.value }],
  })
}
