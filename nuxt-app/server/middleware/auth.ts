import { resolveLocalAuthUserByTokenData } from '../utils/authUser'
import { verifyTokenIdentity } from '../utils/jwt'

// Exact public routes (no token required)
const PUBLIC_ROUTES = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/passkey/login-options',
  '/api/auth/passkey/login-verify',
])

// Public route prefixes (e.g. models list, guest chat)
const PUBLIC_PREFIXES = ['/api/models', '/api/guest/']

// For SSE streams, token comes as ?token= query param (EventSource can't send headers)
const SSE_PATHS = ['/api/chat/stream/']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Skip non-API routes (pages, assets)
  if (!path.startsWith('/api/')) return

  // Allow explicitly public routes
  if (PUBLIC_ROUTES.has(path) || PUBLIC_PREFIXES.some(p => path.startsWith(p))) return

  let token: string | undefined

  if (SSE_PATHS.some(p => path.startsWith(p))) {
    // SSE: token in query param
    token = getQuery(event).token as string | undefined
  }
  else {
    // Standard REST: Bearer token
    const authHeader = getRequestHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  try {
    const identity = await verifyTokenIdentity(token)

    const localUser = await resolveLocalAuthUserByTokenData({
      sub: identity.sub,
      email: identity.email,
      name: identity.name,
    })

    if (!localUser) {
      throw new Error('Unable to resolve local app user from token identity')
    }

    event.context.user = {
      sub: localUser.id,
      email: localUser.email,
      name: localUser.name,
      role: localUser.role,
    }
  }
  catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
})
