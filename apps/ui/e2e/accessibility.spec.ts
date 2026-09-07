import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('sign-in page', () => {
  test('renders the sign-in control rather than a blank document', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('button').or(page.getByRole('link')).first()).toBeVisible();
  });

  test('has no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)).toEqual([]);
  });

  test('a protected route sends a signed-out visitor to sign in instead of rendering half a page', async ({ page }) => {
    await page.goto('/pools');
    await page.waitForURL(/\/login/);

    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
