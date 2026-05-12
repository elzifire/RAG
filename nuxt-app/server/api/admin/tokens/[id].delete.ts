import { requireAdmin } from '../../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '`id` is required' })

  const existing = await prisma.unlimitedAccess.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Token not found' })

  await prisma.unlimitedAccess.update({
    where: { id },
    data: { isActive: false },
  })

  return sendNoContent(event)
})
