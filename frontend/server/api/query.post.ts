import { neon } from '@neondatabase/serverless'
import { sessions } from './auth.post'

export default defineEventHandler(async (event) => {
  const { sql: query } = await readBody(event)

  const token = getCookie(event, 'session')
  const cs = (token && sessions.get(token)) ?? process.env.NEON_CONNECTION_STRING!

  const url = new URL(cs)
  url.password = encodeURIComponent(url.password)
  const sql = neon(url.toString())
  const result = await sql.query(query)
  return result
})