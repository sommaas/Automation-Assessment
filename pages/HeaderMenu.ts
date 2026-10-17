import { expect, type Locator, type Page } from '@playwright/test';

/** Hamburger (burger) menu + cart icon shared by every logged-in page. */
export class HeaderMenu {
  readonly menuButton: Locator;
  readonly closeButton: Locator;
  readonly resetAppStateLink: Locator;
  readonly logoutLink: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.closeButton = page.locator('#react-burger-cross-btn');
    this.resetAppStateLink = page.locator('#reset_sidebar_link');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async open() {
    await this.menuButton.click();
    await expect(this.resetAppStateLink).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.resetAppStateLink).toBeHidden();
  }

  /**
   * Resets app state from the hamburger menu and verifies the cart is empty.
   * saucedemo's reset clears storage but does not re-render "Remove" buttons
   * on the current page, so we reload to bring the UI in sync.
   */
  async resetAppState() {
    await this.open();
    await this.resetAppStateLink.click();
    await this.close();
    await this.page.reload();
    await expect(this.cartBadge).toHaveCount(0);
  }

  async logout() {
    await this.open();
    await this.logoutLink.click();
  }

  async openCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart\.html/);
  }
}
