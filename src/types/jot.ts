/**
 * Jot type definition matching the Rust backend
 */
export interface Jot {
  /** Unique identifier: "jot-YYYY-MM-DD-HHMMSS-XXXX" */
  id: string;

  /** The jot text (without frontmatter) */
  content: string;

  /** ISO 8601 datetime when created */
  created_at: string;

  /** ISO 8601 datetime when last modified */
  modified_at: string;

  /** Extracted tags (without # prefix) */
  tags: string[];

  /** Extracted wiki-links (without [[ ]]) */
  links: string[];

  /** Whether jot has been promoted to a full note */
  promoted: boolean;

  /** Relative path from vault root */
  file_path: string;
}

/**
 * Input for creating a new jot
 */
export interface CreateJotInput {
  content: string;
}

/**
 * Input for updating a jot
 */
export interface UpdateJotInput {
  id: string;
  content: string;
}

/**
 * Error types for jot operations
 */
export type JotErrorType =
  | "not_found"
  | "file_error"
  | "parse_error"
  | "db_error"
  | "vault_not_configured"
  | "validation_error"
  | "unknown";

/**
 * Jot error structure
 */
export interface JotError {
  type: JotErrorType;
  message: string;
}
