import { requireAdmin } from '../../utils/adminGuard'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const body = await readBody<{ key: string; value: string }>(event)

  if (!body.key?.trim()) throw createError({ statusCode: 400, message: '`key` is required' })
  if (body.value === undefined) throw createError({ statusCode: 400, message: '`value` is required' })

  const setting = await prisma.appSetting.upsert({
    where: { key: body.key },
    create: { key: body.key, value: body.value, updatedBy: admin.sub },
    update: { value: body.value, updatedBy: admin.sub },
  })

  return setting
})
