//! macOS Keychain wrapper. 모든 외부 비밀(GEMINI_API_KEY)은 여기에만 저장.

use security_framework::passwords::{
    delete_generic_password, get_generic_password, set_generic_password,
};

pub fn set(service: &str, account: &str, value: &str) -> Result<(), String> {
    set_generic_password(service, account, value.as_bytes()).map_err(|e| e.to_string())
}

pub fn get(service: &str, account: &str) -> Result<Option<String>, String> {
    match get_generic_password(service, account) {
        Ok(bytes) => String::from_utf8(bytes)
            .map(Some)
            .map_err(|e| e.to_string()),
        Err(e) => {
            // -25300 = errSecItemNotFound
            if e.code() == -25300 {
                Ok(None)
            } else {
                Err(e.to_string())
            }
        }
    }
}

pub fn get_or_empty(service: &str, account: &str) -> String {
    get(service, account).ok().flatten().unwrap_or_default()
}

pub fn remove(service: &str, account: &str) -> Result<(), String> {
    delete_generic_password(service, account).map_err(|e| {
        if e.code() == -25300 {
            String::new() // 이미 없으면 무시
        } else {
            e.to_string()
        }
    })
}
