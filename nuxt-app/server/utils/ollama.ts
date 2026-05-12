/**
 * Ollama API client utilities.
 * Provides a streaming async-generator for chat completions.
 */

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OllamaChatRequest {
  model: string
  messages: OllamaMessage[]
  stream: boolean
}

export interface OllamaChunk {
  content: string
  done: boolean
}

/** Streams chat chunks from the Ollama /api/chat endpoint. */
export async function* streamOllamaChat(
  request: OllamaChatRequest,
): AsyncGenerator<OllamaChunk> {
  const config = useRuntimeConfig()
  const baseUrl = config.ollamaApiUrl || ''

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Split on newlines; keep incomplete tail in buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const data = JSON.parse(trimmed)
        const content: string = data.message?.content ?? ''
        const isDone: boolean = data.done === true

        yield { content, done: isDone }

        if (isDone) return
      }
      catch {
        // Ignore malformed lines
      }
    }
  }
}

/** Fetches the list of available models from /api/tags. */
export async function fetchOllamaModels() {
  const config = useRuntimeConfig()
  const baseUrl = config.ollamaApiUrl || ''

  const data = await $fetch<{ models: unknown[] }>(`${baseUrl}/api/tags`)
  return data.models
}
  