import { describe, it, expect, beforeEach } from 'vitest'
import { SignJWT } from 'jose'
import { signToken, verifyToken, type AppJWTPayload } from '../../../server/utils/jwt'

const samplePayload: AppJWTPayload = {
  sub: 'user-cuid-1234',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
}

describe('JWT utils', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!'
    process.env.JWT_EXPIRES_IN = '7d'
  })

  describe('signToken', () => {
    it('returns a non-empty JWT string', async () => {
      const token = await signToken(samplePayload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // header.payload.signature
    })

    it('includes all payload fields', async () => {
      const token = await signToken(samplePayload)
      const decoded = await verifyToken(token)
      expect(decoded.sub).toBe(samplePayload.sub)
      expect(decoded.email).toBe(samplePayload.email)
      expect(decoded.name).toBe(samplePayload.name)
      expect(decoded.role).toBe(samplePayload.role)
    })
  })

  describe('verifyToken', () => {
    it('successfully verifies a valid token', async () => {
      const token = await signToken(samplePayload)
      const payload = await verifyToken(token)
      expect(payload.sub).toBe(samplePayload.sub)
      expect(payload.email).toBe(samplePayload.email)
    })

    it('throws on a tampered token', async () => {
      const token = await signToken(samplePayload)
      const parts = token.split('.')
      parts[1] = Buffer.from(JSON.stringify({ sub: 'hacked' })).toString('base64url')
      await expect(verifyToken(parts.join('.'))).rejects.toThrow()
    })

    it('throws on a completely invalid token', async () => {
      await expect(verifyToken('not.a.token')).rejects.toThrow()
      await expect(verifyToken('')).rejects.toThrow()
    })

    it('throws on token signed with wrong secret', async () => {
      process.env.JWT_SECRET = 'other-secret-also-at-least-32-chars-xxxx!'
      const tokenWithOtherSecret = await signToken(samplePayload)
      process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!'
      await expect(verifyToken(tokenWithOtherSecret)).rejects.toThrow()
    })

    it('throws on expired token', async () => {
      // Build a token with an `exp` set 60 seconds in the past using jose directly
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      const expiredToken = await new SignJWT({ ...samplePayload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
        .sign(secret)
      await expect(verifyToken(expiredToken)).rejects.toThrow()
    })
  })
})
