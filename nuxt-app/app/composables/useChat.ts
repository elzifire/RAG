import type { ChatMessage, SseChunkEvent, SseDoneEvent, SseErrorEvent } from '~/types/chat'

/**
 * Core chat composable.
 * Handles send → Redis queue → SSE stream lifecycle for a given session.
 */
export const useChat = () => {
  const store = useChatStore()
  const api = useApi()

  async function sendMessage(sessionId: string, content: string) {
    const session = store.getSession(sessionId)
    if (!session || !content.trim()) return

    store.setSessionStreaming(sessionId, true)

    // ── Optimistic user message ───────────────────────────────────────────
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'user',
      content: content.trim(),
      status: 'done',
      createdAt: new Date().toISOString(),
    }
    store.addMessage(sessionId, userMsg)

    // ── Streaming assistant placeholder ───────────────────────────────────
    const assistantId = crypto.randomUUID()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      sessionId,
      role: 'assistant',
      content: '',
      model: session.model,
      status: 'streaming',
      createdAt: new Date().toISOString(),
    }
    store.addMessage(sessionId, assistantMsg)

    try {
      // Push message into queue (authenticated)
      await api.post('/api/chat/send', { sessionId, content: content.trim(), model: session.model })

      // Open authenticated SSE stream
      await openStream(sessionId, assistantId)
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      store.setMessageError(sessionId, assistantId, message)
      store.setSessionStreaming(sessionId, false)
    }
  }

  function openStream(sessionId: string, assistantId: string): Promise<void> {
    return new Promise((resolve) => {
      // Token passed as query param — EventSource cannot send custom headers
      const url = api.sseUrl(`/api/chat/stream/${encodeURIComponent(sessionId)}`)
      const es = new EventSource(url)

      es.addEventListener('chunk', (e: MessageEvent) => {
        const data = JSON.parse(e.data) as SseChunkEvent
        store.appendToMessage(sessionId, assistantId, data.content)
      })

      es.addEventListener('done', (e: MessageEvent) => {
        const data = JSON.parse(e.data) as SseDoneEvent
        store.finalizeMessage(sessionId, assistantId)
        store.setSessionStreaming(sessionId, false)
        store.updateSessionPreview(sessionId, store.messages[sessionId]?.find(m => m.id === assistantId)?.content ?? '')
        // Rename session from first user message if still default
        const session = store.getSession(sessionId)
        if (session?.name === 'New Chat') {
          const firstUser = store.messages[sessionId]?.find(m => m.role === 'user')
          if (firstUser) {
            const title = firstUser.content.length > 40
              ? firstUser.content.slice(0, 40) + '…'
              : firstUser.content
            store.renameSession(sessionId, title)
          }
        }
        es.close()
        resolve()
      })

      es.addEventListener('error', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as SseErrorEvent
          store.setMessageError(sessionId, assistantId, data.message)
        }
        catch {
          store.setMessageError(sessionId, assistantId, 'Stream error')
        }
        store.setSessionStreaming(sessionId, false)
        es.close()
        resolve()
      })

      // Network / connection error
      es.onerror = () => {
        store.setMessageError(sessionId, assistantId, 'Connection lost — please retry')
        store.setSessionStreaming(sessionId, false)
        es.close()
        resolve()
      }
    })
  }

  return { sendMessage }
}
