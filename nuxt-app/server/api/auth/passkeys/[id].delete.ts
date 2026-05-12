import type { AppJWTPayload } from '../../../utils/jwt'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload
  const id = getRouterParam(event, 'id')!

  const passkey = await prisma.passkey.findUnique({
    select: { id: true, userId: true },
    where: { id },
  })

  if (!passkey) throw createError({ statusCode: 404, message: 'Passkey not found' })
  if (passkey.userId !== user.sub) throw createError({ statusCode: 403, message: 'Forbidden' })

  await prisma.passkey.delete({ where: { id } })

  return { success: true }
})
