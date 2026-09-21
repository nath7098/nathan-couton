// Scene ids drive the rail, the nav and the legacy redirects. Single source of truth.
const SCENES = ['home', 'about', 'experience', 'skills', 'education', 'projects', 'contact'] as const

// The v1 site was a multi-page SPA. Those URLs are indexed, so they must survive
// as 301s onto the matching scene. A fragment never reaches the server, so this
// only imposes the hash — it cannot read one.
const legacyRedirects = Object.fromEntries(
  SCENES.filter(scene => scene !== 'home').flatMap(scene => [
    [`/${scene}`, { redirect: { to: `/#${scene}`, statusCode: 301 as const } }],
    [`/en/${scene}`, { redirect: { to: `/en#${scene}`, statusCode: 301 as const } }],
  ]),
)

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  // Components live in folders that describe their role (primitives/, rail/,
  // effects/, scenes/) but are named Nc* already, so the directory must not be
  // prefixed onto the tag — <NcThemeToggle>, not <PrimitivesNcThemeToggle>.
  components: [{ path: '~/components', pathPrefix: false }],
  devtools: { enabled: true },

  app: {
    head: {
      link: [{ rel: 'icon', href: '/favicon.ico' }],
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  css: ['~/assets/css/reset.css', '~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/rail.css'],

  colorMode: {
    classSuffix: '',
    dataValue: 'theme', // writes data-theme="dark|light", which tokens.css keys off
    preference: 'system',
    fallback: 'dark',
    storageKey: 'nc-theme',
  },

  runtimeConfig: {
    public: {
      siteUrl: 'https://nathancouton.fr',
    },
  },

  routeRules: {
    ...legacyRedirects,
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-09-01',

  // Everything is prerendered and served from Vercel's CDN. The only function
  // that ships is POST /api/contact (added in L5).
  nitro: {
    preset: 'vercel',
    prerender: {
      routes: ['/', '/en'],
      crawlLinks: false,
    },
  },

  typescript: { strict: true, typeCheck: false },

  // postcss-custom-media v12 dropped `importFrom`, so the named breakpoints are
  // injected globally first (the csstools-recommended pairing) and resolved
  // after. Nuxt resolves these by name and passes the value as OPTIONS — giving
  // it a plugin instance silently does nothing and leaves `@media (--rail)` in
  // the output.
  postcss: {
    plugins: {
      '@csstools/postcss-global-data': { files: ['app/assets/css/media.css'] },
      'postcss-custom-media': {},
    },
  },
  eslint: { config: { stylistic: true } },

  fonts: {
    families: [{ name: 'JetBrains Mono', provider: 'google', weights: [400, 700] }],
  },

  i18n: {
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
    baseUrl: 'https://nathancouton.fr',
    // Browser-language detection is OFF on purpose.
    //
    // Every page is prerendered, so `/` is French HTML on the CDN. Letting the
    // client redirect an English browser to `/en` after hydration guarantees a
    // markup mismatch (the FR payload hydrates against EN messages) and, in
    // practice, crashes the app. Accept-Language belongs at the edge, not in
    // the client — L6 adds a Vercel redirect for it. French stays the default,
    // which is what v1 fell back to anyway, and the switch works from there.
    detectBrowserLanguage: false,
  },
})
