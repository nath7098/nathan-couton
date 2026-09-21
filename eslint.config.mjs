import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    '@stylistic/max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
  },
}).prepend({
  ignores: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
})
