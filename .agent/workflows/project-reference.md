---
description: REAL.P 프로젝트 구조, 인증 정보, 핵심 설정 등 빠른 참조 가이드
---

# 프로젝트 빠른 참조

## 핵심 정보
- **프로젝트 경로:** `D:\realp`
- **라이브 URL:** https://realpasset.netlify.app
- **어드민:** https://realpasset.netlify.app/admin/login.html
- **어드민 로그인:** ID `realpasset` / PW `s8888885!`
- **GitHub:** https://github.com/ha-sou/realpasset.git
- **Git 설정:** email: `jju9120@naver.com`, name: `hahahasou`
- **Git 브랜치:** 로컬 `master` → 원격 `main`

## DB 연결
```
postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 주요 파일
| 파일 | 설명 |
|---|---|
| `netlify.toml` | Netlify 빌드/배포 설정 (`skip_processing = true` 필수!) |
| `admin/admin.js` | 어드민 대시보드 전체 로직 (948줄) |
| `admin/admin.css` | 어드민 대시보드 스타일 (826줄) |
| `styles.css` | 프론트엔드 메인 스타일 |
| `docs/db_schema.md` | DB 스키마 문서 |
| `docs/project_summary.md` | 프로젝트 전체 요약 |

## 어드민 대시보드 탭 구조
1. `📋 문의 관리` (data-tab="inquiries") — 문의 내역/상태/CSV
2. `📝 문의 페이지 관리` (data-tab="inquiry-pages") — 동적 폼 페이지/필드
3. `🏙️ 투자정보 관리` (data-tab="regions") — 권역 카드
4. `⚙️ 설정` (data-tab="settings") — 시스템 정보

## 페이지 구조
| URL | 파일 | 설명 |
|---|---|---|
| `/` | `index.html` | 메인 랜딩 |
| `/about` | `about.html` | 회사소개 |
| `/services` | `services.html` | 자산 플래닝 |
| `/investment` | `investment.html` | 투자정보 (DB에서 권역 로드) |
| `/invest-form?region=xxx` | `invest-form.html` | 투자 문의 폼 |
| `/contact?page=slug` | `contact.html` | 동적 상담 예약 폼 |

## 주의사항
- **netlify.toml의 `skip_processing = true`는 절대 변경하지 말 것** — 변경하면 JS/CSS 캐시 문제 재발
- **모든 서버리스 함수에 fallback DB URL 필수** — `process.env.DATABASE_URL || '...'`
- **PowerShell에서 `&&` 사용 불가** — 명령어 분리 실행
- **Push는 사용자 요청 시에만**
