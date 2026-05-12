import { getNeonAuthConfig } from '../../../utils/neonAuth'

export default defineEventHandler(() => {
  const config = getNeonAuthConfig()
  return {
    enabled: config.enabled,
    providers: config.providers,
  }
})
