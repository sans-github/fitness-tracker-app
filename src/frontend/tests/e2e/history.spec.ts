/**
 * E2E tests for AC-4: History table order and value correctness.
 * Issue 11 — E2E-15, E2E-16, E2E-17, E2E-18, EDGE-06
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api/v1';

async function seedRow(
  request: APIRequestContext,
  exercise: string,
  weightLbs: number,
  sets: number,
  reps: number
): Promise<void> {
  const res = await request.post(`${API_BASE}/workout-logs`, {
    data: { exercise, weightLbs, sets, reps },
  });
  if (res.status() !== 201) throw new Error(`Seed failed: ${res.status()}`);
}

test.describe('Issue 11 — AC-4: History order and value correctness', () => {
  test('E2E-15: rows seeded in known order appear newest-first', async ({ page, request }) => {
    // Seed oldest to newest — newest ("Bench Press") must appear in row 1
    await seedRow(request, 'Squat', 100, 3, 5);
    await new Promise((r) => setTimeout(r, 150));
    await seedRow(request, 'Deadlift', 200, 1, 3);
    await new Promise((r) => setTimeout(r, 150));
    await seedRow(request, 'Bench Press', 80, 4, 8);

    await page.goto('/');

    const table = page.getByRole('table');
    // The newest (Bench Press) must be the first data row
    const firstDataRow = table.getByRole('row').nth(1);
    await expect(firstDataRow.getByRole('cell', { name: 'Bench Press' })).toBeVisible();

    // The Squat row seeded here must appear after the Deadlift row
    const allRows = await table.getByRole('row').all();
    const cellTexts = await Promise.all(
      allRows.slice(1).map((row) => row.textContent())
    );
    const benchIdx = cellTexts.findIndex((t) => t?.includes('Bench Press') && t?.includes('80'));
    const deadliftIdx = cellTexts.findIndex((t) => t?.includes('Deadlift') && t?.includes('200'));
    const squatIdx = cellTexts.findIndex((t) => t?.includes('Squat') && t?.includes('100'));
    expect(benchIdx).toBeGreaterThanOrEqual(0);
    expect(deadliftIdx).toBeGreaterThan(benchIdx);
    expect(squatIdx).toBeGreaterThan(deadliftIdx);
  });

  test('E2E-16: weight 135.75 displays as "135.75" with no rounding', async ({ page, request }) => {
    await seedRow(request, 'Overhead Press', 135.75, 3, 5);
    await page.goto('/');

    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: '135.75', exact: true }).first()).toBeVisible();
    const cellTexts = await table.getByRole('cell').allTextContents();
    expect(cellTexts).not.toContain('135.8');
    expect(cellTexts).not.toContain('136');
  });

  test('E2E-17: integer sets and reps display without decimals', async ({ page, request }) => {
    await seedRow(request, 'Bent-over Row', 60, 3, 5);
    await page.goto('/');

    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: '3', exact: true }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '5', exact: true }).first()).toBeVisible();
    const texts = await table.getByRole('cell').allTextContents();
    expect(texts).not.toContain('3.0');
    expect(texts).not.toContain('5.0');
  });

  test('E2E-18: exercise name matches submitted value exactly', async ({ page, request }) => {
    await seedRow(request, 'Overhead Press', 50, 2, 10);
    await page.goto('/');
    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: 'Overhead Press', exact: true }).first()).toBeVisible();
  });

  test('EDGE-06: 3 entries submitted in rapid succession all appear with newest at top', async ({ page }) => {
    await page.goto('/');

    const squatCard = page.locator('article').filter({ has: page.locator('#squat-weight') });

    await page.locator('#squat-weight').fill('100');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    await squatCard.getByRole('button', { name: /log/i }).click();
    await expect(page.getByRole('cell', { name: '100', exact: true }).first()).toBeVisible();
    await expect(page.locator('#squat-weight')).toHaveValue('');

    await page.locator('#squat-weight').fill('110');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    await squatCard.getByRole('button', { name: /log/i }).click();
    await expect(page.getByRole('cell', { name: '110', exact: true }).first()).toBeVisible();
    await expect(page.locator('#squat-weight')).toHaveValue('');

    await page.locator('#squat-weight').fill('120');
    await page.locator('#squat-sets').fill('3');
    await page.locator('#squat-reps').fill('5');
    await squatCard.getByRole('button', { name: /log/i }).click();

    const table = page.getByRole('table');
    await expect(table.getByRole('cell', { name: '100', exact: true }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '110', exact: true }).first()).toBeVisible();
    await expect(table.getByRole('cell', { name: '120', exact: true }).first()).toBeVisible();

    const firstDataRow = table.getByRole('row').nth(1);
    await expect(firstDataRow.getByRole('cell', { name: '120', exact: true })).toBeVisible();
  });
});
