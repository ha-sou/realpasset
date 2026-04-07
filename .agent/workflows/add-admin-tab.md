---
description: REAL.P 어드민 대시보드에 새 관리 탭을 추가하는 방법
---

# 어드민 대시보드 탭 추가 워크플로우

## 구조 이해

어드민 대시보드는 3개 파일로 구성:
- `admin/index.html` — HTML 구조 (사이드바, 탭 콘텐츠, 모달)
- `admin/admin.js` — 전체 로직 (탭 전환, CRUD, 모달 제어)
- `admin/admin.css` — 스타일

## 새 탭 추가 절차

### 1. 사이드바에 네비게이션 아이템 추가 (index.html)
```html
<!-- admin/index.html의 .nav-container 안에 추가 -->
<div class="nav-item" data-tab="새탭ID">🆕 새 탭 이름</div>
```

### 2. 탭 콘텐츠 영역 추가 (index.html)
```html
<!-- main.main-content 안에 추가 -->
<div id="tab-새탭ID" class="tab-content">
    <!-- 탭 콘텐츠 -->
</div>
```

### 3. 모달 추가 (index.html, </main> 아래)
```html
<div class="modal-overlay" id="새모달ID">
    <div class="modal">
        <div class="modal-header">
            <h2>모달 제목</h2>
            <button class="modal-close" id="새모달CloseBtn">&times;</button>
        </div>
        <form id="새Form">
            <div class="modal-body">
                <!-- 폼 필드 -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" id="새모달CancelBtn">취소</button>
                <button type="submit" class="btn-save">저장</button>
            </div>
        </form>
    </div>
</div>
```

### 4. switchTab에 제목 추가 (admin.js)
```javascript
const titles = {
    inquiries: '문의 내역 관리',
    'inquiry-pages': '문의 페이지 관리',
    regions: '투자정보 관리',
    settings: '설정',
    '새탭ID': '새 탭 제목'  // ← 추가
};
```

### 5. 데이터 로드 함수 연결 (admin.js의 switchTab)
```javascript
if (tabId === '새탭ID') {
    load새데이터();
}
```

### 6. CRUD 로직 구현 (admin.js)
- `load새데이터()` — 데이터 로드 및 렌더링
- `open새Modal()` / `close새Modal()` — 모달 열기/닫기
- `handle새Save(e)` — 저장 처리
- 삭제는 `openGenericDeleteModal()` 재사용 가능

### 7. 이벤트 리스너 등록 (admin.js의 DOMContentLoaded)
```javascript
document.getElementById('add새Btn').addEventListener('click', () => open새Modal());
document.getElementById('새모달CloseBtn').addEventListener('click', () => close새Modal());
// ...
```

## 모달 CSS 규칙
- 모달은 반드시 `class="modal-overlay"` 사용 (display: none 기본)
- 열기: `.classList.add('show')` / 닫기: `.classList.remove('show')`
- 오버레이 클릭으로 닫기: `e.target === e.currentTarget` 체크

## 기존 패턴 참조
- 권역 관리 탭 (`regions`) — 테이블 기반 CRUD
- 문의 페이지 관리 탭 (`inquiry-pages`) — 카드 기반 중첩 CRUD
