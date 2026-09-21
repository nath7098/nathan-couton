<script setup lang="ts">
/**
 * Dialog built on native <dialog>: focus trapping, Esc, inertness and focus
 * restore come from the platform. v1 pulled in vue-final-modal for this, and
 * injected its body as an HTML string — here the content is a slot.
 */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  /** Tints the title with a tech accent. */
  accent?: string
}>(), { accent: undefined })

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()

watch(() => props.open, (open) => {
  const el = dialog.value
  if (!el) return
  if (open && !el.open) el.showModal()
  if (!open && el.open) el.close()
})

onMounted(() => {
  if (props.open) dialog.value?.showModal()
})

/** Esc and the backdrop both go through the dialog's own close event. */
function onClose() {
  if (props.open) emit('close')
}

/** A click on the backdrop lands on the dialog element itself. */
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="nc-modal"
    :style="accent ? { '--modal-accent': accent } : undefined"
    @close="onClose"
    @click="onClick"
  >
    <div class="nc-modal__panel">
      <h2 class="nc-modal__title">
        {{ title }}
      </h2>

      <div class="nc-modal__body">
        <slot />
      </div>

      <footer class="nc-modal__footer">
        <NcButton
          variant="ghost"
          size="sm"
          @click="emit('close')"
        >
          {{ t('a11y.closeModal') }}
        </NcButton>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.nc-modal {
  max-inline-size: min(34rem, calc(100vw - 2 * var(--space-m)));
  padding: 0;
  color: var(--surface);
  background: var(--background);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-3);
}

.nc-modal::backdrop {
  background: color-mix(in oklab, #000 55%, transparent);
  backdrop-filter: blur(3px);
}

.nc-modal[open] {
  animation: nc-modal-in var(--dur-base) var(--ease-out-expo);
}

.nc-modal[open]::backdrop {
  animation: nc-fade-in var(--dur-base) var(--ease-out-expo);
}

@keyframes nc-modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}

@keyframes nc-fade-in {
  from { opacity: 0; }
}

.nc-modal__panel {
  display: grid;
  gap: var(--space-s);
  padding: var(--space-m);
}

.nc-modal__title {
  font-size: var(--step-1);
  color: var(--modal-accent, var(--primary-text));
}

.nc-modal__body {
  font-size: var(--step-0);
  line-height: 1.65;
  color: var(--surface);
}

.nc-modal__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
