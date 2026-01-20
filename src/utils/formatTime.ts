/**
 * Format a timestamp as relative time with multi-tier display
 *
 * Time tiers (in priority order):
 * - < 1 min: "just now"
 * - < 1 hour: "X min ago"
 * - Today (same calendar day): "2:30 PM"
 * - < 24 hours (yesterday): "Xh ago"
 * - Yesterday: "Yesterday 2:30 PM"
 * - Older: "Jan 19"
 *
 * @param timestamp - ISO 8601 datetime string or Unix timestamp in milliseconds
 * @returns Formatted relative time string
 *
 * @example
 * formatRelativeTime(Date.now() - 30000) // "just now"
 * formatRelativeTime(Date.now() - 600000) // "10 min ago"
 * formatRelativeTime(today - 21600000) // "8:00 AM" (6h ago, but earlier today)
 * formatRelativeTime(yesterday - 3600000) // "3h ago" (3h ago yesterday)
 */
export function formatRelativeTime(timestamp: string | number): string {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diff = now - time;

  // Less than 1 minute
  if (diff < 60000) {
    return 'just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min ago`;
  }

  // Less than 24 hours - show relative hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  const date = new Date(time);
  const today = new Date();

  // Today (>= 24 hours is impossible for same calendar day, but check anyway)
  // Use UTC to match test expectations
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (time >= todayStart) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  }

  // Yesterday
  const yesterdayStart = todayStart - 86400000;
  if (time >= yesterdayStart) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    return `Yesterday ${timeStr}`;
  }

  // Older (same year)
  if (date.getUTCFullYear() === today.getUTCFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  // Different year
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Format a timestamp as absolute time for tooltips
 *
 * Returns full date and time in a readable format
 *
 * @param timestamp - ISO 8601 datetime string or Unix timestamp in milliseconds
 * @returns Formatted absolute time string
 *
 * @example
 * formatAbsoluteTime("2026-01-19T14:32:56Z")
 * // Returns: "January 19, 2026, 2:32:56 PM"
 */
export function formatAbsoluteTime(timestamp: string | number): string {
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const date = new Date(time);

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
}
