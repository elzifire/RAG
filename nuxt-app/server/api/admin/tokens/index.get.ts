import { requireAdmin } from '../../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const tokens = await prisma.unlimitedAccess.findMany({
    select: {
      id: true,
      token: true,
      label: true,
      grantedAt: true,
      expiredAt: true,
      isActive: true,
      messageLimit: true,
      messageCount: true,
      admin: { select: { name: true } },
    },
    orderBy: { grantedAt: 'desc' },
  })

  const now = new Date()
  return tokens.map(t => ({
    ...t,
    isExpired: t.expiredAt !== null && t.expiredAt < now,
    remaining: Math.max(0, t.messageLimit - t.messageCount),
    exhausted: t.messageCount >= t.messageLimit,
  }))
})
