import { prisma } from './prisma'
import { getRedisRuntimeState, useRedis } from './redis'

let warnedMissingQueueModel = false

type ChatQueueModelDelegate = {
  create: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<{
    id: string
    sessionId: string
    model: string
    userMessageId: string
    status: string
    createdAt: Date
  } | null>
  updateMany: (args: unknown) => Promise<{ count: number }>
  findFirst: (args: unknown) => Promise<{
    id: string
    sessionId: string
    model: string
    userMessageId: string
    createdAt: Date
  } | null>
}

function getChatQueueModel(): ChatQueueModelDelegate | null {
  const model = (prisma as unknown as { chatQueueJob?: ChatQueueModelDelegate }).chatQueueJob
  if (model) return model

  if (!warnedMissingQueueModel) {
    warnedMissingQueueModel = true
    console.warn('[Queue] Prisma client has no chatQueueJob delegate. Database queue is disabled.')
  }

  return null
}

export interface ChatQueueJobPayload {
  sessionId: string
  model: string
  userMessageId: string
  timestamp: string
}

export interface DequeuedChatQueueJob extends ChatQueueJobPayload {
  queueJobId: string
  source: 'redis' | 'database' | 'skipped'
}

function queueKey(sessionId: string) {
  return `chat:queue:${sessionId}`
}

function isRedisQueueAvailable(): boolean {
  // Initialize store first, then read latest backend mode.
  useRedis()
  return getRedisRuntimeState().mode === 'redis'
}

export async function enqueueChatJob(job: ChatQueueJobPayload): Promise<void> {
  if (isRedisQueueAvailable()) {
    try {
      const redis = useRedis()
      await redis.rpush(queueKey(job.sessionId), JSON.stringify(job))

      if (getRedisRuntimeState().mode === 'redis') {
        return
      }

      console.warn('[Queue] Redis switched to memory fallback. Trying DB queue instead.')
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown redis error'
      console.warn(`[Queue] Redis enqueue failed, trying DB queue: ${message}`)
    }
  }

  const queueModel = getChatQueueModel()
  if (queueModel) {
    try {
      await queueModel.create({
        data: {
          sessionId: job.sessionId,
          userMessageId: job.userMessageId,
          model: job.model,
          status: 'PENDING',
        },
      })
      return
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown db queue error'
      console.warn(`[Queue] DB enqueue failed, queue will be skipped: ${message}`)
    }
  }

  console.warn('[Queue] Redis and DB queue are unavailable. Skipping queue for prototype mode.')
}

async function claimFromDatabase(sessionId: string): Promise<DequeuedChatQueueJob | null> {
  const queueModel = getChatQueueModel()
  if (!queueModel) return null

  for (let attempt = 0; attempt < 3; attempt++) {
    const pending = await queueModel.findFirst({
      where: {
        sessionId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        model: true,
        userMessageId: true,
        createdAt: true,
      },
    })

    if (!pending) return null

    const updated = await queueModel.updateMany({
      where: {
        id: pending.id,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        errorText: null,
      },
    })

    if (updated.count === 1) {
      return {
        queueJobId: pending.id,
        sessionId: pending.sessionId,
        model: pending.model,
        userMessageId: pending.userMessageId,
        timestamp: pending.createdAt.toISOString(),
        source: 'database',
      }
    }
  }

  return null
}

function safeParseJob(raw: string): ChatQueueJobPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ChatQueueJobPayload>
    if (!parsed.sessionId || !parsed.model || !parsed.userMessageId || !parsed.timestamp) return null
    return {
      sessionId: parsed.sessionId,
      model: parsed.model,
      userMessageId: parsed.userMessageId,
      timestamp: parsed.timestamp,
    }
  }
  catch {
    return null
  }
}

export async function dequeueChatJob(sessionId: string): Promise<DequeuedChatQueueJob | null> {
  if (isRedisQueueAvailable()) {
    try {
      const redis = useRedis()
      const raw = await redis.lpop(queueKey(sessionId))

      if (getRedisRuntimeState().mode !== 'redis') {
        console.warn('[Queue] Redis switched to memory fallback. Using DB queue for dequeue.')
      }
      else if (raw) {
        const parsed = safeParseJob(raw)
        if (parsed) {
          return {
            queueJobId: parsed.userMessageId,
            sessionId: parsed.sessionId,
            model: parsed.model,
            userMessageId: parsed.userMessageId,
            timestamp: parsed.timestamp,
            source: 'redis',
          }
        }
      }
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown redis error'
      console.warn(`[Queue] Redis dequeue failed, falling back to DB queue: ${message}`)
    }
  }

  return claimFromDatabase(sessionId)
}

export async function completeChatJob(queueJobId: string, source: DequeuedChatQueueJob['source']) {
  if (source !== 'database') return

  const queueModel = getChatQueueModel()
  if (!queueModel) return

  await queueModel.updateMany({
    where: {
      id: queueJobId,
      status: {
        in: ['PENDING', 'PROCESSING'],
      },
    },
    data: {
      status: 'DONE',
      finishedAt: new Date(),
      errorText: null,
    },
  })
}

export async function failChatJob(
  queueJobId: string,
  errorMessage: string,
  source: DequeuedChatQueueJob['source'],
) {
  if (source !== 'database') return

  const queueModel = getChatQueueModel()
  if (!queueModel) return

  await queueModel.updateMany({
    where: {
      id: queueJobId,
      status: {
        in: ['PENDING', 'PROCESSING'],
      },
    },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
      errorText: errorMessage.slice(0, 1000),
    },
  })
}
