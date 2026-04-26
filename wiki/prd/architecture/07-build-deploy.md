# 07. Build & Deploy

## 빌드 산출물

| 산출물 | 용도 |
|--------|------|
| `dist/Shortify-x.y.z.dmg` | 사용자 다운로드 |
| `dist/Shortify-x.y.z.dmg.sig` | Sparkle 무결성 서명 (EdDSA) |
| `dist/appcast.xml` | Sparkle 자동 업데이트 피드 |

## 빌드 파이프라인 (GitHub Actions, macOS runner)

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Frontend build                                            │
│    pnpm install --frozen-lockfile                            │
│    pnpm vite build                                           │
│    → dist/ (정적 HTML/JS/CSS)                                │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Sidecar build (PyInstaller, universal2)                   │
│    cd sidecar                                                │
│    python -m venv .venv && pip install -e .                  │
│    pyinstaller PyInstaller.spec                              │
│      --target-arch universal2                                │
│      --noconfirm                                             │
│    → bin/shortify-sidecar (단일 실행파일, ~150MB)             │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Tauri bundle                                              │
│    cargo tauri build --target universal-apple-darwin         │
│    (사이드카 + ffmpeg + assets 포함)                          │
│    → src-tauri/target/release/bundle/macos/Shortify.app      │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Code sign                                                 │
│    codesign --deep --force --options=runtime                 │
│      --entitlements src-tauri/entitlements.plist             │
│      --sign "Developer ID Application: <NAME> (<TEAM_ID>)"   │
│      Shortify.app                                            │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Notarize                                                  │
│    ditto -c -k --keepParent Shortify.app Shortify.zip        │
│    xcrun notarytool submit Shortify.zip                      │
│      --apple-id $APPLE_ID                                    │
│      --team-id $TEAM_ID                                      │
│      --password $APP_SPECIFIC_PASSWORD                       │
│      --wait                                                  │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Staple                                                    │
│    xcrun stapler staple Shortify.app                         │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. DMG                                                       │
│    create-dmg                                                │
│      --volname "Shortify"                                    │
│      --window-pos 200 120                                    │
│      --window-size 600 400                                   │
│      --icon-size 100                                         │
│      --icon "Shortify.app" 175 190                           │
│      --hide-extension "Shortify.app"                         │
│      --app-drop-link 425 190                                 │
│      Shortify-$VERSION.dmg                                   │
│      Shortify.app                                            │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Sparkle sign + appcast                                    │
│    sign_update Shortify-$VERSION.dmg > sig.txt               │
│    appcast.xml에 새 항목 추가:                                │
│      <enclosure url="..." sparkle:edSignature="..."           │
│                 sparkle:version="1.2.3" .../>                │
└────────────────────┬─────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 9. Upload                                                    │
│    gh release create v$VERSION                               │
│      Shortify-$VERSION.dmg                                   │
│      appcast.xml                                             │
└──────────────────────────────────────────────────────────────┘
```

## PyInstaller 설정 (요약)

```python
# sidecar/PyInstaller.spec
a = Analysis(
    ['shortify_sidecar/main.py'],
    pathex=[],
    binaries=[
        # ffmpeg는 Tauri 단계에서 별도 번들 (PyInstaller 안에 넣지 않음)
    ],
    datas=[
        ('shortify_sidecar/db/schema.sql', 'shortify_sidecar/db'),
        ('shortify_sidecar/db/migrations', 'shortify_sidecar/db/migrations'),
        ('shortify_sidecar/prompts', 'shortify_sidecar/prompts'),
    ],
    hiddenimports=[
        'faster_whisper',
        'pydub',
        'fastapi',
        'uvicorn.workers',
    ],
    excludes=['matplotlib', 'tkinter'],  # 번들 크기 감소
)
exe = EXE(
    pyz, a.scripts, [],
    name='shortify-sidecar',
    target_arch='universal2',
    codesign_identity=None,  # codesign은 Tauri build 후 일괄 처리
    onefile=True,
)
```

## Tauri 설정 (`src-tauri/tauri.conf.json` 발췌)

```json
{
  "build": { "beforeBuildCommand": "pnpm vite build", "frontendDist": "../dist" },
  "bundle": {
    "active": true,
    "targets": ["dmg"],
    "macOS": {
      "minimumSystemVersion": "13.0",
      "frameworks": [],
      "providerShortName": "<TEAM_ID>",
      "signingIdentity": "Developer ID Application: <NAME> (<TEAM_ID>)",
      "entitlements": "entitlements.plist"
    },
    "externalBin": ["bin/shortify-sidecar"],
    "resources": [
      "../assets/ffmpeg/ffmpeg",
      "../assets/fonts/**/*",
      "../assets/bgm/**/*",
      "../assets/image_concepts/**/*"
    ]
  },
  "app": {
    "windows": [{ "title": "Shortify", "width": 1200, "height": 800, "minWidth": 900, "minHeight": 600 }]
  }
}
```

## Entitlements (`src-tauri/entitlements.plist`)

Hardened runtime 필수 (notarization 요구사항):

```xml
<plist>
<dict>
  <key>com.apple.security.network.client</key>            <true/>  <!-- 외부 API 호출 -->
  <key>com.apple.security.files.user-selected.read-write</key> <true/>
  <key>com.apple.security.cs.allow-jit</key>              <true/>  <!-- Python JIT 일부 -->
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key> <false/>
  <key>com.apple.security.cs.disable-library-validation</key> <true/>  <!-- ffmpeg dylib -->
