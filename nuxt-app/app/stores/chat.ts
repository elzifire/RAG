import { defineStore } from 'pinia'
import type { ChatMessage, ChatSession, OllamaModel } from '~/types/chat'

export const useChatStore = defineStore('chat', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const messages = ref<Record<string, ChatMessage[]>>({})
  const streamingSessions = ref(new Set<string>())
  const models = ref<OllamaModel[]>([])
  const activeModel = ref('deepseek-coder:6.7b')
  const isLoadingSessions = ref(false)
  const isLoadingModels = ref(false)
  const globalError = ref<string | null>(null)

  const auth = useAuthStore()

  function headers(): Record<string, string> {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }

  // ─── Getters ──────────────────────────────────────────────────────────────
  const activeSession = computed(
    () => sessions.value.find(s => s.id === activeSessionId.value) ?? null,
  )

  const activeMessages = computed(
    () => (activeSessionId.value ? (messages.value[activeSessionId.value] ?? []) : []),
  )

  const getSession = (id: string) => sessions.value.find(s => s.id === id) ?? null

  const isStreaming = (sessionId: string) => streamingSessions.value.has(sessionId)

  const isActiveStreaming = computed(() =>
    activeSessionId.value ? streamingSessions.value.has(activeSessionId.value) : false,
  )

  // ─── Session actions ──────────────────────────────────────────────────────
  async function fetchSessions() {
    isLoadingSessions.value = true
    try {
      sessions.value = await $fetch<ChatSession[]>('/api/chat/sessions', { headers: headers() })
    }
    catch (err: unknown) {
      globalError.value = err instanceof Error ? err.message : 'Failed to load sessions'
    }
    finally {
      isLoadingSessions.value = false
    }
  }

  async function createSession(model?: string) {
    const chosenModel = model || activeModel.value
    const session = await $fetch<ChatSession>('/api/chat/sessions', {
      method: 'POST',
      body: { model: chosenModel, name: 'New Chat' },
      headers: headers(),
    })
    sessions.value.unshift(session)
    messages.value[session.id] = []
    activeSessionId.value = session.id
    return session
  }

  async function deleteSession(sessionId: string) {
    await $fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE', headers: headers() })
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    delete messages.value[sessionId]
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }
  }

  async function setActiveSession(sessionId: string) {
    activeSessionId.value = sessionId
    if (!messages.value[sessionId]) {
      await fetchMessages(sessionId)
    }
  }

  // ─── Message actions ──────────────────────────────────────────────────────
  async function fetchMessages(sessionId: string) {
    const data = await $fetch<ChatMessage[]>(`/api/chat/sessions/${sessionId}/messages`, { headers: headers() })
    messages.value[sessionId] = data
  }

  function addMessage(sessionId: string, message: ChatMessage) {
    if (!messages.value[sessionId]) messages.value[sessionId] = []
    messages.value[sessionId].push(message)
  }

  function appendToMessage(sessionId: string, messageId: string, content: string) {
    const msg = messages.value[sessionId]?.find(m => m.id === messageId)
    if (msg) msg.content += content
  }

  function finalizeMessage(sessionId: string, messageId: string) {
    const msg = messages.value[sessionId]?.find(m => m.id === messageId)
    if (msg) msg.status = 'done'
  }

  function setMessageError(sessionId: string, messageId: string, error: string) {
    const msg = messages.value[sessionId]?.find(m => m.id === messageId)
    if (msg) { msg.status = 'error'; msg.error = error }
  }

  function setSessionStreaming(sessionId: string, on: boolean) {
    if (on) streamingSessions.value.add(sessionId)
    else streamingSessions.value.delete(sessionId)
  }

  // ─── Session metadata ─────────────────────────────────────────────────────
  function updateSessionPreview(sessionId: string, lastMessage: string) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (s) {
      s.lastMessage = lastMessage.length > 80 ? lastMessage.slice(0, 80) + '…' : lastMessage
      s.updatedAt = new Date().toISOString()
      sessions.value = [s, ...sessions.value.filter(x => x.id !== sessionId)]
    }
  }

  function renameSession(sessionId: string, name: string) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (s) s.name = name
  }

  function clearAll() {
    sessions.value = []
    messages.value = {}
    activeSessionId.value = null
    streamingSessions.value.clear()
  }

  // ─── Models ───────────────────────────────────────────────────────────────
  async function fetchModels() {
    isLoadingModels.value = true
    try {
      models.value = await $fetch<OllamaModel[]>('/api/models')
      if (models.value.length && !models.value.find(m => m.name === activeModel.value)) {
        activeModel.value = models.value[0].name
      }
    }
    catch (err: unknown) {
      globalError.value = err instanceof Error ? err.message : 'Failed to load models'
    }
    finally {
      isLoadingModels.value = false
    }
  }

  return {
    // State
    sessions,
    activeSessionId,
    messages,
    models,
    activeModel,
    isLoadingSessions,
    isLoadingModels,
    globalError,
    // Getters
    activeSession,
    activeMessages,
    isActiveStreaming,
    getSession,
    isStreaming,
    // Actions
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
    fetchMessages,
    addMessage,
    appendToMessage,
    finalizeMessage,
    setMessageError,
    setSessionStreaming,
    updateSessionPreview,
    renameSession,
    clearAll,
    fetchModels,
  }
})
