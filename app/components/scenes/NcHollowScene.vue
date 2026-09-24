<script setup lang="ts">
import {
  BACKDROP_LAYERS,
  FIGURE_SCALE,
  FOREGROUND_LAYERS,
  GROUND_LINE,
  KNIGHT_START,
  PAN,
  SEAT_RISE,
  tileCount,
  type ParallaxLayer,
} from '~/data/parallax'
import { PARALLAX_SIZES } from '~/data/parallax-sizes'
import { createRandom } from '~/utils/particles'

/**
 * The cave scene — the contact section's choreography (SPEC §6.7).
 *
 * The contact scene is one viewport wide and fills it edge to edge. The rail
 * brings it in, parks, and hands the rest of the page's scroll to `--walk`,
 * which runs 0 → 1 while nothing else on the page moves at all. Over that
 * stretch the Knight walks from the left of the screen to its centre and sits
 * down on a bench, and the cavern separates into its layers behind and in
 * front of him.
 *
 * The scenery itself is cut out of one painting by
 * `scripts/build-cave-layers.mjs`; `app/data/parallax.ts` is the table of what
 * came out and how fast each piece travels.
 *
 * ── What changed, and why ────────────────────────────────────────────────────
 * The previous version kept the scene three viewports wide and cancelled the
 * rail's own travel with a camera that translated right by exactly as much as
 * the track translated left. Two full-screen transforms of equal size and
 * opposite sign — one driven by the compositor off the scroll timeline, the
 * other recomputed on the main thread from an animated custom property — never
 * agreed frame to frame, and the whole scene shimmered as you scrolled.
 *
 * Nothing is cancelled here. Each layer owns one transform, keyed straight off
 * the scroll timeline, and the only thing that varies between them is the
 * distance in the keyframe. There is nothing left to disagree.
 *
 * ── Scroll, and only scroll ──────────────────────────────────────────────────
 * No pointer input reaches this scene. In the game the parallax *is* the camera
 * move; mixing in a little sway on mouse position is what breaks the illusion,
 * because the world then reacts to something the character is not doing.
 *
 * ── Landing on the bench ─────────────────────────────────────────────────────
 * The bench rides the ground plane, the Knight advances across it, and both
 * reach their untransformed state at `--walk: 1` — at the centre of the
 * screen, on the ground line measured off the artwork. He sits in the middle
 * of the bench because the arithmetic cannot put him anywhere else.
 */
const { t, locale } = useI18n()
const { reduced } = useMotionPreference()
const rail = useRail()

/** One shared source of truth; the rail owns the range. */
const { arrived: seated } = useContactWalk()

/**
 * The fallback path has no scroll-driven animations, so the sprite cycle there
 * runs on time and has to be paused when the rail is still — a Knight marking
 * time on the spot reads as a bug. A watch on the rail's own smoothed velocity
 * is enough; this writes a class, never a per-frame style.
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

// ── Sitting down ─────────────────────────────────────────────────────────────
// What the game plays when the Knight drops onto a bench, in the order it plays
// it: he flares pure white for an instant, and only once he is back to normal
// does the light he let go of drift off him.
//
// Both beats are CSS animations on elements of their own — the Knight's own
// sprites already carry the walk's animation on path A, and an `animation`
// shorthand on top of that would reset the timeline and drop him back at the
// left of the screen.

/** How long the flare lasts. Short: it is a blink, not a transformation. */
const FLASH_MS = 260
/** How long motes keep coming off him afterwards — the slowest of them is
 * 190ms of delay plus 980ms of travel, so this outlasts the last one. */
const MOTES_MS = 1200

/**
 * The motes, laid out once from a fixed seed so every visitor — and every
 * screenshot — gets the same burst.
 *
 * Positions are percentages of the Knight's own box; distances and sizes are
 * in the figures' source pixels, scaled in CSS by the same `--figure × --art`
 * as the sprites, so the burst is the same size against him at any viewport.
 */
