import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface LocalAuthUser {
  id: string
  email: string
  name: string
  role: string
}

function fallbackNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'User'
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, 80) : 'User'
}

export async function ensureLocalAuthUser(identity: { email: string; name?: string | null }): Promise<LocalAuthUser> {
  const email = identity.email.trim().toLowerCase()
  if (!email) {
    throw createError({ statusCode: 400, message: 'Identity email is required' })
  }

  const found = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  })

  if (found) {
    // Keep existing role/name authoritative in app DB.
    return found
  }

  const name = identity.name?.trim() || fallbackNameFromEmail(email)

  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: null,
      role: 'USER',
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return created
}

export async function ensureLocalAuthUserWithPassword(
  identity: { email: string; name?: string | null },
  password: string,
): Promise<LocalAuthUser> {
  const email = identity.email.trim().toLowerCase()
  if (!email) {
    throw createError({ statusCode: 400, message: 'Identity email is required' })
  }

  if (!password?.trim()) {
    throw createError({ statusCode: 400, message: 'Password is required' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const found = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  })

  if (found) {
    const updated = await prisma.user.update({
      where: { id: found.id },
      data: { passwordHash },
      select: { id: true, email: true, name: true, role: true },
    })
    return updated
  }

  const name = identity.name?.trim() || fallbackNameFromEmail(email)

  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'USER',
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return created
}

export async function resolveLocalAuthUserByTokenData(data: {
  sub?: string | null
  email?: string | null
  name?: string | null
}): Promise<LocalAuthUser | null> {
  if (data.sub?.trim()) {
    const byId = await prisma.user.findUnique({
      where: { id: data.sub.trim() },
      select: { id: true, email: true, name: true, role: true },
    })

    if (byId) return byId
  }

  if (data.email?.trim()) {
    return ensureLocalAuthUser({
      email: data.email,
      name: data.name,
    })
  }

  return null
}
