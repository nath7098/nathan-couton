/**
 * One requestAnimationFrame for the whole site (SPEC §5.1.2).
 *
 * Every effect subscribes here instead of starting its own loop: a single rAF
 * means one scheduling point, one place to pause, and no chance of a forgotten
 * loop running behind a hidden tab. The loop stops entirely when nothing is
 * subscribed or the tab is hidden.
 */
type FrameCallback = (delta: number, now: number) => void

const subscribers = new Set<FrameCallback>()
let handle = 0
let last = 0
let running = false

function tick(now: number) {
  // Clamped so a backgrounded tab returning does not deliver a huge delta.
  const delta = Math.min(now - last, 50)
  last = now
  for (const callback of subscribers) callback(delta, now)
  handle = requestAnimationFrame(tick)
}

function start() {
  if (running || subscribers.size === 0) return
  running = true
  last = performance.now()
  handle = requestAnimationFrame(tick)
}

function stop() {
  if (!running) return
  running = false
  cancelAnimationFrame(handle)
}

/**
 * Runs `callback` on every frame while the component is mounted.
 * `active` can pause an individual subscriber without leaving the loop.
 */
export function useFrameLoop(callback: FrameCallback, active?: Ref<boolean>) {
  if (import.meta.server) return

  const wrapped: FrameCallback = (delta, now) => {
    if (active && !active.value) return
    callback(delta, now)
  }

  onMounted(() => {
    subscribers.add(wrapped)
    start()

    useEventListener(document, 'visibilitychange', () => {
      if (document.hidden) stop()
      else start()
    })
  })

  onBeforeUnmount(() => {
    subscribers.delete(wrapped)
    if (subscribers.size === 0) stop()
  })
}

/** Exposed for tests; not part of the component API. */
export const _frameLoopInternals = {
  size: () => subscribers.size,
  isRunning: () => running,
}
