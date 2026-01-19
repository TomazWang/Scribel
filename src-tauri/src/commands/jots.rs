use crate::jots::models::{CreateJotInput, Jot, UpdateJotInput};
use crate::jots::{index, storage};
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Create a new jot
#[tauri::command]
pub async fn create_jot(
    content: String,
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, Mutex<String>>,
) -> Result<Jot, String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());

    // Create jot file
    let jot = storage::create_jot(&vault_pathbuf, &content).map_err(|e| e.to_string())?;

    // Insert into index
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    index::insert_jot(&conn, &jot).map_err(|e| e.to_string())?;

    Ok(jot)
}

/// Get paginated list of jots
#[tauri::command]
pub async fn get_jots(
    limit: Option<u32>,
    offset: Option<u32>,
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<Jot>, String> {
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    let limit = limit.unwrap_or(50).min(500);
    let offset = offset.unwrap_or(0);

    index::get_jots(&conn, limit, offset).map_err(|e| e.to_string())
}

/// Get a single jot by ID
#[tauri::command]
pub async fn get_jot(
    id: String,
    vault_path: State<'_, Mutex<String>>,
) -> Result<Jot, String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());

    storage::read_jot(&vault_pathbuf, &id).map_err(|e| e.to_string())
}

/// Update jot content
#[tauri::command]
pub async fn update_jot(
    id: String,
    content: String,
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, Mutex<String>>,
) -> Result<Jot, String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());

    // Update file
    let jot = storage::update_jot(&vault_pathbuf, &id, &content).map_err(|e| e.to_string())?;

    // Update index
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    index::update_jot_index(&conn, &jot).map_err(|e| e.to_string())?;

    Ok(jot)
}

/// Delete a jot
#[tauri::command]
pub async fn delete_jot(
    id: String,
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, Mutex<String>>,
) -> Result<(), String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());

    // Delete file
    storage::delete_jot(&vault_pathbuf, &id).map_err(|e| e.to_string())?;

    // Delete from index
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    index::delete_jot_index(&conn, &id).map_err(|e| e.to_string())?;

    Ok(())
}

/// Search jots by content
#[tauri::command]
pub async fn search_jots(
    query: String,
    limit: Option<u32>,
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<Jot>, String> {
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    let limit = limit.unwrap_or(50).min(500);

    index::search_jots(&conn, &query, limit).map_err(|e| e.to_string())
}

/// Set promoted status for a jot
#[tauri::command]
pub async fn set_jot_promoted(
    id: String,
    promoted: bool,
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, Mutex<String>>,
) -> Result<Jot, String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());

    // Update file
    let jot = storage::set_promoted(&vault_pathbuf, &id, promoted).map_err(|e| e.to_string())?;

    // Update index
    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;
    index::update_jot_index(&conn, &jot).map_err(|e| e.to_string())?;

    Ok(jot)
}

/// Rebuild jot index from files
#[tauri::command]
pub async fn rebuild_jot_index(
    db: State<'_, Mutex<Connection>>,
    vault_path: State<'_, Mutex<String>>,
) -> Result<u32, String> {
    let vault = vault_path
        .lock()
        .map_err(|e| format!("Vault lock poisoned: {}", e))?;
    let vault_pathbuf = PathBuf::from(vault.as_str());
    let jots_dir = vault_pathbuf.join(".scribel/jots");

    if !jots_dir.exists() {
        return Ok(0);
    }

    let conn = db
        .lock()
        .map_err(|e| format!("Database lock poisoned: {}", e))?;

    // Clear existing index
    conn.execute("DELETE FROM jot_index", [])
        .map_err(|e| e.to_string())?;

    // Scan and index all jot files
    let mut count = 0;
    for entry in std::fs::read_dir(&jots_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            if let Some(file_name) = path.file_stem() {
                let id = file_name.to_str().unwrap_or("");
                match storage::read_jot(&vault_pathbuf, id) {
                    Ok(jot) => {
                        if let Err(e) = index::insert_jot(&conn, &jot) {
                            eprintln!("Failed to index {}: {}", id, e);
                        } else {
                            count += 1;
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to read {}: {}", id, e);
                    }
                }
            }
        }
    }

    Ok(count)
}
