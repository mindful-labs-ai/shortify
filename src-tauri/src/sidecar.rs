//! Python 사이드카 lifecycle.
//!
//! - 부팅 시 random free port + 32바이트 base64 토큰 발급
//! - dev 모드: `cd sidecar && uvicorn ...` 직접 실행 (이미 떠있으면 spawn 안 함)
//! - prod 모드: 번들된 `bin/shortify-sidecar` 실행 파일 spawn
//! - Keychain에서 `gemini` 키를 꺼내 환경변수 `GEMINI_API_KEY` 로 주입

use base64::Engine;
use rand::RngCore;
use serde::Serialize;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Default)]
pub struct SidecarHandle {
    pub child: Mutex<Option<Child>>,
    pub config: Mutex<Option<ApiConfig>>,
}

#[derive(Clone, Serialize)]
pub struct ApiConfig {
    #[serde(rename = "baseUrl")]
    pub base_url: String,
    pub token: String,
}

#[derive(Clone, Serialize)]
pub struct SidecarStatus {
    pub running: bool,
    pub pid: Option<u32>,
    pub port: Option<u16>,
}

fn make_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

fn pick_port() -> u16 {
    51234
}

fn is_dev_mode() -> bool {
    // 1) SHORTIFY_DEV=1/0 명시 override 우선
    match std::env::var("SHORTIFY_DEV").ok().as_deref() {
        Some("1") => return true,
        Some("0") => return false,
        _ => {}
    }
    // 2) debug_assertions = cargo dev / pnpm tauri dev
    cfg!(debug_assertions)
}

fn dev_sidecar_command(host: &str, port: u16, token: &str, api_key: &str) -> Result<Command, String> {
    // <repo>/src-tauri/target/debug/shortify (cwd at runtime) → 상위 2단 = repo
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let candidates = [
        exe.parent().and_then(|p| p.parent()).and_then(|p| p.parent()).and_then(|p| p.parent()).map(|p| p.join("sidecar/.venv/bin/python")),
        Some(PathBuf::from("../sidecar/.venv/bin/python")),
        Some(PathBuf::from("sidecar/.venv/bin/python")),
    ];
    let python = candidates.into_iter().flatten().find(|p| p.exists()).ok_or_else(|| {
        "dev sidecar venv not found. Run: cd sidecar && python3 -m venv .venv && .venv/bin/pip install -e \".[dev]\"".to_string()
    })?;

    let mut cmd = Command::new(python);
    cmd.args([
        "-m", "uvicorn", "shortify_sidecar.main:app",
        "--host", host,
        "--port", &port.to_string(),
        "--log-level", "info",
    ]);
    cmd.env("SHORTIFY_HOST", host)
        .env("SHORTIFY_PORT", port.to_string())
        .env("SHORTIFY_TOKEN", token);
    // 빈 키를 주입하면 사이드카의 .env 가 덮어써지지 않음 — Keychain 에 값이 있을 때만 주입.
    if !api_key.is_empty() {
        cmd.env("GEMINI_API_KEY", api_key);
    }
    Ok(cmd)
}

fn prod_sidecar_command(host: &str, port: u16, token: &str, api_key: &str) -> Result<Command, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let resources = exe
        .parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("Resources"))
        .ok_or_else(|| "could not resolve Resources dir".to_string())?;
    let bin = resources.join("shortify-sidecar");
    if !bin.exists() {
        return Err(format!(
            "prod sidecar not found at {bin:?}. Did you forget to run scripts/build_sidecar.sh?"
        ));
    }
    let mut cmd = Command::new(bin);
    cmd.env("SHORTIFY_HOST", host)
        .env("SHORTIFY_PORT", port.to_string())
        .env("SHORTIFY_TOKEN", token)
        .env("GEMINI_API_KEY", api_key);
    Ok(cmd)
}

