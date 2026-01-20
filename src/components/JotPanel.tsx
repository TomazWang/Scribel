import { useJots } from '../hooks/useJots';
import { JotList } from './JotList';
import { JotInput } from './JotInput';

/**
 * JotPanel is the main container component for the jot interface
 *
 * Features:
 * - Manages jot state via useJots hook
 * - Coordinates JotList and JotInput components
 * - Handles create and delete actions
 * - Shows error messages when operations fail
 *
 * @example
 * <JotPanel />
 */
export function JotPanel() {
  const { jots, loading, error, createJot, deleteJot } = useJots();

  const handleCreateJot = async (content: string) => {
    try {
      await createJot(content);
    } catch (err) {
      // Error already logged in useJots hook
      // Could show a toast notification here
    }
  };

  const handleDeleteJot = async (id: string) => {
    try {
      await deleteJot(id);
    } catch (err) {
      // Error already logged in useJots hook
      // Could show a toast notification here
    }
  };

  return (
    <div className="jot-panel flex flex-col h-full bg-white dark:bg-neutral-900">
      {/* Error banner */}
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Jot list */}
      <JotList jots={jots} onDelete={handleDeleteJot} loading={loading} />

      {/* Input field */}
      <JotInput onSubmit={handleCreateJot} disabled={loading} />
    </div>
  );
}
