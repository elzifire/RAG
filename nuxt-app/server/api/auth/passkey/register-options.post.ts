import { generateRegistrationOptions } from '@simplewebauthn/server'
import type { AppJWTPayload } from '../../../utils/jwt'

const CHALLENGE_TTL = 300 // 5 minutes

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload
  const origin = process.env.APP_ORIGIN || 'http://localhost:3000'
  const rpID = new URL(origin).hostname

  const existingPasskeys = await prisma.passkey.findMany({
    select: { credentialId: true, transports: true },
    where: { userId: user.sub },
  })

  const options = await generateRegistrationOptions({
    rpName: 'RAG Chatbot',
    rpID,
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map(pk => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  // Store challenge in Redis with TTL
  const redis = useRedis()
  await redis.set(`passkey:reg:challenge:${user.sub}`, options.challenge, 'EX', CHALLENGE_TTL)

  return options
})
