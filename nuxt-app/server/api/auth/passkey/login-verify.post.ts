import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { signToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody<AuthenticationResponseJSON>(event)

  const origin = process.env.APP_ORIGIN || 'http://localhost:3000'
  const rpID = new URL(origin).hostname

  // Find the passkey by credentialId
  const passkey = await prisma.passkey.findUnique({
    select: {
      id: true,
      publicKey: true,
      counter: true,
      transports: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
    where: { credentialId: body.id },
  })

  if (!passkey) {
    throw createError({ statusCode: 400, message: 'Passkey not found' })
  }

  // Derive challenge from clientDataJSON (base64url encoded)
  const clientData = JSON.parse(Buffer.from(body.response.clientDataJSON, 'base64url').toString())
  const challenge = clientData.challenge as string

  const redis = useRedis()
  const storedChallenge = await redis.get(`passkey:auth:challenge:${challenge}`)

  if (!storedChallenge) {
    throw createError({ statusCode: 400, message: 'Authentication challenge expired or not found' })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: storedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: body.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransport[],
      },
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed'
    throw createError({ statusCode: 400, message })
  }

  if (!verification.verified) {
    throw createError({ statusCode: 401, message: 'Passkey authentication failed' })
  }

  // Update counter
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter) },
  })

  // Remove used challenge
  await redis.del(`passkey:auth:challenge:${challenge}`)

  const { user } = passkey
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
})
