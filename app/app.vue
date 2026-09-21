<script setup lang="ts">
const { t } = useI18n()
const head = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

useMotionPreference()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
}))

useSeoMeta({
  titleTemplate: title => (title ? `${title} — Nathan Couton` : 'Nathan Couton'),
  ogSiteName: 'Nathan Couton',
  ogType: 'website',
  ogImage: `${config.public.siteUrl}/nc_logo_static.png`,
  twitterCard: 'summary',
  twitterSite: '@nath7098',
})
</script>

<template>
  <div class="app">
    <a
      class="nc-skip-link"
      href="#main"
    >{{ t('a11y.skipToContent') }}</a>

    <NuxtPage />
  </div>
</template>

<style>
.app {
  isolation: isolate;
}
</style>
