<script setup lang="ts">
import { CONTACT } from '~/data/contact'

/**
 * Scene 07 — contact.
 *
 * L3 puts the real content in place: heading, contact points and the form
 * shell. The Hollow Knight parallax, the easter egg and the working submit
 * arrive in L5.
 */
const { t } = useI18n()

const name = ref('')
const email = ref('')
const message = ref('')

const socialIcon = { linkedin: 'linkedin', github: 'github', gitlab: 'gitlab' } as const
</script>

<template>
  <div class="contact">
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
            class="contact__point"
            :href="`tel:${CONTACT.phone}`"
            :aria-label="CONTACT.phoneDisplay"
          >
            <NcIcon
              name="phone"
              size="1.8rem"
            />
          </a>
        </li>
      </ul>
    </div>

    <form
      class="contact__form"
      @submit.prevent
    >
      <p class="contact__form-title">
        {{ t('contact.mail_title') }}
      </p>

      <div class="contact__fields">
        <NcField
          v-model="name"
          :label="t('contact.name')"
          name="name"
          autocomplete="name"
          required
        />
        <NcField
          v-model="email"
          :label="t('contact.email')"
          name="email"
          type="email"
          autocomplete="email"
          required
        />
      </div>

      <NcField
        v-model="message"
        :label="t('contact.message')"
        name="message"
        type="textarea"
        :maxlength="2000"
        required
      />

      <NcButton
        variant="solid"
        type="submit"
      >
        {{ t('contact.send') }}
      </NcButton>
    </form>
  </div>
</template>

<style scoped>
.contact {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
  inline-size: min(64rem, 100%);
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
  .contact {
    grid-template-columns: 1fr;
    gap: var(--space-l);
  }

  .contact__fields {
    grid-template-columns: 1fr;
  }
}
</style>
