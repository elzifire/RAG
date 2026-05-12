/**
 * Redis client singleton with automatic in-memory fallback.
 * Uses a ResilientRedisStore proxy so any Redis error (connection refused,
 * stream not writable, etc.) transparently switches to an in-process Map store.
 */
import Redis from 'ioredis'

type RedisBackendMode = 'redis' | 'memory'

const redisRuntimeState: {
  mode: RedisBackendMode
  reason: string | null
  lastChangedAt: string | null
} = {
  mode: 'redis',
  reason: null,
  lastChangedAt: null,
}

function setRedisBackendMode(mode: RedisBackendMode, reason?: string) {
  redisRuntimeState.mode = mode
  redisRuntimeState.reason = reason || null
  redisRuntimeState.lastChangedAt = new Date().toISOString()
}

export function getRedisRuntimeState() {
  return {
    mode: redisRuntimeState.mode,
    reason: redisRuntimeState.reason,
    lastChangedAt: redisRuntimeState.lastChangedAt,
  }
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface RedisStore {
  sadd(key: string, ...members: string[]): Promise<number>
  smembers(key: string): Promise<string[]>
  srem(key: string, ...members: string[]): Promise<number>
  rpush(key: string, ...values: string[]): Promise<number>
  lpop(key: string): Promise<string | null>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  llen(key: string): Promise<number>
  hset(key: string, ...fieldValues: string[]): Promise<number>
  hgetall(key: string): Promise<Record<string, string> | null>
  del(...keys: string[]): Promise<number>
  set(key: string, value: string, mode?: 'EX', duration?: number): Promise<'OK' | null>
  get(key: string): Promise<string | null>
}

// ─── In-Memory Fallback ───────────────────────────────────────────────────────

class InMemoryStore implements RedisStore {
  private sets = new Map<string, Set<string>>()
  private lists = new Map<string, string[]>()
  private hashes = new Map<string, Record<string, string>>()
  private strings = new Map<string, { value: string; expiry?: number }>()

  async set(key: string, value: string, mode?: 'EX', duration?: number) {
    const expiry = mode === 'EX' && duration ? Date.now() + duration * 1000 : undefined
    this.strings.set(key, { value, expiry })
    return 'OK' as const
  }

  async get(key: string) {
    const item = this.strings.get(key)
    if (!item) return null
    if (item.expiry && Date.now() > item.expiry) {
      this.strings.delete(key)
      return null
    }
    return item.value
  }

  async sadd(key: string, ...members: string[]) {
    if (!this.sets.has(key)) this.sets.set(key, new Set())
    const set = this.sets.get(key)!
    let added = 0
    for (const m of members) {
      if (!set.has(m)) { set.add(m); added++ }
    }
    return added
  }

  async smembers(key: string) {
    return [...(this.sets.get(key) ?? [])]
  }

  async srem(key: string, ...members: string[]) {
    const set = this.sets.get(key)
    if (!set) return 0
    let removed = 0
    for (const m of members) { if (set.delete(m)) removed++ }
    return removed
  }

  async rpush(key: string, ...values: string[]) {
    if (!this.lists.has(key)) this.lists.set(key, [])
    const list = this.lists.get(key)!
    list.push(...values)
    return list.length
  }

  async lpop(key: string) {
    const list = this.lists.get(key)
    if (!list || list.length === 0) return null
    return list.shift() ?? null
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? []
    const end = stop === -1 ? list.length : stop + 1
    return list.slice(start, end)
  }

  async llen(key: string) {
    return this.lists.get(key)?.length ?? 0
  }

  async hset(key: string, ...fieldValues: string[]) {
    if (!this.hashes.has(key)) this.hashes.set(key, {})
    const hash = this.hashes.get(key)!
    let added = 0
    for (let i = 0; i + 1 < fieldValues.length; i += 2) {
      const field = fieldValues[i]!
      const val = fieldValues[i + 1]!
      if (!(field in hash)) added++
      hash[field] = val
    }
    return added
  }

  async hgetall(key: string) {
    return this.hashes.get(key) ?? null
  }

  async del(...keys: string[]) {
    let count = 0
    for (const k of keys) {
      if (this.sets.delete(k) || this.lists.delete(k) || this.hashes.delete(k)) count++
    }
    return count
  }
}

// ─── Fault-tolerant Proxy ────────────────────────────────────────────────────
// Wraps a real Redis client; on any error it switches transparently to the
// in-memory store so the app keeps working without Redis installed.

class ResilientRedisStore implements RedisStore {
  private readonly mem = new InMemoryStore()
  private fallback = false

  constructor(private readonly client: Redis) {
    setRedisBackendMode('redis')

    client.on('error', (err: Error) => {
      if (!this.fallback) {
        console.warn('[Redis] Falling back to in-memory store:', err.message)
        this.fallback = true
        setRedisBackendMode('memory', err.message)
      }
    })
  }

  private async run<T>(redisFn: () => Promise<T>, memFn: () => Promise<T>): Promise<T> {
    if (this.fallback) return memFn()
    try {
      return await redisFn()
    }
    catch (err: unknown) {
      console.warn('[Redis] Command error, switching to in-memory:', (err as Error).message)
      this.fallback = true
      setRedisBackendMode('memory', (err as Error).message)
      return memFn()
    }
  }

  sadd(key: string, ...m: string[]) {
    return this.run(() => this.client.sadd(key, ...m), () => this.mem.sadd(key, ...m))
  }

  smembers(key: string) {
    return this.run(() => this.client.smembers(key), () => this.mem.smembers(key))
  }

  srem(key: string, ...m: string[]) {
    return this.run(() => this.client.srem(key, ...m), () => this.mem.srem(key, ...m))
  }

  rpush(key: string, ...v: string[]) {
    return this.run(() => this.client.rpush(key, ...v), () => this.mem.rpush(key, ...v))
  }

  lpop(key: string) {
    return this.run(() => this.client.lpop(key), () => this.mem.lpop(key))
  }

  lrange(key: string, start: number, stop: number) {
    return this.run(() => this.client.lrange(key, start, stop), () => this.mem.lrange(key, start, stop))
  }

  llen(key: string) {
    return this.run(() => this.client.llen(key), () => this.mem.llen(key))
  }

  hset(key: string, ...fv: string[]) {
    return this.run(() => this.client.hset(key, ...fv), () => this.mem.hset(key, ...fv))
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    return this.run(
      async () => {
        const r = await this.client.hgetall(key)
        return r && Object.keys(r).length ? r : null
      },
      () => this.mem.hgetall(key),
    )
  }

  set(key: string, value: string, mode?: 'EX', duration?: number): Promise<'OK' | null> {
    if (mode === 'EX' && duration) {
      return this.run(() => this.client.set(key, value, 'EX', duration), () => this.mem.set(key, value, 'EX', duration))
    }
    return this.run(() => this.client.set(key, value) as Promise<'OK' | null>, () => this.mem.set(key, value))
  }

  get(key: string) {
    return this.run(() => this.client.get(key), () => this.mem.get(key))
  }

  del(...keys: string[]) {
    return this.run(() => this.client.del(...keys), () => this.mem.del(...keys))
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _store: RedisStore | null = null

export const useRedis = (): RedisStore => {
  if (_store) return _store

  try {
    const config = useRuntimeConfig()
    const client = new Redis({
      host: config.redisHost || '127.0.0.1',
      port: Number(config.redisPort) || 6379,
      password: config.redisPassword || undefined,
      lazyConnect: false,
      connectTimeout: 3_000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null, // no retry — ResilientRedisStore handles fallback
    })

    _store = new ResilientRedisStore(client)
  }
  catch {
    console.warn('[Redis] Failed to create client — using in-memory store')
    setRedisBackendMode('memory', 'redis client initialization failed')
    _store = new InMemoryStore()
  }

  return _store
}
