<script setup lang="ts">
/**
 * `$ npm run contact` — the threshold between the document and the world.
 *
 * The page arrives here the colour of the page, so the finale's first frame is
 * still "the file": a prompt, a command typing itself, a few lines of build
 * log. Then the screen splits into shutters that slide apart, and behind them
 * Greenpath is already in place. Compile, then run.
 *
 * All of it is driven by the finale's own `view-timeline`, over the `run` and
 * `open` segments (see `finale-geometry.ts`): transforms, opacity and one
 * clip-path on a line of text, nothing on the main thread. Path B reads
 * `--run` and `--open`, written on the section by `useFinale()`.
 */
const { t, tm, rt } = useI18n()

const logs = computed(() => (tm('finale.logs') as unknown[]).map(line => rt(line as never)))

/** Six shutters: three slide left, three right, the middle ones first. */
const SHUTTERS = 6
</script>

<template>
  <div
    class="term"
    aria-hidden="true"
  >
    <div class="term__shutters">
      <span
        v-for="i in SHUTTERS"
        :key="i"
        class="term__shutter"
        :style="{
          '--i': i - 1,
          '--side': i <= SHUTTERS / 2 ? -1 : 1,
          '--order': i <= SHUTTERS / 2 ? SHUTTERS / 2 - i : i - SHUTTERS / 2 - 1,
        }"
      />
    </div>

    <div class="term__screen">
      <p class="term__prompt">
        <span class="term__path">~/nathan-couton</span>
        <span class="term__dollar">$</span>
        <span class="term__command">npm run contact</span>
      </p>
      <p
        v-for="(line, index) in logs"
        :key="index"
        class="term__log"
        :style="{ '--n': index }"
      >
        {{ line }}
      </p>
      <p class="term__run">
        {{ t('finale.running') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.term {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.term__shutters {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}

/* A hair wider than its column, so two neighbours never show a seam of the
   scene between them before they move. */
.term__shutter {
  display: block;
  margin-inline: -1px;
  background: var(--bg);
  transform: translate3d(calc(var(--side) * var(--open-now, 0) * (100% + 50vw)), 0, 0);
}

.term__screen {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--space-2xs);
  padding-inline: max(var(--gutter), calc((100% - var(--content)) / 2 + var(--gutter)));
  font-family: var(--font-mono);
  font-size: clamp(0.9rem, 0.75rem + 0.6vw, 1.35rem);
  color: var(--text-dim);
  opacity: calc(1 - var(--open-now, 0) * 4);
}

.term__prompt {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6ch;
  font-size: 1.35em;
  color: var(--text);
}

.term__path {
  color: var(--brand-ink);
}

.term__dollar {
  color: var(--warm-ink);
}

.term__command {
  clip-path: inset(0 calc((1 - var(--type-now, 1)) * 100%) 0 0);
}

.term__log {
  opacity: var(--log-now, 1);
}

.term__run {
  margin-block-start: var(--space-s);
  color: var(--brand-ink);
}

/* ── Path A: the finale's timeline drives every value ────────────────────── */
@supports (animation-timeline: view()) {
  .term__command {
    clip-path: inset(0 100% 0 0);
    animation: term-type steps(15, end) both;
    animation-timeline: --finale;
    animation-range: contain 0% contain calc(var(--open-from) * 45%);
  }

  .term__log {
    opacity: 0;
    animation: term-show linear both;
    animation-timeline: --finale;
    animation-range:
      contain calc(var(--open-from) * (48% + var(--n) * 10%))
      contain calc(var(--open-from) * (52% + var(--n) * 10%));
  }

  .term__run {
    opacity: 0;
    animation: term-show linear both;
    animation-timeline: --finale;
    animation-range: contain calc(var(--open-from) * 90%) contain calc(var(--open-from) * 96%);
  }

  .term__screen {
    opacity: 1;
    animation: term-hide linear both;
    animation-timeline: --finale;
    animation-range: contain calc(var(--open-from) * 100%) contain calc((var(--open-from) + (var(--walk-from) - var(--open-from)) * 0.25) * 100%);
  }

  /* Middle shutters first, outer ones a beat later. */
  .term__shutter {
    transform: none;
    animation: term-open linear both;
    animation-timeline: --finale;
    animation-range:
      contain calc((var(--open-from) + (var(--walk-from) - var(--open-from)) * var(--order) * 0.12) * 100%)
      contain calc((var(--open-from) + (var(--walk-from) - var(--open-from)) * (0.64 + var(--order) * 0.12)) * 100%);
  }

  @keyframes term-type {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }

  @keyframes term-show {
    to { opacity: 1; }
  }

  @keyframes term-hide {
    to { opacity: 0; }
  }

  @keyframes term-open {
    to { transform: translate3d(calc(var(--side) * (100% + 50vw)), 0, 0); }
  }
}

/* ── Path B: values from the section's own custom properties ─────────────── */
@supports not (animation-timeline: view()) {
  .term {
    --type-now: clamp(0, var(--run) * 2.2, 1);
    --open-now: var(--open);
  }

  .term__log {
    --log-now: clamp(0, (var(--run) - 0.5 - var(--n) * 0.1) * 10, 1);
  }
}

/* Reduced motion: no threshold at all — the finale is its last frame. */
@media (prefers-reduced-motion: reduce) {
  .term {
    display: none;
  }
}

:root[data-motion='reduced'] .term {
  display: none;
}
</style>
