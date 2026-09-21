import { fileURLToPath } from 'node:url'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssCustomMedia from 'postcss-custom-media'

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
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [{ rel: 'icon', href: '/favicon.ico' }],
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  css: ['~/assets/css/reset.css', '~/assets/css/tokens.css', '~/assets/css/typography.css'],

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
  // injected globally first (the csstools-recommended pairing) and resolved after.
  postcss: {
    plugins: {
      '@csstools/postcss-global-data': postcssGlobalData({
        files: [fileURLToPath(new URL('./app/assets/css/media.css', import.meta.url))],
      }),
      'postcss-custom-media': postcssCustomMedia(),
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
    // Messages are static JSON, compiled at build time — the runtime message
    // compiler is dropped from the bundle (measured: -4.7 kB gzip). SPEC §10.1.
    bundle: { dropMessageCompiler: true },
    compilation: { strictMessage: false },
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'nc-locale',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },
})
