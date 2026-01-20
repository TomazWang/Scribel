import { useState } from 'react';
import { formatRelativeTime, formatAbsoluteTime } from '../utils/formatTime';
import { JotContent } from './JotContent';
import type { Jot } from '../types/jot';

interface JotItemProps {
  jot: Jot;
  onDelete: () => void;
}

/**
 * JotItem component displays a single jot with timestamp and delete button
 *
 * Features:
 * - Shows relative timestamp (e.g., "10 min ago")
 * - Tooltip shows absolute timestamp on hover
 * - Delete button appears on hover
 * - Uses JotContent for syntax-highlighted content
 *
 * @example
 * <JotItem
 *   jot={jot}
 *   onDelete={() => handleDelete(jot.id)}
 * />
 */
export function JotItem({ jot, onDelete }: JotItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className="jot-item group flex items-start gap-3 py-2 px-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timestamp */}
      <time
        className="text-sm text-neutral-400 dark:text-neutral-500 whitespace-nowrap flex-shrink-0 min-w-[80px]"
        dateTime={jot.created_at}
        title={formatAbsoluteTime(jot.created_at)}
      >
        {formatRelativeTime(jot.created_at)}
      </time>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <JotContent content={jot.content} />
      </div>

      {/* Delete button (visible on hover or focus) */}
      <button
        onClick={onDelete}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`flex-shrink-0 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 focus:text-red-500 dark:focus:text-red-400 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 rounded ${
          isHovered || isFocused ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Delete jot"
        title="Delete jot"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
