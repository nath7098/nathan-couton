import fr from './locales/fr'
import en from './locales/en'

/**
 * Messages are imported statically rather than fetched at runtime.
 *
 * With `langDir`, the module requests the locale file over HTTP at boot. In dev
 * that request 404s (Vite will not serve those files as modules), so every t()
 * falls back to the raw key while the production build stays green — a trap
 * worth avoiding. Two locales of JSON are small enough to bundle, and this
 * removes a round-trip on first paint.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'fr',
  messages: { fr, en },
}))
