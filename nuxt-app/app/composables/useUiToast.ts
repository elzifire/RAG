import { computed } from 'vue'
import { useState } from '#imports'

export type UiToastType = 'success' | 'error' | 'warning' | 'info'

export interface UiToastItem {
  id: string
  type: UiToastType
  title?: string
  message: string
  duration: number
}

interface PushToastPayload {
  type?: UiToastType
  title?: string
  message: string
  duration?: number
}

const DEFAULT_DURATION = 3200

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useUiToast() {
  const store = useState<UiToastItem[]>('ui-toasts', () => [])

  function remove(id: string) {
    store.value = store.value.filter(item => item.id !== id)
  }

  function push(payload: PushToastPayload) {
    const item: UiToastItem = {
      id: makeId(),
      type: payload.type ?? 'info',
      title: payload.title,
      message: payload.message,
      duration: payload.duration ?? DEFAULT_DURATION,
    }

    store.value = [...store.value, item]

    if (import.meta.client && item.duration > 0) {
      setTimeout(() => remove(item.id), item.duration)
    }

    return item.id
  }

  function success(message: string, title = 'Berhasil') {
    return push({ type: 'success', title, message })
  }

  function error(message: string, title = 'Terjadi Error') {
    return push({ type: 'error', title, message, duration: 4200 })
  }

  function warning(message: string, title = 'Perhatian') {
    return push({ type: 'warning', title, message })
  }

  function info(message: string, title = 'Info') {
    return push({ type: 'info', title, message })
  }

  return {
    toasts: computed(() => store.value),
    push,
    remove,
    success,
    error,
    warning,
    info,
  }
}
