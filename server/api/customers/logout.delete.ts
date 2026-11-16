// Signing out only drops the cookie; Medusa isn't called, so the token itself
// stays valid until it expires.
export default defineWrappedResponseHandler(async (event) => {
  deleteCookie(event, 'medusa_jwt')

  return { success: true }
})
