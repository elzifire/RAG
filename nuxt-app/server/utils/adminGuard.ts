import type { H3Event } from 'h3'
import type { AppJWTPayload } from './jwt'

/**
 * Ensures the request is authenticated AND has the ADMIN role.
 * The global auth middleware has already verified the JWT and set event.context.user.
 * This utility just adds the role check on top.
 */
export function requireAdmin(event: H3Event): AppJWTPayload {
  const user = event.context.user as AppJWTPayload | undefined
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }
  return user
}
