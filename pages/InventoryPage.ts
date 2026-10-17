import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../utils/testData';

export type Product = { name: string; price: number };

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly sortDropdown: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.title');
    this.items = page.locator('.inventory_item');
    this.itemNames = page.locator('.inventory_item_name');
    this.sortDropdown = page.locator('.product_sort_container');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.title).toHaveText('Products');
    await expect(this.items.first()).toBeVisible();
  }

  async sortBy(option: SortOption) {
    await this.sortDropdown.selectOption(option);
    await expect(this.sortDropdown).toHaveValue(option);
  }

  async getAllNames(): Promise<string[]> {
    return (await this.itemNames.allTextContents()).map((n) => n.trim());
  }

  /** Adds the product at `index` to the cart and returns its name and price. */
  async addItemByIndex(index: number): Promise<Product> {
    const item = this.items.nth(index);
    const name = (await item.locator('.inventory_item_name').innerText()).trim();
    const price = parsePrice(await item.locator('.inventory_item_price').innerText());
    const button = item.locator('button');
    await expect(button).toHaveText('Add to cart');
    await button.click();
    await expect(button).toHaveText('Remove');
    return { name, price };
  }
}
