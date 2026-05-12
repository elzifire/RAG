import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

type DbConnectionSource = 'primary' | 'fallback' | 'unknown'

interface DbConnectionRuntimeState {
  source: DbConnectionSource
  maskedUrl: string | null
  initialized: boolean
  lastError: string | null
  lastCheckedAt: string | null
}

const dbRuntimeState: DbConnectionRuntimeState = {
  source: 'unknown',
  maskedUrl: null,
  initialized: false,
  lastError: null,
  lastCheckedAt: null,
}

function markDbSuccess(source: DbConnectionSource, connectionString: string) {
  dbRuntimeState.source = source
  dbRuntimeState.maskedUrl = maskDbUrl(connectionString)
  dbRuntimeState.initialized = true
  dbRuntimeState.lastError = null
  dbRuntimeState.lastCheckedAt = new Date().toISOString()
}

function markDbError(errorMessage: string) {
  dbRuntimeState.lastError = errorMessage
  dbRuntimeState.lastCheckedAt = new Date().toISOString()
}

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return undefined
}

function buildDatabaseUrlFromParts(parts: {
  user: string
  password: string
  host: string
  port: string
  database: string
}): string {
  const password = encodeURIComponent(parts.password)
  return `postgresql://${parts.user}:${password}@${parts.host}:${parts.port}/${parts.database}`
}

function buildLegacyDatabaseUrl(): string {
  const user = process.env.DATABASE_USER?.trim() || 'root'
  const password = process.env.DATABASE_PASSWORD?.trim() || ''
  const host = process.env.DATABASE_HOST?.trim() || 'localhost'
  const port = process.env.DATABASE_PORT?.trim() || '5432'
  const database = process.env.DATABASE_NAME?.trim() || 'ragdb'

  return buildDatabaseUrlFromParts({ user, password, host, port, database })
}

function buildFallbackDatabaseUrlFromParts(): string | undefined {
  const host = process.env.DATABASE_FALLBACK_HOST?.trim()
  if (!host) return undefined

  const user = process.env.DATABASE_FALLBACK_USER?.trim() || 'postgres'
  const password = process.env.DATABASE_FALLBACK_PASSWORD?.trim() || ''
  const port = process.env.DATABASE_FALLBACK_PORT?.trim() || '5432'
  const database = process.env.DATABASE_FALLBACK_NAME?.trim() || 'ragdb'

  return buildDatabaseUrlFromParts({ user, password, host, port, database })
}

function resolvePrimaryDatabaseUrl(): string {
  return firstEnv(
    'DATABASE_PRIMARY_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
  ) || buildLegacyDatabaseUrl()
}

function resolveFallbackDatabaseUrl(primaryUrl: string): string | undefined {
  const fallback = firstEnv(
    'DATABASE_FALLBACK_URL',
    'DATABASE_URL_FALLBACK',
    'DATABASE_LOCAL_URL',
  ) || buildFallbackDatabaseUrlFromParts()

  if (!fallback || fallback === primaryUrl) return undefined
  return fallback
}

function maskDbUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    const username = url.username ? `${url.username}:***@` : ''
    return `${url.protocol}//${username}${url.host}${url.pathname}`
  }
  catch {
    return '[invalid-db-url]'
  }
}

async function canConnect(connectionString: string): Promise<boolean> {
  const probe = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  })

  try {
    const client = await probe.connect()
    client.release()
    return true
  }
  catch {
    return false
  }
  finally {
    await probe.end().catch(() => {})
  }
}

async function selectDatabaseUrl(): Promise<{ connectionString: string; source: 'primary' | 'fallback' }> {
  const primaryUrl = resolvePrimaryDatabaseUrl()
  const fallbackUrl = resolveFallbackDatabaseUrl(primaryUrl)

  if (await canConnect(primaryUrl)) {
    console.info(`[DB] Connected to primary database: ${maskDbUrl(primaryUrl)}`)
    return { connectionString: primaryUrl, source: 'primary' }
  }

  if (fallbackUrl && await canConnect(fallbackUrl)) {
    console.warn(`[DB] Primary unavailable. Switched to fallback database: ${maskDbUrl(fallbackUrl)}`)
    return { connectionString: fallbackUrl, source: 'fallback' }
  }

  // Last resort: keep primary as target so error is explicit when app starts.
  console.error('[DB] Primary and fallback are unreachable. Using primary target and expecting connection error.')
  return { connectionString: primaryUrl, source: 'primary' }
}

