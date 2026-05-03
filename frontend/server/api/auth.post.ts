import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  const base = new URL(process.env.NEON_CONNECTION_STRING!)
  base.username = username
  base.password = encodeURIComponent(password)

  try {
    const sql = neon(base.toString())
    await sql.query('SELECT 1')
    return { ok: true }
  }
  catch {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }
})