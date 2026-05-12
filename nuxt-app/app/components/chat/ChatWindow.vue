<script setup lang="ts">
const store = useChatStore()
const { sendMessage } = useChat()

const messagesEnd = ref<HTMLDivElement | null>(null)

function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => messagesEnd.value?.scrollIntoView({ behavior, block: 'end' }))
}

// Scroll on new messages or streaming updates
watch(
  () => store.activeMessages.length,
  () => scrollToBottom(),
)

watch(
  () => store.activeMessages[store.activeMessages.length - 1]?.content,
  () => {
    const last = store.activeMessages[store.activeMessages.length - 1]
    if (last?.status === 'streaming') scrollToBottom('instant')
  },
)

async function handleSend(content: string) {
  if (!store.activeSessionId) return
  await sendMessage(store.activeSessionId, content)
}

async function handleQuickPrompt(prompt: string) {
  // Create a session if none is active
  if (!store.activeSessionId) {
    await store.createSession()
  }
  await handleSend(prompt)
}

onMounted(() => scrollToBottom('instant'))
</script>

<template>
  <div class="flex flex-col h-full min-h-0">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-base-300 shrink-0">
      <div class="flex-1 min-w-0">
        <h2 class="font-semibold truncate">
          {{ store.activeSession?.name ?? 'New Chat' }}
        </h2>
      </div>
      <div v-if="store.activeSession" class="badge badge-ghost text-xs shrink-0">
        {{ formatModelName(store.activeSession.model) }}
      </div>
    </div>

    <!-- ── Messages ────────────────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-1 min-h-0">
      <!-- Empty state when session exists but has no messages -->
      <div
        v-if="store.activeSessionId && !store.activeMessages.length && !store.isActiveStreaming"
        class="flex flex-col items-center justify-center h-full gap-3 text-center text-base-content/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        <p class="text-sm">Send a message to start the conversation</p>
      </div>

      <!-- Full empty state (no session selected) -->
      <ChatEmptyState
        v-else-if="!store.activeSessionId"
        @new-chat="store.createSession()"
        @use-prompt="handleQuickPrompt"
      />

      <!-- Message list -->
      <template v-else>
        <div class="group" v-for="msg in store.activeMessages" :key="msg.id">
          <ChatMessageBubble :message="msg" />
        </div>

        <ChatTypingIndicator
          v-if="store.isActiveStreaming && store.activeMessages[store.activeMessages.length - 1]?.status !== 'streaming'"
        />
      </template>

      <div ref="messagesEnd" class="h-1" />
    </div>

    <!-- ── Input ───────────────────────────────────────────────── -->
    <ChatInput
      v-if="store.activeSessionId"
      :disabled="store.isActiveStreaming"
      @send="handleSend"
    />
  </div>
</template>