pub fn spawn(handle: &SidecarHandle) -> Result<ApiConfig, String> {
    let token = make_token();
    let port = pick_port();
    let host = "127.0.0.1".to_string();
    // dev 빌드는 매 cargo build 마다 ad-hoc 서명이 바뀌어 Keychain ACL 캐시가
    // 무효화 → 부팅마다 macOS 인증 다이얼로그가 뜬다. env 가 있으면 그걸 우선 쓰고
    // 없을 때만 Keychain 으로 폴백.
    let api_key = std::env::var("GEMINI_API_KEY")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| crate::keychain::get_or_empty("shortify", "gemini"));

    let mut cmd = if is_dev_mode() {
        dev_sidecar_command(&host, port, &token, &api_key)?
    } else {
        prod_sidecar_command(&host, port, &token, &api_key)?
    };
    cmd.stdout(Stdio::inherit()).stderr(Stdio::inherit());
    let child = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn sidecar: {e}"))?;

    let cfg = ApiConfig {
        base_url: format!("http://{host}:{port}"),
        token,
    };

    *handle.child.lock().unwrap() = Some(child);
    *handle.config.lock().unwrap() = Some(cfg.clone());

    // health check (최대 10s)
    let started = Instant::now();
    while started.elapsed() < Duration::from_secs(10) {
        if let Ok(resp) = ureq_health(&cfg.base_url) {
            if resp {
                return Ok(cfg);
            }
        }
        // 자식이 일찍 죽었으면(보통 EADDRINUSE) 포트 충돌로 단정.
        if let Some(child) = handle.child.lock().unwrap().as_mut() {
            if matches!(child.try_wait(), Ok(Some(_))) {
                return Err(format!(
                    "sidecar exited during boot — port {port} is likely already in use.\n\
                     Find the holder:  lsof -nP -iTCP:{port} -sTCP:LISTEN\n\
                     Kill it:         kill -9 <PID>\n\
                     Or quit any standalone uvicorn / previous Tauri instance."
                ));
            }
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    Err(format!(
        "sidecar health check on {} timed out after 10s. \
         If port {port} is held by another process, run: lsof -nP -iTCP:{port} -sTCP:LISTEN",
        cfg.base_url
    ))
}

fn ureq_health(base_url: &str) -> Result<bool, ()> {
    // tokio 의존성 줄이려고 동기 fetch는 std::net 으로
    use std::io::{Read, Write};
    use std::net::TcpStream;

    let url = base_url.strip_prefix("http://").unwrap_or(base_url);
    let mut stream = TcpStream::connect(url).map_err(|_| ())?;
    stream
        .write_all(b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
        .map_err(|_| ())?;
    let mut buf = String::new();
    stream.read_to_string(&mut buf).ok();
    Ok(buf.contains("\"ok\":true"))
}

pub fn kill(handle: &SidecarHandle) {
    if let Some(mut child) = handle.child.lock().unwrap().take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    *handle.config.lock().unwrap() = None;
}

pub fn status(handle: &SidecarHandle) -> SidecarStatus {
    let mut child_lock = handle.child.lock().unwrap();
    let cfg = handle.config.lock().unwrap().clone();

    if let Some(child) = child_lock.as_mut() {
        match child.try_wait() {
            Ok(Some(_)) => SidecarStatus { running: false, pid: None, port: None },
            Ok(None) => SidecarStatus {
                running: true,
                pid: Some(child.id()),
                port: cfg.as_ref().and_then(|c| {
                    c.base_url.rsplit(':').next().and_then(|p| p.parse().ok())
                }),
            },
            Err(_) => SidecarStatus { running: false, pid: None, port: None },
        }
    } else {
        // dev 모드 — 자식은 없지만 config 는 있음
        SidecarStatus {
            running: cfg.is_some(),
            pid: None,
            port: cfg.as_ref().and_then(|c| {
                c.base_url.rsplit(':').next().and_then(|p| p.parse().ok())
            }),
        }
    }
}
