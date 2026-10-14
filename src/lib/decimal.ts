/**
 * MedLedger — Decimal-Safe Financial Arithmetic Utilities
 *
 * Provides exact-precision numeric operations for monetary calculations (PKR),
 * avoiding IEEE 754 floating-point rounding errors (e.g. 0.1 + 0.2 = 0.30000000000000004).
 */

/**
 * Rounds a number to exactly two decimal places (rupees and paisas).
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Multiplies quantity by unit price with exact two-decimal precision.
 */
export function multiplyMoney(quantity: number, unitPrice: number): number {
  const q = Math.round(quantity);
  const pInPaisa = Math.round(unitPrice * 100);
  return Math.round(q * pInPaisa) / 100;
}

/**
 * Adds multiple monetary amounts with exact two-decimal precision.
 */
export function addMoney(...amounts: number[]): number {
  const sumInPaisa = amounts.reduce((acc, curr) => {
    return acc + Math.round((curr || 0) * 100);
  }, 0);
  return sumInPaisa / 100;
}

/**
 * Subtracts subtrahend from minuend with exact two-decimal precision.
 */
export function subtractMoney(minuend: number, subtrahend: number): number {
  const mInPaisa = Math.round((minuend || 0) * 100);
  const sInPaisa = Math.round((subtrahend || 0) * 100);
  return (mInPaisa - sInPaisa) / 100;
}

/**
 * Formats a numeric PKR amount into standard Pakistani locale format (e.g. Rs. 125,000.00).
 */
export function formatPKR(amount: number): string {
  const rounded = roundMoney(amount);
  return `PKR ${rounded.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