const MOTES = (() => {
  const random = createRandom(0x51_77_1e)
  return Array.from({ length: 20 }, (_, id) => {
    const x = 26 + random() * 48
    const y = 32 + random() * 34
    // Away from his middle, so the burst opens outwards rather than rising in
    // a column.
    const spread = (x - 50) * 0.95 + (random() - 0.5) * 6
    return {
      id,
      style: {
        '--mote-x': `${x.toFixed(1)}%`,
        '--mote-y': `${y.toFixed(1)}%`,
        '--mote-dx': spread.toFixed(2),
        '--mote-dy': (-14 - random() * 16).toFixed(2),
        '--mote-size': (2.4 + random() * 2.6).toFixed(2),
        '--mote-delay': `${Math.round(random() * 190)}ms`,
        '--mote-dur': `${600 + Math.round(random() * 380)}ms`,
      },
    }
  })
})()

/** True for the flare itself. */
const flashing = ref(false)
/** True while motes are still leaving him — starts as the flare ends. */
const shedding = ref(false)
let flashTimer = 0
let motesTimer = 0

function clearRest() {
  window.clearTimeout(flashTimer)
  window.clearTimeout(motesTimer)
  flashing.value = false
  shedding.value = false
}

watch(seated, (value) => {
  clearRest()
  // Only on the walk's own arrival: the stacked layout draws him already
  // sitting, so there is no moment to punctuate, and reduced motion asked for
  // none of this.
  if (!value || reduced.value || !rail.isHorizontal.value) return

  flashing.value = true
  flashTimer = window.setTimeout(() => {
    flashing.value = false
    shedding.value = true
    motesTimer = window.setTimeout(() => {
      shedding.value = false
    }, MOTES_MS)
  }, FLASH_MS)
})

/**
 * Per-layer custom properties. `--depth` is the only thing that differs between
 * two layers' transforms, and it is static — which is what lets the browser
 * interpolate each one between two concrete values and run it off the main
 * thread.
 */
const layerStyle = (layer: ParallaxLayer) => ({
  '--depth': layer.depth,
  '--tile-w': layer.width,
  '--tile-h': layer.height,
  '--tile-top': layer.top,
})

// ── The easter egg ───────────────────────────────────────────────────────────
// The Knight is on screen from the start, so his arrival is not the secret.
// Sitting down is: reach the bench and the theme is offered, and it only ever
// plays by the visitor's own hand.
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
  clearRest()
  pause()
})
</script>

