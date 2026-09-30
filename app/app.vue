<script setup lang="ts">
import { LEGACY_HASHES } from '~/data/sections'

const { t } = useI18n()
const head = useLocaleHead({ seo: true })

useMotionPreference()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
  script: [{
    // Captured before Nuxt boots: by the time a component's setup runs, the
    // initial hash is already gone from location (the router normalises the URL
    // against the prerendered route, which has no fragment). useSections reads
    // this to restore a deep link. The anchors of the old layout are
    // translated on the way — `#experience` and `#education` are the Parcours
    // now — and the address bar is corrected to match.
    key: 'nc-hash-capture',
    innerHTML: `window.__ncHash=(function(m){var h=(location.hash||"").slice(1);if(m[h]){h=m[h];history.replaceState(null,"","#"+h)}return h})(${JSON.stringify(LEGACY_HASHES)})`,
    tagPosition: 'head',
  }],
}))
</script>

<template>
  <div class="app">
    <a
      class="nc-skip-link"
      href="#main"
    >{{ t('a11y.skipToContent') }}</a>

    <NuxtPage />

    <NcToaster />
    <NcNoise />
    <NcCursor />
    <NcIntro />
  </div>
</template>

<style>
.app {
  isolation: isolate;
}
</style>
