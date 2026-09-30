<script setup lang="ts">
import { CONTACT } from '~/data/contact'
import { SUBJECTS } from '~/composables/useContactForm'

/**
 * The contact panel — the answer to the sign.
 *
 * On a wide screen it arrives over the scene on one cue: the Knight sitting
 * down. Until then it is not there at all — transparent *and* `inert`, since a
 * form nobody can see must not be one a keyboard can land in. Below
 * `--stage-wide` it simply follows the stage in the flow.
 *
 * What a recruiter needs is on the panel itself, not behind the form: the
 * address in plain text, the CV, LinkedIn. The form is for everyone else.
 */
const { t } = useI18n()
const toast = useToast()
const finale = useFinale()
const { values, subject, company, errors, status, touch, submit } = useContactForm()

const away = computed(() => !finale.arrived.value)

const socialIcon = { linkedin: 'linkedin', github: 'github', gitlab: 'gitlab' } as const

const isPhone = ref(false)
onMounted(() => {
  isPhone.value = window.matchMedia('(hover: none) and (pointer: coarse)').matches
})

async function copy(value: string, ok: string, ko: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(t(ok))
  }
  catch {
    toast.error(t(ko))
  }
}
</script>

<template>
  <div
    class="panel"
    :class="{ 'is-away': away }"
    :inert="away"
  >
    <header class="panel__head">
      <p
        class="panel__prompt"
        aria-hidden="true"
      >
        <span class="panel__dollar">$</span> ./contact.sh
      </p>
      <p class="panel__title">
        {{ t('contact.title') }}
      </p>
      <p class="panel__lede">
        {{ t('contact.lede') }}
      </p>
    </header>

    <div class="panel__direct">
      <div class="panel__mail">
        <a
          class="panel__address"
          :href="`mailto:${CONTACT.email}`"
        >{{ CONTACT.email }}</a>
        <button
          type="button"
          class="panel__icon"
          :aria-label="t('contact.copyEmail')"
          :title="t('contact.copyEmail')"
          @click="copy(CONTACT.email, 'contact.copied', 'contact.copy_error')"
        >
          <NcIcon
            name="copy"
            size="1.1rem"
          />
        </button>
      </div>

      <div class="panel__row">
        <NcButton
          variant="primary"
          size="sm"
          icon="download"
          :href="CONTACT.resume"
          :download="CONTACT.resumeName"
          :aria-label="t('a11y.downloadResume')"
        >
          {{ t('header.resume') }}
        </NcButton>

        <ul class="panel__points">
          <li
            v-for="item in CONTACT.social"
            :key="item.id"
          >
            <a
              class="panel__icon"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="t('a11y.openExternal', { name: item.label })"
              :title="item.label"
            >
              <NcIcon
                :name="socialIcon[item.id]"
                size="1.2rem"
              />
            </a>
          </li>
          <li>
            <a
              v-if="isPhone"
              class="panel__icon"
              :href="`tel:${CONTACT.phone}`"
              :aria-label="CONTACT.phoneDisplay"
            >
              <NcIcon
                name="phone"
                size="1.2rem"
              />
            </a>
            <button
              v-else
              type="button"
              class="panel__icon"
              :aria-label="t('contact.copyPhone', { phone: CONTACT.phoneDisplay })"
              :title="CONTACT.phoneDisplay"
              @click="copy(CONTACT.phone, 'contact.copied', 'contact.copy_phone.ko')"
            >
              <NcIcon
                name="phone"
                size="1.2rem"
              />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <form
      class="panel__form"
      novalidate
      @submit.prevent="submit"
    >
      <fieldset class="panel__subjects">
        <legend class="panel__legend">
          {{ t('contact.subjectLegend') }}
        </legend>
        <label
          v-for="item in SUBJECTS"
          :key="item"
          class="panel__subject"
        >
          <input
            v-model="subject"
            type="radio"
            name="subject"
            :value="item"
          >
          <span>{{ t(`contact.subjects.${item}`) }}</span>
        </label>
      </fieldset>

      <div class="panel__fields">
        <NcField
          v-model="values.name"
          :label="t('contact.name')"
          :error="errors.name"
          name="name"
          autocomplete="name"
          required
          @blur="touch('name')"
        />
        <NcField
          v-model="values.email"
          :label="t('contact.email')"
          :error="errors.email"
          name="email"
          type="email"
          autocomplete="email"
          required
          @blur="touch('email')"
        />
      </div>

      <NcField
        v-model="values.message"
        :label="t('contact.message')"
        :error="errors.message"
        name="message"
        type="textarea"
        :rows="3"
        :maxlength="2000"
        required
        @blur="touch('message')"
      />

      <!-- Honeypot: off-screen, not hidden, so bots fill it and people never
           reach it. aria-hidden and tabindex keep it out of the real flow. -->
      <div
        class="panel__honeypot"
        aria-hidden="true"
      >
        <label for="contact-company">Company</label>
        <input
          id="contact-company"
          v-model="company"
          type="text"
          name="company"
          tabindex="-1"
          autocomplete="off"
        >
      </div>

      <NcButton
        variant="primary"
        type="submit"
        icon-end="arrow-right"
        :loading="status === 'submitting'"
      >
        {{ status === 'submitting' ? t('contact.sending') : t('contact.send') }}
      </NcButton>
    </form>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--space-m);
  inline-size: min(40rem, 100%);
  padding: clamp(1.25rem, 2.4vw, 2rem);
  color: var(--text);
  /* Over the artwork, whichever theme is on: the scene is dark in both, so the
     panel is too. Its own tokens are pinned to the dark values. */
  background: color-mix(in oklab, #0d1a20 84%, transparent);
  backdrop-filter: blur(14px) saturate(1.1);
  border: 1px solid color-mix(in oklab, var(--gp-glow) 22%, transparent);
  border-radius: var(--radius-l);
  box-shadow: 0 30px 80px rgb(0 0 0 / 35%);
}

