<script setup lang="ts">
/** Renders the toast queue. Mounted once, in app.vue. */
const { toasts, dismiss } = useToast()
</script>

<template>
  <!-- aria-live so new messages are announced without stealing focus. -->
  <div
    class="nc-toaster"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="nc-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="nc-toast"
        :class="`nc-toast--${toast.tone}`"
      >
        <NcIcon :name="toast.tone === 'success' ? 'check' : 'close'" />
        <p class="nc-toast__message">
          {{ toast.message }}
        </p>
        <button
          type="button"
          class="nc-toast__dismiss"
          :aria-label="$t('a11y.closeModal')"
          @click="dismiss(toast.id)"
        >
          <NcIcon name="close" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.nc-toaster {
  position: fixed;
  inset-block-start: var(--space-s);
  inset-inline-end: var(--space-s);
  z-index: 100;
  display: grid;
  gap: var(--space-2xs);
  justify-items: end;
  pointer-events: none;
}

.nc-toast {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  max-inline-size: min(26rem, calc(100vw - 2 * var(--space-s)));
  padding: var(--space-2xs) var(--space-s);
  color: var(--surface);
  background: var(--background);
  border: 1px solid var(--toast-accent);
  border-inline-start: 3px solid var(--toast-accent);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-2);
  pointer-events: auto;
}

.nc-toast--success {
  --toast-accent: var(--secondary);
}

.nc-toast--error {
  --toast-accent: var(--danger);
}

.nc-toast__message {
  font-size: var(--step--1);
  line-height: 1.5;
}

.nc-toast__dismiss {
  color: var(--surface-dim);
  transition: color var(--dur-fast) var(--ease-out-expo);
}

.nc-toast__dismiss:hover {
  color: var(--surface);
}

.nc-toast-enter-active,
.nc-toast-leave-active {
  transition: opacity var(--dur-base) var(--ease-out-expo), transform var(--dur-base) var(--ease-out-expo);
}

.nc-toast-enter-from,
.nc-toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.nc-toast-leave-active {
  position: absolute;
}
</style>
