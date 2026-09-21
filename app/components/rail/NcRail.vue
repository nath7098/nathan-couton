<script setup lang="ts">
import { SCENES, TOTAL_SPAN, isSceneId, type SceneId } from '~/data/scenes'
import { RAIL_BOUNDS, RAIL_TRAVEL } from '~/composables/useRail'

/**
 * The rail: a tall scroll proxy, a sticky viewport and a track that slides
 * sideways. Below the `--rail` breakpoint the same markup stacks vertically.
 * SPEC §3.
 */
const rail = provideRail()
const { reduced } = useMotionPreference()

/**
 * Each scene's slice of the rail, as fractions of total scroll. Feeds
 * `animation-range` so scroll-driven CSS can give every scene its own progress.
 */
const sceneRanges = computed(() =>
  Object.fromEntries(RAIL_BOUNDS.map(bounds => [
    bounds.id,
    {
      start: RAIL_TRAVEL === 0 ? 0 : Math.max(bounds.start - 1, 0) / RAIL_TRAVEL,
      end: RAIL_TRAVEL === 0 ? 1 : Math.min(bounds.end, RAIL_TRAVEL) / RAIL_TRAVEL,
    },
  ])),
)

// ── Deep linking ───────────────────────────────────────────────────────────
// The hash mirrors the active scene so a position can be shared and restored.
// replaceState only: a router navigation here would reset the scroll we are
// describing.
const route = useRoute()

watch(rail.activeScene, (id) => {
  if (!import.meta.client) return
  const next = `#${id}`
  if (window.location.hash !== next) {
    window.history.replaceState(window.history.state, '', next)
  }
})

onMounted(() => {
  const hash = window.__ncHash || (window.location.hash || route.hash).replace('#', '')
  if (!hash || !isSceneId(hash)) return

  // Two frames: the first lets the sticky/track styles settle so the proxy has
  // its real height, the second places the rail. A single tick lands on a
  // scrollHeight that is still the pre-layout one.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => rail.goTo(hash as SceneId, { instant: true }))
  })
})

// ── Keyboard ───────────────────────────────────────────────────────────────
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

function step(direction: 1 | -1) {
  const index = SCENES.findIndex(scene => scene.id === rail.activeScene.value)
  const next = SCENES[Math.min(Math.max(index + direction, 0), SCENES.length - 1)]
  if (next) rail.goTo(next.id)
}

function onKeydown(event: KeyboardEvent) {
  if (!rail.isHorizontal.value || isTyping(event.target) || event.metaKey || event.ctrlKey) return

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      step(1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      step(-1)
      break
    case 'Home':
      event.preventDefault()
      rail.goTo(SCENES[0]!.id)
      break
    case 'End':
      event.preventDefault()
      rail.goTo(SCENES.at(-1)!.id)
      break
  }
}

/**
 * Horizontal wheel and trackpad gestures feel like they should move the rail,
 * but the rail is driven by vertical scroll — so forward deltaX onto it.
 */
function onWheel(event: WheelEvent) {
  if (!rail.isHorizontal.value) return
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
  window.scrollBy({ top: event.deltaX, behavior: 'auto' })
}

/**
 * Tab moves focus into scenes that are off to the side. The sticky viewport
 * cannot scroll (overflow: clip), so bring the rail to the focused scene.
 */
function onFocusIn(event: FocusEvent) {
  if (!rail.isHorizontal.value) return
  const scene = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-scene]')
  const id = scene?.dataset.scene
  if (id && isSceneId(id) && id !== rail.activeScene.value) {
    rail.goTo(id, { instant: reduced.value })
  }
}

onMounted(() => {
  useEventListener(window, 'keydown', onKeydown)
  useEventListener(window, 'wheel', onWheel, { passive: true })
  useEventListener(document, 'focusin', onFocusIn)
})
</script>

<template>
  <div
    class="rail"
    :style="{ '--rail-total-span': TOTAL_SPAN }"
  >
    <div class="rail__proxy">
      <div class="rail__viewport">
        <div class="rail__track">
          <div class="rail__lean">
            <NcScene
              v-for="(scene, index) in SCENES"
              :key="scene.id"
              :scene="scene"
              :index="index"
              :range="sceneRanges[scene.id]!"
            >
              <slot
                :name="scene.id"
                :scene="scene"
                :index="index"
              />
            </NcScene>
          </div>
        </div>
      </div>
    </div>

    <NcRailNav />
  </div>
</template>
