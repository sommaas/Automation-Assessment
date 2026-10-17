import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly cartItemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.cartItemNames = page.locator('.cart_item .inventory_item_name');
    this.checkoutButton = page.locator('#checkout');
  }

  async expectItems(names: string[]) {
    await expect(this.cartItemNames).toHaveText(names);
  }

  async checkout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
  }
}
