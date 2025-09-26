
import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? 'http://127.0.0.1:4173/'

test.describe('Draft auto-save conflict handling', () => {
  test('shows conflict banner and emits metrics when server rejects updates', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const draftId = 'draft-e2e'
    const createdAt = new Date().toISOString()
    let conflictInjected = false

    await page.addInitScript(() => {
      window.localStorage.clear()
      ;(window as any).__capturedDraftMetrics = []
      window.addEventListener('drafts.metric', (event) => {
        const custom = event as CustomEvent
        ;(window as any).__capturedDraftMetrics.push(custom.detail)
      })
    })

    await page.route('**/api/boards', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'news', title: 'News', order: 1 }
        ])
      })
    })

    await page.route('**/posts/drafts', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }
      const payload = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: draftId,
          post_id: payload.post_id ?? null,
          author_id: 77,
          title: payload.title ?? '',
          content: payload.content ?? '',
          metadata: payload.metadata ?? {},
          status: 'active',
          created_at: createdAt,
          updated_at: createdAt,
          conflict_warning: false
        })
      })
    })

    await page.route(`**/posts/drafts/${draftId}`, async (route) => {
      const method = route.request().method()

      if (method === 'PUT') {
        const payload = JSON.parse(route.request().postData() ?? '{}')
        if (!conflictInjected) {
          conflictInjected = true
          const conflictDraft = {
            id: draftId,
            post_id: payload.post_id ?? null,
            author_id: 999,
            title: payload.title ?? '',
            content: 'remote-version-content',
            metadata: payload.metadata ?? {},
            status: 'conflict',
            created_at: createdAt,
            updated_at: new Date(Date.now() + 5000).toISOString(),
            conflict_warning: true
          }
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'conflict',
              message: 'Conflict detected by test harness',
              draft: conflictDraft
            })
          })
          return
        }

        const okDraft = {
          id: draftId,
          post_id: payload.post_id ?? null,
          author_id: 77,
          title: payload.title ?? '',
          content: payload.content ?? '',
          metadata: payload.metadata ?? {},
          status: 'active',
          created_at: createdAt,
          updated_at: new Date().toISOString(),
          conflict_warning: false
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(okDraft)
        })
        return
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: draftId,
            post_id: null,
            author_id: 77,
            title: 'News Draft',
            content: 'remote-version-content',
            metadata: { boardId: 'news' },
            status: 'conflict',
            created_at: createdAt,
            updated_at: new Date(Date.now() + 5000).toISOString(),
            conflict_warning: true
          })
        })
        return
      }

      await route.fallback()
    })

    await page.goto(`${FRONTEND_URL}board/news/create`, { waitUntil: 'networkidle' })

    await page.fill('#title', 'Example draft title')
    await page.fill('#content', 'First draft body text')

    const createResponse = page.waitForResponse((response) =>
      response.url().includes('/posts/drafts') && response.request().method() === 'POST'
    )
    await page.waitForTimeout(1700)
    await createResponse

    await expect.poll(async () => await page.getAttribute('.draft-status', 'data-draft-status') ?? '', { timeout: 5000 }).toBe('saved')

    const conflictResponse = page.waitForResponse((response) =>
      response.url().includes(`/posts/drafts/${draftId}`) &&
      response.request().method() === 'PUT' &&
      response.status() === 409
    )
    await page.fill('#content', 'Second draft body text')
    await page.waitForTimeout(1700)
    await conflictResponse

    await expect(page.locator('[data-testid="draft-conflict-banner"]').first()).toBeVisible()

    await expect.poll(async () => await page.getAttribute('.draft-status', 'data-draft-status') ?? '', { timeout: 5000 }).toBe('conflict')

    const resolveResponse = page.waitForResponse((response) =>
      response.url().includes(`/posts/drafts/${draftId}`) &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await page.click('[data-testid="draft-conflict-keep-local"]')
    await resolveResponse

    await expect.poll(async () => await page.getAttribute('.draft-status', 'data-draft-status') ?? '', { timeout: 5000 }).toBe('saved')

    await expect(page.locator('[data-testid="draft-conflict-banner"]').first()).toBeHidden()

    const metrics = await page.evaluate(() => (window as any).__capturedDraftMetrics ?? [])
    expect(Array.isArray(metrics)).toBeTruthy()
    const conflictMetric = metrics.find((event: any) => event?.reason === 'http_conflict')
    expect(conflictMetric?.name).toBe('drafts.save.failure')
    expect(conflictMetric?.error).toBe('conflict')
    expect(conflictMetric?.draftId).toBe(draftId)
    expect(conflictMetric?.boardId).toBe('news')

    await context.close()
  })
})