.panel__head {
  display: grid;
  gap: var(--space-2xs);
}

.panel__prompt {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: color-mix(in oklab, var(--gp-glow) 80%, white);
}

.panel__dollar {
  color: var(--warm);
}

.panel__title {
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 560;
  line-height: 1.05;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

.panel__lede {
  color: var(--text-dim);
  font-size: var(--step--1);
  line-height: 1.5;
}

.panel__direct {
  display: grid;
  gap: var(--space-s);
  padding-block: var(--space-s);
  border-block: 1px solid color-mix(in oklab, var(--text) 12%, transparent);
}

.panel__mail {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  flex-wrap: wrap;
}

.panel__address {
  font-family: var(--font-mono);
  font-size: var(--step-0);
  color: var(--gp-glow);
  text-decoration-color: color-mix(in oklab, var(--gp-glow) 40%, transparent);
  overflow-wrap: anywhere;
}

.panel__row {
  display: flex;
  gap: var(--space-s);
  align-items: center;
  flex-wrap: wrap;
}

.panel__points {
  display: flex;
  gap: var(--space-3xs);
  padding: 0;
  margin: 0;
  list-style: none;
}

.panel__icon {
  display: grid;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  color: var(--text-dim);
  border: 1px solid color-mix(in oklab, var(--text) 16%, transparent);
  border-radius: 50%;
  transition:
    color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo);
}

@media (hover: hover) {
  .panel__icon:hover {
    color: var(--gp-glow);
    border-color: var(--gp-glow);
  }
}

.panel__form {
  display: grid;
  gap: var(--space-s);
  justify-items: start;
}

.panel__form > :deep(.nc-field) {
  inline-size: 100%;
}

.panel__subjects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  padding: 0;
  margin: 0;
  border: 0;
}

.panel__legend {
  inline-size: 100%;
  margin-block-end: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
  float: inline-start;
}

.panel__subject {
  position: relative;
  cursor: pointer;
}

.panel__subject input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
}

.panel__subject span {
  display: inline-block;
  padding: 0.3em 0.9em;
  font-size: var(--step--1);
  color: var(--text-dim);
  border: 1px solid color-mix(in oklab, var(--text) 22%, transparent);
  border-radius: var(--radius-pill);
  transition:
    color var(--dur-base) var(--ease-out-expo),
    background-color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo);
}

.panel__subject input:checked + span {
  color: var(--on-brand);
  background: var(--gp-glow);
  border-color: var(--gp-glow);
}

.panel__subject input:focus-visible + span {
  outline: 2px solid var(--gp-glow);
  outline-offset: 2px;
}

.panel__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-s);
  inline-size: 100%;
}

/* Off-screen rather than display:none — a bot reading the DOM still finds it. */
.panel__honeypot {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ── Arriving over the scene ───────────────────────────────────────────────
   Wide screens only; below, the panel is in the flow and always there. The
   width keeps its left edge clear of the bench at the centre of the screen —
   the Knight has to be seen sitting on it while the form is filled in.

   The slide is one `translate` declaration, not `translate` plus `transform`:
   a build step folded that pair once and kept the wrong half (HANDOFF). */
@media (--stage-wide) {
  .panel {
    inline-size: min(30rem, 33vw);
    max-block-size: calc(100svh - var(--header-h) - var(--space-l));
    overflow: auto;
    translate: 2.5rem 0;
    opacity: 0;
    transition:
      opacity var(--dur-slow) var(--ease-out-expo),
      translate var(--dur-slow) var(--ease-out-expo);
  }

  .panel:not(.is-away) {
    translate: 0 0;
    opacity: 1;
    /* A beat behind his flare, so the panel reads as its answer. */
    transition-delay: 260ms;
  }
}

:root[data-motion='reduced'] .panel {
  transition-delay: 0s;
}
</style>
