import { expect, test, type Page } from '@playwright/test';

type Violation = { directive: string; blocked: string };

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: { directive: string; blocked: string }[] = [];
    Object.assign(window, { __violations: seen });
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __violations: Violation[] }).__violations);

test('the pools page breaks none of its own content security policy', async ({ page }) => {
  await recordViolations(page);
  await page.goto('/pools');
  await page.waitForLoadState('networkidle');
  expect(await violations(page)).toEqual([]);
});
