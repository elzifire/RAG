import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE_NAME = '__ragchat_guest'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const DEFAULT_MAX_MESSAGES = 5

/** Returns the guest message limit from AppSetting, falling back to default. */
export async function getGuestLimit(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'guest_max_messages' } })
  const num = parseInt(setting?.value ?? '', 10)
  return Number.isFinite(num) && num > 0 ? num : DEFAULT_MAX_MESSAGES
}

/** Returns true if guest chat feature is enabled. */
export async function isGuestEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'guest_enabled' } })
  return (setting?.value ?? 'true') !== 'false'
}

/**
 * Gets or creates the guest session for the current request.
 * Sets the fingerprint cookie if not present.
 */
export async function getOrCreateGuestSession(event: H3Event) {
  let fingerprint = getCookie(event, COOKIE_NAME)

  if (!fingerprint) {
    fingerprint = randomUUID()
    setCookie(event, COOKIE_NAME, fingerprint, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  const session = await prisma.guestSession.upsert({
    where: { fingerprint },
    create: { fingerprint, messageCount: 0 },
    update: {},
  })

  return session
}

/** Increments the guest message count and updates lastMessageAt. */
export async function incrementGuestCount(fingerprint: string) {
  return prisma.guestSession.update({
    where: { fingerprint },
    data: {
      messageCount: { increment: 1 },
      lastMessageAt: new Date(),
    },
  })
}
