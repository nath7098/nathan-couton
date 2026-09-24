<script setup lang="ts">
/**
 * A media tile whose name is revealed by a veil rising over the image.
 *
 * v1 animated `bottom: 100% → 0`, which lays out every frame. This uses
 * clip-path on a composited layer instead, and fixes the `opacity: 7` typo in
 * the label rule.
 */
withDefaults(defineProps<{
  name: string
  image: string
  by?: string
  href?: string
  shape?: 'circle' | 'square'
}>(), { by: undefined, href: undefined, shape: 'circle' })

/**
 * Spotify and IGDB artwork lives on third-party CDNs whose URLs can expire.
 * When one does, the tile falls back to its name on a plain surface rather
 * than a broken-image glyph with alt text spilling out.
 */
const failed = ref(false)
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    class="tile"
    :class="`tile--${shape}`"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
  >
    <img
      v-if="!failed"
      :src="image"
      :alt="name"
      class="tile__image"
      width="320"
      height="320"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    >
    <span
      class="tile__veil"
      :class="{ 'is-fallback': failed }"
      aria-hidden="true"
    />
    <span
      class="tile__label"
      :class="{ 'is-fallback': failed }"
    >
      <span class="tile__name">{{ name }}</span>
      <span
        v-if="by"
        class="tile__by"
      >{{ by }}</span>
    </span>
  </component>
</template>

<style scoped>
.tile {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  background: var(--editor);
  isolation: isolate;
}

.tile--circle {
  border-radius: 50%;
  aspect-ratio: 1;
}

.tile--square {
  border-radius: var(--radius-m);
  aspect-ratio: 3 / 4;
}

.tile__image {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  transition: transform var(--dur-slow) var(--ease-out-expo);
}

.tile__veil {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 82%);
  clip-path: inset(100% 0 0 0);
  transition: clip-path var(--dur-base) var(--ease-out-expo);
}

/* No artwork: the surface itself carries the name. */
.tile__veil.is-fallback {
  clip-path: none;
  background: linear-gradient(145deg, var(--surface-faint), var(--editor));
}

.tile__label.is-fallback {
  position: relative;
  opacity: 1;
  transform: none;
}

.tile__label.is-fallback .tile__name {
  color: var(--surface);
}

.tile__label.is-fallback .tile__by {
  color: var(--surface-dim);
}

.tile__label {
  position: absolute;
  display: grid;
  gap: 0.1em;
  padding: var(--space-3xs);
  text-align: center;
  /* The fallback puts this label back in flow, where an artist name longer than
     its tile spilled over the neighbours — four tiles across a phone leave 86px
     each. It stays inside its own tile and wraps instead. */
  max-inline-size: 100%;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  opacity: 0;
  transform: translateY(0.4rem);
  transition: opacity var(--dur-base) var(--ease-out-expo), transform var(--dur-base) var(--ease-out-expo);
}

.tile__name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
}

.tile__by {
  font-size: 0.62rem;
  color: rgb(255 255 255 / 75%);
}

@media (hover: hover) {
  .tile:hover .tile__veil,
  .tile:focus-visible .tile__veil {
    clip-path: inset(0 0 0 0);
  }

  .tile:hover .tile__label,
  .tile:focus-visible .tile__label {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 120ms;
  }

  .tile:hover .tile__image {
    transform: scale(1.06);
  }
}

/* Touch and keyboard: the veil is always up, the name always readable. */
@media not all and (hover: hover) {
  .tile__veil {
    clip-path: inset(70% 0 0 0);
  }

  .tile__label {
    opacity: 1;
    transform: none;
    align-self: end;
    padding-block-end: var(--space-2xs);
  }
}

.tile:focus-visible .tile__veil {
  clip-path: inset(0 0 0 0);
}

.tile:focus-visible .tile__label {
  opacity: 1;
  transform: none;
}
</style>
