import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface JotInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * JotInput component provides single-line input with Enter-to-submit
 *
 * Features:
 * - Auto-focus on mount (configurable)
 * - Submit on Enter key (if non-empty)
 * - Clear input after successful submission
 * - Disabled state support
 *
 * @example
 * <JotInput
 *   onSubmit={(content) => handleCreateJot(content)}
 *   autoFocus={true}
 * />
 */
export function JotInput({
  onSubmit,
  disabled = false,
  autoFocus = true
}: JotInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue(''); // Clear input after submission

      // Re-focus input after submission
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="jot-input-container border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="What's on your mind?"
          className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
            bg-white dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
          aria-label="Jot input"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700
            text-white disabled:text-neutral-500
            rounded-lg transition-colors
            disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label="Submit jot"
          title="Press Enter to submit"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>

      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Press <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-mono">Enter</kbd> to submit •{' '}
        Use <span className="text-blue-500 dark:text-blue-400">#tags</span> and{' '}
        <span className="text-purple-500 dark:text-purple-400">[[links]]</span>
      </div>
    </div>
  );
}
