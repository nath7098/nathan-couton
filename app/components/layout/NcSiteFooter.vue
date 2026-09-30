<script setup lang="ts">
import { CONTACT } from '~/data/contact'
import { CONTENT_AS_OF } from '~/data/now'

/**
 * The foot of the page, after the finale has let go.
 *
 * Never inert, never behind a walk: the address, the phone, the CV and the
 * profiles are here in plain text for anyone who scrolled past the scene, and
 * for Ctrl+F. Then the colophon — how the page was built — and the credit the
 * Greenpath artwork is owed.
 */
const { t } = useI18n()
const { goTo } = useSections()

const socialIcon = { linkedin: 'linkedin', github: 'github', gitlab: 'gitlab' } as const

function top(event: MouseEvent) {
  event.preventDefault()
  goTo('home')
}
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__contact">
        <p class="site-footer__label">
          {{ t('footer.reach') }}
        </p>
        <a
          class="site-footer__mail"
          :href="`mailto:${CONTACT.email}`"
        >{{ CONTACT.email }}</a>
        <a
          class="site-footer__phone"
          :href="`tel:${CONTACT.phone}`"
        >{{ CONTACT.phoneDisplay }}</a>
      </div>

      <ul class="site-footer__links">
        <li>
          <a
            :href="CONTACT.resume"
            :download="CONTACT.resumeName"
            :aria-label="t('a11y.downloadResume')"
          >
            <NcIcon name="download" />
            {{ t('header.resume') }}
          </a>
        </li>
        <li
          v-for="item in CONTACT.social"
          :key="item.id"
        >
          <a
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NcIcon :name="socialIcon[item.id]" />
            {{ item.label }}
          </a>
        </li>
      </ul>

      <div class="site-footer__meta">
        <p class="site-footer__colophon">
          {{ t('footer.colophon') }}
        </p>
        <p class="site-footer__credit">
          {{ t('footer.credits') }}
        </p>
        <p class="site-footer__legal">
          <span>© {{ CONTENT_AS_OF.year }} Nathan Couton</span>
          <a
            href="#home"
            @click="top"
          >{{ t('footer.backToTop') }} ↑</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: 1;
  padding: var(--space-2xl) var(--gutter) var(--space-l);
  color: oklch(0.92 0.01 200);
  /* Continues the cavern the finale ends in, whichever theme is on. */
  background: linear-gradient(to bottom, #0b1a1f, #071014);
}

.site-footer__inner {
  display: grid;
  gap: var(--space-xl);
  max-inline-size: var(--content);
  margin-inline: auto;
}

.site-footer__contact {
  display: grid;
  gap: var(--space-2xs);
  justify-items: start;
}

.site-footer__label {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--gp-glow);
}

.site-footer__mail {
  font-family: var(--font-display);
  font-size: var(--step-4);
  font-weight: 500;
  line-height: 1.05;
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
  background: linear-gradient(currentcolor, currentcolor) 0 100% / 0 1px no-repeat;
  transition: background-size var(--dur-slow) var(--ease-out-expo);
}

@media (hover: hover) {
  .site-footer__mail:hover {
    background-size: 100% 1px;
  }
}

.site-footer__phone {
  font-family: var(--font-mono);
  font-size: var(--step-0);
  color: oklch(0.8 0.01 200);
  text-decoration: none;
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s) var(--space-l);
  padding: 0;
  margin: 0;
  list-style: none;
}

.site-footer__links a {
  display: inline-flex;
  gap: var(--space-2xs);
  align-items: center;
  color: oklch(0.86 0.01 200);
  text-decoration: none;
}

@media (hover: hover) {
  .site-footer__links a:hover {
    color: var(--gp-glow);
  }
}

.site-footer__meta {
  display: grid;
  gap: var(--space-2xs);
  padding-block-start: var(--space-m);
  font-size: var(--step--2);
  color: oklch(0.72 0.012 200);
  border-block-start: 1px solid oklch(0.35 0.02 200);
}

.site-footer__colophon {
  font-family: var(--font-mono);
}

.site-footer__legal {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
  justify-content: space-between;
}

.site-footer__legal a {
  color: inherit;
}
</style>
