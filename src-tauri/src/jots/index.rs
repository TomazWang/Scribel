use crate::jots::models::{Jot, JotError};
use rusqlite::{Connection, Result as SqlResult};

/// Insert jot into SQLite index
pub fn insert_jot(conn: &Connection, jot: &Jot) -> Result<(), JotError> {
    let tags_json = serde_json::to_string(&jot.tags).unwrap_or_else(|_| "[]".to_string());
    let links_json = serde_json::to_string(&jot.links).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO jot_index (id, file_path, content, created_at, modified_at, tags, links, promoted, file_mtime)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            jot.id,
            jot.file_path,
            jot.content,
            jot.created_at.timestamp_millis(),
            jot.modified_at.timestamp_millis(),
            tags_json,
            links_json,
            if jot.promoted { 1 } else { 0 },
            jot.modified_at.timestamp_millis(), // file_mtime = modified_at for consistency
        ],
    )?;

    Ok(())
}

/// Update jot in SQLite index
pub fn update_jot_index(conn: &Connection, jot: &Jot) -> Result<(), JotError> {
    let tags_json = serde_json::to_string(&jot.tags).unwrap_or_else(|_| "[]".to_string());
    let links_json = serde_json::to_string(&jot.links).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT OR REPLACE INTO jot_index (id, file_path, content, created_at, modified_at, tags, links, promoted, file_mtime)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            jot.id,
            jot.file_path,
            jot.content,
            jot.created_at.timestamp_millis(),
            jot.modified_at.timestamp_millis(),
            tags_json,
            links_json,
            if jot.promoted { 1 } else { 0 },
            jot.modified_at.timestamp_millis(),
        ],
    )?;

    Ok(())
}

