<script setup lang="ts">
import { CONTACT } from '~/data/contact'

/**
 * Scene 07 — contact.
 *
 * The Hollow Knight backdrop sits behind, the contact points and the working
 * form in front. Submission goes through /api/contact, the site's only
 * serverless function.
 */
const { t } = useI18n()
const toast = useToast()
const { values, company, errors, status, touch, submit } = useContactForm()

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
  <div class="contact">
    <NcHollowScene />

    <div class="contact__inner">
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
/* Fills the scene so the backdrop can too. The content starts at the left
   edge: this scene is two viewports wide, and centring would park it off
   screen until you had scrolled halfway through. */
.contact {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  display: grid;
  place-items: center start;
}

.contact__inner {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  /* Fits inside the first viewport, gutters included, so nothing is clipped on
     arrival; the backdrop keeps travelling for the scene's second viewport. */
  inline-size: min(78rem, calc(100vw - 2 * var(--gutter)));
  padding: var(--space-l);
  /* The artwork is bright in places; this panel keeps the text readable over
     it without hiding the scene. */
  background: color-mix(in oklab, var(--background) 72%, transparent);
  backdrop-filter: blur(6px);
  border: 1px solid color-mix(in oklab, var(--surface) 12%, transparent);
  border-radius: var(--radius-l);
}

.contact__intro {
  display: grid;
  gap: var(--space-l);
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

@media not all and (min-width: 1024px) {
  .contact__inner {
    grid-template-columns: 1fr;
    gap: var(--space-l);
  }

  .contact__fields {
    grid-template-columns: 1fr;
  }
}
</style>
