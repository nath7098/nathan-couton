<script setup lang="ts">
/**
 * The opening — the page compiling itself, once.
 *
 * v1 typed the header's logo for two seconds and a quarter: the same
 * `<Nathan Couton />` the visitor would see a moment later, for nothing. This
 * is the first half of the page's bookend instead: `npm run build` here, and
 * `npm run contact` at the bottom, where the build finally runs.
 *
 * Painted with the page, decided before it. The veil is in the prerendered
 * HTML, hidden unless `<html>` carries `nc-intro` — which a tiny inline script
 * in the head (app.vue, `nc-intro-gate`) sets on the first visit of a session
 * when motion is allowed. Deciding here, after hydration, showed the site
 * first and then dropped the veil over it.
 *
 * The whole sequence is CSS, lift included (1.1s, then 650ms), so it never
 * waits on the app's JavaScript: a slow bundle cannot keep it up. Vue only
 * adds the skip (any key, click or wheel) and removes the element once the
 * lift has finished.
 */
const { t } = useI18n()

/** Rendered on both sides, so hydration matches; CSS decides what is seen. */
const showing = ref(true)
const leaving = ref(false)
const root = ref<HTMLElement>()

function settle() {
  showing.value = false
  document.documentElement.classList.remove('nc-intro')
}

/** Removes the veil when whichever lift is running has finished. */
function afterLift() {
  const lift = root.value?.getAnimations()
    .find(a => a instanceof CSSAnimation && /^intro-(lift|skip)$/.test(a.animationName))
  if (!lift || lift.playState === 'finished') return settle()
  // A skip replaces the lift, which rejects as cancelled: nothing to do then.
  lift.finished.then(settle, () => {})
}

function dismiss() {
  if (leaving.value || !showing.value) return
  leaving.value = true
  nextTick(afterLift)
}

onMounted(() => {
  if (!document.documentElement.classList.contains('nc-intro')) {
    showing.value = false
    return
  }
  afterLift()

  useEventListener(window, 'keydown', dismiss)
  useEventListener(window, 'pointerdown', dismiss)
  useEventListener(window, 'wheel', dismiss, { passive: true })
})
</script>

<template>
  <div
    v-if="showing"
    ref="root"
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
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 9999;
  /* Lifts on its own, upwards, whether or not the app has booted. */
  animation: intro-lift 650ms var(--ease-in-out-quint, cubic-bezier(0.83, 0, 0.17, 1)) 1100ms forwards;
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

/* A skip is a new animation, not a re-timed one: changing the delay of the
   running lift would jump it to wherever the clock already is. */
.intro.is-leaving {
  animation: intro-skip 450ms var(--ease-in-out-quint, cubic-bezier(0.83, 0, 0.17, 1)) forwards;
}

@keyframes intro-lift {
  /* From an explicit inset: `none` → inset() does not interpolate, it flips. */
  from { clip-path: inset(0 0 0 0); }

  to {
    clip-path: inset(0 0 100% 0);
    visibility: hidden;
    pointer-events: none;
  }
}

@keyframes intro-skip {
  /* From an explicit inset: `none` → inset() does not interpolate, it flips. */
  from { clip-path: inset(0 0 0 0); }

  to {
    clip-path: inset(0 0 100% 0);
    visibility: hidden;
    pointer-events: none;
  }
}

.intro__skip {
  padding: var(--space-3xs) var(--space-2xs);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
}
</style>

<style>
/* Unscoped on purpose: the decision is a class on <html>, set before Vue. */
html:not(.nc-intro) .intro {
  display: none;
}
</style>
