<script setup lang="ts">
import { PARALLAX_LAYERS } from '~/data/parallax'

/**
 * The Hollow Knight backdrop and its easter egg (SPEC §6.7).
 *
 * Thirteen parallax layers plus the sign and the Knight. Clicking the bench
 * brings the Knight out and starts the theme — always by the visitor's own
 * hand, never on load, and with visible controls once it plays.
 *
 * The audio file is fetched only when asked for: `preload="none"` keeps 4MB
 * off every page load.
 */
const { t, locale } = useI18n()
const { reduced } = useMotionPreference()

const audio = ref<HTMLAudioElement>()
const knightOut = ref(false)
const playing = ref(false)
const volume = ref(0.35)

/** The sign is drawn in the visitor's language, as in v1. */
const signFile = computed(() => (locale.value === 'fr' ? 'sit-fr' : 'sit-en'))

async function summonKnight() {
  knightOut.value = !knightOut.value

  if (!knightOut.value) {
    pause()
    return
  }

  const el = audio.value
  if (!el) return
  el.volume = 0
  try {
    await el.play()
    playing.value = true
    fadeTo(volume.value, 1200)
  }
  catch {
    // Autoplay policies, a missing file, anything: the Knight still appears.
    playing.value = false
  }
}

/** Gentle fade so the theme does not slam in at full volume. */
let fadeHandle = 0
function fadeTo(target: number, duration: number) {
  const el = audio.value
  if (!el) return
  cancelAnimationFrame(fadeHandle)
  if (reduced.value) {
    el.volume = target
    return
  }
  const from = el.volume
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    el.volume = from + (target - from) * progress
    if (progress < 1) fadeHandle = requestAnimationFrame(step)
  }
  fadeHandle = requestAnimationFrame(step)
}

function pause() {
  audio.value?.pause()
  playing.value = false
}

function toggleSound() {
  if (playing.value) {
    pause()
    return
  }
  audio.value?.play().then(() => {
    playing.value = true
  }).catch(() => {})
}

watch(volume, (value) => {
  if (audio.value) audio.value.volume = value
})

// Leaving the scene stops the music: it should never follow the visitor.
const rail = useRail()
watch(rail.activeScene, (scene) => {
  if (scene !== 'contact' && playing.value) pause()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(fadeHandle)
  pause()
})
</script>

<template>
  <div class="hollow">
    <div
      class="hollow__stage"
      aria-hidden="true"
    >
      <NcParallaxLayer
        v-for="layer in PARALLAX_LAYERS"
        :key="layer.file"
        :depth="layer.depth"
        :scale-with="layer.scaleWith ?? 0"
        :class="layer.motion ? `is-${layer.motion}` : undefined"
      >
        <picture>
          <source
            :srcset="`/img/parallax/${layer.file}.avif`"
            type="image/avif"
          >
          <img
            :src="`/img/parallax/${layer.file}.webp`"
            alt=""
            loading="lazy"
            decoding="async"
          >
        </picture>
      </NcParallaxLayer>

      <!-- The sign bounces until the Knight is out, as in v1. -->
      <img
        v-show="!knightOut"
        class="hollow__sign"
        :src="`/img/parallax/${signFile}.webp`"
        alt=""
        loading="lazy"
      >

      <img
        v-show="knightOut"
        class="hollow__knight"
        src="/img/parallax/knight-sit.webp"
        alt=""
        loading="lazy"
      >
    </div>

    <!-- The only interactive part of the backdrop. -->
    <button
      type="button"
      class="hollow__bench"
      :aria-pressed="knightOut"
      :aria-label="t('contact.music.play')"
      @click="summonKnight"
    />

    <Transition name="nc-fade">
      <div
        v-if="knightOut"
        class="hollow__controls"
      >
        <NcButton
          size="sm"
          variant="ghost"
          :icon="playing ? 'pause' : 'play'"
          @click="toggleSound"
        >
          {{ playing ? t('contact.music.pause') : t('contact.music.play') }}
        </NcButton>

        <label class="hollow__volume">
          <span class="nc-sr-only">{{ t('contact.music.volume') }}</span>
          <NcIcon :name="volume === 0 ? 'volume-off' : 'volume'" />
          <input
            v-model.number="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :aria-label="t('contact.music.volume')"
          >
        </label>

        <p
          class="nc-sr-only"
          aria-live="polite"
        >
          {{ playing ? t('contact.music.playing') : '' }}
        </p>
      </div>
    </Transition>

    <p class="hollow__credit">
      {{ t('contact.credits') }}
    </p>

    <audio
      ref="audio"
      src="/audio/hollow-knight-theme.mp3"
      preload="none"
      loop
    />
  </div>
