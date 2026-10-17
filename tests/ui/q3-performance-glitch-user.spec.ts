import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HeaderMenu } from '../../pages/HeaderMenu';
import { InventoryPage, type Product } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { CUSTOMER, MESSAGES, PASSWORD, TAX_RATE, USERS, round2 } from '../../utils/testData';

test.describe('Q3 - Performance glitch user purchase journey', () => {
  test('performance_glitch_user sorts Z-A, buys the first product and the order succeeds', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const menu = new HeaderMenu(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    let selected!: Product;

    await test.step('Log in with performance_glitch_user', async () => {
      await loginPage.goto();
      await loginPage.login(USERS.performanceGlitch, PASSWORD);
      await inventory.expectLoaded();
    });

    await test.step('Reset App State from the hamburger menu', async () => {
      await menu.resetAppState();
    });

    await test.step('Filter by Name (Z to A) and verify the order', async () => {
      await inventory.sortBy('za');
      const names = await inventory.getAllNames();
      const expected = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(expected);
    });

    await test.step('Add the first product to the cart', async () => {
      selected = await inventory.addItemByIndex(0);
      await expect(menu.cartBadge).toHaveText('1');
    });

    await test.step('Navigate to the final checkout page', async () => {
      await menu.openCart();
      await cart.expectItems([selected.name]);
      await cart.checkout();
      await checkout.fillInformation(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    });

    await test.step("Verify all products' names and the total price", async () => {
      await expect(checkout.overviewItemNames).toHaveText([selected.name]);

      const expectedItemTotal = round2(selected.price);
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
    });

    await test.step('Reset App State again and log out', async () => {
      await menu.resetAppState();
      await menu.logout();
      await loginPage.expectLoggedOut();
    });
  });
});
