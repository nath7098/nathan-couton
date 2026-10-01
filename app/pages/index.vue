<script setup lang="ts">
import { SECTIONS } from '~/data/sections'

/**
 * The site is one page: a document of five sections that scrolls down like a
 * file, then the finale, pinned, where it turns into a world.
 *
 * Everything below the hero is prerendered in full and hydrated only when it
 * comes into view: the words are in the HTML from the first byte, and the
 * JavaScript that makes them interactive waits until someone is there to use
 * it. The finale is the exception — it has to be measuring the page before
 * the visitor reaches it, or the header's Contact link would not know where
 * the form is.
 */
useSiteSeo()
provideSections()

const byId = Object.fromEntries(SECTIONS.map((section, index) => [section.id, { section, index }]))
const meta = (id: keyof typeof byId) => byId[id]!
</script>

<template>
  <div class="page">
    <NcAtmosphere />
    <NcSiteHeader />

    <main id="main">
      <section
        id="home"
        data-section="home"
        class="page__hero"
        aria-labelledby="home-title"
      >
        <NcHomeScene />
      </section>

      <NcSection
        :section="meta('about').section"
        :index="meta('about').index + 1"
      >
        <LazyNcAboutScene hydrate-on-visible />
      </NcSection>

      <NcSection
        :section="meta('parcours').section"
        :index="meta('parcours').index + 1"
      >
        <LazyNcGitGraph hydrate-on-visible />
      </NcSection>

      <NcSection
        :section="meta('skills').section"
        :index="meta('skills').index + 1"
      >
        <LazyNcSkillsScene hydrate-on-visible />
      </NcSection>

      <NcSection
        :section="meta('projects').section"
        :index="meta('projects').index + 1"
      >
        <LazyNcProjectsScene hydrate-on-visible />
      </NcSection>

      <NcFinale />
    </main>

    <LazyNcSiteFooter hydrate-on-visible />
  </div>
</template>
