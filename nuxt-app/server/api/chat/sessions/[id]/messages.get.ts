import type { AppJWTPayload } from '../../../../utils/jwt'
import type { ChatMessage } from '#shared/types/chat'

export default defineEventHandler(async (event): Promise<ChatMessage[]> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Session ID required' })

  const user = event.context.user as AppJWTPayload

  const session = await prisma.chatSession.findUnique({
    select: { userId: true },
    where: { id },
  })

  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  if (session.userId !== user.sub) throw createError({ statusCode: 403, message: 'Forbidden' })

  const messages = await prisma.message.findMany({
    select: { id: true, sessionId: true, role: true, content: true, model: true, createdAt: true },
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
  })

  return messages.map(m => ({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role.toLowerCase() as ChatMessage['role'],
    content: m.content,
    model: m.model ?? undefined,
    status: 'done' as const,
    createdAt: m.createdAt.toISOString(),
  }))
})
