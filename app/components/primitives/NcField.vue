<script setup lang="ts">
/**
 * Text field with a floating label.
 *
 * v1 tracked the filled state through a `data-value` attribute mirrored from
 * the model — fragile, and wrong on autofill. This uses `:placeholder-shown`,
 * which the browser maintains itself.
 */
const props = withDefaults(defineProps<{
  label: string
  modelValue: string
  type?: 'text' | 'email' | 'textarea'
  name?: string
  error?: string
  required?: boolean
  maxlength?: number
  autocomplete?: string
  rows?: number
}>(), {
  type: 'text',
  name: undefined,
  error: undefined,
  required: false,
  maxlength: undefined,
  autocomplete: undefined,
  rows: 4,
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const uid = useId()
const inputId = computed(() => `field-${props.name ?? uid}`)
const errorId = computed(() => `${inputId.value}-error`)

const value = computed({
  get: () => props.modelValue,
  set: (next: string) => emit('update:modelValue', next),
})
</script>

<template>
  <div
    class="nc-field"
    :class="{ 'has-error': error }"
  >
    <textarea
      v-if="type === 'textarea'"
      :id="inputId"
      v-model="value"
      class="nc-field__control nc-field__control--area"
      :name="name"
      :rows="rows"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      placeholder=" "
    />
    <input
      v-else
      :id="inputId"
      v-model="value"
      class="nc-field__control"
      :type="type"
      :name="name"
      :required="required"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      placeholder=" "
    >

    <label
      class="nc-field__label"
      :for="inputId"
    >{{ label }}</label>

    <p
      v-if="error"
      :id="errorId"
      class="nc-field__error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.nc-field {
  position: relative;
  display: grid;
}

.nc-field__control {
  inline-size: 100%;
  padding: var(--space-m) var(--space-2xs) var(--space-2xs);
  font: inherit;
  color: var(--surface);
  background: transparent;
  border: none;
  border-block-end: 1px solid var(--surface-faint);
  border-radius: 0;
  outline-offset: 4px;
  transition: border-color var(--dur-base) var(--ease-out-expo);
}

.nc-field__control--area {
  resize: vertical;
  min-block-size: 6rem;
}

.nc-field__control:focus {
  border-block-end-color: var(--primary);
}

.nc-field.has-error .nc-field__control {
  border-block-end-color: var(--danger);
}

/* The label rides above the field unless it is empty and unfocused. */
.nc-field__label {
  position: absolute;
  inset-block-start: var(--space-2xs);
  inset-inline-start: var(--space-2xs);
  font-size: var(--step--1);
  color: var(--surface-dim);
  pointer-events: none;
  transform-origin: left top;
  transition: transform var(--dur-base) var(--ease-out-expo), color var(--dur-base) var(--ease-out-expo);
}

.nc-field__control:placeholder-shown:not(:focus) + .nc-field__label {
  transform: translateY(0.85rem) scale(1.1);
  color: var(--surface-dim);
}

.nc-field__control:focus + .nc-field__label {
  color: var(--primary-text);
}

.nc-field__error {
  margin-block-start: var(--space-3xs);
  font-size: var(--step--1);
  color: var(--danger);
}
</style>
