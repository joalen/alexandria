import { InfisicalSDK } from '@infisical/sdk'

let cached: Record<string, string> | null = null

export async function getSecrets() {
  if (cached) return cached

  const client = new InfisicalSDK()
  await client.auth().universalAuth.login({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  })

  const { secrets } = await client.secrets().listSecrets({
    projectId: process.env.INFISICAL_PROJECT_ID!,
    environment: 'dev',
    secretPath: '/',
  })

  cached = {}
  for (const s of secrets) {
    cached[s.secretKey] = s.secretValue
  }
  return cached
}