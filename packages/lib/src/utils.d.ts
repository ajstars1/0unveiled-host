import { type ClassValue } from "clsx";
/**
 * Utility function for merging Tailwind CSS classes with clsx
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Format currency with proper localization
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncate(text: string, length: number): string;
/**
 * Generate a random string of specified length
 */
export declare function generateRandomString(length: number): string;
/**
 * Sleep for a specified number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map