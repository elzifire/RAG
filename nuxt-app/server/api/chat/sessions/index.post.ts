import type { AppJWTPayload } from '../../../utils/jwt'
import type { ChatSession, CreateSessionBody } from '#shared/types/chat'

export default defineEventHandler(async (event): Promise<ChatSession> => {
  const user = event.context.user as AppJWTPayload
  const body = await readBody<CreateSessionBody>(event)

  if (!body.model?.trim()) {
    throw createError({ statusCode: 400, message: '`model` is required' })
  }

  const name = body.name?.trim() || 'New Chat'

  const session = await prisma.chatSession.create({
    data: {
      userId: user.sub,
      name,
      model: body.model.trim(),
    },
    select: { id: true, name: true, model: true, createdAt: true, updatedAt: true },
  })

  return {
    id: session.id,
    name: session.name,
    model: session.model,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    messageCount: 0,
    lastMessage: '',
  }
})
