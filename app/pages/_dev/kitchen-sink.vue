<script setup lang="ts">
import { ICON_NAMES } from '~/utils/icon-names'

/**
 * Internal component gallery — every primitive in every state.
 *
 * Excluded from the prerender (see nuxt.config `routeRules`), so it never ships
 * in the sitemap or the crawl. It exists to be looked at, and for the smoke test
 * to assert that each primitive renders.
 */
definePageMeta({ layout: false })

useSeoMeta({ title: 'Kitchen sink', robots: 'noindex, nofollow' })

const toast = useToast()
const modalOpen = ref(false)
const tagModal = ref<{ label: string, details: string, accent: string } | null>(null)

const name = ref('')
const email = ref('')
const message = ref('')
const loading = ref(false)

const demoTags = [
  { label: 'Vue 3', tech: 'vue' as const, details: 'Composition API, script setup, SSR.' },
  { label: 'Java', tech: 'java' as const, details: 'Java EE 8, Spring Boot, Hibernate.' },
  { label: 'Agile', tech: 'agile' as const, details: 'Sprints, revues de code, merge requests.' },
  { label: 'Flex', tech: 'flex' as const },
]

function fakeSubmit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    toast.success('Message envoyé 😃')
  }, 1200)
}
</script>

<template>
  <div class="sink">
    <header class="sink__head">
      <NcHeading :level="1">
        Kitchen sink
      </NcHeading>
      <div class="sink__controls">
        <NcLocaleSwitch />
        <NcThemeToggle />
      </div>
    </header>

    <section class="sink__block">
      <h2 class="sink__label">
        Buttons
      </h2>
      <div class="sink__row">
        <NcButton variant="code">
          En savoir plus
        </NcButton>
        <NcButton variant="solid">
          Envoyer
        </NcButton>
        <NcButton variant="ghost">
          Annuler
        </NcButton>
        <NcButton
          variant="ghost"
          icon="download"
        >
          CV
        </NcButton>
        <NcButton
          variant="ghost"
          icon-end="arrow-right"
        >
          Suivant
        </NcButton>
        <NcButton
          variant="solid"
          :loading="loading"
          @click="fakeSubmit"
        >
          Envoyer
        </NcButton>
        <NcButton
          variant="solid"
          disabled
        >
          Désactivé
        </NcButton>
        <NcButton
          variant="ghost"
          size="sm"
          href="https://gitlab.com/nath7098"
          external
          icon-end="external-link"
        >
          GitLab
        </NcButton>
      </div>
    </section>

    <section class="sink__block">
      <h2 class="sink__label">
        Tags
      </h2>
      <div class="sink__row">
        <NcTag
          v-for="tag in demoTags"
          :key="tag.label"
          :label="tag.label"
          :tech="tag.tech"
          :details="tag.details"
          @open="tagModal = { label: tag.label, details: tag.details!, accent: `var(--tech-${tag.tech}-accent)` }"
        />
      </div>
    </section>

    <section class="sink__block">
      <h2 class="sink__label">
        Fields
      </h2>
      <div class="sink__grid">
        <NcField
          v-model="name"
          label="Votre nom"
          name="demo-name"
        />
        <NcField
          v-model="email"
          label="Votre e-mail"
          name="demo-email"
          type="email"
          error="Cet e-mail ne semble pas valide"
        />
        <NcField
          v-model="message"
          label="Votre message"
          name="demo-message"
          type="textarea"
        />
      </div>
    </section>

    <section class="sink__block">
      <h2 class="sink__label">
        Card
      </h2>
      <div class="sink__row">
        <NcCard
          interactive
          class="sink__card"
        >
          <h3>Portfolio</h3>
          <p>Migration de mon ancien portfolio statique vers Nuxt.</p>
          <div class="sink__row">
            <NcTag
              label="Nuxt"
              tech="nuxt"
            />
            <NcTag
              label="Ts"
              tech="ts"
            />
          </div>
        </NcCard>
      </div>
    </section>

    <section class="sink__block">
      <h2 class="sink__label">
        Feedback
      </h2>
      <div class="sink__row">
        <NcSpinner />
        <NcSpinner size="2.5rem" />
        <NcButton @click="toast.success('Copié 😇 !')">
          Toast succès
        </NcButton>
        <NcButton @click="toast.error('Une erreur s\'est produite 😞')">
          Toast erreur
        </NcButton>
        <NcButton @click="modalOpen = true">
          Ouvrir la modale
        </NcButton>
      </div>
      <div class="sink__grid">
        <NcSkeleton variant="text" />
        <NcSkeleton
          variant="circle"
          width="4rem"
        />
        <NcSkeleton
          variant="rect"
          height="6rem"
        />
      </div>
    </section>

    <section class="sink__block">
      <h2 class="sink__label">
        Icons ({{ ICON_NAMES.length }})
      </h2>
      <ul class="sink__icons">
        <li
          v-for="icon in ICON_NAMES"
          :key="icon"
          class="sink__icon"
        >
          <NcIcon
            :name="icon"
            size="1.6rem"
          />
          <span>{{ icon }}</span>
        </li>
      </ul>
    </section>

    <NcModal
      :open="modalOpen"
      title="Une modale"
      @close="modalOpen = false"
    >
      <p>Construite sur &lt;dialog&gt; : Échap, backdrop, piège de focus et restauration viennent de la plateforme.</p>
    </NcModal>

    <NcModal
      :open="tagModal !== null"
      :title="tagModal?.label ?? ''"
      :accent="tagModal?.accent"
      @close="tagModal = null"
    >
      <p>{{ tagModal?.details }}</p>
    </NcModal>
  </div>
</template>

<style scoped>
.sink {
  display: grid;
  gap: var(--space-xl);
  max-inline-size: 70rem;
  padding: var(--space-xl) var(--gutter) var(--space-3xl);
  margin-inline: auto;
}

.sink__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
  align-items: center;
  justify-content: space-between;
}

.sink__controls {
  display: flex;
  gap: var(--space-m);
  align-items: center;
}

.sink__block {
  display: grid;
  gap: var(--space-s);
}

.sink__label {
  font-size: var(--step--1);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--surface-dim);
  padding-block-end: var(--space-3xs);
  border-block-end: 1px solid var(--surface-faint);
}

.sink__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
  align-items: center;
}

.sink__grid {
  display: grid;
  gap: var(--space-m);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  align-items: start;
}

.sink__card {
  max-inline-size: 22rem;
  padding: var(--space-m);
  gap: var(--space-2xs);
}

.sink__icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: var(--space-s);
  padding: 0;
  margin: 0;
  list-style: none;
}

.sink__icon {
  display: grid;
  gap: var(--space-3xs);
  justify-items: center;
  padding: var(--space-2xs);
  font-size: 0.68rem;
  color: var(--surface-dim);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-m);
}
</style>
