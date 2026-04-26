// Tauri Rust 명령 래퍼.
// src-tauri/src/main.rs 의 #[tauri::command] 와 1:1 매칭.

import { invoke } from "@tauri-apps/api/core";

export type ApiConfig = { baseUrl: string; token: string };
export type SidecarStatus = { running: boolean; pid: number | null; port: number | null };

export const tauri = {
  getApiConfig: () => invoke<ApiConfig>("get_api_config"),
  sidecarStatus: () => invoke<SidecarStatus>("sidecar_status"),
  sidecarRestart: () => invoke<void>("sidecar_restart"),

  keychainSet: (service: string, key: string, value: string) =>
    invoke<void>("keychain_set", { service, key, value }),
  keychainGet: (service: string, key: string) =>
    invoke<string | null>("keychain_get", { service, key }),

  openInFinder: (path: string) => invoke<void>("open_in_finder", { path }),
  pickDirectory: () => invoke<string | null>("pick_directory"),
};
