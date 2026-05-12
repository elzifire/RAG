import { requireAdmin } from '../../../utils/adminGuard'
import { generateAccessToken } from '../../../utils/tokenAccess'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const body = await readBody<{
    label?: string
    messageLimit: number
    expiredAt?: string | null
  }>(event)

  if (!body.messageLimit || body.messageLimit < 1) {
    throw createError({ statusCode: 400, message: '`messageLimit` must be a positive integer' })
  }

  const token = generateAccessToken()

  const record = await prisma.unlimitedAccess.create({
    data: {
      token,
      label: body.label?.trim() || null,
      grantedBy: admin.sub,
      messageLimit: Math.floor(body.messageLimit),
      expiredAt: body.expiredAt ? new Date(body.expiredAt) : null,
    },
  })

  return record
})
