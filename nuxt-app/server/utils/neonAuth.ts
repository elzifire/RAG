interface NeonAuthSessionResponse {
  user?: Record<string, unknown>
  data?: {
    user?: Record<string, unknown>
  }
  [key: string]: unknown
}

interface NeonAuthUserResponse {
  email?: string
  user_metadata?: Record<string, unknown>
  raw_user_meta_data?: Record<string, unknown>
  [key: string]: unknown
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getNeonAuthUrl(): string | null {
  const raw = process.env.NEON_AUTH_URL?.trim()
  if (!raw) return null
  return trimSlash(raw)
}

export function getNeonJwksUrl(): string | null {
  const raw = process.env.NEON_JWKS_URL?.trim()
  if (!raw) return null
  return trimSlash(raw)
}

export function isNeonAuthEnabled(): boolean {
  return Boolean(getNeonAuthUrl() && getNeonJwksUrl())
}

export function getNeonOAuthProviders(): string[] {
  const raw = process.env.NEON_OAUTH_PROVIDERS?.trim() || 'google'
  return raw
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
}

export function getNeonAuthConfig() {
  return {
    enabled: isNeonAuthEnabled(),
    providers: getNeonOAuthProviders(),
    authUrl: getNeonAuthUrl(),
    jwksUrl: getNeonJwksUrl(),
  }
}

function withNeonHeaders(initHeaders?: HeadersInit, accessToken?: string): Headers {
  const headers = new Headers(initHeaders)
  headers.set('Content-Type', 'application/json')

  const anonKey = process.env.NEON_AUTH_ANON_KEY?.trim()
  const appOrigin = process.env.APP_ORIGIN?.trim()

  if (anonKey) headers.set('apikey', anonKey)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (appOrigin) {
    headers.set('Origin', appOrigin)
    headers.set('Referer', `${appOrigin.replace(/\/+$/, '')}/`)
  }

  return headers
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json() as Record<string, unknown>
    const msg = data.error_description || data.message || data.error
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  catch {
    // ignore parse error
  }
  return `Neon Auth request failed (${response.status})`
}

async function neonFetch<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const baseUrl = getNeonAuthUrl()
  if (!baseUrl) {
    throw createError({ statusCode: 500, message: 'Neon Auth URL is not configured' })
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: withNeonHeaders(init.headers, accessToken),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw createError({ statusCode: response.status, message })
  }

  return response.json() as Promise<T>
}

function readDisplayName(user: NeonAuthUserResponse): string | null {
  const metadata = user.user_metadata || user.raw_user_meta_data || {}
  const candidates = [
    metadata.name,
    metadata.full_name,
    metadata.display_name,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }

  return null
}

function readEmailFromUnknownUser(user: Record<string, unknown> | undefined): string {
  if (!user) return ''
  const raw = user.email
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

function readNameFromUnknownUser(user: Record<string, unknown> | undefined): string | null {
  if (!user) return null
  const candidates = [
    user.name,
    user.full_name,
    user.display_name,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

function extractIdentityFromSessionResponse(
  result: NeonAuthSessionResponse,
  fallbackEmail: string,
  fallbackName?: string,
): { email: string; name: string | null } {
  const user = (result.user || result.data?.user) as Record<string, unknown> | undefined
  const emailFromResponse = readEmailFromUnknownUser(user)
  const nameFromResponse = readNameFromUnknownUser(user)

  return {
    email: emailFromResponse || fallbackEmail,
    name: nameFromResponse || fallbackName || null,
  }
}

export async function neonLoginWithPassword(email: string, password: string): Promise<{ email: string; name: string | null }> {
  const result = await neonFetch<NeonAuthSessionResponse>('/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return extractIdentityFromSessionResponse(result, email)
}

export async function neonRegisterWithPassword(email: string, password: string, name: string): Promise<{ email: string; name: string | null }> {
  const result = await neonFetch<NeonAuthSessionResponse>('/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  })

  return extractIdentityFromSessionResponse(result, email, name)
}

export function buildNeonOAuthUrl(provider: string, redirectTo: string): string {
  const baseUrl = getNeonAuthUrl()
  if (!baseUrl) {
    throw createError({ statusCode: 500, message: 'Neon Auth URL is not configured' })
  }

  const chosen = provider.trim().toLowerCase()
  const url = new URL(`${baseUrl}/authorize`)
  url.searchParams.set('provider', chosen)
  url.searchParams.set('redirect_to', redirectTo)
  return url.toString()
}

export async function neonFetchCurrentUser(accessToken: string): Promise<{ email: string; name: string | null }> {
  const user = await neonFetch<NeonAuthUserResponse>('/user', { method: 'GET' }, accessToken)

  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
  if (!email) {
    throw createError({ statusCode: 400, message: 'Neon token has no email claim' })
  }

  return {
    email,
    name: readDisplayName(user),
  }
}
