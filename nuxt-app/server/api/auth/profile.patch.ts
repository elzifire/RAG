import bcrypt from 'bcryptjs'
import type { AppJWTPayload } from '../../utils/jwt'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload
  const body = await readBody<{ name?: string; currentPassword?: string; newPassword?: string }>(event)

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const trimmed = body.name.trim()
    if (!trimmed) throw createError({ statusCode: 400, message: 'Name cannot be empty' })
    updates.name = trimmed
  }

  if (body.newPassword !== undefined) {
    if (!body.currentPassword) {
      throw createError({ statusCode: 400, message: 'Current password is required to set a new password' })
    }
    if (body.newPassword.length < 8) {
      throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
    }

    const dbUser = await prisma.user.findUnique({
      select: { passwordHash: true },
      where: { id: user.sub },
    })
    if (!dbUser) throw createError({ statusCode: 404, message: 'User not found' })

    if (!dbUser.passwordHash) {
      throw createError({ statusCode: 400, message: 'This account uses passkey only — no password to change' })
    }
    const valid = await bcrypt.compare(body.currentPassword, dbUser.passwordHash)
    if (!valid) throw createError({ statusCode: 400, message: 'Current password is incorrect' })

    updates.passwordHash = await bcrypt.hash(body.newPassword, 12)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  const updated = await prisma.user.update({
    select: { id: true, email: true, name: true, role: true },
    where: { id: user.sub },
    data: updates,
  })

  return updated
})
