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

  // The provider's login page. If it is not what we landed on, say what we did
  // land on: a redirect that failed silently is otherwise a bare "not found".
  const subject = page.locator('form input:not([type="hidden"])').first();
  try {
    await expect(subject).toBeVisible({ timeout: 15_000 });
  } catch (error) {
    const body = (
      await page
        .locator('body')
        .innerText()
        .catch(() => '')
    ).slice(0, 800);
    throw new Error(
      `Expected the provider login form.\nURL: ${page.url()}\nTitle: ${await page.title()}\nBody:\n${body}`,
      { cause: error }
    );
  }
  await subject.fill('e2e-user');
  await page.locator('form button, form input[type="submit"]').first().click();

  // Back on the application with a session.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });

  await page.context().storageState({ path: SIGNED_IN_STATE });
});
