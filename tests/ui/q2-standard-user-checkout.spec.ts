import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HeaderMenu } from '../../pages/HeaderMenu';
import { InventoryPage, type Product } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { CUSTOMER, MESSAGES, PASSWORD, TAX_RATE, USERS, round2 } from '../../utils/testData';

test.describe('Q2 - Standard user purchase journey', () => {
  test('standard_user buys three items and the order succeeds', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const menu = new HeaderMenu(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const added: Product[] = [];

    await test.step('Log in with standard_user', async () => {
      await loginPage.goto();
      await loginPage.login(USERS.standard, PASSWORD);
      await inventory.expectLoaded();
    });

    await test.step('Reset App State from the hamburger menu', async () => {
      await menu.resetAppState();
    });

    await test.step('Add three items to the cart', async () => {
      for (const index of [0, 1, 2]) {
        added.push(await inventory.addItemByIndex(index));
      }
      await expect(menu.cartBadge).toHaveText('3');
    });

    await test.step('Go to cart and start checkout', async () => {
      await menu.openCart();
      await cart.expectItems(added.map((p) => p.name));
      await cart.checkout();
      await checkout.fillInformation(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    });

    await test.step('Verify product names and total price on the final checkout page', async () => {
      await expect(checkout.overviewItemNames).toHaveText(added.map((p) => p.name));

      const expectedItemTotal = round2(added.reduce((sum, p) => sum + p.price, 0));
      const expectedTax = round2(expectedItemTotal * TAX_RATE);
      const expectedTotal = round2(expectedItemTotal + expectedTax);

      const summary = await checkout.getSummary();
      expect(summary.itemTotal).toBe(expectedItemTotal);
      expect(summary.tax).toBe(expectedTax);
      expect(summary.total).toBe(expectedTotal);
      await expect(checkout.totalLabel).toHaveText(`Total: $${expectedTotal.toFixed(2)}`);
    });

    await test.step('Finish purchase and verify the success message', async () => {
      await checkout.finish();
      await expect(checkout.completeHeader).toHaveText(MESSAGES.orderComplete);
      await expect(checkout.completeText).toHaveText(MESSAGES.orderCompleteText);
      await expect(menu.cartBadge).toHaveCount(0);
    });

    await test.step('Reset App State again and log out', async () => {
      await menu.resetAppState();
      await menu.logout();
      await loginPage.expectLoggedOut();
    });
  });
});
