import type { Ref } from 'vue'
import type { Theme } from '~/types'

const KEY = 'kit-theme'

/** Theme on `html[data-theme]`; the head script picks it before paint, this keeps it in sync. */
export function useTheme(): { theme: Ref<Theme>; ready: Ref<boolean>; toggle: () => void } {
  const theme = useState<Theme>('theme', () => 'light')
  const ready = useState('theme-ready', () => false)

  if (import.meta.client && !ready.value) {
    onNuxtReady(() => {
      theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
      ready.value = true
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!localStorage.getItem(KEY)) apply(event.matches ? 'dark' : 'light')
      })
    })
  }

  function apply(next: Theme): void {
    document.documentElement.dataset.theme = next
    theme.value = next
  }

  function toggle(): void {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    apply(next)
  }

  return { theme, ready, toggle }
}
