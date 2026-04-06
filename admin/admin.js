let allInquiries = [];
let allRegions = [];
let deleteRegionId = null;
let allPages = [];
let genericDeleteCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    // ─── Auth Check ───
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminName').textContent = user.name;

    // ─── Logout ───
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    });

    // ─── CSV Download ───
    document.getElementById('downloadCsvBtn').addEventListener('click', () => {
        downloadCSV();
    });

    // ─── Tab Navigation ───
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            switchTab(tabId);
        });
    });

    // ─── Region Modal ───
    document.getElementById('addRegionBtn').addEventListener('click', () => openRegionModal());
    document.getElementById('modalCloseBtn').addEventListener('click', () => closeRegionModal());
    document.getElementById('modalCancelBtn').addEventListener('click', () => closeRegionModal());
    document.getElementById('regionForm').addEventListener('submit', handleRegionSave);

    // ─── Delete Modal ───
    document.getElementById('deleteCloseBtn').addEventListener('click', () => closeDeleteModal());
    document.getElementById('deleteCancelBtn').addEventListener('click', () => closeDeleteModal());
    document.getElementById('deleteConfirmBtn').addEventListener('click', handleRegionDelete);

    // ─── Page Modal ───
    document.getElementById('addPageBtn').addEventListener('click', () => openPageModal());
    document.getElementById('pageModalCloseBtn').addEventListener('click', () => closePageModal());
    document.getElementById('pageModalCancelBtn').addEventListener('click', () => closePageModal());
    document.getElementById('pageForm').addEventListener('submit', handlePageSave);

    // ─── Field Modal ───
    document.getElementById('fieldModalCloseBtn').addEventListener('click', () => closeFieldModal());
    document.getElementById('fieldModalCancelBtn').addEventListener('click', () => closeFieldModal());
    document.getElementById('fieldForm').addEventListener('submit', handleFieldSave);
    document.getElementById('fieldType').addEventListener('change', (e) => {
        document.getElementById('fieldOptionsGroup').style.display = e.target.value === 'select' ? '' : 'none';
    });

    // ─── Generic Delete Modal ───
    document.getElementById('genericDeleteCloseBtn').addEventListener('click', () => closeGenericDeleteModal());
    document.getElementById('genericDeleteCancelBtn').addEventListener('click', () => closeGenericDeleteModal());
    document.getElementById('genericDeleteConfirmBtn').addEventListener('click', () => {
        if (genericDeleteCallback) genericDeleteCallback();
    });

    // Close modals on overlay click
    document.getElementById('regionModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeRegionModal();
    });
    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDeleteModal();
    });
    document.getElementById('pageModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePageModal();
    });
    document.getElementById('fieldModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeFieldModal();
    });
    document.getElementById('genericDeleteModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeGenericDeleteModal();
    });

    // ─── Initial Load ───
    loadInquiries();
});

// ═══════════════════════════════════════════
// Tab System
// ═══════════════════════════════════════════

