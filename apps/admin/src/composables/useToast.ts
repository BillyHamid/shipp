import { ref } from 'vue'

interface ToastState {
  type: 'success' | 'error'
  message: string
}

const toast = ref<ToastState | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

/** App-wide toast singleton — simple enough not to need Pinia. */
export function useToast() {
  function show(type: ToastState['type'], message: string, durationMs = 3000) {
    if (timer) clearTimeout(timer)
    toast.value = { type, message }
    timer = setTimeout(() => (toast.value = null), durationMs)
  }

  return {
    toast,
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
  }
}
