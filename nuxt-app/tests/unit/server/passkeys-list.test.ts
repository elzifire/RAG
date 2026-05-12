import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { AppJWTPayload } from '../../../server/utils/jwt'

vi.mock('../../../server/utils/prisma', () => ({
  prisma: {
    passkey: {
      findMany: vi.fn(),
    },
  },
}))

let handler: Function
let prismaMock: { passkey: { findMany: ReturnType<typeof vi.fn> } }

beforeAll(async () => {
  vi.resetModules()
  const [mod, prismaModule] = await Promise.all([
    import('../../../server/api/auth/passkeys/index.get'),
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

describe('GET /api/auth/passkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the list of passkeys for the authenticated user', async () => {
    const mockPasskeys = [
      { id: 'pk-1', deviceType: 'multiDevice', transports: ['internal'], createdAt: new Date('2025-01-01') },
      { id: 'pk-2', deviceType: 'singleDevice', transports: ['usb'], createdAt: new Date('2025-01-02') },
    ]
    prismaMock.passkey.findMany.mockResolvedValueOnce(mockPasskeys)

    const result = await handler(makeEvent())

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('pk-1')
  })

  it('returns empty array when user has no passkeys', async () => {
    prismaMock.passkey.findMany.mockResolvedValueOnce([])

    const result = await handler(makeEvent())

    expect(result).toEqual([])
  })

  it('queries passkeys by authenticated user id', async () => {
    prismaMock.passkey.findMany.mockResolvedValueOnce([])

    await handler(makeEvent())

    const call = prismaMock.passkey.findMany.mock.calls[0][0]
    expect(call.where.userId).toBe('user-1')
  })

  it('orders passkeys by createdAt descending', async () => {
    prismaMock.passkey.findMany.mockResolvedValueOnce([])

    await handler(makeEvent())

    const call = prismaMock.passkey.findMany.mock.calls[0][0]
    expect(call.orderBy.createdAt).toBe('desc')
  })
})
