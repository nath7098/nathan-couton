import type { RouterConfig } from '@nuxt/schema'

/**
 * The rail owns the scroll position.
 *
 * Nuxt's default scrollBehavior resets to the top (or jumps to a hash element)
 * after navigation, which fights NcRail's hash restore and, in the horizontal
 * layout, would try to scroll an element inside a `overflow: clip` sticky box.
 * Returning false leaves the position alone; NcRail places it.
 */
export default <RouterConfig>{
  scrollBehavior: () => false,
}
