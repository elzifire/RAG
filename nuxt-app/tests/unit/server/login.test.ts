import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { AppJWTPayload } from '../../../server/utils/jwt'

// ── Mock explicit imports used by login.post.ts ───────────────────────────────
vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

// login.post.ts uses `prisma` as a Nitro auto-import global (no explicit import)
// and uses `readBody`, `createError`, `defineEventHandler` the same way.
// These are all stubbed on globalThis by tests/setup.ts.

let handler: Function

beforeAll(async () => {
  vi.resetModules()
  const mod = await import('../../../server/api/auth/login.post')
  handler = mod.default
})

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  passwordHash: '$2b$12$hashedpassword',
}

const makeEvent = () => ({ context: { user: null } })

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns token and user on valid credentials', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'test@example.com', password: 'password123' })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(mockUser)
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never)

    const result = await handler(makeEvent())

    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws 400 when email is missing', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: '', password: 'pass' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is missing', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'test@example.com', password: '' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when user does not exist', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'nobody@example.com', password: 'password123' })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(null)
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when password is wrong', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'test@example.com', password: 'wrongpassword' })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(mockUser)
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })
})
