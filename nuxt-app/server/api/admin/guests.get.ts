import { requireAdmin } from '../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const [totalUsers, totalGuests, totalMessages] = await Promise.all([
    prisma.user.count(),
    prisma.guestSession.count(),
    prisma.guestSession.aggregate({ _sum: { messageCount: true } }),
  ])

  const recentGuests = await prisma.guestSession.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 20,
    select: {
      id: true,
      fingerprint: true,
      messageCount: true,
      createdAt: true,
      lastMessageAt: true,
    },
  })

  return {
    totalUsers,
    totalGuests,
    totalGuestMessages: totalMessages._sum.messageCount ?? 0,
    recentGuests,
  }
})
