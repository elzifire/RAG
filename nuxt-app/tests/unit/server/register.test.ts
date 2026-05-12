import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

let handler: Function

beforeAll(async () => {
  vi.resetModules()
  const mod = await import('../../../server/api/auth/register.post')
  handler = mod.default
})

const makeEvent = () => ({ context: {} })

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user and returns token on success', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      email: 'new@example.com',
      name: 'New User',
      password: 'securepassword1',
    })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(null) // no existing user
    vi.mocked(bcrypt.default.hash).mockResolvedValueOnce('hashed-pw' as never)
    ;(globalThis as any).prisma.user.create.mockResolvedValueOnce({
      id: 'user-new',
      email: 'new@example.com',
      name: 'New User',
      role: 'USER',
    })

    const result = await handler(makeEvent())

    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe('new@example.com')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws 400 when email is missing', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: '', name: 'Test', password: 'password123' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when name is missing', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'x@x.com', name: '', password: 'password123' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is too short', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({ email: 'x@x.com', name: 'X', password: 'short' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when email already exists', async () => {
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      email: 'existing@example.com',
      name: 'Test',
      password: 'password123',
    })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-id' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 409 })
  })

  it('normalises email to lowercase', async () => {
    const bcrypt = await import('bcryptjs')
    ;(globalThis as any).readBody.mockResolvedValueOnce({
      email: 'Upper@Example.COM',
      name: 'Test',
      password: 'password123',
    })
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(null)
    vi.mocked(bcrypt.default.hash).mockResolvedValueOnce('hashed' as never)
    ;(globalThis as any).prisma.user.create.mockResolvedValueOnce({
      id: 'u1',
      email: 'upper@example.com',
      name: 'Test',
      role: 'USER',
    })

    await handler(makeEvent())

    const createCall = (globalThis as any).prisma.user.create.mock.calls[0][0]
    expect(createCall.data.email).toBe('upper@example.com')
  })
})
