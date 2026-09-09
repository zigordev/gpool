import { expect, test as setup } from '@playwright/test';

export const SIGNED_IN_STATE = 'e2e/.auth/signed-in.json';

/**
 * Signs in the way a person does: the app redirects to the provider, the
 * provider's login page asks who you are, and the callback comes back to the
 * API, which runs the same code production runs. Nothing here is a test-only
 * route in the application; the only difference from production is that the
 * three provider endpoints point at the mock in docker/compose.ci.yml.
 */
setup('sign in through the provider', async ({ page }) => {
  await page.goto('/login');

  await page
    .getByRole('button', { name: /google/i })
    .or(page.getByRole('link', { name: /google/i }))
    .first()
    .click();

  // The mock's login page: one visible text field for the subject, then submit.
  const subject = page.locator('form input:not([type="hidden"])').first();
  await expect(subject).toBeVisible();
  await subject.fill('e2e-user');
  await page.locator('form button, form input[type="submit"]').first().click();

  // Back on the application with a session.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });

  await page.context().storageState({ path: SIGNED_IN_STATE });
});
