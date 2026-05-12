import { ensureLocalAuthUser } from '../../../utils/authUser'
import { isNeonAuthEnabled, neonFetchCurrentUser } from '../../../utils/neonAuth'

interface NeonSessionBody {
  accessToken: string
}

export default defineEventHandler(async (event) => {
  if (!isNeonAuthEnabled()) {
    throw createError({ statusCode: 503, message: 'Neon Auth is not enabled' })
  }

  const body = await readBody<NeonSessionBody>(event)
  const accessToken = body.accessToken?.trim()

  if (!accessToken) {
    throw createError({ statusCode: 400, message: '`accessToken` is required' })
  }

  const profile = await neonFetchCurrentUser(accessToken)
  const user = await ensureLocalAuthUser({
    email: profile.email,
    name: profile.name,
  })

  return {
    token: accessToken,
    user,
    provider: 'neon' as const,
  }
})
