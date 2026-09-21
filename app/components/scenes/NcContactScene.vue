<script setup lang="ts">
import { CONTACT } from '~/data/contact'

/**
 * Scene 07 — contact (SPEC §6.7).
 *
 * Three viewports wide, and the layout is the choreography. You arrive on the
 * Knight standing in the Hollow Knight scenery with nothing else on screen;
 * scrolling walks him across two viewports while the backdrop separates into
 * its layers; and the form — parked against the scene's far right edge — rides
 * in behind him, landing flush against the viewport's right gutter at the exact
 * moment he reaches the middle of the bench.
 *
 * The panel needs no transform of its own to do that. It sits at the end of a
 * scene whose right edge finishes level with the viewport's, so the rail
 * delivers it. `--walk` only fades and settles it on the way in.
 */
const { t } = useI18n()
const toast = useToast()
const { values, company, errors, status, touch, submit } = useContactForm()
const { range } = useContactWalk()

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
    :style="{
      '--walk-start': range.start,
      '--walk-end': range.end,
      '--walk-scale': range.scale,
    }"
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
                size="1.8rem"
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
                size="1.8rem"
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
                size="1.8rem"
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
                size="1.8rem"
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
/* ── The walk ──────────────────────────────────────────────────────────────
   Declared here, on the scene root, because both the backdrop and the form
   panel read it and neither contains the other. Path A lets the compositor
   produce it straight from the scroll timeline; path B derives it from the
   --rail-progress that useRail already writes every frame. Neither costs a
   layout read, and the two agree to five decimal places. */
.contact {
  --walk: clamp(0, (var(--rail-progress, 0) - var(--walk-start)) * var(--walk-scale), 1);

  position: relative;
  inline-size: 100%;
  block-size: 100%;
}

@supports (animation-timeline: scroll()) {
  .contact {
    animation: contact-walk linear both;
    animation-timeline: scroll(root block);
    animation-range: calc(var(--walk-start) * 100%) calc(var(--walk-end) * 100%);
  }

  @keyframes contact-walk {
    from { --walk: 0; }
    to { --walk: 1; }
  }
}

/* ── The destination ───────────────────────────────────────────────────────
   Parked against the scene's right edge. The scene's right edge finishes level
   with the viewport's, so at --walk: 1 the panel's own right edge lands exactly
   one gutter in from the right of the screen — no transform involved, and
   nothing to keep in sync with the Knight. It is simply where the walk ends. */
.contact__panel {
  position: absolute;
  z-index: 1;
  /* `.scene` already insets by one gutter, so this is 0, not --gutter: adding
     another would land the panel two gutters in from the right. */
  inset-inline-end: 0;
  inset-block-start: 50%;
  translate: 0 -50%;
  inline-size: min(44rem, 46vw);
  display: grid;
  gap: var(--space-l);
  padding: var(--space-l);
  /* The artwork is bright in places; this panel keeps the text readable over
     it without hiding the scene. */
  background: color-mix(in oklab, var(--background) 76%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid color-mix(in oklab, var(--surface) 14%, transparent);
  border-radius: var(--radius-l);
  /* Settles over the last third of the walk, so it arrives rather than
     appears. Composited: opacity and transform only. */
  opacity: clamp(0, (var(--walk) - 0.6) * 3.4, 1);
  transform: translate3d(calc((1 - clamp(0, (var(--walk) - 0.6) * 3.4, 1)) * 2rem), 0, 0);
}

.contact__intro {
  display: grid;
  gap: var(--space-m);
}

.contact__points {
  display: flex;
  gap: var(--space-s);
  padding: 0;
  margin: 0;
  list-style: none;
}

.contact__point {
  display: grid;
  place-items: center;
  inline-size: 3rem;
  block-size: 3rem;
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
  gap: var(--space-m);
  justify-items: start;
}

.contact__form-title {
  font-size: var(--step-1);
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
    --walk: 1;

    display: grid;
    place-items: center;
    animation: none;
  }

  .contact__panel {
    position: relative;
    inset: auto;
    translate: none;
    transform: none;
    opacity: 1;
    inline-size: min(48rem, 100%);
  }

  .contact__fields {
    grid-template-columns: 1fr;
  }
}
</style>
