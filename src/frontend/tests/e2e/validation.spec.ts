/**
 * E2E tests for AC-3: Inline validation errors block submission.
 * Issue 9  — E2E-08, E2E-09, E2E-10, E2E-14 (empty field errors)
 * Issue 10 — E2E-11, E2E-12, E2E-13 (zero value errors)
 */

import { test, expect, type Page } from '@playwright/test';

function squatLogBtn(page: Page) {
  return page.locator('article').filter({ has: page.locator('#squat-weight') }).getByRole('button', { name: /log/i });
}

async function historyRowCount(page: Page): Promise<number> {
  const rows = page.getByRole('table').getByRole('row');
  const count = await rows.count();
  return Math.max(0, count - 1);
}

test.describe('Issue 9 — AC-3: Empty fields block submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial GET to complete so historyRowCount captures a stable baseline
    await page.waitForLoadState('networkidle');
  });

  test('E2E-08: empty weight shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-weight-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });

  test('E2E-09: empty sets shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-reps').fill('5');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-sets-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });

  test('E2E-10: empty reps shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-sets').fill('3');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-reps-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });

  test('E2E-14: all fields empty shows errors for all three fields; no new row', async ({ page }) => {
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-weight-err')).toBeVisible();
    await expect(page.locator('#squat-sets-err')).toBeVisible();
    await expect(page.locator('#squat-reps-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });
});

test.describe('Issue 10 — AC-3: Zero values block submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-11: weight = 0 shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-weight').fill('0');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-weight-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });

  test('E2E-12: sets = 0 shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-sets').fill('0');
    await page.locator('#squat-reps').fill('5');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-sets-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });

  test('E2E-13: reps = 0 shows inline error; no new row', async ({ page }) => {
    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('0');
    const before = await historyRowCount(page);
    await squatLogBtn(page).click();
    await expect(page.locator('#squat-reps-err')).toBeVisible();
    expect(await historyRowCount(page)).toBe(before);
  });
});
