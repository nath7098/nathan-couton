export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error'
}

/** Errors stay longer: they usually carry a fallback worth reading. */
const DURATION = { success: 3000, error: 6000 } as const
const MAX_VISIBLE = 3

/**
 * Toast queue. Replaces vue3-toastify.
 *
 * State lives in useState so the queue is shared by every caller and survives
 * component unmounts.
 */
export function useToast() {
  const toasts = useState<Toast[]>('nc-toasts', () => [])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  function push(message: string, tone: Toast['tone'] = 'success') {
    const id = Date.now() + Math.random()
    toasts.value = [...toasts.value, { id, message, tone }].slice(-MAX_VISIBLE)
    if (import.meta.client) {
      timers.set(id, setTimeout(() => dismiss(id), DURATION[tone]))
    }
    return id
  }

  return {
    toasts: readonly(toasts),
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    dismiss,
  }
}
