/**
 * E2E tests for keyword detail page (/keyword/[id]).
 *
 * Prerequisites:
 *   - docker compose up (postgres + redis)
 *   - backend running on http://localhost:3001
 *   - frontend running on http://localhost:3000
 *
 * Run with:
 *   npx playwright test tests/e2e/keyword-detail.test.tsx
 *   or:
 *   node --experimental-vm-modules node_modules/.bin/playwright test tests/e2e/keyword-detail.test.tsx
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

const TEST_USER = {
  email: `e2e-detail-${Date.now()}@test.com`,
  password: 'TestPassword123!',
};

const TEST_KEYWORD = 'smart projector';

async function registerOrLogin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);

  // Try login first; fall back to register if user does not exist
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  const hasError = await page.locator('.bg-red-50').isVisible({ timeout: 2000 }).catch(() => false);
  if (hasError) {
    await page.click('text=Register');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 });
}

async function addKeyword(page: Page, term: string): Promise<string> {
  await page.fill('input[placeholder*="keyword"]', term);
  await page.click('button:has-text("Add")');
  await page.waitForSelector(`p.truncate:has-text("${term}")`, { timeout: 8000 });

  // Extract keyword ID from the API
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  const res = await fetch(`${API_URL}/keywords`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const keywords = (await res.json()) as Array<{ id: string; term: string }>;
  const kw = keywords.find((k) => k.term.toLowerCase().includes(term.toLowerCase()));
  if (!kw) throw new Error(`Keyword "${term}" not found after adding`);
  return kw.id;
}

test.describe('Keyword detail page', () => {
  let keywordId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerOrLogin(page);
    keywordId = await addKeyword(page, TEST_KEYWORD);
    await page.close();
  });

  test('navigates from OpportunityCard keyword link to detail page', async ({ page }) => {
    await registerOrLogin(page);

    // Click the keyword name link in the opportunity card
    const keywordLink = page.locator(`a:has-text("${TEST_KEYWORD}")`).first();
    await keywordLink.waitFor({ timeout: 10000 });
    await keywordLink.click();

    await page.waitForURL(`${BASE_URL}/keyword/**`, { timeout: 8000 });
    expect(page.url()).toContain('/keyword/');
  });

  test('displays keyword name and prediction score', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);

    // Keyword name heading
    await expect(page.locator('h1')).toContainText(TEST_KEYWORD, { ignoreCase: true, timeout: 10000 });

    // Prediction score area (shows "prediction score" label)
    await expect(page.locator('text=prediction score')).toBeVisible();
  });

  test('displays lifecycle stage badge', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);
    await page.waitForLoadState('networkidle');

    // Should show one of the known lifecycle stages
    const stageBadge = page
      .locator('span')
      .filter({ hasText: /^(seed|emerging|growing|viral|saturated|declining)$/i });
    await expect(stageBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('renders AccelerationChart section', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);
    await page.waitForLoadState('networkidle');

    // Chart section heading
    await expect(page.locator('h2:has-text("30-Day Acceleration")')).toBeVisible({ timeout: 10000 });

    // Either an SVG or the empty state message
    const hasChart = await page.locator('svg[aria-label]').isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await page.locator('text=No historical data').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasChart || hasEmpty).toBe(true);
  });

  test('renders StageTimeline section', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2:has-text("Lifecycle Stage")')).toBeVisible({ timeout: 10000 });
  });

  test('renders InsightDetail section', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2:has-text("AI Insight")')).toBeVisible({ timeout: 10000 });
  });

  test('back button navigates to dashboard', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/${keywordId}`);
    await page.waitForLoadState('networkidle');

    await page.click('a:has-text("Dashboard")');
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
    expect(page.url()).toBe(`${BASE_URL}/`);
  });

  test('shows error state for unknown keyword ID', async ({ page }) => {
    await registerOrLogin(page);
    await page.goto(`${BASE_URL}/keyword/00000000-0000-0000-0000-000000000000`);
    await page.waitForLoadState('networkidle');

    // Should show error message and back link, not crash
    const errorMsg = page.locator('text=/not found|failed|error/i');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Back to dashboard")')).toBeVisible();
  });
});
