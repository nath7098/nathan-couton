import type { ValidationIssue } from '../../server/utils/contact-validation'

/**
 * Contact form state and submission.
 *
 * Client-side validation mirrors the server's rules, but only as a courtesy:
 * the server re-checks everything (server/utils/contact-validation.ts).
 * Fields are validated on blur, then live once touched — so nobody is told
 * their email is wrong while they are still typing it.
 */
type Field = 'name' | 'email' | 'message'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN = { name: 2, message: 10 } as const
const MAX_MESSAGE = 2000

export function useContactForm() {
  const { t } = useI18n()
  const toast = useToast()

  const values = reactive<Record<Field, string>>({ name: '', email: '', message: '' })
  /** Honeypot. Hidden from people, irresistible to bots. */
  const company = ref('')
  const touched = reactive<Record<Field, boolean>>({ name: false, email: false, message: false })
  const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const openedAt = ref(Date.now())

  function checkField(field: Field): string | undefined {
    const value = values[field].trim()

    if (field === 'name') {
      if (!value) return t('contact.errors.nameRequired')
      if (value.length < MIN.name) return t('contact.errors.nameTooShort')
    }
    if (field === 'email') {
      if (!value) return t('contact.errors.emailRequired')
      if (!EMAIL.test(value)) return t('contact.errors.emailInvalid')
    }
    if (field === 'message') {
      if (!value) return t('contact.errors.messageRequired')
      if (value.length < MIN.message) return t('contact.errors.messageTooShort')
      if (value.length > MAX_MESSAGE) return t('contact.errors.messageTooLong')
    }
    return undefined
  }

  /** Only surfaces an error once the field has been left at least once. */
  const errors = computed(() => ({
    name: touched.name ? checkField('name') : undefined,
    email: touched.email ? checkField('email') : undefined,
    message: touched.message ? checkField('message') : undefined,
  }))

  const isValid = computed(() =>
    (['name', 'email', 'message'] as Field[]).every(field => !checkField(field)))

  function touch(field: Field) {
    touched[field] = true
  }

  async function submit() {
    for (const field of ['name', 'email', 'message'] as Field[]) touched[field] = true
    if (!isValid.value || status.value === 'submitting') return

    status.value = 'submitting'
    try {
      await $fetch('/api/contact', {
        method: 'POST',
        body: {
          name: values.name,
          email: values.email,
          message: values.message,
          company: company.value,
          elapsed: Date.now() - openedAt.value,
        },
      })
      status.value = 'success'
      toast.success(t('contact.mail_response.ok'))
      values.name = ''
      values.email = ''
      values.message = ''
      for (const field of ['name', 'email', 'message'] as Field[]) touched[field] = false
      openedAt.value = Date.now()
    }
    catch (error) {
      status.value = 'error'
      const statusCode = (error as { statusCode?: number }).statusCode
      // 429 deserves its own words: the message was fine, the timing was not.
      toast.error(statusCode === 429 ? t('contact.mail_response.tooMany') : t('contact.mail_response.ko'))
    }
  }

  return { values, company, errors, isValid, status, touch, submit }
}

export type { ValidationIssue }
