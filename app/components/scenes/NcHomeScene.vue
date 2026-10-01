<script setup lang="ts">
import { NOW, YEARS_OF_EXPERIENCE } from '~/data/now'

/**
 * The hero — who, what, and the two things a recruiter came for, in the first
 * screen.
 *
 * v1 said "Hello! Je m'appelle Nathan Couton, Développeur Fullstack" and
 * offered "En savoir plus". It named the job and nothing else: no stack, no
 * domain, no years, no CV. The right third of the screen was empty.
 *
 * Now: a value statement under the name, the CV and the Parcours as the two
 * calls to action, and on the right the same facts as code — `whoami.ts` —
 * which is the page's first line of code and the first thing it will compile.
 */
const { t, tm, rt } = useI18n()
const resume = useResume()
const { goTo } = useSections()

const years = YEARS_OF_EXPERIENCE

/** The card's lines, in the visitor's language. Values may be lists. */
const card = computed(() => (tm('hero.card') as Array<{ key: unknown, value: unknown, comment?: unknown }>)
  .map(line => ({
    key: rt(line.key as never),
    value: Array.isArray(line.value)
      ? (line.value as unknown[]).map(item => rt(item as never))
      : rt(line.value as never, { years }),
    comment: line.comment ? rt(line.comment as never, { client: NOW.client }) : undefined,
  })))

const cta = ref()
useMagnetic(cta)

function toParcours(event: MouseEvent) {
  event.preventDefault()
  goTo('parcours')
}
</script>

<template>
  <div class="hero">
    <div class="hero__text">
      <p class="hero__overline">
        <span aria-hidden="true">// </span>{{ t('hero.overline', { city: NOW.city }) }}
      </p>

      <h1
        id="home-title"
        class="hero__name nc-braces"
      >
        Nathan Couton
      </h1>

      <p class="hero__statement">
        {{ t('hero.statement', { years }) }}
      </p>

      <div class="hero__actions">
        <NcButton
          ref="cta"
          variant="primary"
          size="lg"
          icon="download"
          :href="resume.href"
          :download="resume.name"
        >
          {{ t('hero.ctaResume') }}
        </NcButton>
        <NcButton
          variant="ghost"
          size="lg"
          icon-end="chevron-down"
          href="#parcours"
          @click="toParcours"
        >
          {{ t('hero.ctaParcours') }}
        </NcButton>
      </div>
    </div>

    <figure
      class="hero__card"
      :aria-label="t('hero.cardLabel')"
    >
      <div
        class="hero__tabs"
        aria-hidden="true"
      >
        <span class="hero__dots"><i /><i /><i /></span>
        <span class="hero__tab">whoami.ts</span>
      </div>
      <pre class="hero__code"><code><span class="c-line"><span class="c-kw">export const</span> <span class="c-id">nathan</span> = {</span><span
        v-for="(line, index) in card"
        :key="line.key"
        class="c-line c-line--item"
        :style="{ '--i': index }"
      >  <span class="c-key">{{ line.key }}</span>: <template v-if="Array.isArray(line.value)">[<template
        v-for="(item, i) in line.value"
        :key="item"
      ><span class="c-str">'{{ item }}'</span><template v-if="i < line.value.length - 1">, </template></template>]</template><span
        v-else
        class="c-str"
      >'{{ line.value }}'</span>,<span
        v-if="line.comment"
        class="c-comment"
      > // {{ line.comment }}</span></span><span class="c-line">} <span class="c-kw">as const</span><span
        class="c-caret"
        aria-hidden="true"
      /></span></code></pre>
    </figure>

    <a
      class="hero__cue"
      href="#about"
      @click.prevent="goTo('about')"
    >
      <span>{{ t('hero.scroll') }}</span>
      <span
        class="hero__cue-line"
        aria-hidden="true"
      />
    </a>
  </div>
</template>

<style scoped>
.hero {
  --code: 1;

  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: clamp(2rem, 4vw, 4.5rem);
  align-items: center;
  max-inline-size: var(--content);
  min-block-size: 100svh;
  margin-inline: auto;
  padding: calc(var(--header-h) + var(--space-l)) var(--gutter) calc(var(--space-2xl) + var(--space-s));
  box-sizing: content-box;
}

.hero__text {
  display: grid;
  gap: var(--space-m);
  justify-items: start;
}

.hero__overline {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-dim);
}

