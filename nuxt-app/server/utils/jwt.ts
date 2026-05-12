import {
  SignJWT,
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload as JosePayload,
  type JWTVerifyOptions,
} from 'jose'

export interface AppJWTPayload {
  sub: string    // user id (cuid)
  email: string
  name: string
  role: string
}

export interface TokenIdentity {
  source: 'local' | 'neon'
  sub: string | null
  email: string | null
  name: string | null
  role: string | null
  raw: JosePayload
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'change_me_in_production_min_32_chars!!'
  return new TextEncoder().encode(secret)
}

function getClaimString(payload: JosePayload, key: string): string | null {
  const value = payload[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function toTokenIdentity(source: 'local' | 'neon', payload: JosePayload): TokenIdentity {
  const email = getClaimString(payload, 'email')?.toLowerCase() ?? null
  const name = getClaimString(payload, 'name')
    || getClaimString(payload, 'full_name')
    || getClaimString(payload, 'preferred_username')
    || null

  return {
    source,
    sub: getClaimString(payload, 'sub'),
    email,
    name,
    role: getClaimString(payload, 'role'),
    raw: payload,
  }
}

function getNeonJwksUrl(): string | null {
  const url = process.env.NEON_JWKS_URL?.trim()
  return url || null
}

let neonJwksResolver: ReturnType<typeof createRemoteJWKSet> | null = null

function getNeonJwksResolver() {
  const jwksUrl = getNeonJwksUrl()
  if (!jwksUrl) return null
  if (!neonJwksResolver) {
    neonJwksResolver = createRemoteJWKSet(new URL(jwksUrl))
  }
  return neonJwksResolver
}

async function verifyLocalToken(token: string): Promise<TokenIdentity> {
  const { payload } = await jwtVerify<JosePayload>(token, getSecret())
  return toTokenIdentity('local', payload)
}

async function verifyNeonToken(token: string): Promise<TokenIdentity> {
  const jwks = getNeonJwksResolver()
  if (!jwks) {
    throw new Error('Neon JWKS is not configured')
  }

  const verifyOptions: JWTVerifyOptions = {}

  const configuredIssuer = process.env.NEON_JWT_ISSUER?.trim()
  if (configuredIssuer) {
    verifyOptions.issuer = configuredIssuer.replace(/\/+$/, '')
  }

  const configuredAudience = process.env.NEON_JWT_AUDIENCE?.trim()
  if (configuredAudience) {
    verifyOptions.audience = configuredAudience
  }

  const { payload } = await jwtVerify<JosePayload>(token, jwks, verifyOptions)
  return toTokenIdentity('neon', payload)
}

export async function signToken(payload: AppJWTPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function verifyTokenIdentity(token: string): Promise<TokenIdentity> {
  try {
    return await verifyLocalToken(token)
  }
  catch {
    return verifyNeonToken(token)
  }
}

export async function verifyToken(token: string): Promise<AppJWTPayload> {
  const identity = await verifyTokenIdentity(token)

  if (!identity.sub || !identity.email || !identity.name || !identity.role) {
    throw new Error('Token payload is missing required app claims')
  }

  return {
    sub: identity.sub,
    email: identity.email,
    name: identity.name,
    role: identity.role,
  }
}
