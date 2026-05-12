<script setup lang="ts">
const emit = defineEmits<{
  'new-chat': []
  'use-prompt': [prompt: string]
}>()

const QUICK_PROMPTS = [
  'Explain a concept clearly',
  'Write a code snippet',
  'Debug this error',
  'Summarize a topic',
]
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-6 px-6 text-center select-none">
    <!-- Icon -->
    <div class="w-20 h-20 rounded-2xl bg-primary/10 text-primary grid place-items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    </div>

    <div>
      <h2 class="text-2xl font-bold mb-2">How can I help you?</h2>
      <p class="text-base-content/50 text-sm max-w-xs">
        Select a conversation in the sidebar or start a new chat.
      </p>
    </div>

    <!-- Quick-start prompts -->
    <div class="grid grid-cols-2 gap-2 w-full max-w-sm">
      <button
        v-for="prompt in QUICK_PROMPTS"
        :key="prompt"
        class="btn btn-outline btn-sm text-xs normal-case text-left h-auto py-2 px-3 justify-start rounded-2xl border-4 border-indigo-500/50  hover:border-sky-500/80 hover:bg-sky-500/10 transition-colors"
        @click="emit('use-prompt', prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <button class="btn btn-primary rounded-xl shadow-sm hover:shadow-md transition-all duration-200 gap-2 normal-case font-medium" @click="emit('new-chat')">
  <svg
    xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>

  <span>New Chat</span>
</button>
  </div>
</template>
