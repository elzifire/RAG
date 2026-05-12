import { requireAdmin } from '../../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  const currentUser = requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID tidak valid' })

  // Prevent admin from deleting themselves
  if (currentUser.sub === id) {
    throw createError({ statusCode: 403, message: 'Tidak dapat menghapus akun sendiri' })
  }

  await prisma.user.delete({ where: { id } })

  return { success: true }
})
