import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a date string safely.
 * If the string is YYYY-MM-DD, it parses it as LOCAL time to avoid timezone shifts.
 */
export function safeDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  // If it's just YYYY-MM-DD (no time component)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Otherwise default to standard new Date()
  return new Date(dateStr);
}
