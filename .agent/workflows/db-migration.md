---
description: REAL.P 프로젝트 DB 마이그레이션 실행 방법
---

# DB 마이그레이션 워크플로우

## 데이터베이스 정보
- **DB:** PostgreSQL (Neon DB)
- **연결 문자열:** `postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

## 마이그레이션 스크립트 위치
`D:\realp\scripts\` 디렉토리

### 기존 스크립트
| 파일 | 설명 |
|---|---|
| `db_init_admin.js` | 어드민 계정 초기화 |
| `migrate_users.js` | users 테이블 생성 |
| `migrate_inquiry_pages.js` | inquiry_pages, inquiry_fields 테이블 생성 + 기본 데이터 시딩 |
| `migrate_fix_inquiries.js` | inquiries 테이블 수정 (message nullable, type VARCHAR) |

## 마이그레이션 실행

// turbo
1. 스크립트 실행
```bash
node scripts/<마이그레이션_파일명>.js
```

## 새 마이그레이션 작성 규칙

1. `D:\realp\scripts\` 에 `migrate_<설명>.js` 파일 생성
2. DB URL은 항상 동일한 패턴 사용:
```javascript
const { Client } = require('pg');
const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: dbUrl });
```
3. 반드시 `try/catch/finally` 패턴으로 `client.end()` 호출
4. 콘솔에 진행 상황 로그 출력

## 주의사항
- 마이그레이션 실행 후 Push하면 Netlify에 자동 반영됨
- ENUM 타입 추가/변경 시 주의 (현재 inquiries.type은 VARCHAR로 변환됨)
- `pg` 패키지는 이미 package.json에 포함
