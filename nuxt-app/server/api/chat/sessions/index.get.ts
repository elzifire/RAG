import type { AppJWTPayload } from '../../../utils/jwt'
import type { ChatSession } from '#shared/types/chat'

export default defineEventHandler(async (event): Promise<ChatSession[]> => {
  const user = event.context.user as AppJWTPayload

  const sessions = await prisma.chatSession.findMany({
    select: {
      id: true,
      name: true,
      model: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
      messages: {
        select: { content: true, role: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    where: { userId: user.sub },
    orderBy: { updatedAt: 'desc' },
  })

  return sessions.map(s => ({
    id: s.id,
    name: s.name,
    model: s.model,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    messageCount: s._count.messages,
    lastMessage: s.messages[0]?.content.slice(0, 80) ?? '',
  }))
})