<template>
  <div
    class="hk"
    :class="{ 'is-seated': seated, 'is-striding': striding }"
    :style="{
      '--pan': PAN,
      '--ground-line': GROUND_LINE,
      '--seat-rise': SEAT_RISE,
      '--figure': FIGURE_SCALE,
      '--knight-start': `${KNIGHT_START}vw`,
      '--flash-dur': `${FLASH_MS}ms`,
    }"
  >
    <div
      class="hk__world"
      aria-hidden="true"
    >
      <div
        v-for="layer in BACKDROP_LAYERS"
        :key="layer.file"
        class="hk__layer"
        :class="[`is-${layer.repeat}`, layer.motion ? `is-${layer.motion}` : '']"
        :style="layerStyle(layer)"
      >
        <picture
          v-for="tile in tileCount(layer)"
          :key="tile"
          class="hk__tile"
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

      <!-- The bench travels with the ground it stands on: same depth, same
           keyframes, so the two cannot drift apart. -->
      <img
        class="hk__bench"
        src="/img/parallax/bench.webp"
        :width="PARALLAX_SIZES.bench?.width"
        :height="PARALLAX_SIZES.bench?.height"
        alt=""
        decoding="async"
      >

      <!-- The sign invites you to sit, rides in with the bench, and steps
           aside once the Knight has arrived. -->
      <img
        class="hk__sign"
        :src="`/img/parallax/${signFile}.webp`"
        :width="PARALLAX_SIZES[signFile]?.width"
        :height="PARALLAX_SIZES[signFile]?.height"
        alt=""
        decoding="async"
      >

      <!-- Two sprites, one character: the strip walks, the sit pose lands. -->
      <div class="hk__knight hk__knight--walk" />
      <img
        class="hk__knight hk__knight--sit"
        src="/img/parallax/knight-sit.webp"
        :width="PARALLAX_SIZES['knight-sit']?.width"
        :height="PARALLAX_SIZES['knight-sit']?.height"
        alt=""
        decoding="async"
      >

      <!-- Sitting down, in two beats. The box is the sit pose's own, so the
           flare registers with him exactly and the motes leave from his body
           rather than from somewhere near it. -->
      <div
        v-if="flashing || shedding"
        class="hk__rest"
      >
        <img
          v-if="flashing"
          class="hk__flash"
          src="/img/parallax/knight-sit.webp"
          :width="PARALLAX_SIZES['knight-sit']?.width"
          :height="PARALLAX_SIZES['knight-sit']?.height"
          alt=""
          decoding="async"
        >

        <template v-if="shedding">
          <span
            v-for="mote in MOTES"
            :key="mote.id"
            class="hk__mote"
            :style="mote.style"
          />
        </template>
      </div>

      <div
        v-for="layer in FOREGROUND_LAYERS"
        :key="layer.file"
        class="hk__layer"
        :class="[`is-${layer.repeat}`, layer.motion ? `is-${layer.motion}` : '']"
        :style="layerStyle(layer)"
      >
        <picture
          v-for="tile in tileCount(layer)"
          :key="tile"
          class="hk__tile"
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
      class="hk__seat"
      :aria-pressed="playing"
      :aria-label="playing ? t('contact.music.pause') : t('contact.music.play')"
      :tabindex="seated ? 0 : -1"
      @click="summon"
    />

    <Transition name="nc-fade">
      <div
        v-if="seated"
        class="hk__controls"
      >
        <NcButton
          size="sm"
          variant="ghost"
          :icon="playing ? 'pause' : 'play'"
          :title="playing ? t('contact.music.pause') : t('contact.music.play')"
          :aria-label="playing ? t('contact.music.pause') : t('contact.music.play')"
          @click="summon"
        />

        <label class="hk__volume">
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

    <p class="hk__credit">
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
/* ── The ruler ─────────────────────────────────────────────────────────────
   `--art` is one pixel of the 1366×768 artwork, in screen units, defined so a
   plate always covers the viewport — the same scale `object-fit: cover` would
   pick, but available to arithmetic. Everything in this scene is sized and
   placed in it, which is what keeps the Knight, the bench and the ground on
   one ruler at any aspect ratio.

   `--plate` is one plate width on screen, and the unit the pan is measured in.
   Because a plate is never narrower than the viewport, a layer that covers
   `1 + depth × pan` plate widths covers every frame of the walk. */
