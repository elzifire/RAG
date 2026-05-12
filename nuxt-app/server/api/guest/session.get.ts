import { getOrCreateGuestSession, getGuestLimit, isGuestEnabled } from '../../utils/guestSession'
import { resolveTokenAccess } from '../../utils/tokenAccess'

export default defineEventHandler(async (event) => {
  const enabled = await isGuestEnabled()

  // ── Path A: X-Access-Token header ─────────────────────────────────────────
  const tokenAccess = await resolveTokenAccess(event)
  if (tokenAccess) {
    return {
      enabled,
      limit: tokenAccess.messageLimit,
      count: tokenAccess.messageCount,
      remaining: Math.max(0, tokenAccess.messageLimit - tokenAccess.messageCount),
      exhausted: tokenAccess.messageCount >= tokenAccess.messageLimit,
      mode: 'token',
    }
  }

  // ── Path B: Cookie fingerprint (default guest) ────────────────────────────
  const limit = await getGuestLimit()
  const session = await getOrCreateGuestSession(event)

  return {
    enabled,
    limit,
    count: session.messageCount,
    remaining: Math.max(0, limit - session.messageCount),
    exhausted: session.messageCount >= limit,
    mode: 'guest',
  }
})
