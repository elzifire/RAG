<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{ message: ChatMessage }>()

const { render } = useMarkdown()
const bubbleRef = useTemplateRef<HTMLElement>('bubble')

// ── Global message copy ───────────────────────────────────────────────────
const copied = ref(false)
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* not available */ }
}

// ── Share — copies a message-anchor link ──────────────────────────────────
const shared = ref(false)
async function share() {
  try {
    const url = `${window.location.origin}${window.location.pathname}#msg-${props.message.id}`
    await navigator.clipboard.writeText(url)
    shared.value = true
    setTimeout(() => (shared.value = false), 2000)
  }
  catch { /* not available */ }
}

// ── Model badge toggle (hidden dev feature stored in localStorage) ─────────
const showModelBadge = useLocalStorage('rag_dev_show_model', false)

// ── Rendered content ─────────────────────────────────────────────────────
const renderedContent = computed(() => render(props.message.content))

// ── Per-code-block enhancement (copy + HTML preview) ─────────────────────
function enhanceCodeBlocks() {
  const el = bubbleRef.value
  if (!el) return

  el.querySelectorAll<HTMLPreElement>('pre').forEach((pre, i) => {
    if (pre.dataset.enhanced) return
    pre.dataset.enhanced = '1'

    const code = pre.querySelector('code')
    const lang = (code?.className ?? '').replace('language-', '').trim()
    const text = code?.textContent ?? pre.textContent ?? ''

    // Outer wrapper for positioning
    const outer = document.createElement('div')
    outer.className = 'relative group/code'
    pre.replaceWith(outer)
    outer.appendChild(pre)

    // Action bar
    const bar = document.createElement('div')
    bar.className = 'absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity z-10'

    // Language label
    if (lang) {
      const lbl = document.createElement('span')
      lbl.className = 'text-xs px-1.5 py-0.5 rounded bg-base-content/10 text-base-content/50 font-mono leading-none'
      lbl.textContent = lang
      bar.appendChild(lbl)
    }

    // Copy this code block
    const copyBtn = document.createElement('button')
    copyBtn.className = 'btn btn-xs btn-ghost px-1.5'
    copyBtn.title = 'Copy code'
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(text).catch(() => {})
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      setTimeout(() => {
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
      }, 2000)
    })
    bar.appendChild(copyBtn)

    // HTML preview toggle (for html blocks or content that looks like HTML)
    const isHtml = lang === 'html' || (lang === '' && /<[a-z][\s\S]*>/i.test(text))
    if (isHtml) {
      let iframe: HTMLIFrameElement | null = null
      let previewing = false

      const previewBtn = document.createElement('button')
      previewBtn.className = 'btn btn-xs btn-ghost px-1.5'
      previewBtn.title = 'Preview HTML'
      previewBtn.textContent = '🌐'

      previewBtn.addEventListener('click', () => {
        previewing = !previewing
        if (previewing) {
          iframe = document.createElement('iframe')
          iframe.className = 'w-full min-h-48 rounded-lg border border-base-300 mt-1 bg-white'
          iframe.setAttribute('sandbox', 'allow-scripts')
          iframe.srcdoc = text
          outer.appendChild(iframe)
          previewBtn.textContent = '✕'
          previewBtn.title = 'Hide preview'
        }
        else {
          iframe?.remove()
          iframe = null
          previewBtn.textContent = '🌐'
          previewBtn.title = 'Preview HTML'
        }
      })
      bar.appendChild(previewBtn)
    }

    outer.appendChild(bar)
  })
}

// Only enhance once per finalized message (avoids issues during streaming)
watch(
  () => props.message.status,
  (status) => {
    if (status === 'done') nextTick(enhanceCodeBlocks)
  },
)

onMounted(() => {
  if (props.message.status === 'done') enhanceCodeBlocks()
})
</script>

<template>
  <!-- ── User message ─────────────────────────────────────── -->
  <div
    v-if="message.role === 'user'"
    :id="`msg-${message.id}`"
    class="chat chat-end"
  >
    <div class="chat-bubble chat-bubble-primary whitespace-pre-wrap break-words">
      {{ message.content }}
    </div>
    <div class="chat-footer opacity-40 text-xs mt-1">
      {{ formatTime(message.createdAt) }}
    </div>
  </div>

  <!-- ── Assistant message ───────────────────────────────── -->
  <div
    v-else
    :id="`msg-${message.id}`"
    class="chat chat-start group"
  >
    <div class="chat-image avatar placeholder">
      <div class="w-8 rounded-full bg-secondary text-secondary-content grid place-items-center text-xs font-bold select-none">
        AI
      </div>
    </div>

    <!-- Header: model badge (hidden dev feature, toggle via localStorage) -->
    <div class="chat-header flex items-center gap-2 mb-1">
      <span
        v-if="showModelBadge && message.model"
        class="badge badge-sm badge-outline font-mono text-xs"
        :title="message.model"
      >
        {{ formatModelName(message.model) }}
      </span>
      <span v-else class="text-xs opacity-50">{{ formatModelName(message.model ?? 'Assistant') }}</span>
    </div>

    <!-- Error state -->
    <div
      v-if="message.status === 'error'"
      class="chat-bubble bg-error/10 border border-error/30 text-error"
    >
      <div class="flex items-center gap-2 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ message.error ?? 'An error occurred' }}
      </div>
    </div>

    <!-- Normal / streaming content -->
    <div
      v-else
      ref="bubble"
      class="chat-bubble bg-base-300 text-base-content prose-chat max-w-[72ch] break-words"
      :class="{ 'streaming-cursor': message.status === 'streaming' }"
      v-html="renderedContent"
    />

    <!-- Footer actions (visible on hover) -->
    <div
      v-if="message.status === 'done'"
      class="chat-footer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mt-1"
    >
      <!-- Copy full message -->
      <button
        class="btn btn-ghost btn-xs gap-1 text-xs"
        :class="{ 'text-success': copied }"
        :title="copied ? 'Copied!' : 'Copy response'"
        @click="copyToClipboard"
      >
        <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>

      <!-- Share (copy anchor link) -->
      <button
        class="btn btn-ghost btn-xs gap-1 text-xs"
        :class="{ 'text-success': shared }"
        :title="shared ? 'Link copied!' : 'Share message link'"
        @click="share"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {{ shared ? 'Linked!' : 'Share' }}
      </button>

      <!-- Dev: toggle model badge -->
      <button
        class="btn btn-ghost btn-xs gap-1 text-xs opacity-30 hover:opacity-80"
        :title="showModelBadge ? 'Hide model info' : 'Show model info (dev)'"
        @click="showModelBadge = !showModelBadge"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      </button>

      <span class="text-xs opacity-40 ml-auto">{{ formatTime(message.createdAt) }}</span>
    </div>
  </div>
</template>

