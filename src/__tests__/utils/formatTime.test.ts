import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime, formatAbsoluteTime } from '../../utils/formatTime';

describe('formatRelativeTime', () => {
  let originalNow: () => number;
  const fixedTime = new Date('2026-01-19T14:00:00Z').getTime();

  beforeEach(() => {
    originalNow = Date.now;
    Date.now = vi.fn(() => fixedTime);
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  it('shows "just now" for timestamps less than 1 minute ago', () => {
    const timestamp = fixedTime - 30000; // 30 seconds ago
    expect(formatRelativeTime(timestamp)).toBe('just now');

    const timestamp2 = fixedTime - 59000; // 59 seconds ago
    expect(formatRelativeTime(timestamp2)).toBe('just now');
  });

  it('shows minutes for timestamps less than 1 hour ago', () => {
    const timestamp = fixedTime - 600000; // 10 minutes ago
    expect(formatRelativeTime(timestamp)).toBe('10 min ago');

    const timestamp2 = fixedTime - 1800000; // 30 minutes ago
    expect(formatRelativeTime(timestamp2)).toBe('30 min ago');

    const timestamp3 = fixedTime - 3540000; // 59 minutes ago
    expect(formatRelativeTime(timestamp3)).toBe('59 min ago');
  });

  it('shows hours for timestamps less than 24 hours ago', () => {
    const timestamp = fixedTime - 7200000; // 2 hours ago
    expect(formatRelativeTime(timestamp)).toBe('2h ago');

    const timestamp2 = fixedTime - 18000000; // 5 hours ago
    expect(formatRelativeTime(timestamp2)).toBe('5h ago');

    const timestamp3 = fixedTime - 82800000; // 23 hours ago
    expect(formatRelativeTime(timestamp3)).toBe('23h ago');
  });

  it('shows time for today (more than 24 hours old, edge case)', () => {
    // This tests the edge case where an event is from "today" (same calendar day)
    // but more than 24 hours ago (which would only happen around midnight)
    // Fixed time is 14:00:00 (2:00 PM) on Jan 19
    // An event at 01:00:00 (1:00 AM) on Jan 19 would be 13 hours ago (< 24h)
    // so this test actually can't happen - if it's today, it's always < 24h
    // Changing to test yesterday which IS possible
    const yesterday = new Date('2026-01-18T14:00:00Z').getTime(); // Exactly 24h ago
    const result = formatRelativeTime(yesterday);

    // Should show "Yesterday" with time
    expect(result).toMatch(/^Yesterday \d{1,2}:\d{2} (AM|PM)$/);
  });

  it('shows "Yesterday" with time for yesterday', () => {
    const yesterday = fixedTime - 86400000 - 3600000; // 25 hours ago (yesterday)
    const result = formatRelativeTime(yesterday);

    expect(result).toMatch(/^Yesterday \d{1,2}:\d{2} (AM|PM)$/);
  });

  it('shows month and day for older dates in same year', () => {
    const lastWeek = new Date('2026-01-12T14:00:00Z').getTime();
    const result = formatRelativeTime(lastWeek);

    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/); // e.g., "Jan 12"
  });

  it('shows month, day and year for dates in different year', () => {
    const lastYear = new Date('2025-12-25T14:00:00Z').getTime();
    const result = formatRelativeTime(lastYear);

    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/); // e.g., "Dec 25, 2025"
  });

  it('handles ISO 8601 string input', () => {
    const isoString = new Date(fixedTime - 600000).toISOString();
    expect(formatRelativeTime(isoString)).toBe('10 min ago');
  });

  it('handles timestamp number input', () => {
    const timestamp = fixedTime - 600000;
    expect(formatRelativeTime(timestamp)).toBe('10 min ago');
  });

  it('handles edge case at exactly 1 minute', () => {
    const timestamp = fixedTime - 60000; // exactly 1 minute
    expect(formatRelativeTime(timestamp)).toBe('1 min ago');
  });

  it('handles edge case at exactly 1 hour', () => {
    const timestamp = fixedTime - 3600000; // exactly 1 hour
    expect(formatRelativeTime(timestamp)).toBe('1h ago');
  });
});

describe('formatAbsoluteTime', () => {
  it('formats ISO 8601 string as full datetime', () => {
    const isoString = '2026-01-19T14:32:56Z';
    const result = formatAbsoluteTime(isoString);

    // Should contain: month name, day, year, time with AM/PM
    expect(result).toMatch(/January \d{1,2}, 2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2} (AM|PM)/);
  });

  it('formats timestamp number as full datetime', () => {
    const timestamp = new Date('2026-01-19T14:32:56Z').getTime();
    const result = formatAbsoluteTime(timestamp);

    expect(result).toMatch(/January \d{1,2}, 2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2} (AM|PM)/);
  });

  it('includes seconds in the output', () => {
    const timestamp = new Date('2026-01-19T14:32:56Z').getTime();
    const result = formatAbsoluteTime(timestamp);

    // Should have format like "2:32:56 PM"
    expect(result).toMatch(/:\d{2}:\d{2} (AM|PM)/);
  });

  it('formats different years correctly', () => {
    const timestamp = new Date('2025-12-25T10:30:45Z').getTime();
    const result = formatAbsoluteTime(timestamp);

    expect(result).toMatch(/December 25, 2025/);
  });

  it('handles midnight correctly', () => {
    const timestamp = new Date('2026-01-19T00:00:00Z').getTime();
    const result = formatAbsoluteTime(timestamp);

    expect(result).toMatch(/January \d{1,2}, 2026/);
    expect(result).toMatch(/12:00:00 AM/);
  });

  it('handles noon correctly', () => {
    const timestamp = new Date('2026-01-19T12:00:00Z').getTime();
    const result = formatAbsoluteTime(timestamp);

    expect(result).toMatch(/January \d{1,2}, 2026/);
    expect(result).toMatch(/12:00:00 PM/);
  });
});