.hk {
  /* One source pixel in screen units: 100vw / 1672 against 100svh / 384. The
     plate is about four and a third to one, so on anything narrower than that
     — every real display — it is the height term that wins and the painting
     lands two to three screens wide. */
  --art: max(0.05981vw, 0.26042svh);
  --plate: calc(1672 * var(--art));
  /* Outside the strict minimum coverage, so rounding never shows a sliver of
     page background down the edge of the screen. Mirrors BLEED in the data. */
  --bleed: 0.08;

  /* Where feet and bench legs land, measured off the plates. The seat follows
     from the bench's own geometry, so scaling the bench moves the seat with
     it and the Knight cannot end up sitting through it. */
  --ground: calc(50% + var(--ground-line) * var(--art));
  --seat: calc(var(--ground) - var(--seat-rise) * var(--figure) * var(--art));

  /* How far the Knight advances under his own steam. He finishes dead centre;
     the world slides `--pan` underneath him on top of this. */
  --advance: calc(50vw - var(--knight-start));

  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hk__world {
  position: absolute;
  inset: 0;
}

/* ── The layers ────────────────────────────────────────────────────────────
   Parked with their leading edge just off screen at `--walk: 0`, then slid
   left by `depth × pan` viewport widths. The spread between those distances is
   the depth, and it is the only difference between any two of these.

   Viewport widths, not plate widths: this plate is pinned to the viewport's
   height, so a plate width is two screens on a monitor and thirteen on a phone
   held upright — see PAN in app/data/parallax.ts. */
.hk__layer {
  position: absolute;
  inset-block-start: calc(50% + var(--tile-top) * var(--art));
  inset-inline-start: calc(-100vw * (var(--depth) * var(--pan) + var(--bleed)));
  display: flex;
  transform: translate3d(calc(100vw * (1 - var(--walk)) * var(--depth) * var(--pan)), 0, 0);
}

.hk__tile {
  flex: 0 0 auto;
  inline-size: calc(var(--tile-w) * var(--art));
  block-size: calc(var(--tile-h) * var(--art));
}

/* A plate painted out to its own edges only joins cleanly to a flipped copy of
   itself: the mirrored join repeats the edge column rather than cutting across
   the art. Plates with transparent margins just repeat — see `repeat` in
   app/data/parallax.ts, and `scripts/check-plate-edges.mjs` for which is
   which. */
.hk__layer.is-mirror .hk__tile:nth-child(even) {
  scale: -1 1;
}

.hk__tile img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

/* ── The bench, the sign and the Knight ────────────────────────────────────
   The bench and the sign stand on the ground plane, so they carry `--depth: 1`
   and run the layers' own keyframes. The Knight crosses that ground, so his
   distance is `--advance` instead. All three reach their untransformed state
   at `--walk: 1`: the bench at the centre of the screen, the Knight in the
   middle of the bench. */
.hk__bench,
.hk__sign,
.hk__knight,
.hk__rest {
  position: absolute;
  inset-inline-start: 50%;
}

.hk__bench,
.hk__sign {
  --depth: 1;

  transform: translate3d(calc(100vw * (1 - var(--walk)) * var(--pan)), 0, 0);
}

.hk__bench {
  inset-block-start: var(--ground);
  inline-size: calc(159 * var(--figure) * var(--art));
  block-size: calc(89 * var(--figure) * var(--art));
  /* The crop carries 12 source pixels of padding below the legs, so the feet
     are 86.5% of the way down it. Offset by that, not by the box, or the bench
     floats a dozen pixels above the ground the Knight walks on. */
  translate: -50% -86.52%;
}

.hk__sign {
  inset-block-start: var(--seat);
  inline-size: calc(150 * var(--figure) * var(--art));
  block-size: auto;
  translate: -50% -175%;
  /* Gone before the form settles in, not just before he sits: the two would
     otherwise share the same corner of the screen for a third of the walk. */
  opacity: clamp(0, (0.82 - var(--walk)) * 7, 1);
}

.hk__knight {
  /* 62 source pixels tall — about the height of the bench's back, which is how
     the Knight scales against this scenery in the game. */
  inline-size: calc(32.7 * var(--figure) * var(--art));
  block-size: calc(62 * var(--figure) * var(--art));
  translate: -50% -100%;
}

/* The burst rides with him: it only ever plays at the very end of the walk,
   but `arrived` is a threshold rather than the last pixel, so there is a
   sliver of pan left to keep in step with. */
.hk__knight,
.hk__rest {
  transform: translate3d(calc((var(--walk) - 1) * var(--advance)), 0, 0);
}

.hk__knight--walk {
  inset-block-start: var(--ground);
  background-image: image-set(
    url('/img/parallax/knight-walk.avif') type('image/avif'),
    url('/img/parallax/knight-walk.webp') type('image/webp')
  );
  background-repeat: no-repeat;
  background-size: calc(8 * 32.7 * var(--figure) * var(--art)) calc(62 * var(--figure) * var(--art));
}

/* ── The sit pose ─────────────────────────────────────────────────────────
   Its own 87×146 canvas, and not the walk strip's scale, so it has to be
   matched to it rather than dropped in.

   Matched on the *mask* — the white shell, the one landmark that means the
   same thing in a profile and a front view. It measures 41 source rows in a
   walk frame and 47 in the sit pose, so the sit canvas renders at 41/47 of
   the walk's own 0.481 art units per source pixel: 0.419, hence 87 × 0.419
   and 146 × 0.419 below.

   The 1.4 this replaces came from the *widths* (45 against 63) — but he is
   walking in profile and sitting face on, and a head seen front on is simply
   wider than the same head in profile. Sizing on that shrank him by a third
   the moment he sat down. */
.hk__knight--sit,
.hk__rest {
  inset-block-start: var(--seat);
  inline-size: calc(36.5 * var(--figure) * var(--art));
  block-size: calc(61.2 * var(--figure) * var(--art));
  /* His hips are at row 112 of the canvas's 146 — 77% down — and the canvas
     carries 18 blank rows below his feet. Anchored there rather than on the
     box, so he sits *on* the plank with his legs over its front edge instead
     of floating above the back rest. */
  translate: -50% -84%;
}

.hk__knight--sit {
  opacity: 0;
}

.hk.is-seated .hk__knight--walk { opacity: 0; }
.hk.is-seated .hk__knight--sit { opacity: 1; }

/* ── Sitting down ─────────────────────────────────────────────────────────
   The Knight flares pure white for an instant, and once he is back to normal
   the light he let go of drifts off him. Two beats, two elements: the sprites
   themselves already carry the walk on path A, and an `animation` shorthand
   on top of one of them would reset its timeline and drop him back at the
   left of the screen.

   `brightness(0) invert(1)` is the flare: it flattens every pixel to black,
   alpha untouched, then inverts it — the sprite's own silhouette in pure
   white, which is what the game does. `drop-shadow` on an `<img>` is taken
   from that silhouette rather than from the box, so the glow has his shape. */
.hk__flash {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  animation: hk-flash var(--flash-dur, 260ms) var(--ease-out-expo) both;
}

@keyframes hk-flash {
  0% {
    opacity: 0;
    scale: 1;
    filter:
      brightness(0) invert(1)
      drop-shadow(0 0 0 rgb(255 255 255 / 0%));
  }

  22% {
    opacity: 1;
    scale: 1.03;
    filter:
      brightness(0) invert(1)
      drop-shadow(0 0 calc(9 * var(--figure) * var(--art)) rgb(255 255 255 / 92%));
  }

  100% {
    opacity: 0;
    scale: 1.12;
    filter:
      brightness(0) invert(1)
      drop-shadow(0 0 calc(24 * var(--figure) * var(--art)) rgb(255 255 255 / 0%));
  }
}

/* Positions are a share of his own box; distances and sizes are in the
   figures' source pixels, scaled here by the same `--figure × --art` as every
   sprite in the scene — so the burst keeps its size against him on a laptop
   and on a 4K panel alike. The numbers come from NcHollowScene's own seeded
   table, so the same twenty motes leave him every time. */
.hk__mote {
  position: absolute;
  inset-block-start: var(--mote-y);
  inset-inline-start: var(--mote-x);
  inline-size: calc(var(--mote-size) * var(--figure) * var(--art));
  block-size: calc(var(--mote-size) * var(--figure) * var(--art));
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 calc(var(--mote-size) * 2 * var(--figure) * var(--art)) rgb(255 255 255 / 75%);
  opacity: 0;
  animation: hk-mote var(--mote-dur) var(--ease-out-expo) var(--mote-delay) both;
}

@keyframes hk-mote {
  0% {
    opacity: 0;
    scale: 0.3;
    translate: 0 0;
  }

  18% {
    opacity: 1;
    scale: 1;
  }

  100% {
    opacity: 0;
    scale: 0.35;
    translate:
      calc(var(--mote-dx) * var(--figure) * var(--art))
      calc(var(--mote-dy) * var(--figure) * var(--art));
  }
}

/* ── Path A: the compositor drives every transform ─────────────────────────
   One animation per element, each interpolating between two concrete
   transforms — `--depth`, `--pan` and `--advance` are static, so the browser
   resolves them once and runs the result off the main thread.

   This is the whole point of the rewrite. Animating a shared `--walk` and
   deriving the transforms from it, as the old scene did, puts a full style
   recalculation of a full-screen layer stack in every single frame. */
@supports (animation-timeline: scroll()) {
  .hk__layer,
  .hk__bench,
  .hk__sign,
  .hk__knight,
  .hk__rest {
    transform: none;
    animation-name: hk-pan;
    animation-duration: auto;
    animation-timing-function: linear;
    animation-fill-mode: both;
    animation-timeline: scroll(root block);
    /* The walk owns the scroll left over once the track has parked. */
    animation-range: calc(var(--rail-lock) * 100%) 100%;
  }

  .hk__knight,
  .hk__rest {
    animation-name: hk-advance;
  }

  .hk__sign {
    animation-name: hk-pan, hk-sign-fade;
    animation-range: calc(var(--rail-lock) * 100%) 100%, calc(var(--rail-lock) * 100%) 100%;
  }

  @keyframes hk-pan {
    from { transform: translate3d(calc(100vw * var(--depth) * var(--pan)), 0, 0); }
    to { transform: translate3d(0, 0, 0); }
  }

  @keyframes hk-advance {
    from { transform: translate3d(calc(-1 * var(--advance)), 0, 0); }
    to { transform: translate3d(0, 0, 0); }
  }

  @keyframes hk-sign-fade {
    0%, 68% { opacity: 1; }
    82%, 100% { opacity: 0; }
  }
}

/* ── The stride ────────────────────────────────────────────────────────────
   Path A steps the strip along the scroll itself, so the legs advance with the
   distance walked and stop dead when the scroll does. `steps()` on a scroll
   timeline quantises background-position exactly onto frame boundaries. */
@supports (animation-timeline: scroll()) {
  .hk__knight--walk {
    animation-name: hk-advance, hk-step;
    animation-duration: auto, auto;
    animation-timing-function: linear, steps(8);
    animation-iteration-count: 1, 20;
    animation-fill-mode: both, both;
    animation-timeline: scroll(root block), scroll(root block);
    animation-range:
      calc(var(--rail-lock) * 100%) 100%,
      calc(var(--rail-lock) * 100%) 100%;
  }
}

/* Path B cannot bind frames to distance, so the cycle runs on time and is
   paused whenever the rail is still. */
@supports not (animation-timeline: scroll()) {
  .hk__knight--walk {
    animation: hk-step 0.75s steps(8) infinite;
    animation-play-state: paused;
  }

  .hk.is-striding .hk__knight--walk {
    animation-play-state: running;
  }
}

@keyframes hk-step {
  from { background-position-x: 0; }
  to { background-position-x: calc(-8 * 32.7 * var(--figure) * var(--art)); }
}

/* ── Idle life ─────────────────────────────────────────────────────────────
   On the tiles rather than the layer, so it never has to share the layer's own
   `animation` shorthand with the pan. Every tile of a layer gets the identical
   animation, which is what keeps a mirrored join closed while it plays. */
.hk__layer.is-glow .hk__tile { animation: nc-glow 5s var(--ease-in-out-quint) infinite alternate; }
.hk__layer.is-sway .hk__tile { animation: nc-sway 7s var(--ease-in-out-quint) infinite alternate; }
.hk__layer.is-float .hk__tile { animation: nc-float 9s var(--ease-in-out-quint) infinite alternate; }

@keyframes nc-glow { to { filter: brightness(1.3); } }
@keyframes nc-sway { to { translate: 0.4% 0; } }
@keyframes nc-float { to { translate: 0 -1.4%; } }

/* A flipped tile carries `scale: -1 1`; `translate` is a separate property, so
   the two compose instead of one overwriting the other. */

/* Decorative motion goes when motion is reduced. The walk itself does not: it
   is the navigation, and freezing it would strand the form off screen. */
:root[data-motion='reduced'] .hk__layer .hk__tile,
:root[data-motion='reduced'] .hk__knight--walk {
  animation: none;
}

/* A gradient at the head and foot of the scene hands over to the page
   background, so the header and the rail nav have something to sit on. */
.hk::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    color-mix(in oklab, var(--background) 55%, transparent) 0%,
    transparent 8%,
    transparent 88%,
    color-mix(in oklab, var(--background) 62%, transparent) 100%
  );
}

