import { neon } from '@neondatabase/serverless'
import { sessions } from '../utils/sessions'

export default defineEventHandler(async (event) => {
  const { sql: query } = await readBody(event)

  const token = getCookie(event, 'session')
  const sessionData = token ? sessions.get(token) : null

  let cs: string
  if (sessionData) {
    const { username, password } = JSON.parse(sessionData)
    const base = new URL(process.env.NEON_CONNECTION_STRING!)
    base.username = username
    base.password = password
    cs = base.toString()
  } else {
    cs = process.env.NEON_CONNECTION_STRING!
  }

  const sql = neon(cs)
  const result = await sql.query(query)
  return result
})