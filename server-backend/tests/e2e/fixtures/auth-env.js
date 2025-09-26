export function applyAuthTestEnv() {
  if (!process.env.AUTH_ENABLE_ALL) {
    process.env.AUTH_ENABLE_ALL = '1'
  }
  if (!process.env.USE_MOCK_DB) {
    process.env.USE_MOCK_DB = '1'
  }
  if (!process.env.OAUTH_GOOGLE_CLIENT_ID) {
    process.env.OAUTH_GOOGLE_CLIENT_ID = 'mock-google'
  }
  if (!process.env.OAUTH_APPLE_CLIENT_ID) {
    process.env.OAUTH_APPLE_CLIENT_ID = 'mock-apple'
  }
  if (!process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
    process.env.OAUTH_GOOGLE_CLIENT_SECRET = 'mock-secret'
  }
  if (!process.env.OAUTH_APPLE_CLIENT_SECRET) {
    process.env.OAUTH_APPLE_CLIENT_SECRET = 'mock-secret'
  }
}
