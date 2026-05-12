import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { AppJWTPayload } from '../../../server/utils/jwt'

vi.mock('../../../server/utils/prisma', () => ({
  prisma: {
    passkey: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

let handler: Function
let prismaMock: { passkey: { findUnique: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } }

beforeAll(async () => {
  vi.resetModules()
  const [mod, prismaModule] = await Promise.all([
    import('../../../server/api/auth/passkeys/[id].delete'),
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

const makeEvent = (user: AppJWTPayload = authedUser, passkeyId = 'pk-1') => {
  ;(globalThis as any).getRouterParam.mockReturnValue(passkeyId)
  return { context: { user } }
}

describe('DELETE /api/auth/passkeys/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a passkey owned by the authenticated user', async () => {
    prismaMock.passkey.findUnique.mockResolvedValueOnce({ id: 'pk-1', userId: 'user-1' })
    prismaMock.passkey.delete.mockResolvedValueOnce({ id: 'pk-1' })

    const result = await handler(makeEvent())

    expect(result).toEqual({ success: true })
    expect(prismaMock.passkey.delete).toHaveBeenCalledWith({ where: { id: 'pk-1' } })
  })

  it('throws 404 when passkey does not exist', async () => {
    prismaMock.passkey.findUnique.mockResolvedValueOnce(null)

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(prismaMock.passkey.delete).not.toHaveBeenCalled()
  })

  it('throws 403 when passkey belongs to another user', async () => {
    prismaMock.passkey.findUnique.mockResolvedValueOnce({ id: 'pk-1', userId: 'other-user' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 403 })
    expect(prismaMock.passkey.delete).not.toHaveBeenCalled()
  })

  it('queries the passkey by the route param id', async () => {
    prismaMock.passkey.findUnique.mockResolvedValueOnce({ id: 'pk-99', userId: 'user-1' })
    prismaMock.passkey.delete.mockResolvedValueOnce({})

    await handler(makeEvent(authedUser, 'pk-99'))

    const call = prismaMock.passkey.findUnique.mock.calls[0][0]
    expect(call.where.id).toBe('pk-99')
  })
})
