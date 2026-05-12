import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { AppJWTPayload } from '../../../server/utils/jwt'

// profile.patch.ts imports prisma and bcrypt explicitly
vi.mock('../../../server/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

let handler: Function
let prismaMock: { user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } }

beforeAll(async () => {
  vi.resetModules()
  const [mod, prismaModule] = await Promise.all([
    import('../../../server/api/auth/profile.patch'),
    import('../../../server/utils/prisma'),
  ])
  handler = mod.default
  prismaMock = (prismaModule as any).prisma
})

const authedUser: AppJWTPayload = {
  sub: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
}

const makeEvent = (user: AppJWTPayload = authedUser) => ({ context: { user } })

describe('PATCH /api/auth/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates name only', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ name: 'New Name' })
    prismaMock.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      name: 'New Name',
      role: 'USER',
    })

    const result = await handler(makeEvent())

    expect(result.name).toBe('New Name')
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it('throws 400 when name is empty string', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ name: '   ' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('updates password when current password is correct', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      currentPassword: 'oldpass',
      newPassword: 'newpassword123',
    })
    prismaMock.user.findUnique.mockResolvedValueOnce({ passwordHash: 'hashed-old' })
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never)
    vi.mocked(bcrypt.default.hash).mockResolvedValueOnce('hashed-new' as never)
    prismaMock.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    })

    const result = await handler(makeEvent())
    expect(result).toHaveProperty('id')
  })

  it('throws 400 when current password is wrong', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword123',
    })
    prismaMock.user.findUnique.mockResolvedValueOnce({ passwordHash: 'hashed-old' })
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when new password is shorter than 8 chars', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      currentPassword: 'current',
      newPassword: 'short',
    })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when currentPassword not provided for password change', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ newPassword: 'newpassword123' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when nothing to update', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({})

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for passkey-only accounts (no passwordHash)', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      currentPassword: 'anything',
      newPassword: 'newpassword123',
    })
    prismaMock.user.findUnique.mockResolvedValueOnce({ passwordHash: null })
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })
})
