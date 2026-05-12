import type { AppJWTPayload } from '../../utils/jwt'
import type { SendMessageBody } from '#shared/types/chat'
import { enqueueChatJob } from '../../utils/chatQueue'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload
  const body = await readBody<SendMessageBody>(event)

  if (!body.sessionId?.trim()) {
    throw createError({ statusCode: 400, message: '`sessionId` is required' })
  }
  if (!body.content?.trim()) {
    throw createError({ statusCode: 400, message: '`content` is required' })
  }
  if (!body.model?.trim()) {
    throw createError({ statusCode: 400, message: '`model` is required' })
  }

  // Verify session belongs to this user
  const session = await prisma.chatSession.findUnique({
    select: { id: true, userId: true },
    where: { id: body.sessionId },
  })

  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  if (session.userId !== user.sub) throw createError({ statusCode: 403, message: 'Forbidden' })

  const content = body.content.trim()

  // Persist user message to PostgreSQL
  const userMessage = await prisma.message.create({
    data: {
      sessionId: body.sessionId,
      role: 'user',
      content,
    },
    select: { id: true },
  })

  // Update session model + updatedAt
  await prisma.chatSession.update({
    where: { id: body.sessionId },
    data: { model: body.model, updatedAt: new Date() },
  })

  // Enqueue assistant job with DB durability and Redis acceleration.
  const job = {
    sessionId: body.sessionId,
    model: body.model,
    userMessageId: userMessage.id,
    timestamp: new Date().toISOString(),
  }

  await enqueueChatJob(job)

  return { messageId: userMessage.id, sessionId: body.sessionId }
})
