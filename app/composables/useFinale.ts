import type { InjectionKey, Ref } from 'vue'
import {
  FINALE_SEGMENTS,
  FINALE_SEGMENTS_NARROW,
  finaleMarks,
  finaleProgress,
  scrollForFinale,
  splitFinale,
  type FinaleMarks,
} from '~/utils/finale-geometry'

/**
 * The finale's scroll state, owned by NcFinale and injected by the scene and
 * the contact panel inside it.
 *
 * On engines with scroll-driven animations (path A) every transform in the
 * scene runs off the section's own `view-timeline` and never touches JS. This
 * composable is for what CSS cannot decide — whether the Knight has reached
 * the bench, whether the form may take focus — and for path B, where it
 * publishes `--run`, `--open` and `--walk` on the section itself (never on
 * `<html>`: a custom property written at the root restyles the whole page).
 *
 * The rail version ran its own requestAnimationFrame loop for path B. This one
 * does not run a loop at all: scroll events already arrive once per frame, and
 * the geometry it needs is cached by a ResizeObserver, so nothing in the
 * handler reads layout.
 */
export interface FinaleContext {
  /** 0 → 1 through the pinned range. */
  progress: Readonly<Ref<number>>
  /** 0 → 1 through the walk segment. */
  walk: Readonly<Ref<number>>
  /** The Knight is on the bench: the form may be shown and focused. */
  arrived: Readonly<Ref<boolean>>
  /** The stage runs the walk (wide screens, motion allowed). */
  walking: Readonly<Ref<boolean>>
  /** Signed scroll delta of the last event, for path B's stride. */
  velocity: Readonly<Ref<number>>
  /** Segment boundaries for the current layout. */
  marks: Readonly<Ref<FinaleMarks>>
  /** Document scroll position at which the form is fully there. */
  formScrollTop: () => number
}

const KEY: InjectionKey<FinaleContext> = Symbol('nc-finale')

/**
 * The mounted finale, for callers outside its subtree — the header's
 * "Contact" link lands on the form, not on the top of the stage, and it can
 * only know where that is by asking.
 */
let mounted: FinaleContext | null = null

export function currentFinale(): FinaleContext | null {
  return mounted
}

/** Matches `--stage-wide` in media.css: the layout that walks. */
export const STAGE_WIDE_QUERY = '(min-width: 1024px) and (min-height: 600px)'

/** How close to the stage a resting scroll must be to be carried onto it. */
const SNAP_REACH = 0.5

const WIDE_MARKS = finaleMarks(FINALE_SEGMENTS)
const NARROW_MARKS = finaleMarks(FINALE_SEGMENTS_NARROW)

/**
 * `track` is the tall box whose height is the finale's scroll budget, and
 * which carries the `view-timeline`. Not the section: below `--stage-wide`
 * the section also holds the form, after the track.
 */
export function provideFinale(section: Ref<HTMLElement | undefined>): FinaleContext {
  const progress = ref(0)
  const walk = ref(0)
  const velocity = ref(0)
  const walking = ref(false)
  const { reduced } = useMotionPreference()

  // Cached geometry, in document pixels.
  let top = 0
  let height = 0
  let viewport = 0
  let previous = 0
  let cssDriven = true

  const arrived = computed(() => !walking.value || walk.value >= 0.985)
  const marks = computed(() => (walking.value ? WIDE_MARKS : NARROW_MARKS))

  function measure() {
    const el = section.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    top = rect.top + window.scrollY
    height = rect.height
    viewport = window.innerHeight
  }

  function update() {
    const y = window.scrollY
    velocity.value = y - previous
    previous = y

    progress.value = finaleProgress(y, top, height, viewport)
    const split = splitFinale(progress.value, marks.value)
    walk.value = split.walk

    if (!cssDriven && section.value) {
      const style = section.value.style
      style.setProperty('--run', split.run.toFixed(4))
      style.setProperty('--open', split.open.toFixed(4))
      style.setProperty('--walk', split.walk.toFixed(4))
    }
  }

  function formScrollTop(): number {
    measure()
    return scrollForFinale(walking.value ? marks.value.walkTo : 1, top, height, viewport)
  }

  if (import.meta.client) {
    let near = false
    let settle = 0
    let snapping = false

    /**
     * Carries a scroll that comes to rest just short of the stage onto it, so
     * the sequence always starts from a clean, full-screen frame. Forward
     * only: a visitor already inside the finale is never pulled back.
     */
    const snapToStage = () => {
      if (!near || snapping || reduced.value) return
      const gap = top - window.scrollY
      if (gap <= 0 || gap > SNAP_REACH * viewport) return
      snapping = true
      window.scrollTo({ top, behavior: 'smooth' })
      window.setTimeout(() => {
        snapping = false
      }, 600)
    }

    const onScroll = () => {
      if (!near) return
      update()
      window.clearTimeout(settle)
      settle = window.setTimeout(snapToStage, 140)
    }

    onMounted(() => {
      const el = section.value
      if (!el) return

      cssDriven = CSS.supports('animation-timeline: view()')
      el.dataset.driver = cssDriven ? 'css' : 'js'

      const media = window.matchMedia(STAGE_WIDE_QUERY)
      const syncLayout = () => {
        walking.value = media.matches && !reduced.value
        measure()
        update()
      }
      syncLayout()
      useEventListener(media, 'change', syncLayout)
      watch(reduced, syncLayout)

      // Only listen while the finale is within a screen of the viewport.
      const observer = new IntersectionObserver(([entry]) => {
        near = entry?.isIntersecting ?? false
        if (near) {
          measure()
          update()
        }
      }, { rootMargin: '100% 0px 100% 0px' })
      observer.observe(el)

      // The document above the finale changes height with the language, the
      // width, fonts arriving: re-measure whenever the page's box changes.
      const resize = new ResizeObserver(() => {
        measure()
        update()
      })
      resize.observe(document.body)

      useEventListener(window, 'scroll', onScroll, { passive: true })
      if ('onscrollend' in window) useEventListener(window, 'scrollend', snapToStage)

      mounted = context

      onBeforeUnmount(() => {
        observer.disconnect()
        resize.disconnect()
        window.clearTimeout(settle)
        if (mounted === context) mounted = null
      })
    })
  }

  const context: FinaleContext = {
    progress: readonly(progress),
    walk: readonly(walk),
    arrived,
    walking: readonly(walking),
    velocity: readonly(velocity),
    marks,
    formScrollTop,
  }
  provide(KEY, context)
  return context
}

/** Reads the finale context. Throws rather than silently no-op outside NcFinale. */
export function useFinale(): FinaleContext {
  const context = inject(KEY, null)
  if (!context) throw new Error('useFinale() must be called inside <NcFinale>')
  return context
}
