import { invoke } from '@tauri-apps/api/core';
import type { Jot, CreateJotInput, UpdateJotInput } from '../types/jot';

/**
 * Tauri API wrappers for jot operations
 *
 * These functions call Rust backend commands via Tauri's invoke API.
 * All functions are async and may throw errors from the backend.
 */

/**
 * Create a new jot
 *
 * @param content - The jot content (will be trimmed)
 * @returns The created jot with generated ID and timestamps
 * @throws Error if content is empty or backend operation fails
 *
 * @example
 * const jot = await createJot("Meeting with [[Sarah]] #work");
 */
export async function createJot(content: string): Promise<Jot> {
  const input: CreateJotInput = { content: content.trim() };
  return await invoke<Jot>('create_jot', { input });
}

/**
 * Get all jots with pagination
 *
 * @param limit - Maximum number of jots to return (default: 50, max: 500)
 * @param offset - Number of jots to skip (default: 0)
 * @returns Array of jots sorted by created_at ascending (oldest first)
 *
 * @example
 * const jots = await getJots(50, 0); // First 50 jots
 * const moreJots = await getJots(50, 50); // Next 50 jots
 */
export async function getJots(limit?: number, offset?: number): Promise<Jot[]> {
  return await invoke<Jot[]>('get_jots', {
    limit: limit ?? 50,
    offset: offset ?? 0
  });
}

/**
 * Get a single jot by ID
 *
 * @param id - The jot ID
 * @returns The jot with the given ID
 * @throws Error if jot not found
 *
 * @example
 * const jot = await getJot("jot-2026-01-19-143256-a1b2");
 */
export async function getJot(id: string): Promise<Jot> {
  return await invoke<Jot>('get_jot', { id });
}

/**
 * Update a jot's content
 *
 * @param id - The jot ID
 * @param content - The new content
 * @returns The updated jot with new modified_at timestamp
 * @throws Error if jot not found or content is invalid
 *
 * @example
 * const updated = await updateJot("jot-2026-01-19-143256-a1b2", "Updated content");
 */
export async function updateJot(id: string, content: string): Promise<Jot> {
  const input: UpdateJotInput = { id, content: content.trim() };
  return await invoke<Jot>('update_jot', { input });
}

/**
 * Delete a jot
 *
 * Removes both the markdown file and the index entry.
 *
 * @param id - The jot ID
 * @throws Error if jot not found or deletion fails
 *
 * @example
 * await deleteJot("jot-2026-01-19-143256-a1b2");
 */
export async function deleteJot(id: string): Promise<void> {
  await invoke<void>('delete_jot', { id });
}

/**
 * Search jots by content
 *
 * Uses SQLite LIKE query for simple text search.
 *
 * @param query - The search query
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of matching jots
 *
 * @example
 * const results = await searchJots("meeting", 20);
 */
export async function searchJots(query: string, limit?: number): Promise<Jot[]> {
  return await invoke<Jot[]>('search_jots', {
    query,
    limit: limit ?? 50
  });
}

/**
 * Set a jot's promoted status
 *
 * Promoted jots are marked as converted to standalone notes.
 *
 * @param id - The jot ID
 * @param promoted - Whether the jot is promoted
 * @returns The updated jot
 * @throws Error if jot not found
 *
 * @example
 * await setJotPromoted("jot-2026-01-19-143256-a1b2", true);
 */
export async function setJotPromoted(id: string, promoted: boolean): Promise<Jot> {
  return await invoke<Jot>('set_jot_promoted', { id, promoted });
}

/**
 * Rebuild the jot index from markdown files
 *
 * Scans the .scribel/jots/ folder and recreates the SQLite index.
 * Useful for recovery or after external file modifications.
 *
 * @returns Number of jots indexed
 *
 * @example
 * const count = await rebuildJotIndex();
 * console.log(`Indexed ${count} jots`);
 */
export async function rebuildJotIndex(): Promise<number> {
  return await invoke<number>('rebuild_jot_index');
}
