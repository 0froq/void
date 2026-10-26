import type { VNode } from 'vue'
import { defineComponent, h } from 'vue'

export function rich(text: string): (VNode | string)[] {
  return text
    .split('`')
    .map((part, index) => (index % 2 ? h('code', part) : part))
    .filter(part => part !== '')
}

// Inline copy from props: `backticks` become code, nothing else is interpreted
export default defineComponent({
  name: 'RichText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    return (): (VNode | string)[] => rich(props.text)
  },
})
