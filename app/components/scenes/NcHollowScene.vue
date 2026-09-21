<script setup lang="ts">
import { BACKDROP_LAYERS, FOREGROUND_LAYERS, STAGE_SHIFT, type ParallaxLayer } from '~/data/parallax'
import { PARALLAX_SIZES } from '~/data/parallax-sizes'

/**
 * The Hollow Knight backdrop — the contact scene's choreography (SPEC §6.7).
 *
 * The contact scene is three viewports wide. The first frames the Knight
 * standing in the world; scrolling walks him two viewports to the right, and
 * the contact form rides in from the scene's far edge behind him. Everything is
 * driven by one number, `--walk`, which runs 0 → 1 over exactly that stretch.
 *
 * ── The camera ───────────────────────────────────────────────────────────────
 * The rail slides the whole track left. `.hollow__camera` translates right by
 * precisely the same distance, so it hangs still in the viewport while the
 * scene moves past it — a locked-off camera, as in the game. Every layer inside
 * then slides left by its own `shift`, and that difference is the parallax.
 *
 * ── Why a bespoke unit ───────────────────────────────────────────────────────
 * The plates are 1366×768 paintings drawn as one composition and shown with
 * `object-fit: cover`, whose scale is `max(boxW / 1366, boxH / 768)`. That
 * expression is writable in CSS, so `--art` is one source pixel in screen
 * units. Sizing the bench and the Knight in `--art` keeps them locked to the
 * painting at any aspect ratio, instead of drifting apart on a wide monitor.
 * The ground line and the bench's seat are likewise source-pixel constants
 * measured off the artwork, not numbers found by eye.
 *
 * ── Landing on the bench ─────────────────────────────────────────────────────
 * The bench and the Knight converge on the same base position and both reach
 * their untransformed state at `--walk: 1`. The Knight sits in the middle of
 * the bench because the arithmetic cannot put him anywhere else — no tuning.
 */
const { t, locale } = useI18n()
const { reduced } = useMotionPreference()
const rail = useRail()

/** One shared source of truth; the scene root declares the CSS range. */
const { arrived: seated } = useContactWalk()

/**
 * Path B has no scroll-driven animations, so the sprite cycle there runs on
 * time and has to be paused when the rail is still — a Knight marking time on
 * the spot reads as a bug. A watch on the rail's own smoothed velocity is
 * enough; this writes a class, never a per-frame style.
 */
const striding = ref(false)
let stillTimer = 0
watch(rail.velocity, (value) => {
  if (Math.abs(value) < 0.00004) return
  striding.value = true
  window.clearTimeout(stillTimer)
  stillTimer = window.setTimeout(() => {
    striding.value = false
  }, 120)
})

/** The sign is drawn in the visitor's language, as in v1. */
const signFile = computed(() => (locale.value === 'fr' ? 'sit-fr' : 'sit-en'))

const layerStyle = (layer: ParallaxLayer) => ({ '--shift': layer.shift })

// ── The easter egg ───────────────────────────────────────────────────────────
// The Knight is on screen from the start now, so his arrival is no longer the
// secret. Sitting down is: reach the bench and the theme is offered, and it
// only ever plays by the visitor's own hand.
const audio = ref<HTMLAudioElement>()
const playing = ref(false)
const volume = ref(0.35)