function switchTab(tabId) {
    // Update nav
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    // Update header
    const titles = {
        inquiries: '문의 내역 관리',
        'inquiry-pages': '문의 페이지 관리',
        regions: '투자정보 관리',
        settings: '설정'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || '';

    // Show/hide CSV download button
    document.getElementById('downloadCsvBtn').style.display = tabId === 'inquiries' ? '' : 'none';

    // Load data for tabs
    if (tabId === 'regions') {
        loadRegions();
    } else if (tabId === 'inquiry-pages') {
        loadInquiryPages();
    }
}

// ═══════════════════════════════════════════
// Inquiries (existing logic preserved)
// ═══════════════════════════════════════════

async function loadInquiries() {
    try {
        const response = await fetch('/.netlify/functions/admin-inquiries');
        const inquiries = await response.json();
        allInquiries = inquiries;
        
        const tableBody = document.getElementById('inquiryTable');
        tableBody.innerHTML = '';
        
        let stats = { total: 0, pending: 0, contacted: 0, completed: 0 };
        
        inquiries.forEach(inquiry => {
            stats.total++;
            if (inquiry.status === 'PENDING') stats.pending++;
            else if (inquiry.status === 'CONTACTED') stats.contacted++;
            else if (inquiry.status === 'COMPLETED') stats.completed++;

            const row = document.createElement('tr');
            
            const areaInfo = inquiry.type === 'INVESTMENT' 
                ? `${inquiry.region} / ${inquiry.budget}` 
                : (inquiry.sector || '-');
            
            const date = new Date(inquiry.created_at).toLocaleString('ko-KR');

            row.innerHTML = `
                <td><span class="status-badge ${inquiry.type === 'INVESTMENT' ? 'status-contacted' : 'status-completed'}">${inquiry.type}</span></td>
                <td><strong>${inquiry.name}</strong></td>
                <td>${inquiry.phone}</td>
                <td>${areaInfo}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${inquiry.message}">${inquiry.message}</td>
                <td>${date}</td>
                <td><span class="status-badge status-${inquiry.status.toLowerCase()}">${inquiry.status}</span></td>
                <td>
                    <select class="action-btn" onchange="updateInquiryStatus('${inquiry.id}', this.value)">
                        <option value="PENDING" ${inquiry.status === 'PENDING' ? 'selected' : ''}>대기</option>
                        <option value="CONTACTED" ${inquiry.status === 'CONTACTED' ? 'selected' : ''}>연락완료</option>
                        <option value="COMPLETED" ${inquiry.status === 'COMPLETED' ? 'selected' : ''}>완료</option>
                        <option value="CANCELLED" ${inquiry.status === 'CANCELLED' ? 'selected' : ''}>취소</option>
                    </select>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update stats
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('contactedCount').textContent = stats.contacted;
        document.getElementById('completedCount').textContent = stats.completed;

    } catch (err) {
        console.error('Error loading inquiries:', err);
    }
}

async function updateInquiryStatus(id, newStatus) {
    try {
        const response = await fetch('/.netlify/functions/admin-inquiries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        
        if (response.ok) {
            loadInquiries();
        } else {
            const error = await response.json();
            alert('상태 변경 실패: ' + error.error);
        }
    } catch (err) {
        console.error('Error updating status:', err);
        alert('서버 통신 오류가 발생했습니다.');
    }
}

// ═══════════════════════════════════════════
// CSV Download
// ═══════════════════════════════════════════

function downloadCSV() {
    if (allInquiries.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }

    const headers = ['유형', '성함', '연락처', '이메일', '관심지역', '예산', '업종', '상담내용', '상태', '신청일시'];
    
    const rows = allInquiries.map(inquiry => {
        const date = new Date(inquiry.created_at).toLocaleString('ko-KR');
        return [
            inquiry.type || '',
            inquiry.name || '',
            inquiry.phone || '',
            inquiry.email || '',
            inquiry.region || '',
            inquiry.budget || '',
            inquiry.sector || '',
            `"${(inquiry.message || '').replace(/"/g, '""')}"`,
            inquiry.status || '',
            date
        ];
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `REALP_문의내역_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
// Regions CRUD
// ═══════════════════════════════════════════

async function loadRegions() {
    const tableBody = document.getElementById('regionsTable');
    
    // Skeleton loading
    tableBody.innerHTML = Array(3).fill('').map(() => `
        <tr class="skeleton-row">
            <td><div class="skeleton-line" style="width:30px"></div></td>
            <td><div class="skeleton-line" style="width:56px;height:40px;border-radius:6px"></div></td>
            <td><div class="skeleton-line" style="width:80px"></div></td>
            <td><div class="skeleton-line" style="width:90px"></div></td>
            <td><div class="skeleton-line" style="width:200px"></div></td>
            <td><div class="skeleton-line" style="width:36px;height:20px;border-radius:10px"></div></td>
            <td><div class="skeleton-line" style="width:100px"></div></td>
        </tr>
    `).join('');

    try {
        const response = await fetch('/.netlify/functions/admin-regions');
        const regions = await response.json();
        allRegions = regions;

        tableBody.innerHTML = '';

        if (regions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                            <p>등록된 권역이 없습니다.<br>위의 "권역 추가" 버튼을 클릭하여 첫 번째 권역을 추가하세요.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        regions.forEach(region => {
            const row = document.createElement('tr');
            row.style.opacity = region.is_active ? '1' : '0.5';

            const imgCell = region.image_url
                ? `<img src="../${region.image_url}" alt="${region.name}" class="region-thumb" onerror="this.outerHTML='<div class=\\'region-thumb-placeholder\\'>N/A</div>'">`
                : `<div class="region-thumb-placeholder">N/A</div>`;

            row.innerHTML = `
                <td>
                    <input type="number" class="sort-input" value="${region.sort_order}" 
                           min="0" data-id="${region.id}" 
                           onchange="updateRegionSort('${region.id}', this.value)">
                </td>
                <td>${imgCell}</td>
                <td><strong>${region.name}</strong><br><span style="color:#9ca3af;font-size:0.75rem">${region.region_key}</span></td>
                <td><span class="status-badge status-contacted">${region.tag}</span></td>
                <td style="max-width:250px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${region.description}">${region.description}</td>
                <td>
                    <label class="toggle-switch mini">
                        <input type="checkbox" ${region.is_active ? 'checked' : ''} 
                               onchange="toggleRegionActive('${region.id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td>
                    <div class="region-actions">
                        <button class="btn-edit" onclick="openRegionModal('${region.id}')">수정</button>
                        <button class="btn-delete-sm" onclick="openDeleteModal('${region.id}', '${region.name}')">삭제</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading regions:', err);
        tableBody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem">데이터를 불러오지 못했습니다.</td></tr>
        `;
    }
}

// ─── Modal: Open (Add / Edit) ───
function openRegionModal(editId) {
    const modal = document.getElementById('regionModal');
    const form = document.getElementById('regionForm');
    const title = document.getElementById('modalTitle');

    form.reset();
    document.getElementById('regionId').value = '';
    document.getElementById('regionIsActive').checked = true;
    document.getElementById('regionSortOrder').value = allRegions.length + 1;

    // Remove previous auto-fill listener if any
    const nameInput = document.getElementById('regionName');
    nameInput.removeEventListener('blur', handleRegionNameAutoFill);

    if (editId) {
        const region = allRegions.find(r => r.id === editId);
        if (!region) return;

        title.textContent = '권역 수정';
        document.getElementById('regionId').value = region.id;
        nameInput.value = region.name;
        document.getElementById('regionKey').value = region.region_key;
        document.getElementById('regionTag').value = region.tag;
        document.getElementById('regionSortOrder').value = region.sort_order;
        document.getElementById('regionImageUrl').value = region.image_url || '';
        document.getElementById('regionDescription').value = region.description;
        document.getElementById('regionIsActive').checked = region.is_active;
    } else {
        title.textContent = '권역 추가';
        // Attach auto-fill listener for new regions
        nameInput.addEventListener('blur', handleRegionNameAutoFill);
    }

    modal.classList.add('show');
}

// ─── Auto-fill description, tag, image when region name is entered ───
function handleRegionNameAutoFill() {
    const nameInput = document.getElementById('regionName');
    const regionName = nameInput.value.trim();
    if (!regionName) return;

    // Extract short key (remove "권역" suffix if present)
    const regionKey = regionName.replace(/\s*권역\s*$/, '').trim();

    // Auto-fill region key if empty
    const keyInput = document.getElementById('regionKey');
    if (!keyInput.value.trim()) {
        keyInput.value = regionKey;
    }

    // Auto-fill tag if empty
    const tagInput = document.getElementById('regionTag');
    if (!tagInput.value.trim()) {
        const tags = [
            'Business Hub', 'Growth Zone', 'Premium District',
            'Transit Hub', 'Riverside Living', 'Urban Core',
            'New Development', 'Mixed-use Hub', 'Emerging Area',
            'Innovation District', 'Residential Prime', 'Commercial Center'
        ];
        tagInput.value = tags[Math.floor(Math.random() * tags.length)];
    }

    // Auto-fill image if empty
    const imageInput = document.getElementById('regionImageUrl');
    if (!imageInput.value.trim()) {
        imageInput.value = 'assets/default-region.png';
    }

    // Auto-fill description if empty
    const descInput = document.getElementById('regionDescription');
    if (!descInput.value.trim()) {
        const templates = [
            `${regionKey} 일대의 대규모 개발 호재와 교통 인프라 확충으로, 안정적인 수익과 높은 성장성을 동시에 기대할 수 있는 프리미엄 투자 권역`,
            `${regionKey} 지역은 풍부한 생활 인프라와 우수한 교통 접근성을 갖추고 있어, 실수요와 투자 수요가 동시에 집중되는 핵심 거점`,
            `도시 재정비 사업과 신규 랜드마크 조성이 예정된 ${regionKey}, 미래 가치 상승이 기대되는 전략적 투자 권역`,
            `${regionKey} 권역은 직주근접 환경과 상업·업무 기능이 집약된 복합 도심으로, 꾸준한 임대 수요와 자산 가치를 보장하는 유망 지역`,
            `광역 교통망과 생활 편의시설이 어우러진 ${regionKey}, 높은 거주 만족도와 투자 안정성을 겸비한 차세대 핵심 권역`
        ];
        descInput.value = templates[Math.floor(Math.random() * templates.length)];
    }
}

function closeRegionModal() {
    document.getElementById('regionModal').classList.remove('show');
}

// ─── Save (Create / Update) ───
async function handleRegionSave(e) {
    e.preventDefault();

    const id = document.getElementById('regionId').value;
    const payload = {
        name: document.getElementById('regionName').value.trim(),
        region_key: document.getElementById('regionKey').value.trim(),
        tag: document.getElementById('regionTag').value.trim(),
        sort_order: parseInt(document.getElementById('regionSortOrder').value) || 0,
        image_url: document.getElementById('regionImageUrl').value.trim() || null,
        description: document.getElementById('regionDescription').value.trim(),
        is_active: document.getElementById('regionIsActive').checked
    };

    const saveBtn = document.getElementById('modalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
        let response;
        if (id) {
            // Update
            response = await fetch('/.netlify/functions/admin-regions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload })
            });
        } else {
            // Create
            response = await fetch('/.netlify/functions/admin-regions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            closeRegionModal();
            loadRegions();
        } else {
            const err = await response.json();
            alert('저장 실패: ' + (err.error || '알 수 없는 오류'));
        }
    } catch (err) {
        console.error('Error saving region:', err);
        alert('서버 통신 오류가 발생했습니다.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

// ─── Toggle Active ───
async function toggleRegionActive(id, isActive) {
    try {
        const response = await fetch('/.netlify/functions/admin-regions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: isActive })
        });

        if (response.ok) {
            loadRegions();
        } else {
            const err = await response.json();
            alert('상태 변경 실패: ' + (err.error || '알 수 없는 오류'));
            loadRegions(); // Revert UI
        }
    } catch (err) {
        console.error('Error toggling region:', err);
        alert('서버 통신 오류가 발생했습니다.');
        loadRegions();
    }
}

// ─── Update Sort Order ───
async function updateRegionSort(id, newOrder) {
    try {
        const response = await fetch('/.netlify/functions/admin-regions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, sort_order: parseInt(newOrder) || 0 })
        });

        if (response.ok) {
            loadRegions();
        }
    } catch (err) {
        console.error('Error updating sort order:', err);
    }
}

// ─── Delete Modal ───
function openDeleteModal(id, name) {
    deleteRegionId = id;
    document.getElementById('deleteRegionName').textContent = name;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    deleteRegionId = null;
    document.getElementById('deleteModal').classList.remove('show');
}

async function handleRegionDelete() {
    if (!deleteRegionId) return;

    const btn = document.getElementById('deleteConfirmBtn');
    btn.disabled = true;
    btn.textContent = '삭제 중...';

    try {
        const response = await fetch('/.netlify/functions/admin-regions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteRegionId })
        });

        if (response.ok) {
            closeDeleteModal();
            loadRegions();
        } else {
            const err = await response.json();
            alert('삭제 실패: ' + (err.error || '알 수 없는 오류'));
        }
    } catch (err) {
        console.error('Error deleting region:', err);
        alert('서버 통신 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
        btn.textContent = '삭제';
    }
}

// ═══════════════════════════════════════════
// Inquiry Pages CRUD
// ═══════════════════════════════════════════

const FIELD_TYPE_LABELS = {
    text: '텍스트',
    tel: '전화번호',
    email: '이메일',
    number: '숫자',
    select: '선택',
    textarea: '긴 텍스트'
};

async function loadInquiryPages() {
    const container = document.getElementById('inquiryPagesContainer');
    container.innerHTML = `
        <div class="stat-card" style="text-align:center; padding:3rem">
            <div class="skeleton-line" style="width:200px;margin:0 auto 1rem"></div>
            <div class="skeleton-line" style="width:300px;margin:0 auto"></div>
        </div>`;

    try {
        const response = await fetch('/.netlify/functions/admin-inquiry-pages');
        const pages = await response.json();
        allPages = pages;

        if (pages.length === 0) {
            container.innerHTML = `
                <div class="stat-card" style="text-align:center; padding:3rem">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;opacity:0.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <p style="color:#9ca3af">"문의 페이지 추가" 버튼을 클릭하여<br>첫 번째 문의 페이지를 만들어 보세요.</p>
                </div>`;
            return;
        }

        container.innerHTML = '';
        pages.forEach(page => {
            const card = document.createElement('div');
            card.className = 'page-card';
            card.style.opacity = page.is_active ? '1' : '0.6';

            const fieldsHtml = (page.fields || []).map(field => {
                const opts = field.options || [];
                const parsedOpts = typeof opts === 'string' ? JSON.parse(opts) : opts;
                const optionsDisplay = parsedOpts.length > 0
                    ? `<span class="field-options-preview" title="${parsedOpts.join(', ')}">${parsedOpts.length}개 옵션</span>`
                    : '';

                return `
                    <tr>
                        <td><input type="number" class="sort-input" value="${field.sort_order}" min="0"
                                   onchange="updateFieldSort('${field.id}', this.value)"></td>
                        <td><strong>${field.field_label}</strong><br><span style="color:#9ca3af;font-size:0.75rem">${field.field_name}</span></td>
                        <td><span class="field-type-badge">${FIELD_TYPE_LABELS[field.field_type] || field.field_type}</span></td>
                        <td style="color:#6b7280;font-size:0.8125rem">${field.placeholder || '-'}</td>
                        <td>${field.is_required ? '<span class="status-badge status-contacted">필수</span>' : '<span class="status-badge status-cancelled">선택</span>'} ${optionsDisplay}</td>
                        <td>
                            <div class="region-actions">
                                <button class="btn-edit" onclick="openFieldModal('${page.id}', '${field.id}')">수정</button>
                                <button class="btn-delete-sm" onclick="confirmDeleteField('${field.id}', '${field.field_label}')">삭제</button>
                            </div>
                        </td>
                    </tr>`;
            }).join('');

            card.innerHTML = `
                <div class="page-card-header">
                    <div class="page-card-info">
                        <div class="page-card-title-row">
                            <h3>${page.title}</h3>
                            <span class="status-badge ${page.is_active ? 'status-contacted' : 'status-cancelled'}">${page.is_active ? '활성' : '비활성'}</span>
                            <span class="status-badge status-completed">${page.inquiry_type}</span>
                        </div>
                        <div class="page-card-meta">
                            <span>슬러그: <code>/${page.slug}</code></span>
                            <span>배지: ${page.badge_text || '-'}</span>
                            <span>필드: ${(page.fields || []).length}개</span>
                        </div>
                        ${page.subtitle ? `<p class="page-card-subtitle">${page.subtitle}</p>` : ''}
                    </div>
                    <div class="page-card-actions">
                        <button class="btn-edit" onclick="openPageModal('${page.id}')">수정</button>
                        <button class="btn-delete-sm" onclick="confirmDeletePage('${page.id}', '${page.title}')">삭제</button>
                        <button class="add-field-btn" onclick="openFieldModal('${page.id}')">+ 항목 추가</button>
                    </div>
                </div>
                <div class="page-card-fields">
                    ${(page.fields || []).length > 0 ? `
                        <table class="fields-table">
                            <thead>
                                <tr>
                                    <th style="width:60px">순서</th>
                                    <th>항목명</th>
                                    <th style="width:90px">유형</th>
                                    <th>플레이스홀더</th>
                                    <th style="width:130px">속성</th>
                                    <th style="width:130px">관리</th>
                                </tr>
                            </thead>
                            <tbody>${fieldsHtml}</tbody>
                        </table>
                    ` : `<p class="empty-fields">등록된 항목이 없습니다. "항목 추가" 버튼으로 폼 필드를 추가하세요.</p>`}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading inquiry pages:', err);
        container.innerHTML = `<div class="stat-card" style="text-align:center;color:#ef4444;padding:2rem">데이터를 불러오지 못했습니다.</div>`;
    }
}

