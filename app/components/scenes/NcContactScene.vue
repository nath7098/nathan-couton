<script setup lang="ts">
import { CONTACT } from '~/data/contact'

/**
 * Scene 07 — contact (SPEC §6.7).
 *
 * One viewport wide, edge to edge, and pinned: the rail parks the scene and
 * hands the rest of the page's scroll to the Knight's walk across it. Nothing
 * on this scene slides sideways with the track, so the panel has a fixed place
 * on screen and simply arrives.
 *
 * It arrives on one cue and one only: the Knight sitting down. The walk is the
 * invitation the sign spells out, and putting the form on screen while he is
 * still crossing the cavern answers it before it has been made — worse, it
 * gives the visitor somewhere else to look for the two seconds the scene is
 * about. So it is not there at all until he is on the bench, and then it
 * settles in, a beat behind his flare.
 *
 * It is parked clear of the centre, because the centre is where he sits down.
 */
const { t } = useI18n()
const toast = useToast()
const { values, company, errors, status, touch, submit } = useContactForm()

/** The one cue the panel answers to. */
const { arrived: seated } = useContactWalk()

const socialIcon = { linkedin: 'linkedin', github: 'github', gitlab: 'gitlab' } as const

const isPhone = ref(false)
onMounted(() => {
  isPhone.value = window.matchMedia('(hover: none) and (pointer: coarse)').matches
})

/**
 * On a phone the number should dial. On a desktop it should land in the
 * clipboard — v1 used vue3-clipboard for this; the platform does it now.
 */
async function copyPhone() {
  try {
    await navigator.clipboard.writeText(CONTACT.phone)
    toast.success(t('contact.copy_phone.ok'))
  }
  catch {
    toast.error(t('contact.copy_phone.ko'))
  }
}
</script>

<template>
  <div
    class="contact"
    :class="{ 'is-seated': seated }"
  >
    <NcHollowScene />

    <div class="contact__panel">
      <div class="contact__intro">
        <NcHeading :level="2">
          {{ t('contact.title') }}
        </NcHeading>

        <ul class="contact__points">
          <li
            v-for="item in CONTACT.social"
            :key="item.id"
          >
            <a
              class="contact__point"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="t('a11y.openExternal', { name: item.label })"
            >
              <NcIcon
                :name="socialIcon[item.id]"
                size="1.6rem"
              />
            </a>
          </li>
          <li>
            <a
              class="contact__point"
              :href="`mailto:${CONTACT.email}`"
              :aria-label="CONTACT.email"
            >
              <NcIcon
                name="mail"
                size="1.6rem"
              />
            </a>
          </li>
          <li>
            <a
              v-if="isPhone"
              class="contact__point"
              :href="`tel:${CONTACT.phone}`"
              :aria-label="CONTACT.phoneDisplay"
            >
              <NcIcon
                name="phone"
                size="1.6rem"
              />
            </a>
            <button
              v-else
              type="button"
              class="contact__point"
              :aria-label="CONTACT.phoneDisplay"
              @click="copyPhone"
            >
              <NcIcon
                name="copy"
                size="1.6rem"
              />
            </button>
          </li>
        </ul>
      </div>

      <form
        class="contact__form"
        novalidate
        @submit.prevent="submit"
      >
        <p class="contact__form-title">
          {{ t('contact.mail_title') }}
        </p>

        <div class="contact__fields">
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
          :maxlength="2000"
          required
          @blur="touch('message')"
        />

        <!-- Honeypot: off-screen, not hidden, so bots fill it and people never
           reach it. aria-hidden and tabindex keep it out of the real flow. -->
        <div
          class="contact__honeypot"
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
          variant="solid"
          type="submit"
          :loading="status === 'submitting'"
        >
          {{ status === 'submitting' ? t('contact.sending') : t('contact.send') }}
        </NcButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.contact {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
}

