/**
 * MedLedger — Utility Functions
 *
 * Pure utility functions used across the application.
 * Examples: formatCurrency, formatDate, cn (classname merge), etc.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 * Used throughout the component library.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
