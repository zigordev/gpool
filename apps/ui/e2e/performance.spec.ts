import { expect, test } from '@playwright/test';

const BUDGETS = {
  lcpMs: 2_500,
  cls: 0.1,
  transferBytes: 900_000,
};

test('the sign-in page meets its Core Web Vitals budgets', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const lcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.at(-1)?.startTime ?? 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(0), 5_000);
      }),
  );
  expect(lcp, `LCP ${Math.round(lcp)}ms`).toBeLessThan(BUDGETS.lcpMs);

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          })[]) {
            if (!entry.hadRecentInput) total += entry.value ?? 0;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 2_000);
      }),
  );
  expect(cls, `CLS ${cls.toFixed(3)}`).toBeLessThan(BUDGETS.cls);
});

test('the sign-in page stays inside its transfer budget', async ({ page }) => {
  let transferred = 0;
  page.on('response', (response) => {
    const length = Number(response.headers()['content-length'] ?? 0);
    if (Number.isFinite(length)) transferred += length;
  });

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  expect(transferred, `${Math.round(transferred / 1024)} KB transferred`).toBeLessThan(
    BUDGETS.transferBytes,
  );
});
