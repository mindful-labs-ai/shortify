# Shortify Design Assets

> **원본 작업물 저장소**. 디자인 명세(스펙·가이드)는 [`/wiki/design/`](../wiki/design/) 참고.

이 폴더는 디자인 작업의 **소스 파일**(Figma, Illustrator, Photoshop, SVG 원본 등)과 **export 산출물**을 보관한다. 런타임에 앱 번들에 포함되는 자산은 `assets/` (별도 폴더)이며, 이 폴더는 디자이너의 작업 자산이다.

---

## 폴더 구조

```
design/
├── brand/                # 브랜드 코어 자산
│   ├── logo/             # 로고 원본 (AI/SVG/PNG export)
│   ├── color/            # 컬러 팔레트 시안 · ASE/CLR 파일
│   └── typography/       # 폰트 샘플 · 타이포 시안
├── character/            # 마스코트 / 캐릭터
│   ├── concepts/         # 컨셉 스케치 · 탐색 단계
│   ├── final/            # 확정안 · 포즈/표정 셋
│   └── references/       # 무드보드 · 레퍼런스 이미지
├── ui/                   # 앱 UI 디자인
│   ├── mockups/          # 정적 화면 시안 (PNG/Figma export)
│   ├── prototypes/       # 인터랙션 프로토타입 (Figma 링크 또는 export)
│   └── screens/          # 최종 화면 (개발 인계용)
└── marketing/            # 외부 노출용 자산
    ├── app-icon/         # macOS 앱 아이콘 (.icns 원본 ·  1024x1024 PNG)
    ├── screenshots/      # App Store / 랜딩 페이지 스크린샷
    └── og-images/        # OG / 소셜 미리보기 이미지
```

---

## 명명 규칙

```
<영역>_<주제>_<버전>_<상태>.<ext>
```

예시:
- `brand_logo_v3_final.svg`
- `character_mascot_pose-wave_v1_wip.ai`
- `ui_drop-view_v2_handoff.png`
- `marketing_app-icon_v1_1024.png`

- **버전**: `v1`, `v2` … 큰 변경마다 증가. 마이너 수정은 같은 버전에서 덮어쓴다.
- **상태**: `wip` (작업 중) / `review` (리뷰 대기) / `final` (확정) / `handoff` (개발 인계 완료).

---

## 커밋 규칙

- **원본 (.fig, .ai, .psd, .sketch)**: Git LFS 사용 권장 (현재는 직접 커밋 — 50MB 초과 시 LFS 도입).
- **export (.png, .svg, .pdf)**: 직접 커밋.
- **레퍼런스 이미지**: 저작권 명시 가능한 것만 커밋. 외부 핀터레스트/이미지는 `references/SOURCES.md`에 URL만 기록.

---

## 인덱스

- 폴더별 상세 가이드: [brand](./brand/README.md) · [character](./character/README.md) · [ui](./ui/README.md) · [marketing](./marketing/README.md)
- 디자인 스펙 (마크다운): [`/wiki/design/`](../wiki/design/)
