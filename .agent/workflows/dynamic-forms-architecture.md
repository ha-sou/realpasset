---
description: REAL.P 동적 문의 페이지 및 폼 로직 아키텍처 설명
---

# 동적 문의 폼 아키텍처 (Dynamic Inquiry Forms)

## 개요
REAL.P의 문의 페이지(`contact.html`)는 하드코딩된 HTML 폼이 아니라 데이터베이스(PostgreSQL)의 설정에 따라 동적으로 필드(입력창)를 생성하는 시스템입니다. 이를 통해 관리자가 개발자 없이도 텍스트 입력창, 드롭다운 선택, 체크박스 등을 자유롭게 추가하거나 편집할 수 있습니다.

## 1. 데이터베이스 구조

동적 폼을 구동하기 위해 2개의 테이블이 사용됩니다:

### `inquiry_pages` (문의 페이지 설정)
- **용도:** 고유한 문의 페이지를 정의 (예: "상담 예약", "세미나 신청" 등)
- **URL 연동:** `slug` 값을 기준으로 URL 파라미터(`?page=slug`)를 통해 페이지 식별
- **주요 필드:** `title`, `subtitle`, `description`, `inquiry_type` 등 포함

### `inquiry_fields` (페이지별 폼 필드)
- **용도:** 특정 문의 페이지(`page_id`)에 속하는 개별 입력창(예: 성함, 연락처, 예산 등) 정의
- **주요 속성:**
  - `field_type`: 입력 유형 (`text`, `tel`, `select`, `textarea` 등)
  - `options`: `field_type`이 `select`일 때 표시할 옵션 목록 (JSON 배열 저장)
  - `is_required`: 필수 항목 여부
  - `sort_order`: 화면에 출력되는 순서 지정

## 2. 작동 흐름 (Front-end)

`contact.html` 로딩 시 다음과 같은 순서로 폼이 그려집니다:

1. **파라미터 확인:** URL에서 `?page=contact`와 같이 `slug` 파라미터 추출
2. **API 호출:** `.netlify/functions/inquiry-pages?slug=contact`로 GET 요청
3. **데이터 수신:** DB에서 페이지 정보 및 연결된 `inquiry_fields` 목록(`[]`) 한 번에 조회 반환
4. **HTML 렌더링 (DOM 조작):**
   - 페이지 제목(`h1`), 부제목(`p`) 등 헤더 업데이트
   - `fields` 배열을 순회하며 `field_type`에 맞게 `<input>`, `<select>`, `<textarea>` 동적 생성
   - HTML 폼 영역(`.dynamic-fields-container`)에 엘리먼트 주입
5. **폼 제출:** 
   - 폼 데이터 수집 (FormData 객체 사용)
   - `.netlify/functions/submit-inquiry`로 POST 요청
   - DB `inquiries` 테이블에 일반화된 데이터로 저장 (예상치 못한 필드는 `message` 혹은 별도 `JSON` 형태로 통합)

## 3. 관리자 제어 (Admin Dashboard)

`admin.js`의 문의 페이지 관리 탭(`inquiry-pages`)에서 제어:

- **페이지 CRUD:** 새로운 문의 목적(이벤트/프로모션 용)으로 새 페이지 생성 시 슬러그만 지정하면 즉시 사용 가능
- **필드 CRUD:** 각 페이지별로 '항목 추가' 버튼을 통해 쉽게 설정 (옵션 값은 줄바꿈 단위로 입력받아 배열 변환)
- **UI 순서 변경:** 위/아래 버튼 조작을 통해 DB의 `sort_order` 업데이트로 즉시 프론트엔드 순서 연동

## 4. 백엔드 처리 (`submit-inquiry.js`) 최소화
과거에는 `name`, `phone`, `message` 제약이 엄격했으나, 동적 폼을 수용하기 위해:
- 필수 값 검증 완화 (이름/연락처만 최소 필수, 나머진 허용)
- 스키마가 없는 필드 값들은 별도로 파싱하거나 `message` 형태로 직렬화하여 단일 컬럼 보관 가능
- DB `inquiries` 필드 형식을 `TEXT` 유연/NULL 허용으로 마이그레이션 (`migrate_fix_inquiries.js` 참고)
