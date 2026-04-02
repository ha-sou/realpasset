document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminName').textContent = user.name;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    });

    // Load Inquiries
    loadInquiries();
});

async function loadInquiries() {
    try {
        const response = await fetch('/.netlify/functions/admin-inquiries');
        const inquiries = await response.json();
        
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
            loadInquiries(); // Reload table and stats
        } else {
            const error = await response.json();
            alert('상태 변경 실패: ' + error.error);
        }
    } catch (err) {
        console.error('Error updating status:', err);
        alert('서버 통신 오류가 발생했습니다.');
    }
}
