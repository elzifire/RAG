import type { AppJWTPayload } from '../../../utils/jwt'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload

  const passkeys = await prisma.passkey.findMany({
    select: { id: true, deviceType: true, transports: true, createdAt: true },
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
  })

  return passkeys
})
