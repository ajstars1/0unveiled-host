export { cn } from "@0unveiled/lib/utils" 

export function formatShortDate(date: Date | null | undefined): string {
    if (!date) return 'N/A';
    // Ensure date is a Date object before formatting
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    try {
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(dateObj);
    } catch (error) {
        console.error("Error formatting date:", error, "Input was:", date);
        return 'Invalid Date';
    }
}
export function formatLongDate(date: Date | null | undefined): string {
    if (!date) return 'N/A';
    // Ensure date is a Date object before formatting
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    try {
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(dateObj);
    } catch (error) {
        console.error("Error formatting date:", error, "Input was:", date);
        return 'Invalid Date';
    }
}