async function summon() {
  const el = audio.value
  if (!el) return
  if (playing.value) {
    pause()
    return
  }
  el.volume = 0
  try {
    await el.play()
    playing.value = true
    fadeTo(volume.value, 1200)
  }
  catch {
    // Autoplay policies, a missing file, anything: the scene still works.
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

watch(volume, (value) => {
  if (audio.value) audio.value.volume = value
})

// Walking away stops the music: it should never follow the visitor.
watch(seated, (value) => {
  if (!value && playing.value) pause()
})
watch(rail.activeScene, (scene) => {
  if (scene !== 'contact' && playing.value) pause()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(fadeHandle)
  window.clearTimeout(stillTimer)
  pause()
})
</script>

<template>
  <div
    class="hollow"
    :class="{ 'is-seated': seated, 'is-striding': striding }"
    :style="{ '--stage-shift': STAGE_SHIFT }"
  >
    <div
      class="hollow__camera"
      aria-hidden="true"
    >
      <div
        v-for="layer in BACKDROP_LAYERS"
        :key="layer.file"
        class="hollow__layer"
        :class="[`is-${layer.cover}`, layer.motion ? `is-${layer.motion}` : '']"
        :style="layerStyle(layer)"
      >
        <picture
          v-for="tile in (layer.cover === 'mirror' ? 2 : 1)"
          :key="tile"
          class="hollow__tile"
        >
          <source
            :srcset="`/img/parallax/${layer.file}.avif`"
            type="image/avif"
          >
          <img
            :src="`/img/parallax/${layer.file}.webp`"
            :width="PARALLAX_SIZES[layer.file]?.width"
            :height="PARALLAX_SIZES[layer.file]?.height"
            alt=""
            decoding="async"
          >
        </picture>
      </div>

      <!-- The bench travels with the ground it stands on. -->
      <img
        class="hollow__bench"
        src="/img/parallax/bench.webp"
        :width="PARALLAX_SIZES.bench?.width"
        :height="PARALLAX_SIZES.bench?.height"
        alt=""
        decoding="async"
      >

      <!-- The sign invites you to sit, and steps aside once you have. -->
      <img
        class="hollow__sign"
        :src="`/img/parallax/${signFile}.webp`"
        :width="PARALLAX_SIZES[signFile]?.width"
        :height="PARALLAX_SIZES[signFile]?.height"
        alt=""
        decoding="async"
      >

      <!-- Two sprites, one character: the strip walks, the sit pose lands. -->
      <div class="hollow__knight hollow__knight--walk" />
      <img
        class="hollow__knight hollow__knight--sit"
        src="/img/parallax/knight-sit.webp"
        :width="PARALLAX_SIZES['knight-sit']?.width"
        :height="PARALLAX_SIZES['knight-sit']?.height"
        alt=""
        decoding="async"
      >

      <div
        v-for="layer in FOREGROUND_LAYERS"
        :key="layer.file"
        class="hollow__layer"
        :class="[`is-${layer.cover}`, layer.motion ? `is-${layer.motion}` : '']"
        :style="layerStyle(layer)"
      >
        <picture
          v-for="tile in (layer.cover === 'mirror' ? 2 : 1)"
          :key="tile"
          class="hollow__tile"
        >
          <source
            :srcset="`/img/parallax/${layer.file}.avif`"
            type="image/avif"
          >
          <img
            :src="`/img/parallax/${layer.file}.webp`"
            :width="PARALLAX_SIZES[layer.file]?.width"
            :height="PARALLAX_SIZES[layer.file]?.height"
            alt=""
            decoding="async"
          >
        </picture>
      </div>
    </div>

    <!-- The bench is the hit area: invisible, but a real button, and only
         offered once the Knight is actually sitting on it. -->
    <button
      type="button"
      class="hollow__seat"
      :aria-pressed="playing"
      :aria-label="playing ? t('contact.music.pause') : t('contact.music.play')"
      :tabindex="seated ? 0 : -1"
      @click="summon"
    />

    <Transition name="nc-fade">
      <div
        v-if="seated"
        class="hollow__controls"
      >
        <NcButton
          size="sm"
          variant="ghost"
          :icon="playing ? 'pause' : 'play'"
          @click="summon"
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
/* ── The walk ──────────────────────────────────────────────────────────────
   One number drives the whole scene. Path A lets the compositor produce it
   from the scroll timeline; path B derives it from the --rail-progress that
   useRail already writes each frame. Neither path costs a layout read. */
.hollow {
  /* One pixel of the 1366×768 artwork, in screen units. `object-fit: cover`
     scales by max(box/source) on each axis, which is exactly this. */
  --art: max(0.0732vw, 0.13021svh);

  /* Source-pixel landmarks, measured off the plates (see build-scene-props). */
  --ground: calc(50% + 271 * var(--art));   /* where feet and bench legs land */
  --seat: calc(50% + 245 * var(--art));     /* the top of the bench's seat    */

  /* Where the Knight and the bench meet, as a share of the viewport. Chosen so
     that --meet minus --stride still lands on the painted ground: the platform
     plate only carries ground between 21% and 86% of its width, and starting
     the Knight left of that leaves him standing on the dark. */
  --meet: 34vw;
  /* How far the Knight advances across the screen under his own steam. The
     world slides --stage-shift on top of this, so his feet cover both. */
  --stride: 15;

  position: absolute;
  /* Full-bleed: the scene reserves room for the header and the rail nav, the
     backdrop should ignore both so the camera box is exactly 100vw × 100svh
     and --art stays true. */
  inset-block: calc(-1 * var(--header-h)) calc(-1 * var(--rail-nav-h));
  /* `.scene` insets its content by a gutter; the backdrop must bleed back over
     it, or the artwork stops short of the screen edge and --art — which assumes
     a 100vw camera — measures against the wrong box. */
  inset-inline: calc(-1 * var(--gutter));
  overflow: hidden;
  pointer-events: none;
}

/* ── The camera ────────────────────────────────────────────────────────────
   Cancels the rail's own travel so the viewport holds still on the action. */
.hollow__camera {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 100vw;
  will-change: transform;
  transform: translate3d(calc(var(--walk) * (var(--scene-span) - 1) * 100vw), 0, 0);
}

/* ── The layers ────────────────────────────────────────────────────────────
   Each slides left by its own shift; the spread between them is the depth. */
.hollow__layer {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 100vw;
  display: flex;
  will-change: transform;
  transform: translate3d(
    calc(var(--walk) * var(--shift) * -1vw + var(--pointer-x, 0) * var(--shift) * 0.06vw),
    calc(var(--pointer-y, 0) * var(--shift) * 0.04vh),
    0
  );
}

/* Travel exposes the layer's trailing edge, so the box grows by the distance
   it will move and `cover` re-crops it. Cheapest option, one quad. */
.hollow__layer.is-widen {
  inline-size: calc(100vw + var(--shift) * 1vw);
}

/* Two plates, the second flipped: a mirrored join repeats the edge column, so
   there is no seam to hide, and the art keeps its native scale. */
.hollow__layer.is-mirror {
  inline-size: 200vw;
}

.hollow__layer.is-mirror .hollow__tile:last-child {
  scale: -1 1;
}

.hollow__tile {
  flex: 1 1 0;
  min-inline-size: 0;
}

.hollow__tile img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

/* ── The bench and the Knight ──────────────────────────────────────────────
   Both are pinned to `--meet` and reach their untransformed position at
   --walk: 1. The bench arrives from the right with the ground it stands on;
   the Knight comes up from the left under his own steam. Because both
   transforms vanish together, he lands on its middle by construction. */
.hollow__bench,
.hollow__knight,
.hollow__sign {
  position: absolute;
  inset-inline-start: var(--meet);
  will-change: transform;
}

.hollow__bench {
  inset-block-start: var(--ground);
  inline-size: calc(159 * var(--art));
  block-size: calc(89 * var(--art));
  /* The crop carries 12 source pixels of padding below the legs, so the feet
     are 86.5% of the way down it. Offset by that, not by the box, or the bench
     floats a dozen pixels above the ground the Knight walks on. */
  translate: -50% -86.52%;
  transform: translate3d(calc((1 - var(--walk)) * var(--stage-shift) * 1vw), 0, 0);
}

.hollow__sign {
  inset-block-start: var(--seat);
  inline-size: calc(170 * var(--art));
  block-size: auto;
  translate: -50% -135%;
  transform: translate3d(calc((1 - var(--walk)) * var(--stage-shift) * 1vw), 0, 0);
  opacity: calc(1 - var(--walk));
}

.hollow__knight {
  /* 62 source pixels tall — about the height of the bench's back, which is how
     the Knight scales against this scenery in the game. */
  block-size: calc(62 * var(--art));
  inline-size: calc(32.7 * var(--art));
  translate: -50% -100%;
  transform: translate3d(calc((1 - var(--walk)) * var(--stride) * -1vw), 0, 0);
}

.hollow__knight--walk {
  inset-block-start: var(--ground);
  background-image: image-set(
    url('/img/parallax/knight-walk.avif') type('image/avif'),
    url('/img/parallax/knight-walk.webp') type('image/webp')
  );
  background-repeat: no-repeat;
  background-size: calc(8 * 32.7 * var(--art)) calc(62 * var(--art));
}

/* The sit pose is drawn ~1.4× larger than the walk frames, so it is rendered
   proportionally smaller to keep one character the same size throughout. */
.hollow__knight--sit {
  inset-block-start: var(--seat);
  block-size: calc(50 * var(--art));
  inline-size: calc(30 * var(--art));
  /* A hair past the seat line, so he reads as sitting in the bench rather than
     balanced on its edge. */
  translate: -50% -94%;
  opacity: 0;
}

.hollow.is-seated .hollow__knight--walk { opacity: 0; }
.hollow.is-seated .hollow__knight--sit { opacity: 1; }

/* ── The stride ────────────────────────────────────────────────────────────
   Path A steps the strip along the scroll itself, so the legs advance with the
   distance walked and stop dead when the scroll does. `steps()` on a scroll
   timeline quantises background-position exactly onto frame boundaries. */
@supports (animation-timeline: scroll()) {
  .hollow__knight--walk {
    animation-name: knight-step;
    animation-timing-function: steps(8);
    animation-iteration-count: 18;
    animation-fill-mode: both;
    animation-timeline: scroll(root block);
    animation-range: calc(var(--walk-start) * 100%) calc(var(--walk-end) * 100%);
  }
}

/* Path B cannot bind frames to distance, so the cycle runs on time and is
   paused whenever the rail is still. */
@supports not (animation-timeline: scroll()) {
  .hollow__knight--walk {
    animation: knight-step 0.75s steps(8) infinite;
    animation-play-state: paused;
  }

  .hollow.is-striding .hollow__knight--walk {
    animation-play-state: running;
  }
}

@keyframes knight-step {
  from { background-position-x: 0; }
  to { background-position-x: calc(-8 * 32.7 * var(--art)); }
}

/* ── Idle life ─────────────────────────────────────────────────────────────*/
.hollow .is-glow { animation: nc-glow 5s var(--ease-in-out-quint) infinite alternate; }
.hollow .is-sway { animation: nc-sway 7s var(--ease-in-out-quint) infinite alternate; }
.hollow .is-float { animation: nc-float 9s var(--ease-in-out-quint) infinite alternate; }

@keyframes nc-glow { to { filter: brightness(1.25); } }
@keyframes nc-sway { to { rotate: 0.35deg; } }
@keyframes nc-float { to { translate: 1.5% -2%; } }

/* Decorative motion goes when motion is reduced. The walk itself does not: it
   is the navigation, and freezing it would strand the form off screen. */
:root[data-motion='reduced'] .hollow .is-glow,
:root[data-motion='reduced'] .hollow .is-sway,
:root[data-motion='reduced'] .hollow .is-float,
:root[data-motion='reduced'] .hollow__knight--walk {
  animation: none;
}

/* A gradient at the foot of the scene hands over to the page background. */
.hollow::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    color-mix(in oklab, var(--background) 45%, transparent) 0%,
    transparent 18%,
    transparent 72%,
    var(--background) 100%
  );
}

