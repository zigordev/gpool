import { expect, test } from '@playwright/test';

/**
 * The first flow that needs a session. Everything before this suite covered
 * the signed-out surface only, so a regression behind the login page reached
 * production without CI noticing.
 */
test.describe('signed in', () => {
  test('reaches the pools page rather than being sent back to login', async ({ page }) => {
    await page.goto('/pools');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).not.toContain('/login');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('the API recognises the session the browser carries', async ({ page }) => {
    const response = await page.request.get(
      `${process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:3010'}/auth/me`
    );

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ email: 'e2e@zigordev.test' });
  });
});
