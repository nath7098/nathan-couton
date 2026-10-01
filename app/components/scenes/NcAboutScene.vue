<script setup lang="ts">
import { FIGURE_IDS, HOBBY_IDS, SOUNDTRACK, SOUNDTRACK_YEAR, TOP_ARTISTS } from '~/data/about'
import { NOW, YEARS_OF_EXPERIENCE } from '~/data/now'
import { PARALLAX_SIZES } from '~/data/parallax-sizes'

/**
 * The profile — `README.md`: what to know in thirty seconds.
 *
 * It replaces a bento of gadgets (a weather card reading "Tours 37" like a
 * temperature, "Curieux - Esprit d'équipe", a frozen Spotify top shown as if
 * it were live) with what a recruiter reads first: four figures and the facts
 * as a definition list — no bio to wade through, the hero already said it. The personal side is
 * still here — lower, smaller, and honest about its dates — under "off
 * screen". Its last card is the Knight, sitting: the visitor will meet him at
 * the bottom of the page.
 */
const { t } = useI18n()
const { goTo } = useSections()

const figureValue: Record<(typeof FIGURE_IDS)[number], string> = {
  years: String(YEARS_OF_EXPERIENCE),
  esn: '2',
  degree: 'Bac+5',
  english: '930',
}

const knight = PARALLAX_SIZES['knight-sit']!
</script>

<template>
  <div class="profile">
    <figure class="profile__portrait nc-reveal">
      <img
        src="/img/about/profile-pic.jpg"
        :alt="t('about.portraitAlt')"
        width="706"
        height="706"
        loading="lazy"
        decoding="async"
      >
      <figcaption class="profile__caption">
        ~/nathan · {{ NOW.city }}
      </figcaption>
    </figure>

    <div class="profile__main">
      <ul class="profile__figures nc-reveal">
        <li
          v-for="id in FIGURE_IDS"
          :key="id"
          class="profile__figure"
        >
          <span class="profile__figure-value">{{ t(`about.figures.${id}.value`, { value: figureValue[id] }) }}</span>
          <span class="profile__figure-label">{{ t(`about.figures.${id}.label`) }}</span>
        </li>
      </ul>

      <dl class="profile__facts nc-reveal">
        <div>
          <dt>{{ t('about.facts.location') }}</dt>
          <dd>{{ t('about.facts.locationValue', { city: NOW.city }) }}</dd>
        </div>
        <div>
          <dt>{{ t('about.facts.status') }}</dt>
          <dd>{{ t('about.facts.statusValue', { client: NOW.client }) }}</dd>
        </div>
        <div>
          <dt>{{ t('about.facts.employer') }}</dt>
          <dd class="profile__employer">
            <img
              src="/img/about/job.png"
              :alt="t('about.employerAlt')"
              width="294"
              height="294"
              loading="lazy"
            >
            {{ t('about.facts.employerValue', { employer: NOW.employer }) }}
          </dd>
        </div>
        <div>
          <dt>{{ t('about.facts.languages') }}</dt>
          <dd>{{ t('about.facts.languagesValue') }}</dd>
        </div>
        <div>
          <dt>{{ t('about.facts.license') }}</dt>
          <dd>{{ t('about.facts.licenseValue') }}</dd>
        </div>
      </dl>
    </div>

    <section
      class="profile__offscreen"
      :aria-label="t('about.offscreen.title')"
    >
      <p
        class="profile__offscreen-title"
        aria-hidden="true"
      >
        // {{ t('about.offscreen.title') }}
      </p>

      <div class="profile__cards">
        <article class="card card--playlist nc-reveal">
          <h3 class="card__title">
            {{ t('about.offscreen.soundtrack', { year: SOUNDTRACK_YEAR }) }}
          </h3>
          <p class="card__file">
            top-{{ SOUNDTRACK_YEAR }}.m3u
          </p>
          <ol class="playlist">
            <li
              v-for="(track, index) in SOUNDTRACK"
              :key="track.title"
            >
              <a
                :href="track.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="playlist__n">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="playlist__title">{{ track.title }}</span>
                <span class="playlist__artist">{{ track.artist }}</span>
              </a>
            </li>
          </ol>
          <p class="card__note">
            {{ t('about.offscreen.artists', { artists: TOP_ARTISTS.join(', ') }) }}
          </p>
        </article>

        <article class="card card--knight nc-reveal">
          <h3 class="card__title">
            Hollow Knight
          </h3>
          <p class="card__file">
            {{ t('about.offscreen.gamesFile') }}
          </p>
          <img
            class="card__knight"
            src="/img/parallax/knight-sit.webp"
            alt=""
            :width="knight.width"
            :height="knight.height"
            loading="lazy"
          >
          <p class="card__text">
            {{ t('about.offscreen.knight') }}
          </p>
          <a
            class="card__link"
            href="#contact"
            @click.prevent="goTo('contact')"
          >{{ t('about.offscreen.knightLink') }} ↓</a>
          <p class="card__note">
            {{ t('about.offscreen.otherGames') }}
          </p>
        </article>

        <article class="card card--hobbies nc-reveal">
          <h3 class="card__title">
            {{ t('about.offscreen.hobbies') }}
          </h3>
          <p class="card__file">
            hobbies.json
          </p>
          <ul class="hobbies">
            <li
              v-for="id in HOBBY_IDS"
              :key="id"
            >
              <span class="hobbies__name">{{ t(`about.hobbies.${id}.name`) }}</span>
              <span class="hobbies__detail">{{ t(`about.hobbies.${id}.detail`) }}</span>
            </li>
          </ul>
          <div
            class="card__photos"
            aria-hidden="true"
          >
            <img
              src="/img/about/musique.jpg"
              alt=""
              width="750"
              height="745"
              loading="lazy"
            >
            <img
              src="/img/about/australie.jpg"
              alt=""
              width="650"
              height="350"
              loading="lazy"
            >
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.5fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}

