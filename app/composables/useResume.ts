import { CONTACT } from '~/data/contact'

/**
 * The CV in the visitor's language: the French page offers the French PDF,
 * the English page the English one. Both are generated from the site's own
 * data by `npm run cv`.
 */
export function useResume() {
  const { locale } = useI18n()
  return computed(() => {
    const lang = locale.value === 'en' ? 'en' : 'fr'
    return { href: CONTACT.resume[lang], name: CONTACT.resumeName[lang] }
  })
}