/* ── The easter egg ────────────────────────────────────────────────────────*/
.hk__seat {
  position: absolute;
  z-index: 2;
  inset-block-start: var(--ground);
  inset-inline-start: 50%;
  inline-size: calc(159 * var(--figure) * var(--art));
  block-size: calc(110 * var(--figure) * var(--art));
  translate: -50% -100%;
  border-radius: var(--radius-m);
  opacity: 0;
  pointer-events: none;
}

.hk.is-seated .hk__seat {
  pointer-events: auto;
}

.hk__seat:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 3px;
  opacity: 1;
}

/* Just above the Knight's head rather than at the foot of the screen, where
   the rail nav lives, and icon-only: this is a control for an easter egg, not
   a media player, and a pill carrying a full sentence sat in the middle of the
   artwork like a dialog box. */
.hk__controls {
  position: absolute;
  z-index: 3;
  inset-block-start: var(--seat);
  inset-inline-start: 50%;
  translate: -50% calc(-100% - 72 * var(--figure) * var(--art));
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  padding: var(--space-3xs) var(--space-2xs);
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-pill);
  pointer-events: auto;
  white-space: nowrap;
}

/* Icon-only: the button's empty label span would otherwise hold it open. */
.hk__controls :deep(.nc-button__label:empty) {
  display: none;
}

