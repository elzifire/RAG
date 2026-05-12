import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'
import type { AppJWTPayload } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const user = event.context.user as AppJWTPayload
  const body = await readBody<RegistrationResponseJSON>(event)

  const origin = process.env.APP_ORIGIN || 'http://localhost:3000'
  const rpID = new URL(origin).hostname

  const redis = useRedis()
  const expectedChallenge = await redis.get(`passkey:reg:challenge:${user.sub}`)

  if (!expectedChallenge) {
    throw createError({ statusCode: 400, message: 'Registration challenge expired or not found' })
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    throw createError({ statusCode: 400, message })
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({ statusCode: 400, message: 'Registration verification failed' })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  // Remove used challenge
  await redis.del(`passkey:reg:challenge:${user.sub}`)

  await prisma.passkey.create({
    data: {
      userId: user.sub,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: body.response.transports ?? [],
    },
  })

  return { verified: true }
})
