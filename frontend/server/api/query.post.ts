import { neon } from '@neondatabase/serverless'
import { sessions } from '../utils/sessions'
import { getSecrets } from '../utils/secrets'

export default defineEventHandler(async (event) => {
  const { sql: query } = await readBody(event)

  const token = getCookie(event, 'session')
  const sessionData = token ? sessions.get(token) : null

  let cs: string
  try { 
      if (sessionData) {
        const { username, password } = JSON.parse(sessionData)
        const secrets = await getSecrets()
        const base = new URL(secrets.NEON_CONNECTION_STRING!)
        base.username = username
        base.password = encodeURIComponent(decodeURIComponent(password))
        cs = base.toString()
      } else {
        const secrets = await getSecrets()
        cs = secrets.NEON_CONNECTION_STRING!
      }

    const sql = neon(cs)
    const result = await sql.query(query)
    return result
  } catch (e)
  { 
    return { error: String(e), stack: (e as Error).stack }
  }
})