.hk__volume {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  color: var(--surface-dim);
}

.hk__volume input {
  inline-size: 4.5rem;
  accent-color: var(--primary);
}

.hk__credit {
  position: absolute;
  inset-block-end: var(--space-2xs);
  inset-inline-start: var(--space-s);
  font-size: 0.62rem;
  color: var(--surface-faint);
  /* It sits directly on the artwork, which is bright in places and dark in
     others; a scrim rather than a colour keeps it readable over both without
     putting a box on the scene. */
  text-shadow: 0 1px 3px rgb(0 0 0 / 65%);
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
   No horizontal rail, so there is no walk to drive: the scene becomes a still
   band of Greenpath at the foot of the section, with the Knight already on his
   bench and the form in the normal flow above it.

   The band is the whole point. `--art` is normally driven by whichever of the
   viewport's two dimensions needs more of the plate to cover it, which on a
   phone means covering a tall, narrow box with a painting four times wider than
   it is tall — about a twentieth of its width, blown up. It read as an orange
   blur.

   Here it is driven off the width instead, to a band a little over half the
   viewport wide. Fitting the whole painting across the screen is the obvious
   alternative and it is worse: at 4.35∶1 that is a ninety-pixel sliver on a
   phone, too shallow to read as anywhere, with the credit line lying across
   it. Half a screen of height shows a good stretch of cavern at a size where
   the lanterns and the floor are legible, and every landmark inside it still
   lands where the arithmetic says. */
@media not all and (--rail) {
  .hk {
    --art: calc(52vw / 384);
    --walk: 1;

    inset-block-start: auto;
    /* `.scene` insets its content by a gutter; the band has to bleed back over
       it, or it stops short of the screen edge while `--art` — which assumes a
       full-width band — keeps measuring against 100vw. */
    inset-inline: calc(-1 * var(--gutter));
    block-size: 52vw;
  }

  .hk__layer,
  .hk__bench,
  .hk__sign,
  .hk__knight,
  .hk__knight--walk,
  .hk__rest {
    animation: none;
    transform: none;
  }

  .hk__layer {
    inset-inline-start: 0;
  }

  .hk__tile:nth-child(n + 2) {
    display: none;
  }

  /* The invitation belongs to the walk; here he is already sitting. */
  .hk__sign,
  .hk__knight--walk {
    opacity: 0;
  }

  .hk__knight--sit {
    opacity: 1;
  }

  /* The bench easter egg belongs to the desktop scene: stacked, the form fills
     the section and both the seat and its controls can only land on top of it.
     The backdrop stays, the Knight stays sitting on his bench, the audio
     element stays — there is just nothing here that can be clicked. */
  .hk__controls,
  .hk__seat {
    display: none;
  }
}
</style>
