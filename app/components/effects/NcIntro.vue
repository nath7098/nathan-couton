<script setup lang="ts">
/**
 * Opening sequence — v1's typewriter logo, kept (SPEC §6.1).
 *
 * Three rules it did not have: it plays once per session, it can be skipped by
 * any input, and it never blocks. The page content is in the DOM and painted
 * underneath from the first frame; this is only a veil on top, so it costs
 * nothing in LCP terms.
 */
const { t } = useI18n()
const { reduced } = useMotionPreference()

const showing = ref(false)
const leaving = ref(false)

const KEY = 'nc-intro-played'

function dismiss() {
  if (leaving.value || !showing.value) return
  leaving.value = true
  window.setTimeout(() => {
    showing.value = false
  }, 700)
}

onMounted(() => {
  let played = false
  try {
    played = sessionStorage.getItem(KEY) === '1'
  }
  catch {
    // Private mode or blocked storage: play it, it is only a veil.
  }

  if (played || reduced.value) return

  showing.value = true
  try {
    sessionStorage.setItem(KEY, '1')
  }
  catch { /* ignore */ }

  // Total length is capped: 1.75s typing plus a beat, then it lifts.
  const timer = window.setTimeout(dismiss, 2200)

  useEventListener(window, 'keydown', dismiss)
  useEventListener(window, 'pointerdown', dismiss)
  useEventListener(window, 'wheel', dismiss, { passive: true })

  onBeforeUnmount(() => clearTimeout(timer))
})
</script>

<template>
  <Transition name="nc-intro">
    <div
      v-if="showing"
      class="intro"
      :class="{ 'is-leaving': leaving }"
    >
      <p class="intro__logo">
        &lt;Nathan Couton /&gt;
      </p>
      <button
        type="button"
        class="intro__skip"
        @click="dismiss"
      >
        {{ t('intro.skip') }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-content: center;
  gap: var(--space-l);
  justify-items: center;
  background: var(--background);
}

.intro__logo {
  max-inline-size: 100%;
  overflow: hidden;
  font-size: clamp(1.5rem, 5vw, 3.5rem);
  font-weight: 700;
  color: var(--secondary-text);
  white-space: nowrap;
  border-inline-end: 3px solid var(--primary);
  /* steps() on a ch-based width is the typewriter; the caret blinks alongside. */
  inline-size: 0;
  animation:
    nc-type 1.75s steps(19, end) 0.15s forwards,
    nc-caret 0.6s step-end 4;
}

@keyframes nc-type {
  to { inline-size: 19ch; }
}

@keyframes nc-caret {
  0%, 100% { border-inline-end-color: var(--primary); }
  50% { border-inline-end-color: transparent; }
}

.intro__skip {
  padding: var(--space-3xs) var(--space-2xs);
  font-size: var(--step--1);
  color: var(--surface-dim);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-s);
  opacity: 0;
  animation: nc-fade-in 300ms ease 1.2s forwards;
}

@keyframes nc-fade-in {
  to { opacity: 1; }
}

/* The veil retracts towards the corner, as v1's did. */
.nc-intro-leave-active {
  transition: clip-path 700ms var(--ease-in-out-quint), opacity 700ms var(--ease-out-expo);
}

.nc-intro-leave-to {
  clip-path: circle(0% at 0% 0%);
  opacity: 0;
}
</style>
