#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod keychain;
mod sidecar;

use sidecar::{ApiConfig, SidecarHandle, SidecarStatus};
use tauri::{Manager, State};

#[tauri::command]
fn get_api_config(handle: State<SidecarHandle>) -> Result<ApiConfig, String> {
    handle
        .config
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "sidecar not started".into())
}

#[tauri::command]
fn sidecar_status(handle: State<SidecarHandle>) -> SidecarStatus {
    sidecar::status(&handle)
}

#[tauri::command]
fn sidecar_restart(handle: State<SidecarHandle>) -> Result<ApiConfig, String> {
    sidecar::kill(&handle);
    sidecar::spawn(&handle)
}

#[tauri::command]
fn keychain_set(service: String, key: String, value: String) -> Result<(), String> {
    keychain::set(&service, &key, &value)
}

#[tauri::command]
fn keychain_get(service: String, key: String) -> Result<Option<String>, String> {
    keychain::get(&service, &key)
}

#[tauri::command]
fn keychain_delete(service: String, key: String) -> Result<(), String> {
    keychain::remove(&service, &key)
}

fn main() {
    let handle = SidecarHandle::default();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(handle)
        .setup(|app| {
            let state: State<SidecarHandle> = app.state();
            sidecar::spawn(&state).map_err(|e| Box::<dyn std::error::Error>::from(e))?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state: State<SidecarHandle> = window.state();
                sidecar::kill(&state);
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_api_config,
            sidecar_status,
            sidecar_restart,
            keychain_set,
            keychain_get,
            keychain_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
