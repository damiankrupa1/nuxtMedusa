import { clearSessionCookie } from '~~/server/utils/session-cookie'

// Signing out drops the cookie, with the attributes it was set with. Medusa
// isn't called: its customer token is a stateless JWT that can't be revoked,
// and the SDK's auth.logout() only ends a Medusa cookie session
// (DELETE /auth/session), which this server never opens (its client uses JWT
// auth, server/utils/medusa.ts, #82). A copy of the token
// taken before logout therefore stays valid until its `exp` (Medusa's
// jwtExpiresIn, 24h by default).
export default defineWrappedResponseHandler(async (event) => {
  clearSessionCookie(event)

  return { success: true }
})
