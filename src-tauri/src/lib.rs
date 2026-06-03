// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs::File;
use std::io::Write;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_backup_file(app: tauri::AppHandle, content: String, filename: String) -> Result<String, String> {
    // Get the user's Document directory
    let mut path = app.path().document_dir()
        .map_err(|e| format!("Gagal mendapatkan folder Documents: {}", e))?;
    
    // Create a subfolder "Asrep Backups" to be super clean and organized
    path.push("Asrep Backups");
    if !path.exists() {
        std::fs::create_dir_all(&path)
            .map_err(|e| format!("Gagal membuat folder cadangan: {}", e))?;
    }
    
    path.push(&filename);
    
    // Write content
    let mut file = File::create(&path)
        .map_err(|e| format!("Gagal membuat file backup: {}", e))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Gagal menulis data ke file: {}", e))?;
    
    let path_str = path.to_string_lossy().to_string();
    Ok(path_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_backup_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
