"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.truncate = truncate;
exports.generateRandomString = generateRandomString;
exports.sleep = sleep;
exports.debounce = debounce;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
/**
 * Utility function for merging Tailwind CSS classes with clsx
 */
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * Format currency with proper localization
 */
function formatCurrency(amount, currency = "USD", locale = "en-US") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(amount);
}
/**
 * Truncate text with ellipsis
 */
function truncate(text, length) {
    if (text.length <= length)
        return text;
    return text.slice(0, length) + "...";
}
/**
 * Generate a random string of specified length
 */
function generateRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
