import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { AppJWTPayload } from '../../../server/utils/jwt'

let handler: Function

beforeAll(async () => {
  vi.resetModules()
  const mod = await import('../../../server/api/auth/me.get')
  handler = mod.default
})

const authedUser: AppJWTPayload = {
  sub: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
}

const makeEvent = (user: AppJWTPayload = authedUser) => ({ context: { user } })

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current user from the database', async () => {
    const dbUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'USER' }
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(dbUser)

    const result = await handler(makeEvent())

    expect(result).toEqual(dbUser)
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('throws 404 when user no longer exists in the database', async () => {
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce(null)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('queries by the authenticated user id', async () => {
    ;(globalThis as any).prisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'USER' })

    await handler(makeEvent())

    const call = (globalThis as any).prisma.user.findUnique.mock.calls[0][0]
    expect(call.where.id).toBe('user-1')
  })
})
