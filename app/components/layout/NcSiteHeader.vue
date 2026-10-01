<script setup lang="ts">
import { CONTACT } from '~/data/contact'
import { SECTIONS, type SectionId } from '~/data/sections'

/**
 * The header — the site's navigation, now that the rail's dots are gone.
 *
 * What a recruiter looks for first is in it, on every screen of the page: the
 * sections by name, the CV, and where Nathan stands. Over the finale it steps
 * back: no glass, no blur on top of the painting (the blurred band it used to
 * leave across the artwork's sky was the first thing seen of Greenpath).
 *
 * Below 1024px the links move into a native popover menu: no JS to open it,
 * light-dismiss and Escape for free.
 */
const { t } = useI18n()
const { active, goTo } = useSections()

const links = SECTIONS.filter(section => section.nav)
const overArt = computed(() => active.value === 'contact')

const menu = ref<HTMLElement>()
const palette = useState('nc-palette', () => false)

/** Mac or not decides the key shown; it is decoration until mounted. */
const isMac = ref(false)
onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/.test(navigator.platform)
})

function follow(event: MouseEvent, id: SectionId) {
  // A plain anchor would work — and does, without JS — but it jumps. This
  // scrolls, and lands the contact link on the form rather than on the top of
  // the finale.
  event.preventDefault()
  menu.value?.hidePopover?.()
  goTo(id)
}
</script>

<template>
  <header
    class="site-header"
    :class="{ 'is-over-art': overArt }"
  >
    <a
      class="site-header__brand"
      href="#home"
      @click="follow($event, 'home')"
    >
      <span aria-hidden="true">&lt;</span>Nathan Couton<span aria-hidden="true">&nbsp;/&gt;</span>
    </a>

    <nav
      class="site-header__nav"
      :aria-label="t('a11y.mainNav')"
    >
      <ol class="site-header__links">
        <li
          v-for="(section, index) in links"
          :key="section.id"
        >
          <a
            class="site-header__link"
            :href="`#${section.id}`"
            :aria-current="active === section.id ? 'location' : undefined"
            @click="follow($event, section.id)"
          >
            <span
              class="site-header__index"
              aria-hidden="true"
            >{{ String(index + 2).padStart(2, '0') }}</span>
            {{ t(`sections.${section.id}.nav`) }}
          </a>
        </li>
      </ol>
    </nav>

    <div class="site-header__tools">
      <NcNowPill class="site-header__now" />

      <NcButton
        class="site-header__cv"
        variant="primary"
        size="sm"
        icon="download"
        :href="CONTACT.resume"
        :download="CONTACT.resumeName"
        :aria-label="t('a11y.downloadResume')"
      >
        {{ t('header.resume') }}
      </NcButton>

      <button
        type="button"
        class="site-header__palette"
        :aria-label="t('palette.open')"
        :title="t('palette.open')"
        @click="palette = true"
      >
        <kbd>{{ isMac ? '⌘' : 'Ctrl' }}</kbd><kbd>K</kbd>
      </button>

      <div class="site-header__prefs">
        <NcLocaleSwitch />
        <NcThemeToggle />
      </div>

      <button
        type="button"
        class="site-header__menu-button"
        popovertarget="site-menu"
        :aria-label="t('header.menu')"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </div>

    <div
      id="site-menu"
      ref="menu"
      class="site-header__menu"
      popover
    >
      <ol class="site-header__menu-links">
        <li
          v-for="(section, index) in links"
          :key="section.id"
        >
          <a
            class="site-header__menu-link"
            :href="`#${section.id}`"
            :aria-current="active === section.id ? 'location' : undefined"
            @click="follow($event, section.id)"
          >
            <span
              class="site-header__index"
              aria-hidden="true"
            >{{ String(index + 2).padStart(2, '0') }}</span>
            {{ t(`sections.${section.id}.nav`) }}
          </a>
        </li>
      </ol>
      <div class="site-header__menu-prefs">
        <NcNowPill />
        <div class="site-header__prefs site-header__prefs--menu">
          <NcLocaleSwitch />
          <NcThemeToggle />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 30;
  display: flex;
  gap: var(--space-m);
  align-items: center;
  justify-content: space-between;
  block-size: var(--header-h);
  padding-inline: var(--gutter);
  background: var(--glass);
  backdrop-filter: blur(14px) saturate(1.2);
  border-block-end: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
  transition:
    background-color var(--dur-slow) var(--ease-out-expo),
    border-color var(--dur-slow) var(--ease-out-expo);
}

