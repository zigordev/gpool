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

for (const path of ['/', '/login']) {
  test(`${path} breaks none of its own content security policy`, async ({ page }) => {
    await recordViolations(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });
}

test('an inline script the page did not vouch for is still reported', async ({ page }) => {
  await recordViolations(page);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__injected = true;';
    document.body.append(script);
  });
  await expect
    .poll(() => violations(page))
    .toEqual([{ directive: 'script-src-elem', blocked: 'inline' }]);
});

test('a country flag loads from its CDN, and an image from anywhere else is reported', async ({
  page,
}) => {
  await recordViolations(page);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    for (const src of [
      'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/es.svg',
      'https://example.com/pixel.png',
    ]) {
      const image = document.createElement('img');
      image.src = src;
      document.body.append(image);
    }
  });
  await expect
    .poll(() => violations(page))
    .toEqual([{ directive: 'img-src', blocked: 'https://example.com/pixel.png' }]);
});
