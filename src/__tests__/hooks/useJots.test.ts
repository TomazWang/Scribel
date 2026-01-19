import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJots } from '../../hooks/useJots';
import * as jotsApi from '../../api/jots';
import type { Jot } from '../../types/jot';

// Mock the jots API
vi.mock('../../api/jots');

const mockJot1: Jot = {
  id: 'jot-1',
  content: 'First jot',
  created_at: '2025-01-19T10:00:00Z',
  modified_at: '2025-01-19T10:00:00Z',
  tags: ['work'],
  links: ['Project A'],
  promoted: false,
  file_path: '/path/to/jot-1.md'
};

const mockJot2: Jot = {
  id: 'jot-2',
  content: 'Second jot',
  created_at: '2025-01-19T11:00:00Z',
  modified_at: '2025-01-19T11:00:00Z',
  tags: ['personal'],
  links: [],
  promoted: false,
  file_path: '/path/to/jot-2.md'
};

const mockJot3: Jot = {
  id: 'jot-3',
  content: 'Third jot',
  created_at: '2025-01-19T09:00:00Z', // Earlier than jot-1
  modified_at: '2025-01-19T09:00:00Z',
  tags: [],
  links: [],
  promoted: false,
  file_path: '/path/to/jot-3.md'
};

describe('useJots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading jots on mount', () => {
    it('loads jots on mount and sets loading state', async () => {
      const mockGetJots = vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot2]);

      const { result } = renderHook(() => useJots());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.jots).toEqual([]);

      // Wait for jots to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetJots).toHaveBeenCalledWith(500);
      expect(result.current.jots).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('sorts jots by created_at ascending (oldest first)', async () => {
      // Return jots in random order
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot3, mockJot2]);

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should be sorted: jot-3 (09:00), jot-1 (10:00), jot-2 (11:00)
      expect(result.current.jots[0].id).toBe('jot-3');
      expect(result.current.jots[1].id).toBe('jot-1');
      expect(result.current.jots[2].id).toBe('jot-2');
    });

    it('sets error state when loading fails', async () => {
      const errorMessage = 'Failed to fetch jots';
      vi.spyOn(jotsApi, 'getJots').mockRejectedValue(new Error(errorMessage));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.jots).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Creating jots with optimistic updates', () => {
    it('creates a temporary jot immediately (optimistic update)', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([]);
      const createJotSpy = vi.spyOn(jotsApi, 'createJot').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockJot1), 100))
      );

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a jot
      const createPromise = result.current.createJot('First jot');

      // Temporary jot should appear immediately
      await waitFor(() => {
        expect(result.current.jots).toHaveLength(1);
      });

      const tempJot = result.current.jots[0];
      expect(tempJot.id).toMatch(/^temp-/);
      expect(tempJot.content).toBe('First jot');
      expect(tempJot.promoted).toBe(false);

      // Wait for API call to complete
      await createPromise;

      expect(createJotSpy).toHaveBeenCalledWith('First jot');
    });

    it('replaces temporary jot with real jot after API success', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([]);
      vi.spyOn(jotsApi, 'createJot').mockResolvedValue(mockJot1);

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.createJot('First jot');

      await waitFor(() => {
        expect(result.current.jots[0].id).toBe('jot-1');
      });

      expect(result.current.jots).toHaveLength(1);
      expect(result.current.jots[0]).toEqual(mockJot1);
      expect(result.current.error).toBeNull();
    });

    it('removes temporary jot on API failure (rollback)', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([]);
      const errorMessage = 'Network error';
      vi.spyOn(jotsApi, 'createJot').mockRejectedValue(new Error(errorMessage));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create jot (should fail)
      let caughtError: Error | null = null;
      try {
        await result.current.createJot('Failed jot');
      } catch (err) {
        caughtError = err as Error;
      }

      // Temporary jot should be removed (rollback)
      await waitFor(() => {
        expect(result.current.jots).toHaveLength(0);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('clears error state before creating jot', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([]);
      vi.spyOn(jotsApi, 'createJot')
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockJot1);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First creation fails
      try {
        await result.current.createJot('Failed');
      } catch {}

      expect(result.current.error).toBe('First error');

      // Second creation should clear error
      await result.current.createJot('Success');

      await waitFor(() => {
        expect(result.current.jots[0].id).toBe('jot-1');
      });

      expect(result.current.error).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Deleting jots with optimistic updates', () => {
    it('removes jot immediately (optimistic update)', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot2]);
      const deleteJotSpy = vi.spyOn(jotsApi, 'deleteJot').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(), 100))
      );

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jots).toHaveLength(2);

      // Delete jot-1
      const deletePromise = result.current.deleteJot('jot-1');

      // Jot should be removed immediately
      await waitFor(() => {
        expect(result.current.jots).toHaveLength(1);
      });

      expect(result.current.jots[0].id).toBe('jot-2');

      // Wait for API call
      await deletePromise;

      expect(deleteJotSpy).toHaveBeenCalledWith('jot-1');
    });

    it('keeps jot removed after API success', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot2]);
      vi.spyOn(jotsApi, 'deleteJot').mockResolvedValue();

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteJot('jot-1');

      await waitFor(() => {
        expect(result.current.jots).toHaveLength(1);
      });

      expect(result.current.jots[0].id).toBe('jot-2');
      expect(result.current.error).toBeNull();
    });

    it('restores jot on API failure (rollback)', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot2]);
      const errorMessage = 'Delete failed';
      vi.spyOn(jotsApi, 'deleteJot').mockRejectedValue(new Error(errorMessage));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jots).toHaveLength(2);

      // Delete jot (should fail and rollback)
      let caughtError: Error | null = null;
      try {
        await result.current.deleteJot('jot-1');
      } catch (err) {
        caughtError = err as Error;
      }

      // Jot should be restored (rollback)
      await waitFor(() => {
        expect(result.current.jots).toHaveLength(2);
      });

      expect(result.current.jots[0].id).toBe('jot-1');
      expect(result.current.jots[1].id).toBe('jot-2');
      expect(result.current.error).toBe(errorMessage);
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('clears error state before deleting jot', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1, mockJot2]);
      vi.spyOn(jotsApi, 'deleteJot')
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First deletion fails
      try {
        await result.current.deleteJot('jot-1');
      } catch {}

      expect(result.current.error).toBe('First error');

      // Second deletion should clear error
      await result.current.deleteJot('jot-2');

      await waitFor(() => {
        expect(result.current.jots).toHaveLength(1);
      });

      expect(result.current.error).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Refresh functionality', () => {
    it('reloads jots when refresh is called', async () => {
      const getJotsSpy = vi.spyOn(jotsApi, 'getJots')
        .mockResolvedValueOnce([mockJot1])
        .mockResolvedValueOnce([mockJot1, mockJot2]);

      const { result } = renderHook(() => useJots());

      // Initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jots).toHaveLength(1);

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.jots).toHaveLength(2);
      });

      expect(getJotsSpy).toHaveBeenCalledTimes(2);
    });

    it('sets loading state during refresh', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1]);

      const { result } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refreshPromise = result.current.refresh();

      // Should be loading during refresh
      expect(result.current.loading).toBe(true);

      await refreshPromise;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Stability of callbacks', () => {
    it('deleteJot callback remains stable across renders', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1]);
      vi.spyOn(jotsApi, 'deleteJot').mockResolvedValue();

      const { result, rerender } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const deleteJotRef1 = result.current.deleteJot;

      // Trigger a re-render by deleting (which updates state)
      await result.current.deleteJot('jot-1');

      await waitFor(() => {
        expect(result.current.jots).toHaveLength(0);
      });

      rerender();

      const deleteJotRef2 = result.current.deleteJot;

      // Callback should be the same reference (stable)
      expect(deleteJotRef1).toBe(deleteJotRef2);
    });

    it('createJot callback remains stable across renders', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([]);
      vi.spyOn(jotsApi, 'createJot').mockResolvedValue(mockJot1);

      const { result, rerender } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const createJotRef1 = result.current.createJot;

      // Trigger a re-render by creating (which updates state)
      await result.current.createJot('Test jot');

      await waitFor(() => {
        expect(result.current.jots).toHaveLength(1);
      });

      rerender();

      const createJotRef2 = result.current.createJot;

      // Callback should be the same reference (stable)
      expect(createJotRef1).toBe(createJotRef2);
    });

    it('loadJots callback remains stable', async () => {
      vi.spyOn(jotsApi, 'getJots').mockResolvedValue([mockJot1]);

      const { result, rerender } = renderHook(() => useJots());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Access loadJots via refresh (which uses loadJots internally)
      const refreshRef1 = result.current.refresh;

      rerender();

      const refreshRef2 = result.current.refresh;

      // Callback should be stable
      expect(refreshRef1).toBe(refreshRef2);
    });
  });
});
