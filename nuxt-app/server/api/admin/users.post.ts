import bcrypt from 'bcryptjs'
import { requireAdmin } from '../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{
    name: string
    email: string
    password: string
    role?: 'USER' | 'ADMIN'
  }>(event)

  if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
    throw createError({ statusCode: 400, message: 'name, email, dan password wajib diisi' })
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email sudah digunakan' })
  }

  const passwordHash = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash,
      role: body.role === 'ADMIN' ? 'ADMIN' : 'USER',
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return user
})
