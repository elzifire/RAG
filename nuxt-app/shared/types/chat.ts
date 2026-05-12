// ─── Domain Types ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error'

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  model?: string
  status: MessageStatus
  createdAt: string
  error?: string
}

export interface ChatSession {
  id: string
  name: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: string
}

export interface OllamaModel {
  name: string
  model: string
  size: number
  modified_at: string
  details: {
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
    format: string
  }
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface SendMessageBody {
  sessionId: string
  content: string
  model: string
}

export interface CreateSessionBody {
  name?: string
  model: string
}

// ─── SSE Events ──────────────────────────────────────────────────────────────

export interface SseChunkEvent {
  content: string
  messageId: string
}

export interface SseDoneEvent {
  messageId: string
  sessionId: string
}

export interface SseErrorEvent {
  message: string
}