.hero__overline span {
  color: var(--brand-ink);
}

.hero__name {
  font-size: clamp(3.2rem, 1.9rem + 5.2vw, 7.2rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--text);
  text-wrap: balance;
}

.hero__statement {
  max-inline-size: 40ch;
  font-size: clamp(1.1rem, 1.02rem + 0.35vw, 1.3rem);
  line-height: 1.45;
  color: var(--text-dim);
  text-wrap: pretty;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
  margin-block-start: var(--space-2xs);
}

/* ── whoami.ts ─────────────────────────────────────────────────────────── */
.hero__card {
  margin: 0;
  overflow: hidden;
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-3);
}

.hero__tabs {
  display: flex;
  gap: var(--space-s);
  align-items: center;
  padding: var(--space-2xs) var(--space-s);
  background: var(--bg-sunken);
  border-block-end: 1px solid var(--line);
}

.hero__dots {
  display: flex;
  gap: 6px;
}

.hero__dots i {
  inline-size: 10px;
  block-size: 10px;
  background: var(--line);
  border-radius: 50%;
}

.hero__tab {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
}

.hero__code {
  margin: 0;
  padding: var(--space-m) var(--space-m) var(--space-l);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: clamp(0.8rem, 0.62rem + 0.36vw, 0.92rem);
  line-height: 1.85;
  color: var(--text);
  counter-reset: line;
}

.c-line {
  display: block;
  /* Wraps rather than scrolls on a narrow card; a wrapped line is indented
     past the gutter, as an editor with soft wrap would. */
  padding-inline-start: 3.5ch;
  text-indent: -3.5ch;
  white-space: pre-wrap;
}

/* Line numbers, as an editor would draw them. */
.c-line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  inline-size: 2ch;
  margin-inline-end: 1.5ch;
  color: var(--text-faint);
  text-align: end;
  opacity: 0.7;
}

.c-kw { color: var(--warm-ink); }
.c-id { color: var(--text); font-weight: 700; }
.c-key { color: var(--text-dim); }
.c-str { color: var(--brand-ink); }
.c-comment { color: var(--text-faint); font-style: italic; }

.c-caret {
  display: inline-block;
  inline-size: 0.6ch;
  block-size: 1.1em;
  margin-inline-start: 0.4ch;
  vertical-align: -0.2em;
  background: var(--brand);
  animation: caret 1.1s steps(1) infinite;
}

@keyframes caret {
  50% { opacity: 0; }
}

/* The object assembles itself line by line on load. Opacity and a nudge only,
   and the text is in the HTML from the first byte: this is decoration on top
   of content that is already there. */
@media (prefers-reduced-motion: no-preference) {
  .c-line--item {
    animation: line-in 450ms var(--ease-out-expo) both;
    animation-delay: calc(80ms + var(--i) * 55ms);
  }
}

@keyframes line-in {
  from {
    opacity: 0;
    translate: -0.75rem 0;
  }
}

:root[data-motion='reduced'] .c-line--item,
:root[data-motion='reduced'] .c-caret {
  animation: none;
}

/* ── Scroll cue ────────────────────────────────────────────────────────── */
.hero__cue {
  position: absolute;
  inset-block-end: var(--space-l);
  inset-inline-start: 50%;
  display: grid;
  gap: var(--space-2xs);
  justify-items: center;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
  text-decoration: none;
  translate: -50% 0;
}

.hero__cue-line {
  position: relative;
  inline-size: 1px;
  block-size: 2.5rem;
  overflow: hidden;
  background: var(--line);
}

.hero__cue-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--brand);
  animation: cue 2.2s var(--ease-in-out-quint) infinite;
}

@keyframes cue {
  0% { translate: 0 -100%; }
  60%, 100% { translate: 0 100%; }
}

:root[data-motion='reduced'] .hero__cue-line::after {
  animation: none;
  translate: 0 0;
}

@media (width < 960px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    align-content: center;
    padding-block-end: var(--space-3xl);
  }

  .hero__card {
    max-inline-size: 34rem;
  }
}

@media (width < 480px) {
  .hero__code {
    padding-inline: var(--space-s);
  }
}
</style>
