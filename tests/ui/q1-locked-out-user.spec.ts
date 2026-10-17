import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MESSAGES, PASSWORD, USERS } from '../../utils/testData';

test.describe('Q1 - Locked out user', () => {
  test('locked_out_user cannot log in and sees the locked-out error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Open login page', async () => {
      await loginPage.goto();
    });

    await test.step('Log in with locked_out_user', async () => {
      await loginPage.login(USERS.lockedOut, PASSWORD);
    });

    await test.step('Verify the error message', async () => {
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toHaveText(MESSAGES.lockedOut);
      // user must stay on the login page
      await expect(page).not.toHaveURL(/inventory\.html/);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});
