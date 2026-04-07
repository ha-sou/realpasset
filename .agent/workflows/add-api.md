---
description: REAL.P 프로젝트에 새 서버리스 API 함수 추가하는 방법
---

# 서버리스 함수 추가 워크플로우

## 함수 위치
`D:\realp\netlify\functions\` 디렉토리

## 기존 함수 목록
| 파일 | 용도 | 메서드 |
|---|---|---|
| `admin-auth.js` | 어드민 로그인 | POST |
| `admin-inquiries.js` | 문의 내역 관리 | GET, PATCH |
| `admin-inquiry-pages.js` | 문의 페이지/필드 CRUD | GET, POST, PATCH, DELETE |
| `admin-regions.js` | 권역 CRUD | GET, POST, PATCH, DELETE |
| `inquiry-pages.js` | 문의 페이지 조회 (공개) | GET |
| `regions.js` | 권역 조회 (공개) | GET |
| `submit-inquiry.js` | 문의 폼 제출 | POST |

## 새 함수 작성 템플릿

```javascript
const { Client } = require('pg');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      // GET 로직
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      // POST 로직
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error: ' + err.message }) };
  } finally {
    await client.end();
  }
};
```

## 필수 규칙

1. **CORS 헤더 필수** — `Access-Control-Allow-Origin: *` 등
2. **OPTIONS 메서드 처리** — preflight 요청 대응
3. **fallback DB URL 필수** — `process.env.DATABASE_URL || '...'` 패턴 사용
4. **`client.end()` 필수** — finally 블록에서 DB 연결 해제
5. **에러 응답에 상세 메시지** — 디버깅 용이하게
6. **함수 파일명** = API 경로 (예: `admin-regions.js` → `/.netlify/functions/admin-regions`)

## 프론트엔드에서 호출

```javascript
const response = await fetch('/.netlify/functions/함수이름', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});
const data = await response.json();
```
