import { sessions } from '../utils/sessions'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'session')
  if (token) sessions.delete(token)
  deleteCookie(event, 'session')
  return { ok: true }
})