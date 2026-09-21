<script setup lang="ts">
import { ParticleField, type ParticlePreset } from '~/utils/particles'

/**
 * Canvas particle field (SPEC §5.3). No library.
 *
 * Runs only while its scene is on screen and the tab is visible, degrades its
 * own density when frames get slow, and is purely decorative — aria-hidden,
 * never focusable, never carrying information.
 */
const props = withDefaults(defineProps<{
  preset: ParticlePreset
  density?: number
  /** Seed for reproducible rendering (screenshots, tests). */
  seed?: number
}>(), { density: 1, seed: 0x9e3779b9 })

const canvas = ref<HTMLCanvasElement>()
const root = ref<HTMLElement>()
const { reduced } = useMotionPreference()

let context: CanvasRenderingContext2D | null = null
let field: ParticleField | null = null
let dpr = 1
let accent = 'rgba(255,255,255,0.6)'
/** Resolved once from the element: ctx.font cannot read custom properties. */
let fontFamily = 'monospace'

const visible = ref(false)
const active = computed(() => visible.value && !reduced.value)

/** Rolling frame-time watch: a sustained slow patch halves the field once. */
let slowFrames = 0
let degraded = false

function readAccent() {
  if (!root.value) return
  const styles = getComputedStyle(root.value)
  accent = styles.getPropertyValue('--particle-color').trim() || accent
  fontFamily = styles.fontFamily || fontFamily
}

function setup() {
  const el = canvas.value
  if (!el || !root.value) return

  const rect = root.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`

  context = el.getContext('2d', { alpha: true })
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  readAccent()

  if (field) {
    field.resize(rect.width, rect.height)
  }
  else {
    field = new ParticleField({
      preset: props.preset,
      width: rect.width,
      height: rect.height,
      density: props.density * (degraded ? 0.5 : 1),
      seed: props.seed,
    })
  }

  // Setting canvas.width clears it, so repaint straight away. Under reduced
  // motion nothing else ever will, and a resize would leave the field blank.
  draw()
}

function draw() {
  if (!context || !field) return
  const { width, height } = field
  context.clearRect(0, 0, width, height)
  context.fillStyle = accent
  context.strokeStyle = accent

  if (props.preset === 'constellation') {
    // Links first, so dots sit on top of their own threads.
    context.lineWidth = 1
    for (let i = 0; i < field.count; i++) {
      for (let j = i + 1; j < field.count; j++) {
        const dx = field.x[i]! - field.x[j]!
        const dy = field.y[i]! - field.y[j]!
        const distance = Math.hypot(dx, dy)
        if (distance > 120) continue
        context.globalAlpha = (1 - distance / 120) * 0.25
        context.beginPath()
        context.moveTo(field.x[i]!, field.y[i]!)
        context.lineTo(field.x[j]!, field.y[j]!)
        context.stroke()
      }
    }
  }

  if (props.preset === 'spores') context.globalCompositeOperation = 'lighter'

  for (let i = 0; i < field.count; i++) {
    const depth = 0.35 + field.seedValue[i]! * 0.65
    context.globalAlpha = props.preset === 'code-rain' ? depth * 0.5 : depth * 0.7

    if (props.preset === 'code-rain') {
      // Glyphs rather than dots: the hero reads as falling code.
      context.font = `${field.size[i]!.toFixed(1)}px ${fontFamily}`
      const glyph = GLYPHS[Math.floor(field.seedValue[i]! * GLYPHS.length)]!
      context.fillText(glyph, field.x[i]!, field.y[i]!)
      continue
    }

    context.beginPath()
    context.arc(field.x[i]!, field.y[i]!, field.size[i]!, 0, Math.PI * 2)
    context.fill()
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
}

const GLYPHS = ['0', '1', '{', '}', '<', '/', '>', ';', '=', '$']

useFrameLoop((delta) => {
  if (!field) return

  // Two seconds of frames past 20ms means this machine cannot afford the
  // field at full density. Halve it once; never climb back, to avoid flapping.
  if (!degraded) {
    slowFrames = delta > 20 ? slowFrames + 1 : 0
    if (slowFrames > 110) {
      degraded = true
      field = null
      setup()
      return
    }
  }

  field.step(Math.min(delta, 34) / 1000)
  draw()
}, active)

onMounted(() => {
  setup()

  // Only paint while the scene is actually on screen.
  const observer = new IntersectionObserver(([entry]) => {
    visible.value = entry?.isIntersecting ?? false
  }, { threshold: 0.01 })
  if (root.value) observer.observe(root.value)

  const resizeObserver = new ResizeObserver(() => setup())
  if (root.value) resizeObserver.observe(root.value)

  // The accent follows the theme.
  const themeObserver = new MutationObserver(readAccent)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  onBeforeUnmount(() => {
    observer.disconnect()
    resizeObserver.disconnect()
    themeObserver.disconnect()
  })

  // Always paint one frame after layout. Under reduced motion the loop never
  // runs, and this single frame is what the field looks like — a still
  // backdrop rather than an empty one. Testing `reduced` here would be too
  // early: useMotionPreference resolves it in its own onMounted, which runs
  // after this child's.
  requestAnimationFrame(() => {
    if (!context) setup()
    else draw()
  })
})
</script>

<template>
  <div
    ref="root"
    class="particles"
    aria-hidden="true"
  >
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.particles {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  /* Read by the canvas each theme change; keeps colour in the token system. */
  --particle-color: color-mix(in oklab, var(--secondary) 55%, var(--surface));
}

canvas {
  display: block;
}
</style>
