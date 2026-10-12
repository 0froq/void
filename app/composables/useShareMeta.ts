import type { MaybeRefOrGetter } from 'vue'
import { canonicalUrl, OG_IMAGE_HEIGHT, OG_IMAGE_URL, OG_IMAGE_WIDTH } from '~/utils/site'

export interface ShareMetaInput {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<'website' | 'article' | undefined>
}

function filled(value: string | undefined, fallback: string): string {
  const text = value?.trim()
  return text || fallback
}

/**
 * Open Graph / Twitter tags for the current route.
 * Pages pass their title and description; the image and card type are site-wide.
 */
export function useShareMeta(input: ShareMetaInput = {}): void {
  const route = useRoute()
  const { t } = useI18n()
  const { product } = useAppConfig()

  const title = computed(() => filled(toValue(input.title), t('site.title')))
  const description = computed(() => filled(toValue(input.description), t('site.description')))
  const type = computed(() => toValue(input.type) ?? 'website')
  const url = computed(() => canonicalUrl(route.path))

  useSeoMeta({
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogUrl: () => url.value,
    ogType: () => type.value,
    ogSiteName: product.name,
    ogImage: OG_IMAGE_URL,
    ogImageType: 'image/png',
    ogImageWidth: OG_IMAGE_WIDTH,
    ogImageHeight: OG_IMAGE_HEIGHT,
    ogImageAlt: () => title.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: OG_IMAGE_URL,
    twitterImageAlt: () => title.value,
  })

  useHead({
    link: [{ rel: 'canonical', href: () => url.value }],
  })
}
