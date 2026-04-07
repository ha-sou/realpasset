# REAL.P Asset Consulting - 프로젝트 작업 기록

## 프로젝트 개요
- **사이트명:** REAL.P Asset Consulting (부동산 자산 컨설팅)
- **프로젝트 경로:** `D:\realp`
- **라이브 URL:** https://realpasset.netlify.app
- **GitHub:** https://github.com/ha-sou/realpasset.git (브랜치: master → main)
- **호스팅:** Netlify
- **데이터베이스:** PostgreSQL (Neon DB)
- **DB 연결:** `postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **어드민 로그인:** ID: `realpasset` / PW: `s8888885!`

---

## 기술 스택
- **프론트엔드:** 순수 HTML + CSS + JS (프레임워크 없음)
- **백엔드:** Netlify Serverless Functions (Node.js)
- **DB:** PostgreSQL via Neon DB
- **배포:** Netlify (GitHub 연동 자동 배포)
- **폰트:** Pretendard (Google Fonts)

---

## 프로젝트 구조

```
D:\realp/
├── index.html              # 메인 랜딩 페이지
├── about.html              # 회사소개
├── services.html           # 자산 플래닝
├── investment.html         # 투자정보 (권역별 카드)
├── invest-form.html        # 투자 문의 폼 (권역별)
├── contact.html            # 상담 예약 (동적 폼 - DB 기반)
├── styles.css              # 메인 스타일시트
├── netlify.toml            # Netlify 설정
├── package.json            # Node.js 의존성
│
├── admin/                  # 관리자 대시보드
│   ├── index.html          # 대시보드 메인
│   ├── login.html          # 로그인 페이지
│   ├── admin.js            # 대시보드 로직 (전체)
│   └── admin.css           # 대시보드 스타일
│
├── netlify/functions/      # 서버리스 함수 (API)
│   ├── admin-auth.js       # 어드민 로그인 인증
│   ├── admin-inquiries.js  # 문의 내역 관리 (GET/PATCH)
│   ├── admin-inquiry-pages.js # 문의 페이지/필드 CRUD
│   ├── admin-regions.js    # 권역 CRUD (어드민용)
│   ├── inquiry-pages.js    # 문의 페이지 조회 (프론트엔드용)
│   ├── regions.js          # 권역 조회 (프론트엔드용)
│   └── submit-inquiry.js   # 문의 제출 처리
│
├── scripts/                # DB 마이그레이션 스크립트
│   ├── db_init_admin.js    # 어드민 계정 초기화
│   ├── migrate_users.js    # users 테이블 마이그레이션
│   ├── migrate_inquiry_pages.js  # inquiry_pages/fields 테이블 생성
│   └── migrate_fix_inquiries.js  # inquiries 테이블 수정 (message nullable, type VARCHAR)
│
├── docs/                   # 프로젝트 문서
│   └── db_schema.md        # DB 스키마 문서
│
└── assets/                 # 이미지, SVG 등 정적 자원
```

---

## 데이터베이스 테이블

### 1. `inquiries` - 문의 내역
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 고유 ID |
| type | VARCHAR(50) | GENERAL / INVESTMENT / 커스텀 |
| name | VARCHAR(100) | 성함 |
| phone | VARCHAR(20) | 연락처 |
| sector | VARCHAR(100) | 관심 분야 |
| region | VARCHAR(100) | 관심 지역 |
| budget | VARCHAR(50) | 예산 범위 |
| message | TEXT (nullable) | 상세 내용 |
| status | ENUM | PENDING / CONTACTED / COMPLETED / CANCELLED |
| created_at / updated_at | TIMESTAMP | |

### 2. `regions` - 투자 권역 정보
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 고유 ID |
| name | VARCHAR | 권역명 |
| region_key | VARCHAR (UK) | URL용 키 |
| tag | VARCHAR | 배지 텍스트 |
| description | TEXT | 설명 |
| image_url | VARCHAR | 이미지 경로 |
| is_active | BOOLEAN | 활성 상태 |
| sort_order | INTEGER | 표시 순서 |

### 3. `inquiry_pages` - 동적 문의 페이지
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 고유 ID |
| title | VARCHAR(200) | 페이지 제목 |
| slug | VARCHAR(100) UK | URL 식별자 |
| subtitle | VARCHAR(300) | 부제목 |
| description | TEXT | 설명 |
| badge_text | VARCHAR(50) | 배지 텍스트 |
| inquiry_type | VARCHAR(50) | 문의 유형 |
| is_active | BOOLEAN | 활성 상태 |
| sort_order | INTEGER | 표시 순서 |

### 4. `inquiry_fields` - 동적 폼 필드
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 고유 ID |
| page_id | UUID (FK) | 소속 페이지 |
| field_name | VARCHAR(100) | 영문 키 |
| field_label | VARCHAR(200) | 표시 라벨 |
| field_type | VARCHAR(20) | text/tel/email/select/textarea 등 |
| placeholder | VARCHAR(300) | 플레이스홀더 |
| is_required | BOOLEAN | 필수 여부 |
| options | JSONB | select 옵션 배열 |
| sort_order | INTEGER | 표시 순서 |

### 5. `users` - 관리자 계정
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 고유 ID |
| email/name | VARCHAR | 계정 정보 |
| role | VARCHAR(20) | ADMIN / STAFF |

---

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|---|---|---|
| `/.netlify/functions/admin-auth` | POST | 어드민 로그인 |
| `/.netlify/functions/admin-inquiries` | GET, PATCH | 문의 내역 조회/상태변경 |
| `/.netlify/functions/admin-regions` | GET, POST, PATCH, DELETE | 권역 CRUD |
| `/.netlify/functions/admin-inquiry-pages` | GET, POST, PATCH, DELETE | 문의 페이지/필드 CRUD |
| `/.netlify/functions/regions` | GET | 프론트엔드 권역 조회 |
| `/.netlify/functions/inquiry-pages` | GET | 프론트엔드 문의 페이지 조회 (?slug=xxx) |
| `/.netlify/functions/submit-inquiry` | POST | 문의 폼 제출 |

---

## 어드민 대시보드 탭

1. **📋 문의 관리** - 접수된 문의 내역, 상태 변경, CSV 다운로드
2. **📝 문의 페이지 관리** - 문의 페이지 추가/수정/삭제, 폼 필드 관리
3. **🏙️ 투자정보 관리** - 권역 카드 추가/수정/삭제, 순서/활성 관리
4. **⚙️ 설정** - 시스템 정보

---

## 알려진 이슈 & 해결 기록

### ✅ 해결됨
| 이슈 | 원인 | 해결 |
|---|---|---|
| 라이브에서 모달이 전부 보임 | Netlify 에셋 번들링이 이전 JS/CSS 캐시 사용 | `skip_processing = true` |
| 투자정보 데이터 로드 실패 | `regions.js`, `admin-regions.js`에 fallback DB URL 없음 | fallback URL 추가 |
| 동적 폼 제출 시 DB 에러 | `message TEXT NOT NULL` 제약 | nullable로 변경 |
| 커스텀 문의 타입 불가 | `type` 컬럼이 ENUM | VARCHAR(50)으로 변환 |

### ⚠️ 주의사항
- **Netlify 에셋 처리:** `skip_processing = true`로 설정되어 있음. 다시 활성화하면 JS/CSS 캐시 문제 재발할 수 있음
- **Git 브랜치:** 로컬은 `master`, 원격은 `main`. Push 시 `git push origin master:main`
- **Push 규칙:** 사용자가 요청할 때만 Push할 것

---

## 미푸시 커밋 (2026-04-08 기준)

1. `fix: disable CSS/JS bundling`
2. `fix: disable all asset processing to prevent JS/CSS cache corruption`
3. `fix: DB migration, submit-inquiry flexibility, schema docs update`
4. `fix: add fallback DB URL to regions and admin-regions functions`
