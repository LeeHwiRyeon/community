import { applyAuthTestEnv } from './fixtures/auth-env.js'
import { test, expect } from '@playwright/test'

test.describe('Auth API', () => {
  test.beforeAll(() => applyAuthTestEnv())
  test('lists enabled providers', async ({ request }) => {
    const response = await request.get('/api/auth/providers')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(Array.isArray(body.providers)).toBeTruthy()
    const providerIds = body.providers.map((provider) => provider.provider)
    expect(providerIds).toContain('google')
    expect(providerIds).toContain('apple')
  })

  test('builds provider redirect payload', async ({ request }) => {
    const response = await request.get('/api/auth/redirect/google')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.provider).toBe('google')
    expect(body.callback).toContain('/api/auth/callback/google')

    if (body.mock) {
      expect(body.redirect).toBeTruthy()
    } else {
      expect(body.authorize).toContain('https://accounts.google.com')
      expect(body.pkce).toBeTruthy()
    }
  })

  test('mock redirect flow returns tokens for apple', async ({ request }) => {
    const redirect = await request.get('/api/auth/redirect/apple')
    expect(redirect.ok()).toBeTruthy()
    const redirectBody = await redirect.json()
    expect(redirectBody.mock).toBeTruthy()
    expect(redirectBody.callback).toContain('/api/auth/callback/apple')

    const callback = await request.get('/api/auth/callback/apple?code=mock-code')
    expect(callback.ok()).toBeTruthy()
    const callbackBody = await callback.json()
    expect(callbackBody.provider).toBe('apple')
    expect(callbackBody.access).toBeTruthy()
    expect(callbackBody.refresh).toBeTruthy()
  })
})

