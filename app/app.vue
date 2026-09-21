<script setup lang="ts">
const { t } = useI18n()
const head = useLocaleHead({ seo: true })

useMotionPreference()
providePointer()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
  script: [{
    // Captured before Nuxt boots: by the time a component's setup runs, the
    // initial hash is already gone from location (the router normalises the URL
    // against the prerendered route, which has no fragment). NcRail reads this
    // to restore a deep link.
    key: 'nc-hash-capture',
    innerHTML: 'window.__ncHash=(location.hash||"").replace("#","")',
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
