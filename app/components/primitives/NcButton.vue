<script setup lang="ts">
import type { IconName } from '~/utils/icon-names'

/**
 * The site's only button.
 *
 * Three looks, one per weight of action: `primary` is the thing the page wants
 * you to do (download the CV, send the message), `ghost` the quieter
 * alternative next to it, `link` an inline action that should read as text.
 *
 * The v1 `code` variant — the label wrapped in `@click.prevent="…"` — is gone.
 * It made the main call to action read as a snippet to copy rather than a
 * button to press; the code thread now lives in the file tabs and the
 * terminal, where it is decoration and not an instruction.
 */
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  iconEnd?: IconName
  loading?: boolean
  disabled?: boolean
  /** Renders as a link when `href` is set. */
  href?: string
  external?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'ghost',
  size: 'md',
  icon: undefined,
  iconEnd: undefined,
  loading: false,
  disabled: false,
  href: undefined,
  external: false,
  type: 'button',
})

defineOptions({ inheritAttrs: false })

const tag = computed(() => (props.href ? 'a' : 'button'))

const bindings = computed(() => props.href
  ? {
      href: props.href,
      ...(props.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      ...(props.disabled ? { 'aria-disabled': 'true' } : {}),
    }
  : {
      type: props.type,
      disabled: props.disabled || props.loading,
      ...(props.loading ? { 'aria-busy': 'true' } : {}),
    })
</script>

<template>
  <component
    :is="tag"
    v-bind="{ ...bindings, ...$attrs }"
    class="nc-button"
    :class="[`nc-button--${variant}`, `nc-button--${size}`, { 'is-loading': loading }]"
  >
    <NcSpinner
      v-if="loading"
      class="nc-button__spinner"
      size="1em"
    />
    <NcIcon
      v-else-if="icon"
      :name="icon"
    />
    <span class="nc-button__label"><slot /></span>
    <NcIcon
      v-if="iconEnd && !loading"
      :name="iconEnd"
      class="nc-button__icon-end"
    />
  </component>
</template>

<style scoped>
.nc-button {
  display: inline-flex;
  gap: var(--space-2xs);
  align-items: center;
  justify-content: center;
  padding: var(--space-2xs) var(--space-s);
  font: inherit;
  line-height: 1.3;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition:
    color var(--dur-base) var(--ease-out-expo),
    background-color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo),
    transform var(--dur-fast) var(--ease-out-expo);
}

.nc-button--sm {
  padding: var(--space-3xs) var(--space-2xs);
  font-size: var(--step--1);
}

.nc-button:disabled,
.nc-button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.nc-button:not(:disabled):active {
  transform: translateY(1px);
}

.nc-button--lg {
  padding: var(--space-xs) var(--space-m);
  font-size: var(--step-0);
}

/* ── primary ── */
.nc-button--primary {
  color: var(--on-brand);
  background: var(--brand);
  border-color: var(--brand);
  font-weight: 650;
}

/* ── ghost ── */
.nc-button--ghost {
  color: var(--text);
  border-color: var(--line-strong);
}

/* ── link ── */
.nc-button--link {
  padding-inline: 0;
  color: var(--brand-ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
}

@media (hover: hover) {
  .nc-button--primary:not(:disabled):hover {
    background: color-mix(in oklab, var(--brand) 84%, var(--text));
  }

  .nc-button--ghost:not(:disabled):hover {
    color: var(--brand-ink);
    border-color: var(--brand);
  }

  .nc-button--link:not(:disabled):hover {
    color: var(--text);
  }
}

.nc-button__icon-end {
  transition: transform var(--dur-base) var(--ease-out-expo);
}

@media (hover: hover) {
  .nc-button:hover .nc-button__icon-end {
    transform: translateX(0.2em);
  }
}
</style>
