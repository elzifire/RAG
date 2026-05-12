import type { AppJWTPayload } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Session ID required' })

  const user = event.context.user as AppJWTPayload

  const session = await prisma.chatSession.findUnique({
    select: { userId: true },
    where: { id },
  })

  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  if (session.userId !== user.sub) throw createError({ statusCode: 403, message: 'Forbidden' })

  // Cascade deletes messages via schema relation
  await prisma.chatSession.delete({ where: { id } })

  // Also clean up Redis queue/stream remnants
  const redis = useRedis()
  await Promise.all([
    redis.del(`chat:queue:${id}`),
  ])

  return { success: true }
})
