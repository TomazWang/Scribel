use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Jot as represented in memory and API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jot {
    /// Unique identifier: "jot-YYYY-MM-DD-HHMMSS-XXXX"
    pub id: String,

    /// The jot text (without frontmatter)
    pub content: String,

    /// When the jot was created (ISO 8601)
    pub created_at: DateTime<Utc>,

    /// When the jot was last modified (ISO 8601)
    pub modified_at: DateTime<Utc>,

    /// Extracted tags (without # prefix)
    pub tags: Vec<String>,

    /// Extracted wiki-links (without [[ ]])
    pub links: Vec<String>,

    /// Whether jot has been promoted to a full note
    pub promoted: bool,

    /// Relative path from vault root
    pub file_path: String,
}

/// Input for creating a new jot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJotInput {
    pub content: String,
}

/// Input for updating a jot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateJotInput {
    pub id: String,
    pub content: String,
}

/// Jot frontmatter structure (for YAML serialization)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JotFrontmatter {
    pub id: String,
    pub created: DateTime<Utc>,
    pub modified: DateTime<Utc>,
    pub tags: Vec<String>,
    pub links: Vec<String>,
    pub promoted: bool,
}

/// Errors that can occur during jot operations
#[derive(Error, Debug)]
pub enum JotError {
    #[error("Jot not found: {0}")]
    NotFound(String),

    #[error("File operation failed: {0}")]
    FileError(#[from] std::io::Error),

    #[error("Invalid jot format: {0}")]
    ParseError(String),

    #[error("Database error: {0}")]
    DbError(#[from] rusqlite::Error),

    #[error("Vault not configured")]
    VaultNotConfigured,

    #[error("Invalid content: {0}")]
    ValidationError(String),

    #[error("YAML parsing error: {0}")]
    YamlError(#[from] serde_yaml::Error),
}

/// Convert JotError to String for Tauri command responses
impl From<JotError> for String {
    fn from(err: JotError) -> Self {
        err.to_string()
    }
}
