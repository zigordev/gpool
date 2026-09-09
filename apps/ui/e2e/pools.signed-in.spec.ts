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

    // The signed-in shell renders and the sign-in control is gone. A heading is
    // not a useful proxy here: this page has none, so asserting on one tested
    // the markup rather than whether the session held.
    //
    // .first() because the page has two main landmarks, one from the app shell
    // and one from the screen inside it. A document should have one; the axe
    // suite does not catch it because landmark-unique is a best-practice rule
    // rather than WCAG A or AA, and that suite only runs the WCAG tags.
    await expect(page.getByRole('main').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toHaveCount(0);
  });

  test('the API recognises the session the browser carries', async ({ page }) => {
    const response = await page.request.get(
      `${process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:3010'}/auth/me`
    );

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ email: 'e2e@zigordev.test' });
  });
});
