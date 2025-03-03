/**
 * Date utility functions for the application
 */

/**
 * Get the ISO week number for a given date
 * @param date The date to get the week number for
 * @returns The ISO week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  // Copy date to avoid modifying the original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNumber;
}

/**
 * Get the number of weeks in a year
 * @param year The year to get the number of weeks for
 * @returns The number of weeks in the year (52 or 53)
 */
export function getWeeksInYear(year: number): number {
  // If January 1st is Thursday OR if it's a leap year and January 1st is Wednesday,
  // then the year has 53 weeks
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  
  return (jan1.getDay() === 4 || (dec31.getDay() === 4)) ? 53 : 52;
}

/**
 * Format a date as a string with week number
 * @param date The date to format
 * @returns Formatted date string with week number
 */
export function formatDateWithWeek(date: Date): string {
  const weekNumber = getWeekNumber(date);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${date.toLocaleDateString('sv-SE', options)} (v.${weekNumber})`;
}

/**
 * Get all week numbers for a given year
 * @param year The year to get week numbers for
 * @returns Array of week numbers
 */
export function getAllWeeksForYear(year: number): number[] {
  const weeksCount = getWeeksInYear(year);
  return Array.from({ length: weeksCount }, (_, i) => i + 1);
}

/**
 * Check if a date is between two other dates
 * @param date The date to check
 * @param startDate The start date
 * @param endDate The end date
 * @returns True if the date is between the start and end dates
 */
export function isDateBetween(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}