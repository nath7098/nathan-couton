<script setup lang="ts">
/** Scene 01 — the hero. Same words as v1, same code-flavoured CTA. */
const { t } = useI18n()
const rail = useRail()
</script>

<template>
  <div class="home">
    <p class="home__greeting">
      {{ t('home.greetings') }}
    </p>

    <NcHeading
      :level="1"
      class="home__name"
    >
      Nathan Couton
    </NcHeading>

    <p class="home__position">
      {{ t('home.position') }}
    </p>

    <NcButton
      variant="code"
      class="home__cta"
      @click="rail.goTo('about')"
    >
      {{ t('home.button') }}
    </NcButton>

    <p
      class="home__hint"
      aria-hidden="true"
    >
      {{ t('rail.hint') }}
      <NcIcon name="arrow-right" />
    </p>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  align-content: center;
  gap: var(--space-s);
  justify-items: start;
  /* Wide enough for "{{ Nathan Couton }}" on one line at the top of the type
     scale — 46rem broke it in two and split the braces across lines. */
  max-inline-size: 72rem;
}

.home__greeting {
  color: var(--surface-dim);
  font-size: var(--step-1);
}

.home__name {
  margin-block: 0;
  text-wrap: nowrap;
}

.home__position {
  font-size: var(--step-2);
  color: var(--surface);
}

.home__cta {
  margin-block-start: var(--space-s);
}

/* Fades out as soon as the rail starts moving — it has done its job. */
.home__hint {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  margin-block-start: var(--space-l);
  color: var(--surface-dim);
  font-size: var(--step--1);
  text-transform: lowercase;
  letter-spacing: 0.1em;
  opacity: calc(1 - 12 * var(--rail-progress, 0));
  transition: opacity var(--dur-base) var(--ease-out-expo);
}

.home__hint svg {
  animation: nc-nudge 1.6s var(--ease-in-out-quint) infinite;
}

@media not all and (--rail) {
  /* The name is held on one line so the braces never split across two. There is
     no width for that on a phone: at the top of the type scale it wants 578px
     inside a 343px column, and ran off the side of the screen. Wrapping puts
     the opening brace with "Nathan" and the closing one with "Couton", which is
     the split the nowrap was there to prevent — between the two, a hero that
     fits wins. */
  .home__name {
    text-wrap: balance;
  }

  /* "défilez →" points sideways because the rail moves sideways. Stacked, the
     page scrolls down like any other, and the hint is both wrong and
     unnecessary. */
  .home__hint {
    display: none;
  }
}

@keyframes nc-nudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(0.35em); }
}

:root[data-motion='reduced'] .home__hint svg {
  animation: none;
}
</style>
