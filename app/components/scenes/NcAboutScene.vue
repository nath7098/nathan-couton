<script setup lang="ts">
import { GAMES, HOBBIES, TOP_ARTISTS, TOP_TRACKS } from '~/data/about'

/**
 * Scene 02 — the bento grid.
 *
 * Same six tiles as v1 (portrait, weather card, employer, Spotify, games,
 * hobbies), on a fluid 12-column grid instead of v1's fixed 8rem tracks.
 * Content is static now, so there is no loading state to show.
 */
const { t } = useI18n()
</script>

<template>
  <div class="about">
    <div class="about__col">
      <div class="about__portrait">
        <img
          src="/img/about/profile-pic.jpg"
          :alt="t('about.portraitAlt')"
          width="220"
          height="220"
          loading="lazy"
        >
      </div>

      <!-- Weather card: v1's blue gradient, with a drifting cloud layer. -->
      <section class="about__weather">
        <div
          class="about__clouds"
          aria-hidden="true"
        />
        <div class="about__weather-top">
          <div>
            <p class="about__city">
              Tours
            </p>
            <p class="about__dept">
              37
            </p>
          </div>
          <div class="about__weather-right">
            <NcIcon
              name="sun"
              size="1.6rem"
              class="about__sun"
            />
            <p class="about__desc">
              {{ t('about.description') }}
            </p>
          </div>
        </div>
        <p class="about__pickup">
          {{ t('about.pickupline') }}
        </p>
      </section>

      <div class="about__employer">
        <img
          src="/img/about/job.png"
          :alt="t('about.employerAlt')"
          width="160"
          height="160"
          loading="lazy"
        >
      </div>
    </div>

    <section class="about__music">
      <h3 class="about__label">
        {{ t('about.musics') }}
      </h3>
      <div class="about__music-grid">
        <NcBentoTile
          v-for="artist in TOP_ARTISTS"
          :key="artist.name"
          :name="artist.name"
          :image="artist.image"
          :href="artist.href"
        />
        <NcBentoTile
          v-for="track in TOP_TRACKS"
          :key="track.name"
          :name="track.name"
          :by="track.by"
          :image="track.image"
          :href="track.href"
          shape="square"
        />
      </div>
    </section>

    <div class="about__col">
      <section class="about__games">
        <h3 class="about__label">
          {{ t('about.games') }}
        </h3>
        <div class="about__row">
          <NcBentoTile
            v-for="game in GAMES"
            :key="game.name"
            :name="game.name"
            :image="game.image"
            shape="square"
          />
        </div>
      </section>

      <section class="about__hobbies">
        <h3 class="about__label">
          {{ t('about.hobbies.title') }}
        </h3>
        <div class="about__row">
          <NcBentoTile
            v-for="hobby in HOBBIES"
            :key="hobby.id"
            :name="t(hobby.labelKey)"
            :image="hobby.image"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Laid out in columns, not rows: the rail gives this scene 1.5 viewports of
   width but only one of height, so the grid grows sideways. */
.about {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: clamp(1.5rem, 3vw, 3rem);
  align-content: center;
  align-items: center;
  /* Grouped at the start: the scene is 1.5 viewports wide, so centring would
     leave a hole where the first screen should be. */
  justify-content: start;
}

.about__col {
  display: grid;
  gap: var(--space-m);
  align-content: center;
}

.about > *,
.about__col > * {
  opacity: clamp(0, calc(var(--scene-progress, 1) * 3 - 0.2), 1);
}

.about__portrait {
  inline-size: clamp(6rem, 9vw, 8.5rem);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: var(--shadow-2);
}

.about__portrait img,
.about__employer img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.about__weather {
  position: relative;
  display: grid;
  gap: var(--space-2xs);
  align-content: space-between;
  inline-size: clamp(14rem, 20vw, 18rem);
  min-block-size: 9rem;
  padding: var(--space-s);
  color: #fff;
  background: linear-gradient(160deg, rgb(0 119 255), rgb(92 187 255));
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-2);
  overflow: hidden;
}

.about__clouds {
  position: absolute;
  inset: 0;
  background: url('/img/about/cloud.png') center / 62% no-repeat;
  opacity: 0.6;
  animation: nc-drift 24s ease-in-out infinite alternate;
}

@keyframes nc-drift {
  to { transform: translateX(8%) scale(1.06); }
}

:root[data-motion='reduced'] .about__clouds {
  animation: none;
}

.about__weather-top {
  position: relative;
  display: flex;
  gap: var(--space-s);
  align-items: flex-start;
  justify-content: space-between;
}

.about__city {
  font-size: var(--step--1);
}

.about__dept {
  font-size: var(--step-2);
  font-weight: 700;
  line-height: 1;
}

.about__weather-right {
  display: grid;
  gap: var(--space-3xs);
  justify-items: end;
  text-align: end;
}

.about__sun {
  color: #ffd76b;
  animation: nc-pulse 4s var(--ease-in-out-quint) infinite;
}

@keyframes nc-pulse {
  50% { transform: scale(1.12); opacity: 0.85; }
}

:root[data-motion='reduced'] .about__sun {
  animation: none;
}

.about__desc,
.about__pickup {
  position: relative;
  font-size: var(--step--1);
}

.about__employer {
  display: grid;
  place-items: center;
  inline-size: clamp(6rem, 9vw, 8.5rem);
  aspect-ratio: 1;
  padding: var(--space-2xs);
  background: var(--editor);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-l);
}

.about__employer img {
  object-fit: contain;
}

.about__label {
  margin-block-end: var(--space-2xs);
  font-size: var(--step--1);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--surface-dim);
}

/* Artists on the top row, tracks below — v1's arrangement, kept. */
.about__music-grid {
  display: grid;
  grid-template-columns: repeat(4, clamp(4rem, 6vw, 5.5rem));
  gap: var(--space-2xs);
}

.about__row {
  display: flex;
  gap: var(--space-2xs);
}

.about__row > * {
  inline-size: clamp(4rem, 6vw, 5.5rem);
}

@media not all and (min-width: 1024px) {
  /* The scene flows in columns for the rail, which gives it width but no
     height. Stacked it has the opposite, and `grid-template-columns: 1fr` alone
     did not turn it round: with `grid-auto-flow: column` still set, the extra
     items went on filling implicit columns at `max-content`, so the bento ran
     687px past the right edge of a 390px screen. The flow has to turn with the
     layout. */
  .about {
    grid-auto-flow: row;
    grid-auto-columns: auto;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-l);
  }

  .about__col {
    grid-auto-flow: row;
  }

  .about__music-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
