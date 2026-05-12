<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-3 bottom-4 z-[120] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-[360px]">
      <TransitionGroup name="toast-pop" tag="div" class="flex flex-col gap-2">
        <article
          v-for="item in toasts"
          :key="item.id"
          class="pointer-events-auto rounded-2xl border px-3.5 py-3 shadow-xl backdrop-blur-sm"
          :class="toastClass(item.type)"
        >
          <div class="flex items-start gap-2.5">
            <div class="mt-0.5">
              <svg v-if="item.type === 'success'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <svg v-else-if="item.type === 'error'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else-if="item.type === 'warning'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.2 14.2A1 1 0 002.96 20h18.08a1 1 0 00.87-1.94l-8.2-14.2a1 1 0 00-1.74 0z"/></svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>

            <div class="min-w-0 flex-1">
              <p v-if="item.title" class="text-xs font-semibold tracking-wide">{{ item.title }}</p>
              <p class="text-sm leading-relaxed">{{ item.message }}</p>
            </div>

            <button
              class="btn btn-ghost btn-xs h-6 min-h-0 w-6 rounded-lg p-0 opacity-70 hover:opacity-100"
              @click="remove(item.id)"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { UiToastType } from '../composables/useUiToast'
import { useUiToast } from '../composables/useUiToast'

const { toasts, remove } = useUiToast()

function toastClass(type: UiToastType) {
  if (type === 'success') return 'border-success/25 bg-success/10 text-success'
  if (type === 'error') return 'border-error/25 bg-error/10 text-error'
  if (type === 'warning') return 'border-warning/25 bg-warning/10 text-warning'
  return 'border-info/25 bg-info/10 text-info'
}
</script>

<style scoped>
.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
