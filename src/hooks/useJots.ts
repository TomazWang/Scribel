import { useState, useEffect, useCallback, useRef } from 'react';
import { createJot as apiCreateJot, getJots as apiGetJots, deleteJot as apiDeleteJot } from '../api/jots';
import type { Jot } from '../types/jot';

interface UseJotsReturn {
  jots: Jot[];
  loading: boolean;
  error: string | null;
  createJot: (content: string) => Promise<void>;
  deleteJot: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useJots hook manages jot state with optimistic updates
 *
 * Features:
 * - Loads jots on mount
 * - Optimistic updates for create (instant UI feedback)
 * - Optimistic updates for delete (instant UI feedback)
 * - Automatic rollback on error
 * - Sorts jots by created_at ascending (oldest first)
 *
 * @returns Jot state and mutation functions
 *
 * @example
 * const { jots, loading, createJot, deleteJot } = useJots();
 *
 * // Create jot with optimistic update
 * await createJot("New jot content");
 *
 * // Delete jot with optimistic update
 * await deleteJot(jot.id);
 */
export function useJots(): UseJotsReturn {
  const [jots, setJots] = useState<Jot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousJotsRef = useRef<Jot[]>([]);

  const loadJots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedJots = await apiGetJots(500); // Get recent jots
      // Sort by created_at ascending (oldest first)
      const sorted = fetchedJots.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setJots(sorted);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jots';
      setError(errorMessage);
      console.error('Failed to load jots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load jots on mount
  useEffect(() => {
    loadJots();
  }, [loadJots]);

  const createJot = useCallback(async (content: string) => {
    // Create temporary jot for optimistic update
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const tempJot: Jot = {
      id: tempId,
      content,
      created_at: now,
      modified_at: now,
      tags: [],
      links: [],
      promoted: false,
      file_path: ''
    };

    // Clear error state and add temp jot
    setError(null);
    setJots(prev => [...prev, tempJot]);

    try {
      // Call backend API
      const createdJot = await apiCreateJot(content);

      // Replace temp jot with real jot
      setJots(prev =>
        prev.map(jot => jot.id === tempId ? createdJot : jot)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create jot';
      console.error('Failed to create jot:', err);

      // Set error state BEFORE rollback
      setError(errorMessage);

      // Rollback: remove temp jot on error
      setJots(prev => prev.filter(jot => jot.id !== tempId));

      // Re-throw for component error handling
      throw err;
    }
  }, []);

  const deleteJot = useCallback(async (id: string) => {
    // Clear error state first, then optimistic update
    setError(null);
    setJots(prev => {
      // Store original jots for rollback in ref
      previousJotsRef.current = prev;
      return prev.filter(jot => jot.id !== id);
    });

    try {
      // Call backend API
      await apiDeleteJot(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete jot';
      console.error('Failed to delete jot:', err);

      // Set error state BEFORE rollback
      setError(errorMessage);

      // Rollback: restore original jots on error from ref
      setJots(previousJotsRef.current);

      // Re-throw for component error handling
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadJots();
  }, [loadJots]);

  return {
    jots,
    loading,
    error,
    createJot,
    deleteJot,
    refresh
  };
}
