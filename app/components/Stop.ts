import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import { placeholder } from './Fill'
import { rich } from './RichText'

// A title whose trailing stop is its own element, so the paper can bloom it or the pen can land on it
export default defineComponent({
  name: 'Stop',
  props: {
    text: { type: String as PropType<string | null>, default: null },
    /** Field name drawn inside the block while the text is empty. */
    name: { type: String, default: '' },
    anchor: { type: String as PropType<'mark' | 'final-mark'>, default: 'mark' },
    /** Stop added when the text has none. */
    fallback: { type: String, default: '' },
    size: { type: Number, default: 8 },
  },
  setup(props) {
    return (): VNode | (VNode | string)[] => {
      if (!isFilled(props.text)) return placeholder(props.size, props.name || undefined)
      const { body, stop } = splitStop(props.text, props.fallback)
      const mark = h('span', { 'class': 'l-mark', 'data-anchor': props.anchor }, stop)
      return stop ? [...rich(body), mark] : rich(body)
    }
  },
})
