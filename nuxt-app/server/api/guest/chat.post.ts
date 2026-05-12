import {
  getOrCreateGuestSession,
  getGuestLimit,
  isGuestEnabled,
  incrementGuestCount,
} from '../../utils/guestSession'
import {
  resolveTokenAccess,
  incrementTokenCount,
  decrementTokenCount,
} from '../../utils/tokenAccess'
import { generateChatReply } from '../../utils/llm'

/** Demo is always served by deepseek-coder:6.7b regardless of what the client sends. */
const DEMO_MODEL = 'deepseek-coder:6.7b'

const GUEST_SYSTEM_PROMPT = `You are RAGChat Assistant, a helpful AI demo.
You are in guest/trial mode. Answer questions helpfully and concisely.
Note: In full mode, you can query private knowledge bases with source citations.`

export default defineEventHandler(async (event) => {
  // 1. Check if guest chat feature is enabled globally
  const enabled = await isGuestEnabled()
  if (!enabled) {
    throw createError({ statusCode: 403, message: 'Guest chat is currently disabled' })
  }

  // 2. Read & validate body early (shared by both paths)
  const body = await readBody<{
    message: string
    history?: Array<{ role: string; content: string }>
  }>(event)
  if (!body.message?.trim()) {
    throw createError({ statusCode: 400, message: '`message` is required' })
  }

  const messages = [
    { role: 'system' as const, content: GUEST_SYSTEM_PROMPT },
    ...(body.history ?? []).slice(-8).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: body.message.trim() },
  ]

  // ── Path A: X-Access-Token header present ──────────────────────────────────
  const tokenAccess = await resolveTokenAccess(event)
  if (tokenAccess) {
    if (tokenAccess.messageCount >= tokenAccess.messageLimit) {
      throw createError({
        statusCode: 429,
        message: `Token limit reached (${tokenAccess.messageLimit} messages).`,
      })
    }

    await incrementTokenCount(tokenAccess.id)

    let reply = ''
    let provider: 'ollama' | 'openai' = 'openai'
    try {
      const result = await generateChatReply({
        model: DEMO_MODEL,
        messages,
        priority: 'openai-first',
      })
      reply = result.reply
      provider = result.provider
    }
    catch (err) {
      await decrementTokenCount(tokenAccess.id)
      throw createError({ statusCode: 502, message: `AI service error: ${(err as Error).message}` })
    }

    const newCount = tokenAccess.messageCount + 1
    return {
      reply: reply.trim(),
      count: newCount,
      remaining: Math.max(0, tokenAccess.messageLimit - newCount),
      exhausted: newCount >= tokenAccess.messageLimit,
      mode: 'token',
      provider,
    }
  }

  // ── Path B: Cookie fingerprint (default guest) ─────────────────────────────
  const session = await getOrCreateGuestSession(event)
  const limit = await getGuestLimit()

  if (session.messageCount >= limit) {
    throw createError({
      statusCode: 429,
      message: `Demo limit reached (${limit} messages). Please sign up for unlimited access.`,
    })
  }

  await incrementGuestCount(session.fingerprint)

  let reply = ''
  let provider: 'ollama' | 'openai' = 'openai'
  try {
    const result = await generateChatReply({
      model: DEMO_MODEL,
      messages,
      priority: 'openai-first',
    })
    reply = result.reply
    provider = result.provider
  }
  catch (err) {
    await prisma.guestSession.update({
      where: { fingerprint: session.fingerprint },
      data: { messageCount: { decrement: 1 } },
    })
    throw createError({ statusCode: 502, message: `AI service error: ${(err as Error).message}` })
  }

  const newCount = session.messageCount + 1
  return {
    reply: reply.trim(),
    count: newCount,
    remaining: Math.max(0, limit - newCount),
    exhausted: newCount >= limit,
    mode: 'guest',
    provider,
  }
})
