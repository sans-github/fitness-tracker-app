import { test, expect } from '@playwright/test';

test('all five exercises appear on page load with empty inputs', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Bent-over Row']) {
    await expect(page.getByText(name)).toBeVisible();
  }
  await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
});

test('logging a set adds the row to the history table', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Weight (lbs)', { exact: false }).first().fill('100');
  await page.getByLabel('Sets').first().fill('3');
  await page.getByLabel('Reps').first().fill('5');
  await page.getByRole('button', { name: /log/i }).first().click();
  await expect(page.getByRole('cell', { name: 'Squat' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '100' }).first()).toBeVisible();
});

test('submitting empty inputs shows inline errors and does not save', async ({ page }) => {
  await page.goto('/');
  const initialRowCount = await page.getByRole('row').count();
  await page.getByRole('button', { name: /log/i }).first().click();
  await expect(page.getByText(/weight is required/i).first()).toBeVisible();
  await expect(page.getByText(/sets is required/i).first()).toBeVisible();
  await expect(page.getByText(/reps is required/i).first()).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(initialRowCount);
});
