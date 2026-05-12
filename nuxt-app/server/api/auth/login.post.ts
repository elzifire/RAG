import bcrypt from 'bcryptjs'
import { ensureLocalAuthUserWithPassword } from '../../utils/authUser'
import { isNeonAuthEnabled, neonLoginWithPassword } from '../../utils/neonAuth'
import { signToken } from '../../utils/jwt'

interface LoginBody {
  email: string
  password: string
}

async function verifyLocalCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
    where: { email },
  })

  // Constant-time comparison — avoid user enumeration.
  const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000'
  const hashToCheck = user?.passwordHash ?? dummyHash
  const valid = await bcrypt.compare(password, hashToCheck)

  if (!user || !valid) return null
  return user
}

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<LoginBody>(event)

  if (!email?.trim() || !password?.trim()) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (isNeonAuthEnabled()) {
    try {
      const session = await neonLoginWithPassword(normalizedEmail, password)
      const user = await ensureLocalAuthUserWithPassword(
        {
          email: session.email,
          name: session.name,
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
      const fallbackUser = await verifyLocalCredentials(normalizedEmail, password)
      if (fallbackUser) {
        const token = await signToken({
          sub: fallbackUser.id,
          email: fallbackUser.email,
          name: fallbackUser.name,
          role: fallbackUser.role,
        })

        return {
          token,
          user: {
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            role: fallbackUser.role,
          },
          provider: 'local-fallback' as const,
        }
      }

      throw createError({ statusCode: 401, message: 'Invalid email or password' })
    }
  }

  const localUser = await verifyLocalCredentials(normalizedEmail, password)
  if (!localUser) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const token = await signToken({
    sub: localUser.id,
    email: localUser.email,
    name: localUser.name,
    role: localUser.role,
  })

  return {
    token,
    user: { id: localUser.id, email: localUser.email, name: localUser.name, role: localUser.role },
  }
})
