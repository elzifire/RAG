import { generateAuthenticationOptions } from '@simplewebauthn/server'

const CHALLENGE_TTL = 300 // 5 minutes

interface LoginOptionsBody {
  email?: string
}

export default defineEventHandler(async (event) => {
  const { email } = await readBody<LoginOptionsBody>(event)

  const origin = process.env.APP_ORIGIN || 'http://localhost:3000'
  const rpID = new URL(origin).hostname

  let allowCredentials: { id: string; transports: AuthenticatorTransport[] }[] = []

  if (email?.trim()) {
    const user = await prisma.user.findUnique({
      select: { id: true, passkeys: { select: { credentialId: true, transports: true } } },
      where: { email: email.trim().toLowerCase() },
    })

    if (user?.passkeys.length) {
      allowCredentials = user.passkeys.map(pk => ({
        id: pk.credentialId,
        transports: pk.transports as AuthenticatorTransport[],
      }))
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  })

  // Store challenge indexed by challenge value (no user context yet at login time)
  const redis = useRedis()
  await redis.set(`passkey:auth:challenge:${options.challenge}`, options.challenge, 'EX', CHALLENGE_TTL)

  return options
})
