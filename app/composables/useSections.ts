import { SECTIONS, isSectionId, type SectionId } from '~/data/sections'
import { currentFinale } from '~/composables/useFinale'

/**
 * Which section is on screen, and how to get to one.
 *
 * The page is an ordinary document now, so most of what the rail had to do by
 * hand the browser does natively — keyboard scrolling, focus bringing content
 * into view, Ctrl+F. What is left is state the header needs (the active link,
 * whether it sits over the finale's artwork) and deep links.
 *
 * `provideSections()` runs once, in the page; `useSections()` reads the same
 * state from anywhere — the header, the atmosphere, the scenes.
 */
export function useSections() {
  const active = useState<SectionId>('nc-section-active', () => 'home')
  const { reduced } = useMotionPreference()

  /**
   * Scrolls to a section. The contact section lands on the form — the stage
   * pinned, the Knight seated — rather than on the top of the finale, where
   * the sequence has not started yet: someone who clicks "Contact" wants the
   * form, and a smooth scroll there still plays the sequence on the way.
   */
  function goTo(id: SectionId, options: { instant?: boolean } = {}) {
    if (!import.meta.client) return
    const el = document.getElementById(id)
    if (!el) return
    const behavior: ScrollBehavior = options.instant || reduced.value ? 'instant' : 'smooth'

    if (id === 'contact') {
      const finale = currentFinale()
      if (finale) {
        window.scrollTo({ top: finale.formScrollTop(), behavior })
        return
      }
    }

    if (id === 'home') {
      window.scrollTo({ top: 0, behavior })
      return
    }
    // Computed rather than `scrollIntoView()`: on mobile browsers that method
    // folds the toolbar's height into its target and lands the section fifty
    // pixels low. The section's own `scroll-margin-top` still decides the gap.
    const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margin, behavior })
  }

  return { active: readonly(active), goTo }
}

export function provideSections() {
  const active = useState<SectionId>('nc-section-active', () => 'home')
  const { goTo } = useSections()

  if (!import.meta.client) return

  let hashTimer = 0

  // The hash mirrors the active section so a position can be shared. Only
  // `replaceState`: a router navigation would reset the scroll it describes.
  watch(active, (id) => {
    window.clearTimeout(hashTimer)
    hashTimer = window.setTimeout(() => {
      const next = id === 'home' ? window.location.pathname : `#${id}`
      const current = window.location.hash || window.location.pathname
      if (current !== next) window.history.replaceState(window.history.state, '', next)
    }, 200)
  })

  onMounted(async () => {
    // A section is active while it crosses a line 40% down the viewport: late
    // enough that a section is really on screen, early enough that the label
    // does not lag behind what is being read.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).id
        if (entry.isIntersecting && isSectionId(id)) active.value = id
      }
    }, { rootMargin: '-40% 0px -59% 0px' })

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    onBeforeUnmount(() => {
      observer.disconnect()
      window.clearTimeout(hashTimer)
    })

    // Deep link. The fragment is captured in <head> before Nuxt boots (the
    // router normalises it away before any setup runs), already translated
    // from the old anchors. Fonts first: the display face changes line
    // heights, and a target measured before it arrives is off by a screen.
    const hash = window.__ncHash
    if (hash && isSectionId(hash) && hash !== 'home') {
      await document.fonts?.ready
      requestAnimationFrame(() => goTo(hash, { instant: true }))
    }
  })
}

declare global {
  interface Window {
    /** Initial URL fragment, captured in <head> before Nuxt boots. */
    __ncHash?: string
  }
}
