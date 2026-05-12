import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

const TOKEN_HEADER = 'x-access-token'

/** Generates a cryptographically random 32-byte hex token. */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Reads X-Access-Token header and resolves it against the DB.
 * Returns the access record if valid (active, not expired, under limit),
 * or null if the header is absent or the token is invalid/exhausted.
 */
export async function resolveTokenAccess(event: H3Event) {
  const raw = getHeader(event, TOKEN_HEADER)?.trim()
  if (!raw) return null

  const access = await prisma.unlimitedAccess.findUnique({ where: { token: raw } })
  if (!access || !access.isActive) return null
  if (access.expiredAt && access.expiredAt < new Date()) return null

  return access
}

/** Atomically increments the message count for the given token record id. */
export async function incrementTokenCount(id: string) {
  return prisma.unlimitedAccess.update({
    where: { id },
    data: { messageCount: { increment: 1 } },
  })
}

/** Atomically decrements the message count (rollback on AI error). */
export async function decrementTokenCount(id: string) {
  return prisma.unlimitedAccess.update({
    where: { id },
    data: { messageCount: { decrement: 1 } },
  })
}
