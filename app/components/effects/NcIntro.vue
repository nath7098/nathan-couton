<script setup lang="ts">
/**
 * The opening — the page compiling itself, once.
 *
 * v1 typed the header's logo for two seconds and a quarter: the same
 * `<Nathan Couton />` the visitor would see a moment later, for nothing. This
 * is the first half of the page's bookend instead: `npm run build` here, and
 * `npm run contact` at the bottom, where the build finally runs.
 *
 * Rules kept from v1: once per session, skipped by any input, never blocking.
 * The page is painted underneath from the first frame; this is only a veil,
 * and it is gone in 1.1 seconds.
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
  }, 650)
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

  const timer = window.setTimeout(dismiss, 1100)

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
      <div
        class="intro__log"
        aria-hidden="true"
      >
        <p class="intro__line intro__line--cmd">
          <span class="intro__dollar">$</span> npm run build
        </p>
        <p class="intro__line intro__line--1">
          {{ t('intro.compiling') }}
        </p>
        <p class="intro__line intro__line--2">
          ✓ {{ t('intro.done') }}
        </p>
        <span class="intro__bar" />
      </div>
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
  background: var(--bg);
}

.intro__log {
  display: grid;
  gap: var(--space-3xs);
  min-inline-size: min(22rem, 80vw);
  font-family: var(--font-mono);
  font-size: clamp(0.95rem, 0.8rem + 0.5vw, 1.25rem);
  color: var(--text-dim);
}

.intro__line {
  opacity: 0;
  animation: intro-in 180ms var(--ease-out-expo) forwards;
}

.intro__line--cmd {
  color: var(--text);
}

.intro__line--1 { animation-delay: 250ms; }

.intro__line--2 {
  color: var(--brand-ink);
  animation-delay: 700ms;
}

.intro__dollar {
  color: var(--warm-ink);
}

.intro__bar {
  display: block;
  block-size: 2px;
  margin-block-start: var(--space-2xs);
  background: var(--brand);
  transform-origin: left;
  scale: 0 1;
  animation: intro-bar 650ms var(--ease-out-expo) 150ms forwards;
}

@keyframes intro-in {
  from { opacity: 0; translate: 0 0.4rem; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes intro-bar {
  to { scale: 1 1; }
}

.intro__skip {
  padding: var(--space-3xs) var(--space-2xs);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
}

/* The veil lifts off the page, upwards. */
.nc-intro-leave-active {
  transition: clip-path 650ms var(--ease-in-out-quint);
}

.nc-intro-leave-to {
  clip-path: inset(0 0 100% 0);
}
</style>