/// Delete jot from SQLite index
pub fn delete_jot_index(conn: &Connection, id: &str) -> Result<(), JotError> {
    conn.execute("DELETE FROM jot_index WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

/// Get jots with pagination (oldest first)
pub fn get_jots(conn: &Connection, limit: u32, offset: u32) -> Result<Vec<Jot>, JotError> {
    let mut stmt = conn.prepare(
        "SELECT id, file_path, content, created_at, modified_at, tags, links, promoted
         FROM jot_index
         ORDER BY created_at ASC
         LIMIT ?1 OFFSET ?2",
    )?;

    let jots = stmt
        .query_map(rusqlite::params![limit, offset], |row| {
            let id: String = row.get(0)?;
            let file_path: String = row.get(1)?;
            let content: String = row.get(2)?;
            let created_at_ms: i64 = row.get(3)?;
            let modified_at_ms: i64 = row.get(4)?;
            let tags_json: String = row.get(5)?;
            let links_json: String = row.get(6)?;
            let promoted: i32 = row.get(7)?;

            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let links: Vec<String> = serde_json::from_str(&links_json).unwrap_or_default();

            Ok(Jot {
                id,
                content,
                created_at: chrono::DateTime::from_timestamp_millis(created_at_ms)
                    .unwrap_or_default(),
                modified_at: chrono::DateTime::from_timestamp_millis(modified_at_ms)
                    .unwrap_or_default(),
                tags,
                links,
                promoted: promoted != 0,
                file_path,
            })
        })?
        .collect::<SqlResult<Vec<Jot>>>()?;

    Ok(jots)
}

/// Search jots by content (case-insensitive LIKE query)
pub fn search_jots(conn: &Connection, query: &str, limit: u32) -> Result<Vec<Jot>, JotError> {
    if query.trim().is_empty() {
        return Err(JotError::ValidationError(
            "Search query cannot be empty".to_string(),
        ));
    }

    let search_pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, file_path, content, created_at, modified_at, tags, links, promoted
         FROM jot_index
         WHERE content LIKE ?1
         ORDER BY created_at DESC
         LIMIT ?2",
    )?;

    let jots = stmt
        .query_map(rusqlite::params![search_pattern, limit], |row| {
            let id: String = row.get(0)?;
            let file_path: String = row.get(1)?;
            let content: String = row.get(2)?;
            let created_at_ms: i64 = row.get(3)?;
            let modified_at_ms: i64 = row.get(4)?;
            let tags_json: String = row.get(5)?;
            let links_json: String = row.get(6)?;
            let promoted: i32 = row.get(7)?;

            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let links: Vec<String> = serde_json::from_str(&links_json).unwrap_or_default();

            Ok(Jot {
                id,
                content,
                created_at: chrono::DateTime::from_timestamp_millis(created_at_ms)
                    .unwrap_or_default(),
                modified_at: chrono::DateTime::from_timestamp_millis(modified_at_ms)
                    .unwrap_or_default(),
                tags,
                links,
                promoted: promoted != 0,
                file_path,
            })
        })?
        .collect::<SqlResult<Vec<Jot>>>()?;

    Ok(jots)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_jot(id: &str, content: &str, offset_secs: i64) -> Jot {
        let base_time = Utc::now();
        let timestamp = base_time + chrono::Duration::seconds(offset_secs);
        Jot {
            id: id.to_string(),
            content: content.to_string(),
            created_at: timestamp,
            modified_at: timestamp,
            tags: vec!["test".to_string()],
            links: vec![],
            promoted: false,
            file_path: format!(".scribel/jots/{}.md", id),
        }
    }

    #[test]
    fn test_insert_and_get_jots() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let jot1 = create_test_jot("jot-1", "First jot", 0);
        let jot2 = create_test_jot("jot-2", "Second jot", 1);

        insert_jot(&conn, &jot1).unwrap();
        insert_jot(&conn, &jot2).unwrap();

        let jots = get_jots(&conn, 10, 0).unwrap();
        assert_eq!(jots.len(), 2);
        assert_eq!(jots[0].id, "jot-1");
        assert_eq!(jots[1].id, "jot-2");
    }

    #[test]
    fn test_update_jot_index() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let mut jot = create_test_jot("jot-1", "Original content", 0);
        insert_jot(&conn, &jot).unwrap();

        jot.content = "Updated content".to_string();
        update_jot_index(&conn, &jot).unwrap();

        let jots = get_jots(&conn, 10, 0).unwrap();
        assert_eq!(jots.len(), 1);
        assert_eq!(jots[0].content, "Updated content");
    }

    #[test]
    fn test_delete_jot_index() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let jot = create_test_jot("jot-1", "To delete", 0);
        insert_jot(&conn, &jot).unwrap();

        delete_jot_index(&conn, &jot.id).unwrap();

        let jots = get_jots(&conn, 10, 0).unwrap();
        assert!(jots.is_empty());
    }

    #[test]
    fn test_search_jots() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let jot1 = create_test_jot("jot-1", "Meeting about project", 0);
        let jot2 = create_test_jot("jot-2", "Another note", 1);

        insert_jot(&conn, &jot1).unwrap();
        insert_jot(&conn, &jot2).unwrap();

        let results = search_jots(&conn, "meeting", 10).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "jot-1");
    }

    #[test]
    fn test_search_case_insensitive() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let jot = create_test_jot("jot-1", "Important Meeting", 0);
        insert_jot(&conn, &jot).unwrap();

        let results = search_jots(&conn, "meeting", 10).unwrap();
        assert_eq!(results.len(), 1);
    }

    #[test]
    fn test_pagination() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        for i in 0..5 {
            let jot = create_test_jot(&format!("jot-{}", i), &format!("Jot {}", i), i);
            insert_jot(&conn, &jot).unwrap();
        }

        let page1 = get_jots(&conn, 2, 0).unwrap();
        assert_eq!(page1.len(), 2);
        assert_eq!(page1[0].id, "jot-0");

        let page2 = get_jots(&conn, 2, 2).unwrap();
        assert_eq!(page2.len(), 2);
        assert_eq!(page2[0].id, "jot-2");
    }
}
