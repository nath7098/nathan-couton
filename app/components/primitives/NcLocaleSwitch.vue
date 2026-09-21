<script setup lang="ts">
/**
 * Locale switch — the v1 interaction, rebuilt.
 *
 * Kept: the selected flag sits alone until hovered, then the alternatives slide
 * out beside it. Fixed: v1 loaded flags from cdn.countryflags.com (a third-party
 * request per view) and mutated a computed; these are inline SVG and real links,
 * so the choice survives without JS and can be opened in a new tab.
 */
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const ordered = computed(() => {
  const all = locales.value
  const current = all.find(item => item.code === locale.value) ?? all[0]!
  return [current, ...all.filter(item => item.code !== current.code)]
})
</script>

<template>
  <nav
    class="locale-switch"
    :aria-label="t('a11y.selectLanguage')"
  >
    <ul class="locale-switch__list">
      <li
        v-for="(item, index) in ordered"
        :key="item.code"
        class="locale-switch__item"
        :style="{ '--i': index }"
      >
        <NuxtLink
          class="locale-switch__link"
          :class="{ 'is-current': item.code === locale }"
          :to="switchLocalePath(item.code)"
          :aria-current="item.code === locale ? 'true' : undefined"
          :title="item.name"
        >
          <span class="nc-sr-only">{{ item.name }}</span>

          <!-- Flags drawn inline: two rectangles each, no external request. -->
          <svg
            class="locale-switch__flag"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <defs>
              <clipPath :id="`flag-clip-${item.code}`">
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                />
              </clipPath>
            </defs>
            <g :clip-path="`url(#flag-clip-${item.code})`">
              <template v-if="item.code === 'fr'">
                <rect
                  x="0"
                  y="0"
                  width="8"
                  height="24"
                  fill="#0055a4"
                />
                <rect
                  x="8"
                  y="0"
                  width="8"
                  height="24"
                  fill="#fff"
                />
                <rect
                  x="16"
                  y="0"
                  width="8"
                  height="24"
                  fill="#ef4135"
                />
              </template>
              <template v-else>
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                  fill="#012169"
                />
                <path
                  d="M0 0 24 24M24 0 0 24"
                  stroke="#fff"
                  stroke-width="5"
                />
                <path
                  d="M0 0 24 24M24 0 0 24"
                  stroke="#c8102e"
                  stroke-width="3"
                />
                <path
                  d="M12 0v24M0 12h24"
                  stroke="#fff"
                  stroke-width="8"
                />
                <path
                  d="M12 0v24M0 12h24"
                  stroke="#c8102e"
                  stroke-width="5"
                />
              </template>
            </g>
            <circle
              cx="12"
              cy="12"
              r="11"
              fill="none"
              stroke="currentColor"
              stroke-opacity=".35"
            />
          </svg>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.locale-switch {
  position: relative;
  /* Reserves the collapsed width so the header never shifts on hover. */
  inline-size: 2rem;
  block-size: 2rem;
}

.locale-switch__list {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
}

.locale-switch__item {
  flex: 0 0 auto;
}

/* Alternatives hide behind the current flag and slide out on hover or focus. */
.locale-switch__item:not(:first-child) .locale-switch__link {
  opacity: 0;
  transform: translateX(-2.25rem) scale(0.8);
  pointer-events: none;
  transition:
    opacity var(--dur-base) var(--ease-out-expo),
    transform var(--dur-base) var(--ease-spring);
}

.locale-switch:hover .locale-switch__item:not(:first-child) .locale-switch__link,
.locale-switch:focus-within .locale-switch__item:not(:first-child) .locale-switch__link {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}

.locale-switch__link {
  display: block;
  border-radius: 50%;
  color: var(--surface);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.locale-switch__flag {
  inline-size: 2rem;
  block-size: 2rem;
  display: block;
}

@media (hover: hover) {
  .locale-switch__link:hover {
    transform: scale(1.08);
  }
}

.locale-switch__link.is-current {
  box-shadow: 0 0 0 2px var(--primary);
}
</style>