async function createConnectedClient(
  connectionString: string,
  source: Exclude<DbConnectionSource, 'unknown'>,
): Promise<{ client: PrismaClient; pool: Pool }> {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  try {
    await client.$connect()
    markDbSuccess(source, connectionString)
    return { client, pool }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown database error'
    markDbError(message)
    await client.$disconnect().catch(() => {})
    await pool.end().catch(() => {})
    throw err
  }
}

async function initializePrismaClient(): Promise<{ client: PrismaClient; pool: Pool }> {
  const primaryUrl = resolvePrimaryDatabaseUrl()
  const fallbackUrl = resolveFallbackDatabaseUrl(primaryUrl)

  const selected = await selectDatabaseUrl()

  try {
    return await createConnectedClient(selected.connectionString, selected.source)
  }
  catch (primaryErr: unknown) {
    if (selected.source === 'primary' && fallbackUrl) {
      console.warn(`[DB] Primary connect failed at runtime. Retrying fallback: ${maskDbUrl(fallbackUrl)}`)
      return createConnectedClient(fallbackUrl, 'fallback')
    }

    if (selected.source === 'fallback') {
      throw new Error('Database connection failed on fallback target.')
    }

    const message = primaryErr instanceof Error ? primaryErr.message : 'unknown error'
    throw new Error(`Database connection failed on primary target: ${message}`)
  }
}

export function getDatabaseConnectionState() {
  const primaryUrl = resolvePrimaryDatabaseUrl()
  const fallbackUrl = resolveFallbackDatabaseUrl(primaryUrl)

  return {
    primaryMaskedUrl: maskDbUrl(primaryUrl),
    fallbackMaskedUrl: fallbackUrl ? maskDbUrl(fallbackUrl) : null,
    fallbackConfigured: Boolean(fallbackUrl),
    activeSource: dbRuntimeState.source,
    activeMaskedUrl: dbRuntimeState.maskedUrl,
    initialized: dbRuntimeState.initialized,
    lastError: dbRuntimeState.lastError,
    lastCheckedAt: dbRuntimeState.lastCheckedAt,
  }
}

// Singleton pattern — reuse pool and client across hot-reload in development.
const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient
  __pgPool?: Pool
  __prismaInit?: Promise<PrismaClient>
}

async function getPrismaClient(): Promise<PrismaClient> {
  if (globalForPrisma.__prisma) return globalForPrisma.__prisma
  if (!globalForPrisma.__prismaInit) {
    globalForPrisma.__prismaInit = (async () => {
      const { client, pool } = await initializePrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.__pgPool = pool
      }
      return client
    })()
  }

  const client = await globalForPrisma.__prismaInit
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = client
  }
  return client
}

async function invokePrismaPath(path: PropertyKey[], args: unknown[]) {
  const client = await getPrismaClient() as unknown as Record<PropertyKey, unknown>

  if (!path.length) return client

  let target: unknown = client
  for (let i = 0; i < path.length - 1; i++) {
    target = (target as Record<PropertyKey, unknown>)[path[i]!]
  }

  const key = path[path.length - 1]!
  const value = (target as Record<PropertyKey, unknown>)[key]

  if (typeof value === 'function') {
    return (value as (...fnArgs: unknown[]) => unknown).apply(target, args)
  }

  if (args.length > 0) {
    throw new Error(`Prisma property ${String(key)} is not callable`)
  }

  return value
}

function createPrismaPathProxy(path: PropertyKey[]): unknown {
  const callable = () => {}

  return new Proxy(callable, {
    get(_target, prop: PropertyKey) {
      if (prop === Symbol.toStringTag) return 'PrismaLazyProxy'
      return createPrismaPathProxy([...path, prop])
    },
    apply(_target, _thisArg, args: unknown[]) {
      return invokePrismaPath(path, args)
    },
  })
}

export const prisma = createPrismaPathProxy([]) as PrismaClient
