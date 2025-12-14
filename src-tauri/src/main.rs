// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tokio::main]
async fn main() {
    let port = 8000;

    // Start Axum backend in background
    tauri::async_runtime::spawn(async move {
        shara_backend::run_server(port).await;
    });

    // Start Tauri window
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
