/**
 * E2E tests for AC-2: Log a workout entry.
 * Issue 8 — E2E-04, E2E-05, E2E-06, E2E-07
 */

import { test, expect, APIRequestContext, type Page } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api/v1';

async function seedWorkout(request: APIRequestContext, exercise: string): Promise<void> {
  await request.post(`${API_BASE}/workout-logs`, {
    data: { exercise, weightLbs: 80.0, sets: 2, reps: 10 },
  });
}

function squatCard(page: Page) {
  return page.locator('article').filter({ has: page.locator('#squat-weight') });
}
function benchCard(page: Page) {
  return page.locator('article').filter({ has: page.locator('#bench-press-weight') });
}

test.describe('Issue 8 — AC-2: Log a workout entry', () => {
  test('E2E-04: filling Squat card and clicking Log adds row with exact values', async ({ page }) => {
    await page.goto('/');

    await page.locator('#squat-weight').fill('135.75');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    await squatCard(page).getByRole('button', { name: /log/i }).click();

    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: 'Squat' }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '135.75' }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '3' }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '5' }).first()).toBeVisible();
  });

  test('E2E-05: new row appears at top when a prior row already exists', async ({ page, request }) => {
    await seedWorkout(request, 'Deadlift');
    await page.goto('/');

    await page.locator('#bench-press-weight').fill('80');
    await page.locator('#bench-press-sets').fill('4');
    await page.locator('#bench-press-reps').fill('8');
    await benchCard(page).getByRole('button', { name: /log/i }).click();

    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: 'Bench Press' }).first()).toBeVisible();
    const firstDataRow = table.getByRole('row').nth(1);
    await expect(firstDataRow.getByRole('cell', { name: 'Bench Press' })).toBeVisible();
  });

  test('E2E-06: input fields clear after successful submission', async ({ page }) => {
    await page.goto('/');

    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    await squatCard(page).getByRole('button', { name: /log/i }).click();

    await expect(page.getByRole('cell', { name: 'Squat' }).first()).toBeVisible();
    await expect(page.locator('#squat-weight')).toHaveValue('');
    await expect(page.locator('#squat-sets')).toHaveValue('');
    await expect(page.locator('#squat-reps')).toHaveValue('');
  });

  test('E2E-07: history table updates without a full page reload', async ({ page }) => {
    await page.goto('/');

    let fullNavOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) fullNavOccurred = true;
    });

    await page.locator('#squat-weight').fill('90');
    await page.locator('#squat-sets').fill('2');
    await page.locator('#squat-reps').fill('6');
    await squatCard(page).getByRole('button', { name: /log/i }).click();

    await expect(page.getByRole('cell', { name: 'Squat' }).first()).toBeVisible();
    expect(fullNavOccurred).toBe(false);
  });
});
