import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? 'http://127.0.0.1:4173/'

const measureHeaderAlignment = async (page: import('@playwright/test').Page) => {
  return page.evaluate(() => {
    const actions = document.querySelector('.site-header__actions') as HTMLElement | null
    const container = actions?.closest('.site-header__container') as HTMLElement | null
    if (!actions || !container) {
      return null
    }
    const actionsRect = actions.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    return {
      diff: containerRect.right - actionsRect.right,
      containerWidth: containerRect.width,
      actionsWidth: actionsRect.width
    }
  })
}

test.describe('Frontend layout spacing', () => {
  test('desktop header alignment and four-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const alignment = await measureHeaderAlignment(page)
    expect(alignment, 'header alignment data should be present').not.toBeNull()
    if (alignment) {
      expect(Math.abs(alignment.diff)).toBeLessThanOrEqual(12)
      expect(alignment.actionsWidth).toBeLessThan(alignment.containerWidth)
    }

    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.home__news-column .news-grid') as HTMLElement | null
      if (!grid) {
        return null
      }
      const style = window.getComputedStyle(grid).gridTemplateColumns
      const repeatMatch = style.match(/repeat\((\d+)/)
      const columns = repeatMatch ? parseInt(repeatMatch[1], 10) : style.split(/\s+/).filter(Boolean).length
      const children = Array.from(grid.children || [])
      return { template: style, columns, childCount: children.length }
    })

    expect(gridInfo, 'grid template should resolve').not.toBeNull()
    if (gridInfo) {
      const expected = Math.min(4, gridInfo.childCount || 4)
      expect(gridInfo.columns).toBeGreaterThanOrEqual(expected)
    }
  })

  test('tablet header alignment and multi-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const alignment = await measureHeaderAlignment(page)
    expect(alignment, 'header alignment data should be present').not.toBeNull()
    if (alignment) {
      expect(Math.abs(alignment.diff)).toBeLessThanOrEqual(20)
    }

    const firstRowCount = await page.evaluate(() => {
      const grid = document.querySelector('.home__news-column .news-grid') as HTMLElement | null
      if (!grid) {
        return 0
      }
      const children = Array.from(grid.children) as HTMLElement[]
      if (children.length === 0) {
        return 0
      }
      const firstTop = children[0].getBoundingClientRect().top
      return children.filter((child) => Math.abs(child.getBoundingClientRect().top - firstTop) < 1).length
    })

    expect(firstRowCount).toBeGreaterThanOrEqual(2)
  })
})
