import { LEGACY_PATHS } from './app/data/sections'

// The v1 site was a multi-page SPA. Those URLs are indexed, so they must survive
// as 301s onto the matching section. A fragment never reaches the server, so this
// only imposes the hash — it cannot read one. Experience and education both
// lead to the Parcours now.
const legacyRedirects = Object.fromEntries(
  Object.entries(LEGACY_PATHS).flatMap(([path, section]) => [
    [`/${path}`, { redirect: { to: `/#${section}`, statusCode: 301 as const } }],
    [`/en/${path}`, { redirect: { to: `/en#${section}`, statusCode: 301 as const } }],
  ]),
)

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
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
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        // The two faces the first screen paints with: the name, and the code
        // around it. Everything else can arrive after.
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/fraunces-latin-wght-normal.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/jetbrains-mono-latin-400-normal.woff2', crossorigin: '' },
      ],
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  css: ['~/assets/css/fonts.css', '~/assets/css/reset.css', '~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/sections.css'],

  colorMode: {
    classSuffix: '',
    dataValue: 'theme', // writes data-theme="dark|light", which tokens.css keys off
    preference: 'system',
    fallback: 'dark',
    storageKey: 'nc-theme',
  },

  runtimeConfig: {
    // Server-only. Set these in the Vercel project settings; they never reach
    // the client bundle.
    emailjs: {
      serviceId: '',
      templateId: '',
      publicKey: '',
      privateKey: '',
    },
    public: {
      siteUrl: 'https://nathancouton.fr',
    },
  },

  routeRules: {
    ...legacyRedirects,
    // The internal component gallery: never indexed, never prerendered.
    '/_dev/**': { prerender: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
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

  // srcDir is app/, but the locale JSON lives in <rootDir>/i18n/locales where
  // @nuxtjs/i18n expects it. Without this, the dev server answers 404 to
  // `?import` on those files and every t() falls back to the raw key.
  vite: {
    server: {
      fs: { allow: ['..', '.'] },
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

  // The component gallery is a development tool: its route is removed from the
  // production build entirely, so it costs nothing in the shipped bundle.
  hooks: {
    'pages:extend': (pages) => {
      if (import.meta.env.NODE_ENV === 'production') {
        const index = pages.findIndex(page => page.path.startsWith('/_dev'))
        if (index !== -1) pages.splice(index, 1)
      }
    },
  },
  eslint: { config: { stylistic: true } },

  i18n: {
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    // Messages come from i18n/i18n.config.ts, imported statically. See there.
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français' },
      { code: 'en', language: 'en-GB', name: 'English' },
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
