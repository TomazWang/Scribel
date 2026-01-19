// Vault configuration module
// Epic 2, Feature 2.1: Vault Configuration
// This module will be implemented in Epic 2 to allow users to configure vault paths

use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub vault_path: PathBuf,
    pub jots_folder: String,  // default: ".scribel/jots"
}

impl AppConfig {
    /// Detect Obsidian vault in common locations
    /// Implementation planned for Epic 2, Feature 2.1
    pub fn detect_vault() -> Option<PathBuf> {
        // Will check for .obsidian folder in:
        // - ~/Documents/
        // - ~/Obsidian/
        // - User-configured path
        None
    }
}