/* ── Portrait ──────────────────────────────────────────────────────────── */
.profile__portrait {
  position: relative;
  margin: 0;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  background: var(--bg-raised);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-2);
}

.profile__portrait img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: 62% 40%;
  filter: grayscale(1) contrast(1.05);
}

/* A wash of the brand over the black and white: the one photograph on the
   page belongs to its palette. On a small element, so the blend is cheap. */
.profile__portrait::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, color-mix(in oklab, var(--gp-indigo) 70%, transparent), transparent 55%),
    color-mix(in oklab, var(--brand) 22%, transparent);
  mix-blend-mode: multiply;
}

.profile__caption {
  position: absolute;
  z-index: 1;
  inset-inline-start: var(--space-s);
  inset-block-end: var(--space-s);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: rgb(255 255 255 / 88%);
}

/* ── Main column ───────────────────────────────────────────────────────── */
.profile__main {
  display: grid;
  gap: var(--space-l);
}

.profile__figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: var(--space-m) var(--space-s);
  padding: 0;
  margin: 0;
  list-style: none;
}

.profile__figure {
  display: grid;
  gap: var(--space-3xs);
  align-content: start;
  padding-block-start: var(--space-s);
  border-block-start: 1px solid var(--line);
}

.profile__figure-value {
  font-family: var(--font-display);
  font-size: var(--step-3);
  white-space: nowrap;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--brand-ink);
}

.profile__figure-label {
  font-size: var(--step--1);
  color: var(--text-dim);
  line-height: 1.35;
}

.profile__facts {
  display: grid;
  margin: 0;
  border-block-start: 1px solid var(--line);
}

.profile__facts > div {
  display: grid;
  grid-template-columns: minmax(8rem, 0.35fr) 1fr;
  gap: var(--space-s);
  padding-block: var(--space-xs);
  border-block-end: 1px solid var(--line);
}

.profile__facts dt {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
  padding-block-start: 0.2em;
}

.profile__facts dd {
  margin: 0;
}

.profile__employer {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
}

.profile__employer img {
  inline-size: 1.6rem;
  block-size: 1.6rem;
  padding: 2px;
  background: #fff;
  border-radius: 50%;
}

/* ── Off screen ────────────────────────────────────────────────────────── */
.profile__offscreen {
  grid-column: 1 / -1;
  display: grid;
  gap: var(--space-m);
  margin-block-start: var(--space-xl);
}

.profile__offscreen-title {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
}

.profile__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-m);
}

.card {
  position: relative;
  display: grid;
  gap: var(--space-2xs);
  align-content: start;
  padding: var(--space-m);
  overflow: hidden;
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
}

.card__title {
  font-size: var(--step-2);
}

.card__file {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.card__note {
  margin-block-start: var(--space-2xs);
  font-size: var(--step--1);
  color: var(--text-dim);
}

.playlist {
  display: grid;
  padding: 0;
  margin: var(--space-2xs) 0 0;
  list-style: none;
}

.playlist a {
  display: grid;
  grid-template-columns: 2.2ch 1fr;
  column-gap: var(--space-s);
  padding-block: var(--space-2xs);
  color: inherit;
  text-decoration: none;
  border-block-end: 1px solid var(--line);
}

.playlist__n {
  grid-row: span 2;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--brand-ink);
  padding-block-start: 0.25em;
}

.playlist__title {
  font-weight: 600;
}

.playlist__artist {
  font-size: var(--step--1);
  color: var(--text-dim);
}

@media (hover: hover) {
  .playlist a:hover .playlist__title {
    color: var(--brand-ink);
  }
}

/* The Knight's card is a small piece of the finale: its dark, its glow. */
.card--knight {
  color: oklch(0.94 0.01 200);
  background:
    radial-gradient(circle at 70% 30%, color-mix(in oklab, var(--gp-glow) 22%, transparent), transparent 55%),
    linear-gradient(160deg, var(--gp-teal), var(--gp-indigo));
  border-color: color-mix(in oklab, var(--gp-glow) 25%, transparent);
}

.card--knight .card__file,
.card--knight .card__note {
  color: oklch(0.84 0.02 200);
}

.card__knight {
  justify-self: center;
  inline-size: auto;
  block-size: 7.5rem;
  margin-block: var(--space-2xs);
  image-rendering: auto;
  filter: drop-shadow(0 0 18px color-mix(in oklab, var(--gp-glow) 55%, transparent));
}

.card__text {
  font-size: var(--step--1);
  line-height: 1.5;
}

.card__link {
  justify-self: start;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--gp-glow);
}

.hobbies {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  margin: var(--space-2xs) 0 0;
  list-style: none;
}

.hobbies li {
  display: grid;
}

.hobbies__name {
  font-weight: 600;
}

.hobbies__detail {
  font-size: var(--step--1);
  color: var(--text-dim);
}

.card__photos {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: var(--space-2xs);
  margin-block-start: var(--space-s);
}

.card__photos img {
  inline-size: 100%;
  block-size: 6rem;
  object-fit: cover;
  border-radius: var(--radius-m);
  filter: grayscale(0.4);
}

@media (width < 1024px) {
  .profile {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile__portrait {
    max-inline-size: 22rem;
  }

  .profile__cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (width < 640px) {
  .profile__facts > div {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