</template>

<style scoped>
.hollow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

/* Only the artwork sits behind the content. The bench and the controls need to
   be reachable, so they stay in the normal stacking order — with `z-index: -1`
   on the whole block the bench was unclickable. */
.hollow__stage {
  z-index: 0;
}

.hollow__stage {
  position: absolute;
  inset: 0;
}

.hollow :deep(.parallax-layer) picture,
.hollow :deep(.parallax-layer) img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

/* A gradient at the foot of the scene hands over to the page background. */
.hollow::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in oklab, var(--background) 30%, transparent) 0%,
    transparent 25%,
    transparent 70%,
    var(--background) 100%
  );
}

.hollow :deep(.is-glow) {
  animation: nc-glow 5s var(--ease-in-out-quint) infinite alternate;
}

.hollow :deep(.is-sway) {
  animation: nc-sway 7s var(--ease-in-out-quint) infinite alternate;
}

.hollow :deep(.is-float) {
  animation: nc-float 9s var(--ease-in-out-quint) infinite alternate;
}

@keyframes nc-glow {
  to { filter: brightness(1.25); }
}

@keyframes nc-sway {
  to { transform: skewX(0.6deg); }
}

@keyframes nc-float {
  to { transform: translate3d(2%, -3%, 0); }
}

:root[data-motion='reduced'] .hollow :deep(.is-glow),
:root[data-motion='reduced'] .hollow :deep(.is-sway),
:root[data-motion='reduced'] .hollow :deep(.is-float) {
  animation: none;
}

.hollow__sign,
.hollow__knight {
  position: absolute;
  z-index: 1;
  inset-block-end: 12%;
  inset-inline-start: 50%;
  translate: -50% 0;
  pointer-events: none;
}

.hollow__sign {
  inline-size: clamp(9rem, 14vw, 13rem);
  animation: nc-bounce 1.6s var(--ease-in-out-quint) infinite;
}

@keyframes nc-bounce {
  50% { transform: translateY(-8%); }
}

:root[data-motion='reduced'] .hollow__sign {
  animation: none;
}

.hollow__knight {
  inline-size: clamp(2.5rem, 4vw, 3.5rem);
  filter: drop-shadow(0 0 1.2rem color-mix(in oklab, #fff 55%, transparent));
}

/* The bench is the hit area: invisible, but a real button. */
.hollow__bench {
  position: absolute;
  z-index: 2;
  inset-block-end: 10%;
  inset-inline-start: 50%;
  translate: -50% 0;
  inline-size: clamp(7rem, 11vw, 10rem);
  block-size: clamp(4rem, 7vw, 6rem);
  pointer-events: auto;
  border-radius: var(--radius-m);
}

.hollow__bench:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 3px;
}

.hollow__controls {
  position: absolute;
  z-index: 3;
  inset-block-end: var(--space-l);
  inset-inline-start: 50%;
  translate: -50% 0;
  display: flex;
  gap: var(--space-s);
  align-items: center;
  padding: var(--space-2xs) var(--space-s);
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-pill);
  pointer-events: auto;
}

.hollow__volume {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  color: var(--surface-dim);
}

.hollow__volume input {
  inline-size: 6rem;
  accent-color: var(--primary);
}

.hollow__credit {
  position: absolute;
  inset-block-end: var(--space-2xs);
  inset-inline-end: var(--space-s);
  font-size: 0.62rem;
  color: var(--surface-faint);
}

.nc-fade-enter-active,
.nc-fade-leave-active {
  transition: opacity var(--dur-base) var(--ease-out-expo);
}

.nc-fade-enter-from,
.nc-fade-leave-to {
  opacity: 0;
}
</style>