/* Over the painting: the header lets it breathe. Its text is set light
   whatever the theme, because what is behind it is always the dark cavern.
   Wide screens only: below `--stage-wide` the form follows the stage in the
   flow, and a transparent header would let it scroll through underneath. */
@media (--stage-wide) {
  .site-header.is-over-art {
    background: transparent;
    backdrop-filter: none;
    border-color: transparent;

    --text: oklch(0.95 0.006 245);
    --text-dim: oklch(0.82 0.012 245);
    --text-faint: oklch(0.74 0.014 245);
    --brand-ink: var(--gp-glow);
    --line: oklch(0.5 0.02 245);
    --line-strong: oklch(0.7 0.02 245);
  }
}

.site-header__brand {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
}

.site-header__brand span {
  color: var(--brand-ink);
}

.site-header__links {
  display: flex;
  gap: clamp(0.75rem, 2vw, 2rem);
  padding: 0;
  margin: 0;
  list-style: none;
}

.site-header__link {
  position: relative;
  display: inline-flex;
  gap: 0.4em;
  align-items: baseline;
  padding-block: 0.4rem;
  font-size: var(--step--1);
  color: var(--text-dim);
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--dur-base) var(--ease-out-expo);
}

.site-header__link::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: 1px;
  background: var(--brand);
  scale: 0 1;
  transform-origin: left;
  transition: scale var(--dur-slow) var(--ease-out-expo);
}

.site-header__link[aria-current] {
  color: var(--text);
}

.site-header__link[aria-current]::after {
  scale: 1 1;
}

@media (hover: hover) {
  .site-header__link:hover {
    color: var(--text);
  }
}

.site-header__index {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--brand-ink);
}

.site-header__tools {
  display: flex;
  flex: 0 0 auto;
  gap: var(--space-s);
  align-items: center;
}

.site-header__palette {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  color: var(--text-dim);
}

.site-header__palette kbd {
  padding: 0.1em 0.4em;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.4;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-s);
  transition: color var(--dur-base) var(--ease-out-expo), border-color var(--dur-base) var(--ease-out-expo);
}

@media (hover: hover) {
  .site-header__palette:hover kbd {
    color: var(--brand-ink);
    border-color: var(--brand);
  }
}

.site-header__prefs {
  display: flex;
  gap: var(--space-s);
  align-items: center;
}

/* ── Narrow: the menu ──────────────────────────────────────────────────── */
.site-header__menu-button {
  display: none;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  align-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
}

.site-header__menu-button span {
  display: block;
  inline-size: 1rem;
  block-size: 1.5px;
  background: currentcolor;
}

.site-header__menu {
  inset: var(--header-h) var(--space-s) auto auto;
  inline-size: min(22rem, calc(100vw - 2 * var(--space-s)));
  margin: 0;
  padding: var(--space-m);
  color: var(--text);
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-3);
}

.site-header__menu-links {
  display: grid;
  gap: var(--space-3xs);
  padding: 0;
  margin: 0 0 var(--space-m);
  list-style: none;
}

.site-header__menu-link {
  display: flex;
  gap: var(--space-xs);
  align-items: baseline;
  padding-block: var(--space-2xs);
  font-family: var(--font-display);
  font-size: var(--step-2);
  color: var(--text);
  text-decoration: none;
}

.site-header__menu-link[aria-current] {
  color: var(--brand-ink);
}

.site-header__menu-prefs {
  display: grid;
  gap: var(--space-s);
  padding-block-start: var(--space-s);
  border-block-start: 1px solid var(--line);
}

/* The header must never be wider than the screen: what goes first is what is
   said elsewhere on the page too (the status is in the hero and the profile),
   then the palette's key hint (the shortcut still works). */
@media (width < 1440px) {
  .site-header__now {
    display: none;
  }
}

@media (width < 1180px) {
  .site-header__palette {
    display: none;
  }
}

@media (width < 1024px) {
  .site-header__nav,
  .site-header__palette,
  .site-header__tools > .site-header__prefs {
    display: none;
  }

  .site-header__menu-button {
    display: inline-flex;
  }
}

@media (width < 380px) {
  .site-header__cv :deep(.nc-button__label) {
    display: none;
  }
}
</style>
