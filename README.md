# REAL.P Asset Consulting

> 부동산 자산 컨설팅 전문 웹 플랫폼

## 📋 프로젝트 개요

REAL.P는 부동산 투자 및 재개발 컨설팅을 위한 웹 기반 B2B 플랫폼입니다.  
프리미엄 랜딩 페이지와 관리자 대시보드를 통해 효율적인 고객 상담 관리 및 투자 정보 제공을 지원합니다.

- **라이브 URL:** [https://realpasset.netlify.app](https://realpasset.netlify.app)
- **호스팅:** Netlify
- **데이터베이스:** PostgreSQL (Neon DB)

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| **프론트엔드** | HTML + CSS + JavaScript (프레임워크 없음) |
| **백엔드** | Netlify Serverless Functions (Node.js) |
| **데이터베이스** | PostgreSQL (Neon DB) |
| **배포** | Netlify (GitHub 연동 자동 배포) |
| **폰트** | Pretendard (Google Fonts) |

---

## 📁 프로젝트 구조

```
realp/
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
│   ├── admin.js            # 대시보드 로직
│   └── admin.css           # 대시보드 스타일
│
├── netlify/functions/      # 서버리스 함수 (API)
│   ├── utils/db.js         # 공통 DB 연결 유틸리티
│   ├── admin-auth.js       # 어드민 로그인 인증
│   ├── admin-inquiries.js  # 문의 내역 관리
│   ├── admin-inquiry-pages.js # 문의 페이지/필드 CRUD
│   ├── admin-regions.js    # 권역 CRUD (어드민용)
│   ├── inquiry-pages.js    # 문의 페이지 조회
│   ├── regions.js          # 권역 조회
│   └── submit-inquiry.js   # 문의 폼 제출
│
├── scripts/                # DB 스크립트
│   ├── sync_db.js          # 전체 스키마 동기화
│   ├── db_init_admin.js    # 어드민 계정 초기화
│   ├── check_db.js         # DB 상태 확인
│   ├── load-env.js         # 환경변수 로더
│   ├── start-netlify.js    # 로컬 개발 서버
│   ├── migrate_users.js    # users 테이블 마이그레이션
│   ├── migrate_inquiry_pages.js  # inquiry_pages 테이블 생성
│   └── migrate_fix_inquiries.js  # inquiries 테이블 수정
│
├── assets/                 # 이미지, SVG 등 정적 자원
└── docs/                   # 프로젝트 문서
```

---

## 🚀 시작하기

### 사전 요구사항

- Node.js v18+
- PostgreSQL (Neon DB) 계정

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
# DATABASE_URL=postgresql://...

# DB 스키마 동기화
npm run db:sync

# 어드민 계정 초기화
npm run db:init-admin

# 로컬 개발 서버 시작
npm run dev
# → http://localhost:8888
```

### 주요 스크립트

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | 로컬 개발 서버 시작 (포트 8888) |
| `npm run db:check` | DB 연결 및 테이블 상태 확인 |
| `npm run db:sync` | DB 스키마 전체 동기화 |
| `npm run db:init-admin` | 관리자 계정 초기화/업데이트 |

---

## 📊 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|---|---|---|
| `/.netlify/functions/admin-auth` | POST | 어드민 로그인 |
| `/.netlify/functions/admin-inquiries` | GET, PATCH | 문의 내역 조회/상태변경 |
| `/.netlify/functions/admin-regions` | GET, POST, PATCH, DELETE | 권역 CRUD |
| `/.netlify/functions/admin-inquiry-pages` | GET, POST, PATCH, DELETE | 문의 페이지/필드 CRUD |
| `/.netlify/functions/regions` | GET | 권역 목록 조회 |
| `/.netlify/functions/inquiry-pages` | GET | 문의 페이지 조회 |
| `/.netlify/functions/submit-inquiry` | POST | 문의 폼 제출 |

---

## 🔧 관리자 대시보드

관리자 대시보드(`/admin`)에서 다음 기능을 사용할 수 있습니다:

1. **📋 문의 관리** — 접수된 문의 내역 조회, 상태 변경, CSV 다운로드
2. **📝 문의 페이지 관리** — 문의 페이지 추가/수정/삭제, 폼 필드 관리
3. **🏙️ 투자정보 관리** — 권역 카드 추가/수정/삭제, 순서/활성 관리
4. **⚙️ 설정** — 시스템 정보

---

## 🔒 환경변수

| 변수명 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 접속 URL (Neon DB) |

> ⚠️ `.env` 파일은 `.gitignore`에 포함되어 있습니다. 절대 GitHub에 올리지 마세요.  
> Netlify 배포 시에는 Netlify 대시보드의 Environment Variables에서 `DATABASE_URL`을 설정하세요.

---

## 📌 Git 브랜치 정책

- 로컬: `master` → 원격: `main`
- Push 명령: `git push origin master:main`

---

## 📝 라이선스

ISC
