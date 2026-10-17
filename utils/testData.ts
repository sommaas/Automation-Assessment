export const PASSWORD = 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  performanceGlitch: 'performance_glitch_user',
} as const;

export const MESSAGES = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  orderComplete: 'Thank you for your order!',
  orderCompleteText:
    'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;

export const CUSTOMER = {
  firstName: 'Nazmul',
  lastName: 'Iqra',
  postalCode: '1230',
} as const;

/** saucedemo applies an 8% tax on the item total. */
export const TAX_RATE = 0.08;

/** Parses "$29.99" / "Item total: $29.99" / "Total: $32.39" into a number. */
export function parsePrice(text: string): number {
  const match = text.match(/\$([\d,]+\.\d{2})/);
  if (!match) throw new Error(`No price found in "${text}"`);
  return Number(match[1].replace(/,/g, ''));
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
