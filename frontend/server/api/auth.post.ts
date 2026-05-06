import { neon } from '@neondatabase/serverless'
import { sessions } from '../utils/sessions'
import { getSecrets } from '../utils/secrets'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  try {
    const secrets = await getSecrets()
    const base = new URL(secrets.NEON_CONNECTION_STRING!)
    base.username = username
    base.password = encodeURIComponent(decodeURIComponent(password))
    const sql = neon(base.toString())
    await sql.query('SELECT 1')

    const token = crypto.randomUUID()
    sessions.set(token, JSON.stringify({ username, password }))
    setCookie(event, 'session', token, { httpOnly: true, sameSite: 'strict' })
    return { ok: true, user: username }
  }
  catch {
    throw createError({ statusCode: 401, message: 'INVALID CREDENTIALS' })
  }
})