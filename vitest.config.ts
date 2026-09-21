import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Component specs mount real .vue files; the pure-logic specs ignore this.
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
    // Components need a DOM and Nuxt's auto-imports, which the setup file
    // provides. A full `nuxt` environment would be heavier and needs network
    // access at startup, which CI sandboxes do not always have.
    environmentMatchGlobs: [['tests/unit/components/**', 'happy-dom']],
    setupFiles: ['tests/setup/auto-imports.ts'],
  },
})