// ─── Page Modal ───
function openPageModal(editId) {
    const modal = document.getElementById('pageModal');
    const form = document.getElementById('pageForm');
    const title = document.getElementById('pageModalTitle');

    form.reset();
    document.getElementById('pageId').value = '';
    document.getElementById('pageIsActive').checked = true;
    document.getElementById('pageBadge').value = 'Contact Us';
    document.getElementById('pageSortOrder').value = allPages.length + 1;

    if (editId) {
        const page = allPages.find(p => p.id === editId);
        if (!page) return;

        title.textContent = '문의 페이지 수정';
        document.getElementById('pageId').value = page.id;
        document.getElementById('pageTitle').value = page.title;
        document.getElementById('pageSlug').value = page.slug;
        document.getElementById('pageBadge').value = page.badge_text || '';
        document.getElementById('pageInquiryType').value = page.inquiry_type || 'GENERAL';
        document.getElementById('pageSubtitle').value = page.subtitle || '';
        document.getElementById('pageDescription').value = page.description || '';
        document.getElementById('pageSortOrder').value = page.sort_order;
        document.getElementById('pageIsActive').checked = page.is_active;
    } else {
        title.textContent = '문의 페이지 추가';
    }

    modal.classList.add('show');
}

function closePageModal() {
    document.getElementById('pageModal').classList.remove('show');
}

