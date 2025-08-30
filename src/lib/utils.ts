/**
 * Formats a date string or Date object into a more readable format.
 * @param date - The date to format.
 * @returns A formatted string like "Aug 30, 2025, 5:00 PM".
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a distance in meters into a more readable string in kilometers.
 * @param meters - The distance in meters.
 * @returns A formatted string like "5.2 km".
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(1)} km`;
}

/**
 * Formats a duration in seconds into a more readable string.
 * @param seconds - The duration in seconds.
 *@returns A formatted string like "5 min" or "1.2 hours".
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(1)} hours`;
}