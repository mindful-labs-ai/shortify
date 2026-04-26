// Phase 0 minimal entry. 사이드카 lifecycle / Keychain / Sparkle 은
// 박경선(@gngsn) sunny 브랜치에서 단계적으로 추가.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct ApiConfig {
    #[serde(rename = "baseUrl")]
    base_url: String,
    token: String,
}

#[tauri::command]
fn get_api_config() -> ApiConfig {
    // dev 기본값. prod 에서는 사이드카 spawn 시 발급된 값으로 대체.
    let port = std::env::var("SHORTIFY_PORT").unwrap_or_else(|_| "51234".into());
    let host = std::env::var("SHORTIFY_HOST").unwrap_or_else(|_| "127.0.0.1".into());
    let token = std::env::var("SHORTIFY_TOKEN").unwrap_or_else(|_| "dev".into());
    ApiConfig {
        base_url: format!("http://{host}:{port}"),
        token,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_api_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
