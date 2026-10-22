import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'

/** A labeled block standing in for copy that has not been replaced yet. */
export function placeholder(size: number, name?: string): VNode {
  return h(
    'span',
    {
      'class': 'l-fill',
      'style': { '--fill': size },
      'data-slot': name || undefined,
    },
    name ?? '',
  )
}

export default defineComponent({
  name: 'Fill',
  props: {
    value: { type: String as PropType<string | null>, default: null },
    /** Field name drawn inside the block while the value is empty. */
    name: { type: String, default: '' },
    /** Minimum width in characters of the surrounding type. */
    size: { type: Number, default: 8 },
  },
  setup(props) {
    return (): VNode | string =>
      isFilled(props.value) ? props.value : placeholder(props.size, props.name || undefined)
  },
})
