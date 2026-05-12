import OpenAI from 'openai'
import { streamOllamaChat } from './ollama'

export type ChatProvider = 'ollama' | 'openai'
export type ChatProviderPriority = 'ollama-first' | 'openai-first'

export interface ChatCompletionMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionChunk {
  content: string
  done: boolean
  provider: ChatProvider
  model: string
}

interface RuntimeAiConfig {
  ollamaApiUrl?: string
  openaiApiBaseUrl?: string
  openaiApiKey?: string
  openaiModel?: string
}

function getAiConfig(): RuntimeAiConfig {
  return useRuntimeConfig() as unknown as RuntimeAiConfig
}

function hasOpenAIConfig(config: RuntimeAiConfig): boolean {
  return Boolean(config.openaiApiKey?.trim())
}

function getDefaultOpenAIModel(config: RuntimeAiConfig): string {
  return config.openaiModel?.trim() || process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'llama-3.1-8b-instant'
}

function toOpenAIMessages(messages: ChatCompletionMessage[]) {
  return messages.map(m => ({ role: m.role, content: m.content }))
}

function buildOpenAIModelCandidates(requestedModel: string, config: RuntimeAiConfig): string[] {
  const desired = requestedModel.trim()
  const fallback = getDefaultOpenAIModel(config)
  const unique = new Set<string>()
  if (desired) unique.add(desired)
  if (fallback) unique.add(fallback)
  return [...unique]
}

async function* streamOpenAIChat(
  model: string,
  messages: ChatCompletionMessage[],
  config: RuntimeAiConfig,
): AsyncGenerator<ChatCompletionChunk> {
  if (!hasOpenAIConfig(config)) {
    throw new Error('OpenAI fallback not configured (missing openaiApiKey)')
  }

  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiApiBaseUrl,
  })

  const candidates = buildOpenAIModelCandidates(model, config)
  let lastError: unknown

  for (const candidate of candidates) {
    try {
      const stream = await client.chat.completions.create({
        model: candidate,
        messages: toOpenAIMessages(messages),
        stream: true,
      })

      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content ?? ''
        if (content) {
          yield {
            content,
            done: false,
            provider: 'openai',
            model: candidate,
          }
        }
      }

      yield {
        content: '',
        done: true,
        provider: 'openai',
        model: candidate,
      }
      return
    }
    catch (err: unknown) {
      lastError = err
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'unknown OpenAI error'
  throw new Error(`OpenAI API error: ${message}`)
}

async function* streamOllamaWithMeta(
  model: string,
  messages: ChatCompletionMessage[],
): AsyncGenerator<ChatCompletionChunk> {
  for await (const chunk of streamOllamaChat({ model, messages, stream: true })) {
    yield {
      content: chunk.content,
      done: chunk.done,
      provider: 'ollama',
      model,
    }
  }
}

function providerOrder(priority: ChatProviderPriority, config: RuntimeAiConfig): ChatProvider[] {
  const withOpenAI = hasOpenAIConfig(config)
  if (priority === 'openai-first') {
    return withOpenAI ? ['openai', 'ollama'] : ['ollama']
  }
  return withOpenAI ? ['ollama', 'openai'] : ['ollama']
}

export async function* streamChatCompletion(request: {
  model: string
  messages: ChatCompletionMessage[]
  priority: ChatProviderPriority
}): AsyncGenerator<ChatCompletionChunk> {
  const config = getAiConfig()
  const order = providerOrder(request.priority, config)

  let lastError: unknown

  for (let i = 0; i < order.length; i++) {
    const provider = order[i]!
    let yieldedAnything = false

    try {
      const stream = provider === 'ollama'
        ? streamOllamaWithMeta(request.model, request.messages)
        : streamOpenAIChat(request.model, request.messages, config)

      for await (const chunk of stream) {
        yieldedAnything = true
        yield chunk
      }
      return
    }
    catch (err: unknown) {
      lastError = err

      // If provider already emitted chunks, switching provider may duplicate
      // partial content, so we fail fast.
      if (yieldedAnything) throw err

      const isLast = i === order.length - 1
      if (isLast) throw err
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'all providers failed'
  throw new Error(message)
}

export async function generateChatReply(request: {
  model: string
  messages: ChatCompletionMessage[]
  priority: ChatProviderPriority
}): Promise<{ reply: string; provider: ChatProvider; model: string }> {
  let reply = ''
  let provider: ChatProvider = request.priority === 'openai-first' ? 'openai' : 'ollama'
  let usedModel = request.model

  for await (const chunk of streamChatCompletion(request)) {
    provider = chunk.provider
    usedModel = chunk.model
    if (!chunk.done) reply += chunk.content
  }

  return {
    reply: reply.trim(),
    provider,
    model: usedModel,
  }
}

export function getOpenAIModelFallbacks() {
  const config = getAiConfig()
  if (!hasOpenAIConfig(config)) return []

  const name = getDefaultOpenAIModel(config)
  return [{
    name,
    model: name,
    size: 0,
    modified_at: new Date().toISOString(),
    details: {
      family: 'openai-compatible',
      families: ['openai-compatible'],
      parameter_size: 'n/a',
      quantization_level: 'n/a',
      format: 'api',
    },
  }]
}
