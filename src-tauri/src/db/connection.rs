use rusqlite::{Connection, Result};
use std::path::Path;

/// Initialize SQLite database with WAL mode for concurrent access
pub fn init_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL (Write-Ahead Logging) mode for concurrent reads during writes
    conn.pragma_update(None, "journal_mode", "WAL")?;

    // Set synchronous mode to NORMAL for better performance while maintaining safety
    conn.pragma_update(None, "synchronous", "NORMAL")?;

    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_init_db() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");

        let conn = init_db(&db_path).unwrap();

        // Verify WAL mode is enabled
        let journal_mode: String = conn
            .pragma_query_value(None, "journal_mode", |row| row.get(0))
            .unwrap();
        assert_eq!(journal_mode.to_lowercase(), "wal");

        // Verify synchronous mode (1 = NORMAL)
        let sync_mode: i64 = conn
            .pragma_query_value(None, "synchronous", |row| row.get(0))
            .unwrap();
        assert_eq!(sync_mode, 1); // 1 = NORMAL
    }
}
