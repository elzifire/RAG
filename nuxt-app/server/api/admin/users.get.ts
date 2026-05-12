import { requireAdmin } from '../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
})
