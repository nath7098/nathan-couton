import { CONTACT } from '~/data/contact'

/**
 * Page metadata and structured data (SPEC §10.3).
 *
 * Both locales are prerendered, so everything here is baked into the HTML:
 * canonical, hreflang alternates, OpenGraph, and the JSON-LD a search engine
 * reads to know who this page is about.
 */
export function useSiteSeo() {
  const { t, locale } = useI18n()
  const config = useRuntimeConfig()
  const site = config.public.siteUrl

  const description = computed(() => t('seo.description'))
  const title = computed(() => `Nathan Couton — ${t('home.position')}`)

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    author: 'Nathan Couton',

    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: 'website',
    ogUrl: () => `${site}${locale.value === 'fr' ? '/' : '/en'}`,
    ogImage: `${site}/nc_logo_static.png`,
    ogImageAlt: 'Nathan Couton',
    ogSiteName: 'Nathan Couton',
    ogLocale: () => (locale.value === 'fr' ? 'fr_FR' : 'en_GB'),
    ogLocaleAlternate: () => (locale.value === 'fr' ? 'en_GB' : 'fr_FR'),

    twitterCard: 'summary',
    twitterSite: '@nath7098',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: `${site}/nc_logo_static.png`,
  })

  useHead(() => ({
    // `keywords` is not part of useSeoMeta's typed surface (search engines
    // ignore it anyway); kept because v1 carried it.
    meta: [{ name: 'keywords', content: t('seo.keywords') }],
    link: [
      // hreflang alternates come from useLocaleHead({ seo: true }) in app.vue,
      // including x-default. Emitting a second set here only duplicated them.
      { rel: 'canonical', href: `${site}${locale.value === 'fr' ? '/' : '/en'}` },
    ],
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Person',
            '@id': `${site}/#person`,
            'name': 'Nathan Couton',
            'jobTitle': t('home.position'),
            'email': `mailto:${CONTACT.email}`,
            'url': site,
            'image': `${site}/nc_logo_static.png`,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': 'Tours',
              'addressRegion': 'Centre-Val de Loire',
              'addressCountry': 'FR',
            },
            'sameAs': CONTACT.social.map(item => item.href),
            'alumniOf': [
              { '@type': 'CollegeOrUniversity', 'name': 'Polytech Tours' },
              { '@type': 'CollegeOrUniversity', 'name': 'IUT Angoulême' },
            ],
            'knowsAbout': [
              'Vue.js', 'Nuxt', 'TypeScript', 'JavaScript', 'Java', 'Spring',
              'Angular', 'Node.js', 'SQL', 'Web development',
            ],
          },
          {
            '@type': 'WebSite',
            '@id': `${site}/#website`,
            'url': site,
            'name': 'Nathan Couton',
            'description': description.value,
            'inLanguage': locale.value === 'fr' ? 'fr-FR' : 'en-GB',
            'author': { '@id': `${site}/#person` },
          },
        ],
      }),
    }],
  }))
}
