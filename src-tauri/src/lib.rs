mod db;
mod jots;
mod commands;
mod config;

use std::sync::Mutex;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database
            let app_data = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data)?;
            let db_path = app_data.join("scribel.db");

            let conn = db::init_db(&db_path).map_err(|e| e.to_string())?;
            db::run_migrations(&conn).map_err(|e| e.to_string())?;

            app.manage(Mutex::new(conn));

            // Vault path configuration (Phase 2 - Epic 2: Feature 2.1)
            // Currently uses default path, will be user-configurable in Epic 2
            let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/tmp"));
            let default_vault = format!("{}/Documents/Obsidian", home);
            app.manage(Mutex::new(default_vault));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
