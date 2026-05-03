import { neon } from '@neondatabase/serverless'

const sessions = new Map<string, string>()

export { sessions }

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  const base = new URL(process.env.NEON_CONNECTION_STRING!)
  base.username = username
  base.password = encodeURIComponent(password)

  try {
    const sql = neon(base.toString())
    await sql.query('SELECT 1')

    const token = crypto.randomUUID()
    sessions.set(token, base.toString())

    setCookie(event, 'session', token, { httpOnly: true, sameSite: 'strict' })
    return { ok: true, user: username }
  }
  catch {
    throw createError({ statusCode: 401, message: 'INVALID CREDENTIALS' })
  }
})