async function handlePageSave(e) {
    e.preventDefault();

    const id = document.getElementById('pageId').value;
    const payload = {
        title: document.getElementById('pageTitle').value.trim(),
        slug: document.getElementById('pageSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        badge_text: document.getElementById('pageBadge').value.trim(),
        inquiry_type: document.getElementById('pageInquiryType').value,
        subtitle: document.getElementById('pageSubtitle').value.trim(),
        description: document.getElementById('pageDescription').value.trim(),
        sort_order: parseInt(document.getElementById('pageSortOrder').value) || 0,
        is_active: document.getElementById('pageIsActive').checked
    };

    const saveBtn = document.getElementById('pageModalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
        let response;
        if (id) {
            response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload })
            });
        } else {
            response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            closePageModal();
            loadInquiryPages();
        } else {
            const err = await response.json();
            alert('저장 실패: ' + (err.error || '알 수 없는 오류'));
        }
    } catch (err) {
        console.error('Error saving page:', err);
        alert('서버 통신 오류가 발생했습니다.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

// ─── Field Modal ───
function openFieldModal(pageId, editFieldId) {
    const modal = document.getElementById('fieldModal');
    const form = document.getElementById('fieldForm');
    const title = document.getElementById('fieldModalTitle');

    form.reset();
    document.getElementById('fieldId').value = '';
    document.getElementById('fieldPageId').value = pageId;
    document.getElementById('fieldRequired').checked = true;
    document.getElementById('fieldOptionsGroup').style.display = 'none';

    // Find the page to determine sort order
    const page = allPages.find(p => p.id === pageId);
    document.getElementById('fieldSortOrder').value = page ? (page.fields || []).length + 1 : 1;

    if (editFieldId) {
        const field = page && page.fields ? page.fields.find(f => f.id === editFieldId) : null;
        if (!field) return;

        title.textContent = '항목 수정';
        document.getElementById('fieldId').value = field.id;
        document.getElementById('fieldLabel').value = field.field_label;
        document.getElementById('fieldName').value = field.field_name;
        document.getElementById('fieldType').value = field.field_type;
        document.getElementById('fieldPlaceholder').value = field.placeholder || '';
        document.getElementById('fieldSortOrder').value = field.sort_order;
        document.getElementById('fieldRequired').checked = field.is_required;

        if (field.field_type === 'select') {
            document.getElementById('fieldOptionsGroup').style.display = '';
            const opts = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || []);
            document.getElementById('fieldOptions').value = opts.join('\n');
        }
    } else {
        title.textContent = '항목 추가';
    }

    modal.classList.add('show');
}

function closeFieldModal() {
    document.getElementById('fieldModal').classList.remove('show');
}

async function handleFieldSave(e) {
    e.preventDefault();

    const id = document.getElementById('fieldId').value;
    const pageId = document.getElementById('fieldPageId').value;
    const fieldType = document.getElementById('fieldType').value;

    const optionsText = document.getElementById('fieldOptions').value.trim();
    const options = fieldType === 'select'
        ? optionsText.split('\n').map(o => o.trim()).filter(o => o)
        : [];

    const payload = {
        page_id: pageId,
        field_name: document.getElementById('fieldName').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        field_label: document.getElementById('fieldLabel').value.trim(),
        field_type: fieldType,
        placeholder: document.getElementById('fieldPlaceholder').value.trim(),
        sort_order: parseInt(document.getElementById('fieldSortOrder').value) || 0,
        is_required: document.getElementById('fieldRequired').checked,
        options
    };

    const saveBtn = document.getElementById('fieldModalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
        let response;
        if (id) {
            response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_field', id, ...payload })
            });
        } else {
            response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_field', ...payload })
            });
        }

        if (response.ok) {
            closeFieldModal();
            loadInquiryPages();
        } else {
            const err = await response.json();
            alert('저장 실패: ' + (err.error || '알 수 없는 오류'));
        }
    } catch (err) {
        console.error('Error saving field:', err);
        alert('서버 통신 오류가 발생했습니다.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

async function updateFieldSort(fieldId, newOrder) {
    try {
        await fetch('/.netlify/functions/admin-inquiry-pages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_field', id: fieldId, sort_order: parseInt(newOrder) || 0 })
        });
        loadInquiryPages();
    } catch (err) {
        console.error('Error updating field sort:', err);
    }
}

