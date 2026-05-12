<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const MAX_ROWS = 8

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  const lineHeight = parseInt(getComputedStyle(el).lineHeight || '24', 10)
  const maxHeight = lineHeight * MAX_ROWS
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

function handleSend() {
  const content = input.value.trim()
  if (!content || props.disabled) return
  emit('send', content)
  input.value = ''
  nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

// Reset height when input is cleared externally
watch(input, (v) => {
  if (!v) nextTick(autoResize)
})
</script>

<template>
  <div class="border-t border-base-300 bg-base-100 px-4 pt-3 pb-4">
    <div class="flex gap-2 items-end">
      <textarea
        ref="textareaRef"
        v-model="input"
        class="textarea textarea-bordered flex-1 resize-none overflow-y-auto leading-relaxed transition-[height] duration-100 focus:outline-none focus:border-primary"
        style="min-height: 52px; max-height: 192px;"
        :placeholder="placeholder ?? 'Message… (Enter to send, Shift+Enter for new line)'"
        :disabled="disabled"
        rows="1"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />

      <button
        class="btn btn-primary h-[52px] w-[52px] p-0 shrink-0 transition-opacity"
        :disabled="disabled || !input.trim()"
        :class="{ 'opacity-40 cursor-not-allowed': disabled || !input.trim() }"
        aria-label="Send message"
        @click="handleSend"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>

    <p class="text-xs text-base-content/30 mt-1.5 text-right">
      <kbd class="kbd kbd-xs">Enter</kbd> send &nbsp;·&nbsp;
      <kbd class="kbd kbd-xs">Shift+Enter</kbd> new line
    </p>
  </div>
</template>
