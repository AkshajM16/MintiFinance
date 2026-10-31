import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('authenticated transaction creates an asynchronous critical budget alert', async ({ page }) => {
  // Offline fixture creates a real DRF token. No production auth bypass endpoint exists.
  const auth = JSON.parse(readFileSync('work/e2e-auth.json', 'utf8'));
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('minti_auth_token', token);
    localStorage.setItem('minti_user', JSON.stringify(user));
  }, auth);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Budget alerts' })).toContainText('No budget thresholds');
  await page.getByRole('button', { name: 'Transactions', exact: true }).click();
  await page.getByRole('button', { name: /Add Transaction/ }).click();
  await page.getByLabel('Amount', { exact: true }).fill('100');
  await page.getByLabel('Description', { exact: true }).fill('Synthetic groceries');
  await page.getByLabel('Category', { exact: true }).fill('Groceries');
  await page.getByRole('button', { name: 'Add Transaction', exact: true }).last().click();
  const panel = page.getByRole('region', { name: 'Budget alerts' });
  await expect(panel).toContainText('Critical: E2E groceries', { timeout: 20000 });
  await expect(panel).toContainText('Warning: E2E groceries');
  await expect(panel).toContainText('$100.00 spent of $100.00');
  await expect(panel.getByRole('listitem')).toHaveCount(2);
  await page.screenshot({ path: 'results/alert-workflow.png', fullPage: true });
});
