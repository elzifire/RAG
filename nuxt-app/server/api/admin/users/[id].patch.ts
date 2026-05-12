import bcrypt from 'bcryptjs'
import { requireAdmin } from '../../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID tidak valid' })

  const body = await readBody<{
    name?: string
    email?: string
    password?: string
    role?: 'USER' | 'ADMIN'
  }>(event)

  const data: Record<string, unknown> = {}
  if (body.name?.trim()) data.name = body.name.trim()
  if (body.email?.trim()) data.email = body.email.trim().toLowerCase()
  if (body.role === 'USER' || body.role === 'ADMIN') data.role = body.role
  if (body.password?.trim()) {
    if (body.password.length < 8) {
      throw createError({ statusCode: 400, message: 'Password minimal 8 karakter' })
    }
    data.passwordHash = await bcrypt.hash(body.password, 12)
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada data yang diubah' })
  }

  // Check email conflict
  if (data.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: data.email as string, NOT: { id } },
    })
    if (conflict) throw createError({ statusCode: 409, message: 'Email sudah digunakan' })
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return user
})
