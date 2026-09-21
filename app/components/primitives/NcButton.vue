<script setup lang="ts">
import type { IconName } from '~/utils/icon-names'

/**
 * The site's only button.
 *
 * `code` is the signature variant, carried over from v1's home CTA: the label
 * sits inside `@click.prevent="…"`, rendered as pseudo-elements so screen
 * readers hear the label alone.
 */
const props = withDefaults(defineProps<{
  variant?: 'code' | 'ghost' | 'solid'
  size?: 'sm' | 'md'
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
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-s);
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

/* ── ghost ── */
.nc-button--ghost {
  color: var(--surface);
  border-color: var(--surface-faint);
}

/* ── solid ── */
.nc-button--solid {
  color: var(--on-accent);
  background: var(--primary);
  border-color: var(--primary);
  font-weight: 700;
}

/* ── code: the v1 signature ── */
.nc-button--code {
  color: var(--secondary-text);
  border-color: var(--secondary-text);
  padding-inline: var(--space-s);
}

/* inline-flex drops the whitespace a slot's text node carries in from the
   template, so the label sits flush inside the quotes. */
.nc-button--code .nc-button__label {
  display: inline-flex;
}

.nc-button--code .nc-button__label::before {
  content: '@click.prevent="';
  color: var(--primary-text);
}

.nc-button--code .nc-button__label::after {
  content: '"';
  color: var(--primary-text);
}

@media (hover: hover) {
  .nc-button--ghost:not(:disabled):hover {
    color: var(--primary-text);
    border-color: var(--primary);
  }

  .nc-button--solid:not(:disabled):hover {
    background: color-mix(in oklab, var(--primary) 82%, var(--surface));
  }

  .nc-button--code:not(:disabled):hover {
    color: var(--surface);
    border-color: var(--surface);
  }

  .nc-button--code:not(:disabled):hover .nc-button__label::before,
  .nc-button--code:not(:disabled):hover .nc-button__label::after {
    color: var(--secondary-text);
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