/* ── The destination ───────────────────────────────────────────────────────
   Parked in the right-hand band of a scene that no longer moves, so there is
   nothing to keep it in sync with: it has one place on screen, and only fades
   and settles on the way in.

   The width is capped so its left edge always clears the bench at the centre
   of the screen — the Knight has to be visible sitting on it while the form is
   being filled in, or the whole scene is just wallpaper behind a card. */
.contact__panel {
  position: absolute;
  z-index: 1;
  inset-inline-end: var(--gutter);
  inset-block-start: 50%;
  translate: 0 -50%;
  inline-size: min(34rem, 34vw);
  display: grid;
  gap: var(--space-m);
  padding: var(--space-l);
  /* The artwork is bright in places; this panel keeps the text readable over
     it without hiding the scene. */
  background: color-mix(in oklab, var(--background) 78%, transparent);
  backdrop-filter: blur(10px);
  border: 1px solid color-mix(in oklab, var(--surface) 14%, transparent);
  border-radius: var(--radius-l);
}

/* ── Held back until he sits ───────────────────────────────────────────────
   Inside the rail's own media query, so the stacked layout — which has no
   walk and draws him already sitting — never sees any of it and the form is
   simply there, as it was in v1.

   `visibility`, not `opacity` alone: a form faded to nothing still takes tab
   stops and still reads out, and a panel the visitor cannot see is not one
   they should be able to type into. It is discrete rather than interpolated,
   so it gets a line of the transition to itself: it lifts on the way in, with
   the fade, and only comes back once the fade out has finished. */
@media (--rail) {
  .contact__panel {
    opacity: 0;
    visibility: hidden;
    transform: translate3d(2.5rem, 0, 0);
    transition:
      opacity var(--dur-slow) var(--ease-out-expo),
      transform var(--dur-slow) var(--ease-out-expo),
      visibility 0s linear var(--dur-slow);
  }

  .contact.is-seated .contact__panel {
    opacity: 1;
    visibility: visible;
    transform: translate3d(0, 0, 0);
    /* A beat behind him: the flare gets its instant to itself, and the panel
       reads as an answer to it rather than as part of it. Matches FLASH_MS in
       NcHollowScene. */
    transition-delay: 260ms;
  }
}

/* Reduced motion collapses every duration on the page already (see reset.css);
   the delay is the one piece of choreography left, and waiting on a flare that
   is not playing is just a form that arrives late for no reason. */
:root[data-motion='reduced'] .contact__panel {
  transition-delay: 0s;
}

.contact__intro {
  display: grid;
  gap: var(--space-s);
}

.contact__points {
  display: flex;
  gap: var(--space-2xs);
  padding: 0;
  margin: 0;
  list-style: none;
}

.contact__point {
  display: grid;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  color: var(--primary-text);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-m);
  transition:
    color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo),
    transform var(--dur-fast) var(--ease-spring);
}

@media (hover: hover) {
  .contact__point:hover {
    color: var(--secondary-text);
    border-color: var(--secondary);
    transform: translateY(-2px);
  }
}

/* Off-screen rather than display:none — a bot reading the DOM still finds it. */
.contact__honeypot {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.contact__form {
  display: grid;
  gap: var(--space-s);
  justify-items: start;
}

.contact__form-title {
  font-size: var(--step-0);
  color: var(--surface);
}

.contact__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-m);
  inline-size: 100%;
}

.contact__form > :deep(.nc-field) {
  inline-size: 100%;
}

/* ── Stacked layout ────────────────────────────────────────────────────────
   No rail, so no walk: the panel returns to the normal flow over a still
   backdrop, and the scene reads as it did in v1. */
@media not all and (--rail) {
  .contact {
    display: grid;
    place-items: center;
    /* Clears the band of Greenpath the scene draws along the bottom — see the
       stacked-layout note in NcHollowScene. Same expression, so the two cannot
       drift. */
    padding-block-end: calc(768 * 0.0732vw + var(--space-m));
  }

  .contact__panel {
    position: relative;
    inset: auto;
    translate: none;
    inline-size: min(48rem, 100%);
  }

  .contact__fields {
    grid-template-columns: 1fr;
  }
}
</style>
