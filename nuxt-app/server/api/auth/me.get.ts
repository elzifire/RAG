import type { AppJWTPayload } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload

  const dbUser = await prisma.user.findUnique({
    select: { id: true, email: true, name: true, role: true },
    where: { id: user.sub },
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return dbUser
})