/* ── The easter egg ────────────────────────────────────────────────────────*/
.hollow__seat {
  position: absolute;
  z-index: 2;
  inset-block-start: calc(50% + 271 * var(--art));
  inset-inline-start: var(--meet);
  inline-size: calc(159 * var(--art));
  block-size: calc(110 * var(--art));
  translate: -50% -100%;
  border-radius: var(--radius-m);
  opacity: 0;
  pointer-events: none;
}

.hollow.is-seated .hollow__seat {
  pointer-events: auto;
}

.hollow__seat:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 3px;
  opacity: 1;
}

.hollow__controls {
  position: absolute;
  z-index: 3;
  inset-block-end: var(--space-l);
  inset-inline-start: var(--meet);
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

/* ── Stacked layout ────────────────────────────────────────────────────────
   No horizontal rail, so there is no walk to drive. The scene becomes what it
   always was below the breakpoint: a still backdrop with the Knight already on
   his bench, and the form in the normal flow above it. */
@media not all and (--rail) {
  .hollow {
    inset-block: 0;
  }

  .hollow,
  .hollow__camera,
  .hollow__layer {
    animation: none;
  }

  .hollow__camera,
  .hollow__layer,
  .hollow__bench,
  .hollow__knight,
  .hollow__sign {
    transform: none;
  }

  .hollow__layer {
    inline-size: 100%;
  }

  .hollow__layer.is-mirror .hollow__tile:last-child {
    display: none;
  }

  .hollow__bench,
  .hollow__knight,
  .hollow__sign,
  .hollow__seat,
  .hollow__controls {
    inset-inline-start: 50%;
  }
}
</style>
