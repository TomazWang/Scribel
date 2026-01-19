import { useEffect, useRef } from 'react';
import { JotItem } from './JotItem';
import type { Jot } from '../types/jot';

interface JotListProps {
  jots: Jot[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

/**
 * JotList component displays a scrollable list of jots
 *
 * Features:
 * - Displays jots in chronological order (oldest to newest)
 * - Auto-scrolls to bottom when new jot is added
 * - Shows loading state
 * - Shows empty state when no jots
 *
 * @example
 * <JotList
 *   jots={jots}
 *   onDelete={(id) => handleDelete(id)}
 *   loading={isLoading}
 * />
 */
export function JotList({ jots, onDelete, loading = false }: JotListProps) {
  const listEndRef = useRef<HTMLDivElement>(null);
  const prevJotsLengthRef = useRef(jots.length);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);

  // Auto-scroll to bottom when new jot is added (debounced)
  useEffect(() => {
    if (jots.length > prevJotsLengthRef.current && listEndRef.current) {
      // Clear any pending scroll to prevent overlapping smooth scrolls
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    prevJotsLengthRef.current = jots.length;
  }, [jots.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (loading && jots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400">Loading jots...</p>
        </div>
      </div>
    );
  }

  if (jots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            No jots yet
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Start capturing your thoughts by typing below.
            Use <span className="text-blue-500 dark:text-blue-400">#tags</span> and{' '}
            <span className="text-purple-500 dark:text-purple-400">[[links]]</span> to organize.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      role="feed"
      aria-busy={loading}
      aria-label="Jot list"
    >
      {jots.map((jot) => (
        <JotItem
          key={jot.id}
          jot={jot}
          onDelete={() => onDelete(jot.id)}
        />
      ))}
      {/* Invisible div to scroll to */}
      <div ref={listEndRef} className="h-1" />

      {/* Loading indicator when fetching more */}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
