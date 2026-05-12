import { requireAdmin } from '../../utils/adminGuard'

const DEFAULTS: Record<string, string> = {
  guest_max_messages: '5',
  guest_enabled: 'true',
  guest_default_model: 'deepseek-coder:6.7b',
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const stored = await prisma.appSetting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const s of stored) map[s.key] = s.value

  return map
})
