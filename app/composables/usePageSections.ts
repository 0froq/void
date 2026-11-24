import type { Ref } from 'vue'

export interface PageSection {
  id: string
  label: string
}

/** Sections are `block`s with an `id`. A filled label wins; an empty one shows the id. */
export function usePageSections(): {
  sections: Ref<PageSection[]>
  current: Ref<string>
  pinned: Ref<boolean>
} {
  const sections = ref<PageSection[]>([])
  const current = ref('')
  const pinned = ref(false)

  function read(): void {
    sections.value = [...document.querySelectorAll<HTMLElement>('main section.l-section[id]')].map(
      section => {
        const label = section.querySelector('[data-anchor="label"]')
        const text = label?.querySelector('.l-fill') ? '' : label?.textContent?.trim()
        return { id: section.id, label: text || section.id }
      },
    )
    if (!sections.value.some(section => section.id === current.value)) current.value = ''
  }

  function onScroll(): void {
    pinned.value = window.scrollY > 220
    const line = 80
    let active = ''
    for (const section of sections.value) {
      const node = document.getElementById(section.id)
      if (node && node.getBoundingClientRect().top <= line) active = section.id
    }
    current.value = active
  }

  function sync(): void {
    read()
    onScroll()
  }

  onMounted(() => {
    sync()
    addEventListener('scroll', onScroll, { passive: true })
    useNuxtApp().hook('page:finish', sync)
  })

  onBeforeUnmount(() => removeEventListener('scroll', onScroll))

  return { sections, current, pinned }
}