// ─── Generic Delete ───
function openGenericDeleteModal(title, name, callback) {
    document.getElementById('genericDeleteTitle').textContent = title;
    document.getElementById('genericDeleteName').textContent = name;
    genericDeleteCallback = callback;
    document.getElementById('genericDeleteModal').classList.add('show');
}

function closeGenericDeleteModal() {
    genericDeleteCallback = null;
    document.getElementById('genericDeleteModal').classList.remove('show');
}

function confirmDeletePage(pageId, pageName) {
    openGenericDeleteModal('문의 페이지 삭제', pageName, async () => {
        const btn = document.getElementById('genericDeleteConfirmBtn');
        btn.disabled = true;
        btn.textContent = '삭제 중...';
        try {
            const response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pageId })
            });
            if (response.ok) {
                closeGenericDeleteModal();
                loadInquiryPages();
            } else {
                const err = await response.json();
                alert('삭제 실패: ' + (err.error || '알 수 없는 오류'));
            }
        } catch (err) {
            console.error('Error deleting page:', err);
            alert('서버 통신 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            btn.textContent = '삭제';
        }
    });
}

function confirmDeleteField(fieldId, fieldLabel) {
    openGenericDeleteModal('항목 삭제', fieldLabel, async () => {
        const btn = document.getElementById('genericDeleteConfirmBtn');
        btn.disabled = true;
        btn.textContent = '삭제 중...';
        try {
            const response = await fetch('/.netlify/functions/admin-inquiry-pages', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_field', id: fieldId })
            });
            if (response.ok) {
                closeGenericDeleteModal();
                loadInquiryPages();
            } else {
                const err = await response.json();
                alert('삭제 실패: ' + (err.error || '알 수 없는 오류'));
            }
        } catch (err) {
            console.error('Error deleting field:', err);
            alert('서버 통신 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            btn.textContent = '삭제';
        }
    });
}
