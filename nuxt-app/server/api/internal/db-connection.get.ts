import { requireAdmin } from '../../utils/adminGuard'
import { getDatabaseConnectionState, prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const startedAt = Date.now()
  let pingOk = true
  let pingError: string | null = null

  try {
    await prisma.$queryRawUnsafe('SELECT 1')
  }
  catch (err: unknown) {
    pingOk = false
    pingError = err instanceof Error ? err.message : 'Database ping failed'
    setResponseStatus(event, 503)
  }

  const status = getDatabaseConnectionState()

  return {
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    pingOk,
    pingError,
    ...status,
  }
})
