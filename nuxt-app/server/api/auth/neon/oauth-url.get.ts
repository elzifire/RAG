import { buildNeonOAuthUrl, getNeonOAuthProviders, isNeonAuthEnabled } from '../../../utils/neonAuth'

export default defineEventHandler(async (event) => {
  if (!isNeonAuthEnabled()) {
    throw createError({ statusCode: 503, message: 'Neon Auth is not enabled' })
  }

  const query = getQuery(event)
  const providerRaw = String(query.provider || '').trim().toLowerCase()
  const allowed = getNeonOAuthProviders()

  if (!providerRaw || !allowed.includes(providerRaw)) {
    throw createError({
      statusCode: 400,
      message: `provider must be one of: ${allowed.join(', ')}`,
    })
  }

  const config = useRuntimeConfig()
  const fallbackRedirect = `${config.public.appOrigin || 'http://localhost:3000'}/login`
  const redirectTo = String(query.redirectTo || fallbackRedirect).trim()

  const url = buildNeonOAuthUrl(providerRaw, redirectTo)
  return {
    provider: providerRaw,
    url,
  }
})
