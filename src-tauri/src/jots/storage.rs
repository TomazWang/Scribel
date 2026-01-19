use crate::jots::models::{Jot, JotError};
use crate::jots::parser::{extract_links, extract_tags, parse_jot_file, serialize_jot};
use chrono::Utc;
use rand::Rng;
use std::fs;
use std::path::Path;

/// Generate unique jot ID: jot-YYYY-MM-DD-HHMMSS-XXXX
fn generate_jot_id() -> String {
    let now = Utc::now();
    let hex: String = (0..4)
        .map(|_| format!("{:x}", rand::thread_rng().gen_range(0..16)))
        .collect();

    format!("jot-{}-{}", now.format("%Y-%m-%d-%H%M%S"), hex)
}

/// Create a new jot file
/// Writes markdown file to .scribel/jots/ and returns Jot struct
pub fn create_jot(vault_path: &Path, content: &str) -> Result<Jot, JotError> {
    // Validate content
    if content.trim().is_empty() {
        return Err(JotError::ValidationError("Content cannot be empty".to_string()));
    }

    if content.len() > 10_000 {
        return Err(JotError::ValidationError(
            "Content exceeds 10,000 characters".to_string(),
        ));
    }

    // Generate ID and timestamps
    let id = generate_jot_id();
    let now = Utc::now();

    // Extract tags and links
    let tags = extract_tags(content);
    let links = extract_links(content);

    // Create jot struct
    let jot = Jot {
        id: id.clone(),
        content: content.trim().to_string(),
        created_at: now,
        modified_at: now,
        tags,
        links,
        promoted: false,
        file_path: format!(".scribel/jots/{}.md", id),
    };

    // Ensure jots directory exists
    let jots_dir = vault_path.join(".scribel/jots");
    fs::create_dir_all(&jots_dir)?;

    // Write file
    let file_path = vault_path.join(&jot.file_path);
    let markdown = serialize_jot(&jot);
    fs::write(&file_path, markdown)?;

    Ok(jot)
}

/// Read jot from file
pub fn read_jot(vault_path: &Path, id: &str) -> Result<Jot, JotError> {
    let file_path = vault_path.join(format!(".scribel/jots/{}.md", id));

    if !file_path.exists() {
        return Err(JotError::NotFound(id.to_string()));
    }

    let content = fs::read_to_string(&file_path)?;
    let relative_path = format!(".scribel/jots/{}.md", id);
    parse_jot_file(&content, &relative_path)
}

/// Update jot content
/// Rewrites file with new content, extracts new tags/links, updates modified_at
pub fn update_jot(vault_path: &Path, id: &str, new_content: &str) -> Result<Jot, JotError> {
    // Validate content
    if new_content.trim().is_empty() {
        return Err(JotError::ValidationError("Content cannot be empty".to_string()));
    }

    if new_content.len() > 10_000 {
        return Err(JotError::ValidationError(
            "Content exceeds 10,000 characters".to_string(),
        ));
    }

    // Read existing jot
    let mut jot = read_jot(vault_path, id)?;

    // Update fields
    jot.content = new_content.trim().to_string();
    jot.modified_at = Utc::now();
    jot.tags = extract_tags(new_content);
    jot.links = extract_links(new_content);

    // Write updated file
    let file_path = vault_path.join(&jot.file_path);
    let markdown = serialize_jot(&jot);
    fs::write(&file_path, markdown)?;

    Ok(jot)
}

/// Delete jot file
pub fn delete_jot(vault_path: &Path, id: &str) -> Result<(), JotError> {
    let file_path = vault_path.join(format!(".scribel/jots/{}.md", id));

    if !file_path.exists() {
        return Err(JotError::NotFound(id.to_string()));
    }

    fs::remove_file(&file_path)?;
    Ok(())
}

/// Set promoted status for a jot
pub fn set_promoted(vault_path: &Path, id: &str, promoted: bool) -> Result<Jot, JotError> {
    // Read existing jot
    let mut jot = read_jot(vault_path, id)?;

    // Update promoted status and modified_at
    jot.promoted = promoted;
    jot.modified_at = Utc::now();

    // Write updated file
    let file_path = vault_path.join(&jot.file_path);
    let markdown = serialize_jot(&jot);
    fs::write(&file_path, markdown)?;

    Ok(jot)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_generate_jot_id() {
        let id = generate_jot_id();
        assert!(id.starts_with("jot-"));
        assert!(id.len() > 20); // jot-YYYY-MM-DD-HHMMSS-XXXX
    }

    #[test]
    fn test_create_and_read_jot() {
        let vault = tempdir().unwrap();

        let jot = create_jot(vault.path(), "Test #tag [[Link]]").unwrap();

        assert!(jot.id.starts_with("jot-"));
        assert_eq!(jot.content, "Test #tag [[Link]]");
        assert_eq!(jot.tags, vec!["tag"]);
        assert_eq!(jot.links, vec!["Link"]);
        assert!(!jot.promoted);

        // Verify file exists
        let file_path = vault.path().join(&jot.file_path);
        assert!(file_path.exists());

        // Read back
        let fetched = read_jot(vault.path(), &jot.id).unwrap();
        assert_eq!(fetched.content, "Test #tag [[Link]]");
        assert_eq!(fetched.id, jot.id);
    }

    #[test]
    fn test_update_jot() {
        let vault = tempdir().unwrap();

        let jot = create_jot(vault.path(), "Original content").unwrap();
        let updated = update_jot(vault.path(), &jot.id, "Updated content #new").unwrap();

        assert_eq!(updated.content, "Updated content #new");
        assert_eq!(updated.tags, vec!["new"]);
        assert!(updated.modified_at > jot.created_at);

        // Verify file updated
        let fetched = read_jot(vault.path(), &jot.id).unwrap();
        assert_eq!(fetched.content, "Updated content #new");
    }

    #[test]
    fn test_delete_jot() {
        let vault = tempdir().unwrap();

        let jot = create_jot(vault.path(), "To delete").unwrap();
        let file_path = vault.path().join(&jot.file_path);

        assert!(file_path.exists());

        delete_jot(vault.path(), &jot.id).unwrap();

        assert!(!file_path.exists());

        // Reading deleted jot should fail
        let result = read_jot(vault.path(), &jot.id);
        assert!(result.is_err());
    }

    #[test]
    fn test_set_promoted() {
        let vault = tempdir().unwrap();

        let jot = create_jot(vault.path(), "Test content").unwrap();
        assert!(!jot.promoted);

        let promoted = set_promoted(vault.path(), &jot.id, true).unwrap();
        assert!(promoted.promoted);

        // Verify persistence
        let fetched = read_jot(vault.path(), &jot.id).unwrap();
        assert!(fetched.promoted);
    }

    #[test]
    fn test_empty_content_validation() {
        let vault = tempdir().unwrap();

        let result = create_jot(vault.path(), "   ");
        assert!(result.is_err());
        assert!(matches!(result, Err(JotError::ValidationError(_))));
    }

    #[test]
    fn test_jot_not_found() {
        let vault = tempdir().unwrap();

        let result = read_jot(vault.path(), "nonexistent-id");
        assert!(result.is_err());
        assert!(matches!(result, Err(JotError::NotFound(_))));
    }
}
