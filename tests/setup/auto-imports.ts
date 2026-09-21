/**
 * Nuxt auto-imports Vue's API; Vitest does not. Components under test are
 * written the Nuxt way, so the same names are put on globalThis here rather
 * than adding imports to production code purely to satisfy the test runner.
 */
import * as vue from 'vue'

const EXPOSED = [
  'computed', 'ref', 'reactive', 'readonly', 'shallowRef', 'toRef', 'toRefs',
  'watch', 'watchEffect', 'onMounted', 'onBeforeUnmount', 'onUnmounted',
  'nextTick', 'provide', 'inject', 'useId', 'defineAsyncComponent', 'markRaw',
] as const

for (const name of EXPOSED) {
  const value = (vue as Record<string, unknown>)[name]
  if (value) Object.assign(globalThis, { [name]: value })
}
