use rusqlite::{Connection, Result};

pub const SCHEMA_VERSION: i32 = 1;

/// Run database migrations to ensure schema is up to date
pub fn run_migrations(conn: &Connection) -> Result<()> {
    let version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);

    if version < SCHEMA_VERSION {
        create_jot_index_table(conn)?;
        create_embeddings_table(conn)?;
        conn.execute(
            &format!("PRAGMA user_version = {}", SCHEMA_VERSION),
            [],
        )?;
    }

    Ok(())
}

/// Create jot_index table for fast queries
fn create_jot_index_table(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS jot_index (
            id TEXT PRIMARY KEY,
            file_path TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            modified_at INTEGER NOT NULL,
            tags TEXT DEFAULT '[]',
            links TEXT DEFAULT '[]',
            promoted INTEGER DEFAULT 0,
            file_mtime INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_jot_created_at ON jot_index(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_jot_promoted ON jot_index(promoted);
        CREATE INDEX IF NOT EXISTS idx_jot_file_path ON jot_index(file_path);
        "#,
    )?;

    Ok(())
}

/// Create embeddings table (for future RAG features)
fn create_embeddings_table(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS embeddings (
            id TEXT PRIMARY KEY,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            embedding BLOB NOT NULL,
            model TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_type, source_id);
        "#,
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrations() {
        let conn = Connection::open_in_memory().unwrap();

        run_migrations(&conn).unwrap();

        // Verify schema version
        let version: i32 = conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION);

        // Verify jot_index table exists
        let table_exists: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='jot_index'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(table_exists, 1);

        // Verify embeddings table exists
        let embeddings_exists: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='embeddings'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(embeddings_exists, 1);
    }
}
