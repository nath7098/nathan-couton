<script setup lang="ts">
/**
 * Locale switch: `FR / EN`, in the mono of the code thread.
 *
 * Real links to the other prerendered page, so the choice works without JS
 * and can be opened in a new tab. The v1 flags are gone — a flag names a
 * country, not a language, and two of them were the loudest thing in the
 * header.
 */
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav
    class="locale-switch"
    :aria-label="t('a11y.selectLanguage')"
  >
    <ul class="locale-switch__list">
      <li
        v-for="item in locales"
        :key="item.code"
      >
        <NuxtLink
          class="locale-switch__link"
          :class="{ 'is-current': item.code === locale }"
          :to="switchLocalePath(item.code)"
          :aria-current="item.code === locale ? 'true' : undefined"
          :lang="item.language"
          :title="item.name"
        >
          <span aria-hidden="true">{{ item.code.toUpperCase() }}</span>
          <span class="nc-sr-only">{{ item.name }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.locale-switch__list {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.locale-switch__list li + li::before {
  content: '/';
  margin-inline: 0.35em;
  color: var(--text-faint);
}

.locale-switch__link {
  display: inline-block;
  padding-block: 0.25em;
  color: var(--text-faint);
  text-decoration: none;
  transition: color var(--dur-base) var(--ease-out-expo);
}

.locale-switch__link.is-current {
  color: var(--text);
}

@media (hover: hover) {
  .locale-switch__link:hover {
    color: var(--brand-ink);
  }
}
</style>
