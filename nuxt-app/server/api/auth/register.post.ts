import bcrypt from 'bcryptjs'
import { ensureLocalAuthUserWithPassword } from '../../utils/authUser'
import { isNeonAuthEnabled, neonRegisterWithPassword } from '../../utils/neonAuth'
import { signToken } from '../../utils/jwt'

interface RegisterBody {
  email: string
  name: string
  password: string
}

async function registerLocalUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
    where: { email },
  })

  const passwordHash = await bcrypt.hash(password, 12)

  if (existing) {
    // Only allow upgrade flow for legacy rows that explicitly have NULL password_hash.
    if (existing.passwordHash !== null) {
      throw createError({ statusCode: 409, message: 'Email already registered' })
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
      select: { id: true, email: true, name: true, role: true },
    })

    return updated
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return user
}

export default defineEventHandler(async (event) => {
  const { email, name, password } = await readBody<RegisterBody>(event)

  if (!email?.trim() || !name?.trim() || !password?.trim()) {
    throw createError({ statusCode: 400, message: 'email, name, and password are required' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedName = name.trim()

  if (isNeonAuthEnabled()) {
    try {
      const session = await neonRegisterWithPassword(normalizedEmail, password, normalizedName)

      const user = await ensureLocalAuthUserWithPassword(
        {
          email: session.email,
          name: session.name || normalizedName,
        },
        password,
      )

      const token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      return {
        token,
        user,
        provider: 'neon' as const,
      }
    }
    catch {
      const user = await registerLocalUser(normalizedEmail, normalizedName, password)

      const token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      return {
        token,
        user,
        provider: 'local-fallback' as const,
      }
    }
  }

  const user = await registerLocalUser(normalizedEmail, normalizedName, password)

  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return { token, user }
})
