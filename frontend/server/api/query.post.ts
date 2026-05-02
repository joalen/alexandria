import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { sql: query } = await readBody(event)
  
  const sql = neon(config.neonConnectionString)
  const result = await sql(query)
  return result
})