import { InfisicalSDK } from '@infisical/sdk'

export default defineNitroPlugin(async () => {
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

  for (const secret of secrets) {
    if (secret.secretKey === 'NEON_CONNECTION_STRING') {
      process.env[secret.secretKey] = secret.secretValue.replace(
        /\/\/([^:]+):([^@]+)@/,
        (_, user, pass) => `//${user}:${encodeURIComponent(pass)}@`
      )
    } else {
      process.env[secret.secretKey] = secret.secretValue
    }
  }
})