<template>
  <Teleport to="body">
    <Transition name="sa-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="w-full max-w-md rounded-3xl border border-base-content/12 bg-base-100 p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div class="grid h-11 w-11 place-items-center rounded-2xl" :class="iconWrapClass">
              <svg v-if="variant === 'success'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.6"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <svg v-else-if="variant === 'error'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else-if="variant === 'warning'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.2 14.2A1 1 0 002.96 20h18.08a1 1 0 00.87-1.94l-8.2-14.2a1 1 0 00-1.74 0z"/></svg>
              <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>

            <div>
              <p class="ui-page-title text-lg">{{ title }}</p>
              <p v-if="subtitle" class="text-xs text-base-content/45">{{ subtitle }}</p>
            </div>
          </div>

          <p class="mb-6 text-sm leading-relaxed text-base-content/65">{{ message }}</p>

          <div class="flex justify-end gap-2">
            <button
              v-if="showCancel"
              class="btn btn-ghost btn-sm rounded-xl border border-base-content/12"
              @click="cancel"
            >
              {{ cancelText }}
            </button>
            <button class="btn btn-sm rounded-xl" :class="confirmClass" @click="confirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  subtitle?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  variant: 'info',
  confirmText: 'Oke',
  cancelText: 'Batal',
  showCancel: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const iconWrapClass = computed(() => {
  if (props.variant === 'success') return 'bg-success/12 text-success'
  if (props.variant === 'error') return 'bg-error/12 text-error'
  if (props.variant === 'warning') return 'bg-warning/12 text-warning'
  return 'bg-info/12 text-info'
})

const confirmClass = computed(() => {
  if (props.variant === 'error') return 'btn-error'
  if (props.variant === 'warning') return 'btn-warning'
  if (props.variant === 'success') return 'btn-success'
  return 'btn-primary'
})

function close() {
  emit('update:modelValue', false)
}

function cancel() {
  emit('cancel')
  close()
}

function confirm() {
  emit('confirm')
  close()
}
</script>

<style scoped>
.sa-fade-enter-active,
.sa-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sa-fade-enter-from,
.sa-fade-leave-to {
  opacity: 0;
}
</style>
