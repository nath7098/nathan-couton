<script setup lang="ts">
import { NOW } from '~/data/now'

/**
 * Where Nathan stands, in one line: `● En mission · Tours`.
 *
 * Plain facts the page already states elsewhere. Whether to add "open to
 * offers" is the owner's call, not the site's — it is a flag in `now.ts`,
 * off by default.
 */
const { t } = useI18n()
</script>

<template>
  <p
    class="now"
    :class="`is-${NOW.status}`"
  >
    <span
      class="now__dot"
      aria-hidden="true"
    />
    <span class="now__text">
      {{ t(`now.${NOW.status}`, { client: NOW.client }) }}<template v-if="NOW.openToOffers"> · {{ t('now.open') }}</template>
    </span>
  </p>
</template>

<style scoped>
.now {
  display: inline-flex;
  gap: 0.55em;
  align-items: center;
  padding: 0.3em 0.8em 0.3em 0.65em;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
  white-space: nowrap;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
}

.now__dot {
  position: relative;
  inline-size: 0.5rem;
  block-size: 0.5rem;
  background: var(--brand);
  border-radius: 50%;
}

.now__dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  animation: now-ping 2.4s var(--ease-out-expo) infinite;
}

.now.is-available .now__dot {
  background: var(--warm);
}

@keyframes now-ping {
  0% {
    opacity: 0.7;
    scale: 1;
  }

  70%,
  100% {
    opacity: 0;
    scale: 2.6;
  }
}

:root[data-motion='reduced'] .now__dot::after {
  animation: none;
  opacity: 0;
}
</style>
