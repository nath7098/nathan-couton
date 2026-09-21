import type { InjectionKey, Ref } from 'vue'
import { SCENES, TOTAL_SPAN, type SceneId } from '~/data/scenes'
import { activeSceneAt, progressForScene, sceneBounds, sceneProgressAt, travel } from '~/utils/rail-geometry'
import { clamp, lerp } from '~/utils/math'

export interface RailContext {
  /** 0 → 1 across the whole rail. */
  progress: Readonly<Ref<number>>
  /** Scene closest to the viewport centre. */
  activeScene: Readonly<Ref<SceneId>>
  /** Signed, smoothed scroll speed — feeds the kinetic effects in L4. */
  velocity: Readonly<Ref<number>>
  /** True while a programmatic scroll is running. */
  isSnapping: Readonly<Ref<boolean>>
  /** True when the rail runs horizontally (desktop); false in the stacked layout. */
  isHorizontal: Readonly<Ref<boolean>>
  /** Local 0 → 1 progress of one scene across the viewport. */
  sceneProgress: (id: SceneId) => number
  /** Scrolls so that `id` lines up with the viewport's left edge. */
  goTo: (id: SceneId, options?: { instant?: boolean }) => void
}

export const RAIL_KEY: InjectionKey<RailContext> = Symbol('nc-rail')

const BOUNDS = sceneBounds(SCENES)
const TRAVEL = travel(TOTAL_SPAN)

/** Matches the `--rail` custom media: the layout the horizontal rail needs. */
const RAIL_QUERY = '(min-width: 1024px) and (min-height: 600px) and (pointer: fine)'

/**
 * Owns the rail's scroll state. Mounted once by NcRail and injected everywhere
 * else — there is no global store, the rail is the page.
 */
export function provideRail(): RailContext {
  const progress = ref(0)
  const velocity = ref(0)
  const isSnapping = ref(false)
  const isHorizontal = ref(false)
  const activeScene = ref<SceneId>(SCENES[0]!.id)
  const { reduced } = useMotionPreference()

  /** Max scrollable distance of the proxy, in pixels. */
  function maxScroll(): number {
    return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
  }

  function readProgress(): number {
    return clamp(window.scrollY / maxScroll())
  }

  if (import.meta.client) {
    let raf = 0
    let smoothed = 0
    let previous = 0
    let cssDriven = false

    const write = (value: number) => {
      progress.value = value
      activeScene.value = activeSceneAt(BOUNDS, value, TOTAL_SPAN)
      document.documentElement.style.setProperty('--rail-progress', value.toFixed(5))
      document.documentElement.style.setProperty('--rail-velocity', velocity.value.toFixed(4))
    }

    /**
     * Path B (SPEC §3.2): rAF loop with damping, for engines without
     * scroll-driven animations. Reads scroll once per frame and writes a single
     * custom property — no layout reads inside the loop.
     */
    const tick = () => {
      const target = readProgress()
      // Reduced motion gets the raw value: damping is motion for its own sake.
      smoothed = reduced.value ? target : lerp(smoothed, target, 0.12)
      velocity.value = smoothed - previous
      previous = smoothed

      if (Math.abs(smoothed - target) < 0.00002) {
        smoothed = target
        velocity.value = 0
      }
      write(smoothed)
      raf = requestAnimationFrame(tick)
    }

    /** Path A: the browser drives the transform; we only mirror state for JS consumers. */
    const syncOnly = () => {
      const target = readProgress()
      velocity.value = target - previous
      previous = target
      write(target)
    }

    const media = ref<MediaQueryList>()

    onMounted(() => {
      media.value = window.matchMedia(RAIL_QUERY)
      cssDriven = CSS.supports('animation-timeline: scroll()')
      document.documentElement.dataset.railDriver = cssDriven ? 'css' : 'raf'

      const syncLayout = () => {
        isHorizontal.value = media.value!.matches
      }
      syncLayout()
      useEventListener(media.value, 'change', syncLayout)

      previous = readProgress()
      smoothed = previous
      write(previous)

      if (cssDriven) {
        useEventListener(window, 'scroll', syncOnly, { passive: true })
      }
      else {
        raf = requestAnimationFrame(tick)
      }

      useEventListener(window, 'resize', () => write(readProgress()), { passive: true })
    })

    onBeforeUnmount(() => cancelAnimationFrame(raf))
  }

  function goTo(id: SceneId, options: { instant?: boolean } = {}) {
    if (!import.meta.client) return

    const target = progressForScene(BOUNDS, id, TOTAL_SPAN)
    const top = target * maxScroll()
    const instant = options.instant || reduced.value

    isSnapping.value = true
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' })

    // No reliable "scroll finished" event; this is long enough for a smooth
    // scroll across the rail and short enough not to swallow user input.
    window.setTimeout(() => {
      isSnapping.value = false
    }, instant ? 50 : 700)
  }

  const context: RailContext = {
    progress: readonly(progress),
    activeScene: readonly(activeScene),
    velocity: readonly(velocity),
    isSnapping: readonly(isSnapping),
    isHorizontal: readonly(isHorizontal),
    sceneProgress: (id: SceneId) => sceneProgressAt(BOUNDS, id, progress.value, TOTAL_SPAN),
    goTo,
  }

  provide(RAIL_KEY, context)
  return context
}

/** Reads the rail context. Throws rather than silently no-op outside NcRail. */
export function useRail(): RailContext {
  const context = inject(RAIL_KEY, null)
  if (!context) throw new Error('useRail() must be called inside <NcRail>')
  return context
}

export { BOUNDS as RAIL_BOUNDS, TRAVEL as RAIL_TRAVEL }

declare global {
  interface Window {
    /** Initial URL fragment, captured in <head> before Nuxt boots. */
    __ncHash?: string
  }
}
