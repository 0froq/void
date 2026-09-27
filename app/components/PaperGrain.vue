<script setup lang="ts">
import { paperTile } from '~/utils/paper'

const canvas = ref<HTMLCanvasElement | null>(null)
const { theme } = useTheme()

let tile: HTMLCanvasElement | null = null

function paint() {
  const node = canvas.value
  if (!node)
    return
  const ctx = node.getContext('2d')
  if (!ctx)
    return

  const dark = document.documentElement.dataset.theme === 'dark'
  const width = window.innerWidth
  const height = window.innerHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const bw = Math.floor(width * ratio)
  const bh = Math.floor(height * ratio)
  if (node.width !== bw || node.height !== bh) {
    node.width = bw
    node.height = bh
    node.style.width = `${width}px`
    node.style.height = `${height}px`
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  if (!dark)
    return
  tile ??= paperTile(true)
  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern)
    return
  const y = window.scrollY
  ctx.save()
  ctx.translate(0, -y)
  ctx.fillStyle = pattern
  ctx.fillRect(0, y, width, height)
  ctx.restore()
}

onMounted(() => {
  paint()
  window.addEventListener('resize', paint)
  window.addEventListener('scroll', paint, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', paint)
  window.removeEventListener('scroll', paint)
})
watch(theme, () => nextTick(paint))
</script>

<template>
  <canvas
    ref="canvas"
    class="grain"
    aria-hidden="true"
  />
</template>
