import type { InjectionKey, Ref } from 'vue'
import { SCENES, TOTAL_SPAN, type SceneId } from '~/data/scenes'
import {
  activeSceneAt,
  lockFraction,
  progressForScene,
  sceneBounds,
  sceneProgressAt,
  scrollSpan,
  splitScroll,
  travel,
} from '~/utils/rail-geometry'
import { clamp, lerp } from '~/utils/math'

export interface RailContext {
  /** 0 → 1 across the track's travel. Reaches 1 when the last scene is parked. */
  progress: Readonly<Ref<number>>
  /** 0 → 1 across the contact walk, which runs after the track has parked. */
  walk: Readonly<Ref<number>>
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
/** Total page scroll, in viewport heights: the track's travel plus the walk. */
const SCROLL_SPAN = scrollSpan(TOTAL_SPAN)
/** Fraction of that scroll at which the track parks and the walk takes over. */
const LOCK = lockFraction(TOTAL_SPAN)

/** Matches the `--rail` custom media: the layout the horizontal rail needs. */
const RAIL_QUERY = '(min-width: 1024px) and (min-height: 600px) and (pointer: fine)'

/**
 * How close to the lock point an at-rest scroll has to be for the rail to
 * finish the job itself, as a fraction of the viewport's height.
 *
 * Only ever pulls *forward*: land anywhere in the last half-viewport before
 * the contact scene is parked and the rail completes the approach, so the
 * scene always starts its walk from a clean full-screen frame. Once past the
 * lock the visitor is walking, and nothing drags them back.
 */
const SNAP_REACH = 0.5

/**
 * Owns the rail's scroll state. Mounted once by NcRail and injected everywhere
 * else — there is no global store, the rail is the page.
 */
export function provideRail(): RailContext {
  const progress = ref(0)
  const walk = ref(0)
  const velocity = ref(0)
  const isSnapping = ref(false)
  const isHorizontal = ref(false)
  const activeScene = ref<SceneId>(SCENES[0]!.id)
  const { reduced } = useMotionPreference()

  /** Max scrollable distance of the proxy, in pixels. */
  function maxScroll(): number {
    return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
  }

  /** Raw document scroll, 0 → 1. Covers the track *and* the walk. */
  function readScroll(): number {
    return clamp(window.scrollY / maxScroll())
  }

  if (import.meta.client) {
    let raf = 0
    let smoothed = 0
    let previous = 0
    let cssDriven = false

    const write = (value: number) => {
      const split = splitScroll(value, TOTAL_SPAN)
      progress.value = split.progress
      walk.value = split.walk
      activeScene.value = activeSceneAt(BOUNDS, split.progress, TOTAL_SPAN)

      const style = document.documentElement.style
      style.setProperty('--rail-progress', split.progress.toFixed(5))
      style.setProperty('--rail-velocity', velocity.value.toFixed(4))
      // Path A animates every affected transform straight off the scroll
      // timeline and ignores this; path B has no timeline and reads it.
      if (!cssDriven) style.setProperty('--walk', split.walk.toFixed(5))
    }

    /**
     * Path B (SPEC §3.2): rAF loop with damping, for engines without
     * scroll-driven animations. Reads scroll once per frame and writes a single
     * custom property — no layout reads inside the loop.
     */
    const tick = () => {
      const target = readScroll()
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

    /** Path A: the browser drives the transforms; we only mirror state for JS. */
    const syncOnly = () => {
      const target = readScroll()
      velocity.value = target - previous
      previous = target
      write(target)
    }

    // ── Snapping the contact scene into place ────────────────────────────
    // The track parks at LOCK; the walk runs from there. Coming to rest just
    // short of that point leaves the scene a sliver off screen and the walk
    // about to start from a frame that is already wrong, so the rail closes
    // the gap itself once the visitor stops.
    let settle = 0

    const snapToLock = () => {
      if (!isHorizontal.value || isSnapping.value) return

      const max = maxScroll()
      const lock = LOCK * max
      const gap = lock - window.scrollY
      // Forward only, and only from within reach: never yank a walk backwards.
      if (gap <= 0 || gap > SNAP_REACH * window.innerHeight) return

      isSnapping.value = true
      window.scrollTo({ top: lock, behavior: reduced.value ? 'auto' : 'smooth' })
      window.setTimeout(() => {
        isSnapping.value = false
      }, reduced.value ? 50 : 520)
    }

    /**
     * `scrollend` is the right signal and is now broadly supported; the timer
     * is the fallback for engines that lack it. Both are debounced, so having
     * both costs one redundant check rather than two snaps.
     */
    const onScrollSettled = () => {
      window.clearTimeout(settle)
      settle = window.setTimeout(snapToLock, 140)
    }

    onMounted(() => {
      const media = window.matchMedia(RAIL_QUERY)
      cssDriven = CSS.supports('animation-timeline: scroll()')
      document.documentElement.dataset.railDriver = cssDriven ? 'css' : 'raf'

      const syncLayout = () => {
        isHorizontal.value = media.matches
      }
      syncLayout()
      useEventListener(media, 'change', syncLayout)

      previous = readScroll()
      smoothed = previous
      write(previous)

      if (cssDriven) {
        useEventListener(window, 'scroll', syncOnly, { passive: true })
      }
      else {
        raf = requestAnimationFrame(tick)
      }

      useEventListener(window, 'scroll', onScrollSettled, { passive: true })
      if ('onscrollend' in window) useEventListener(window, 'scrollend', snapToLock)

      useEventListener(window, 'resize', () => write(readScroll()), { passive: true })
    })

    onBeforeUnmount(() => {
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
    })
  }

  function goTo(id: SceneId, options: { instant?: boolean } = {}) {
    if (!import.meta.client) return

    // Scene targets are expressed against the track; the scrollbar also carries
    // the walk, so scale into it. A nav click on `contact` therefore lands on
    // the lock point — the scene full screen, the Knight about to set off.
    const target = progressForScene(BOUNDS, id, TOTAL_SPAN) * LOCK
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
    walk: readonly(walk),
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

export {
  BOUNDS as RAIL_BOUNDS,
  LOCK as RAIL_LOCK,
  SCROLL_SPAN as RAIL_SCROLL_SPAN,
  TRAVEL as RAIL_TRAVEL,
}

declare global {
  interface Window {
    /** Initial URL fragment, captured in <head> before Nuxt boots. */
    __ncHash?: string
  }
}