</dict>
</plist>
```

## ffmpeg 번들

- 소스: 정적 빌드 (libass, libfreetype, fontconfig 포함된 universal2 바이너리)
- 위치: `assets/ffmpeg/ffmpeg`
- 런타임 경로: `${BUNDLE}/Contents/Resources/ffmpeg`
- 사이드카에 환경변수 `SHORTIFY_FFMPEG`로 전달

## Sparkle 자동 업데이트

```
사용자 Mac
   ▼ 4시간마다
GET https://shortify.example/appcast.xml
   ▼
새 버전 있으면 → 백그라운드 다운로드 → 사용자 동의 → 재시작 + 적용
```

`appcast.xml`은 GitHub Releases에 호스팅. 또는 Cloudflare R2/CDN으로 캐시.

## 버전 정책

- SemVer (`major.minor.patch`)
- `Cargo.toml`, `package.json`, `pyproject.toml` 모두 동일 버전
- 릴리즈 태그: `v1.2.3`
- 빌드 메타: 커밋 해시 (`1.2.3+abc1234`)

## 로컬 개발 빌드

```bash
# 1. 사이드카 dev 모드 (PyInstaller 없이)
cd sidecar && uvicorn shortify_sidecar.main:app --port 51234 --reload

# 2. Tauri dev (사이드카 자동 spawn 비활성, 위 사이드카에 연결)
SHORTIFY_DEV=1 pnpm tauri dev
```

dev 모드는 codesign/notarization 우회 (Gatekeeper 비활성 가정).

## CI 시크릿 (GitHub Actions)

| 시크릿 | 용도 |
|--------|------|
| `APPLE_ID` | Apple Developer 계정 |
| `APP_SPECIFIC_PASSWORD` | App-specific password (notarytool) |
| `TEAM_ID` | Apple Developer Team ID |
| `SIGNING_CERT_BASE64` | Developer ID Application 인증서 (.p12 base64) |
| `SIGNING_CERT_PASSWORD` | 인증서 비밀번호 |
| `SPARKLE_PRIVATE_KEY` | Sparkle EdDSA 개인키 |

## 릴리즈 트리거

`v*` 태그 push → GitHub Actions workflow가 위 1~9 자동 실행.

```bash
git tag v1.2.3
git push origin v1.2.3
```

## 다음 문서

- 보안 → [08-security](./08-security.md)
