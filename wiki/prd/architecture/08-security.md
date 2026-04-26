# 08. Security

## 위협 모델 (간단)

| 위협 | 영향 | 대응 |
|------|------|------|
| 다른 로컬 프로세스가 사이드카 API 호출 | API 키 누출, 영상 무단 생성 | 랜덤 포트 + Bearer 토큰 |
| 디스크에서 API 키 평문 발견 | 키 누출 | macOS Keychain 사용 |
| 외부 API로 키 전송 시 MITM | 키 누출 | HTTPS only, 인증서 핀닝 (선택) |
| 악성 PDF (parser 취약점) | RCE | pypdf만 사용 (안정 라이브러리), 사용자 시스템 범위 |
| 악성 업데이트 (가짜 appcast) | 임의 코드 실행 | Sparkle EdDSA 서명 검증 + Apple notarization |
| 사이드카 크래시 → 부분 상태 | 데이터 손상 | SQLite WAL + persistent queue로 복구 |

## API 인증

```
Tauri Shell 부팅 시:
   token = base64(os.urandom(32))
   port  = OS 할당 (0 → free port)
   사이드카에 환경변수로 주입

React UI는 Tauri의 invoke('get_api_config') → { baseUrl, token } 받음.

모든 fetch:
   Authorization: Bearer <token>
```

토큰은 메모리에만, 파일/Keychain 저장 안 함. 앱 재시작 시 재발급.

## 외부 호출 차단

```python
# main.py
app = FastAPI()
uvicorn.run(app, host="127.0.0.1", port=PORT)  # 0.0.0.0 절대 금지
```

```rust
// src-tauri/src/sidecar.rs
Command::new(sidecar_path)
    .env("SHORTIFY_HOST", "127.0.0.1")  // 명시
    .env("SHORTIFY_PORT", port.to_string())
    .env("SHORTIFY_TOKEN", token)
    .spawn()?;
```

## API 키 저장 (macOS Keychain)

```rust
// src-tauri/src/keychain.rs
use security_framework::passwords::{set_password, get_password};

#[tauri::command]
fn keychain_set(service: &str, key: &str, value: &str) -> Result<(), String> {
    set_password(service, key, value.as_bytes())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_get(service: &str, key: &str) -> Result<Option<String>, String> {
    match get_password(service, key) {
        Ok(bytes) => Ok(Some(String::from_utf8(bytes).map_err(|e| e.to_string())?)),
        Err(_) => Ok(None),
    }
}
```

**중요**: 사이드카는 Keychain 직접 접근 안 함. Tauri Shell이 Keychain → 환경변수로 사이드카에 주입 (권한 분리).

```rust
// 사이드카 spawn 시
let gemini_key = keychain_get("shortify", "gemini")?.unwrap_or_default();
Command::new(sidecar_path)
    .env("GEMINI_API_KEY", gemini_key)
    // ...
```

## 외부 API 호출

- 모든 호출 HTTPS only
- TLS 1.2+
- 인증서 검증 활성 (httpx 기본값 유지)
- API 키는 헤더에 (URL 쿼리 금지 — 로그 노출)

## 로그 정책

- 로그에 API 키 절대 기록 안 함
- 사용자 PDF 본문도 로그에 기록 안 함 (메타데이터만)
- 로그 위치: `~/Library/.../Shortify/logs/sidecar.log`
- 회전: 10MB × 5개

```python
# 안전한 로깅 헬퍼
def safe_log(msg: str, **kwargs):
    redacted = {k: "***" if k.endswith("_key") or k == "token" else v for k, v in kwargs.items()}
    logger.info(msg, extra=redacted)
```

## 파일 권한

- 사용자 파일은 NSOpenPanel을 통해서만 (드래그앤드롭은 Tauri가 sandbox-safe하게 처리)
- 출력 폴더 (`~/Library/.../Shortify/output/`)는 앱 자체 영역 → 권한 프롬프트 불필요

## Hardened Runtime

`entitlements.plist`에서 최소 권한만:

```xml
<key>com.apple.security.network.client</key>            <true/>
<key>com.apple.security.files.user-selected.read-write</key> <true/>
<key>com.apple.security.cs.allow-jit</key>              <true/>
<key>com.apple.security.cs.disable-library-validation</key> <true/>
```

`network.server`는 false 유지 — 외부에서 들어오는 연결 차단 (사이드카는 localhost 바인딩이라 OK).

## Sparkle 업데이트 무결성

- DMG에 EdDSA 서명 첨부
- 클라이언트가 서명 검증 후 설치
- 개인키는 GitHub Actions secret에만, 로컬 머신에 두지 않음

## 사이드카 크래시 시 데이터 안전성

- SQLite WAL 모드 → 부분 쓰기 시 자동 복구
- persistent queue: `running` 상태 task는 사이드카 재시작 시 `pending`으로 자동 되돌림 (서버가 죽었다고 가정)
- 영상 파일 쓰기는 `output/<job_id>/.tmp/` → 완료 후 atomic rename

## 사용자 제어

- 설정에서 "API 키 삭제" 버튼 (Keychain 항목 삭제)
- 설정에서 "모든 데이터 삭제" 버튼 (`~/Library/.../Shortify` 전체 제거)
- 영상 1편 단위 삭제 가능

## 알려진 한계 (v0)

- DMG 직배포 → 일부 사용자에게 "신뢰할 수 없는 개발자" 경고 가능 (notarized면 우회 가능)
- 사용자가 자기 머신을 직접 통제하므로, 머신 자체가 침해된 경우 보호 불가 (Keychain은 잠긴 키체인 외에는 무력)
- 외부 API 키 도난 시 책임 사용자 (사용량 알림 권장)

## 향후 개선 (v1+)

- Sparkle 업데이트 채널 분리 (stable / beta)
- 외부 API 호출 횟수 표시 (사용자가 비용 인지)
- 로컬 모델 옵션 검토 (현재는 모든 추론·생성·정렬이 Google Gemini API)
