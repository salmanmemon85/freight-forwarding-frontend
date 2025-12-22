// Documents Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadDocumentsData();
    startAutoRefresh();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('currentUser').textContent = 
        `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)} Branch`;
}

// Sample documents data
const documentsData = [
    { 
        docNo: 'DOC001', 
        jobNo: 'JOB001', 
        type: 'invoice', 
        title: 'Commercial Invoice - Electronics',
        customer: 'ABC Industries', 
        date: '2024-01-15', 
        status: 'completed'
    },
    { 
        docNo: 'DOC002', 
        jobNo: 'JOB001', 
        type: 'packing', 
        title: 'Packing List - Electronics Shipment',
        customer: 'ABC Industries', 
        date: '2024-01-15', 
        status: 'completed'
    },
    { 
        docNo: 'DOC003', 
        jobNo: 'JOB001', 
        type: 'bl', 
        title: 'Bill of Lading - MSCU1234567',
        customer: 'ABC Industries', 
        date: '2024-01-16', 
        status: 'pending'
    },
    { 
        docNo: 'DOC004', 
        jobNo: 'JOB002', 
        type: 'certificate', 
        title: 'Certificate of Origin - Textiles',
        customer: 'XYZ Exports', 
        date: '2024-01-14', 
        status: 'completed'
    },
    { 
        docNo: 'DOC005', 
        jobNo: 'JOB003', 
        type: 'customs', 
        title: 'Customs Declaration - Machinery',
        customer: 'Global Trading', 
        date: '2024-01-13', 
        status: 'completed'
    },
    { 
        docNo: 'DOC006', 
        jobNo: 'JOB004', 
        type: 'awb', 
        title: 'Air Waybill - AWB123456789',
        customer: 'Tech Solutions', 
        date: '2024-01-15', 
        status: 'pending'
    }
];

function loadDocumentsData() {
    // Calculate stats
    const pending = documentsData.filter(d => d.status === 'pending').length;
    const blDocs = documentsData.filter(d => d.type === 'bl' || d.type === 'awb').length;
    const customsDocs = documentsData.filter(d => d.type === 'customs' || d.type === 'certificate').length;
    const completed = documentsData.filter(d => d.status === 'completed').length;
    
    document.getElementById('pendingDocs').textContent = pending;
    document.getElementById('blGenerated').textContent = blDocs;
    document.getElementById('customsDocs').textContent = customsDocs;
    document.getElementById('completedDocs').textContent = completed;
    
    // Load table data
    displayDocuments(documentsData);
}

function displayDocuments(documents) {
    const tbody = document.getElementById('documentsTable');
    tbody.innerHTML = '';
    
    documents.forEach(doc => {
        const statusClass = doc.status === 'completed' ? 'success' : 'pending';
        const typeIcon = getDocumentIcon(doc.type);
        
        const row = `
            <tr>
                <td><strong>${doc.docNo}</strong></td>
                <td>${doc.jobNo}</td>
                <td>
                    <div>${typeIcon} ${getDocumentTypeName(doc.type)}</div>
                    <small>${doc.title}</small>
                </td>
                <td>${doc.customer}</td>
                <td>${formatDate(doc.date)}</td>
                <td><span class="status-${statusClass}">${doc.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewDocument('${doc.docNo}')">👁️ View</button>
                    <button class="btn-small" onclick="downloadDocument('${doc.docNo}')">📥 Download</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getDocumentIcon(type) {
    const icons = {
        'invoice': '🧾',
        'packing': '📦',
        'bl': '🚢',
        'awb': '✈️',
        'certificate': '📜',
        'customs': '🏛️',
        'insurance': '🛡️'
    };
    return icons[type] || '📄';
}

function getDocumentTypeName(type) {
    const names = {
        'invoice': 'Commercial Invoice',
        'packing': 'Packing List',
        'bl': 'Bill of Lading',
        'awb': 'Air Waybill',
        'certificate': 'Certificate of Origin',
        'customs': 'Customs Declaration',
        'insurance': 'Insurance Certificate'
    };
    return names[type] || type;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function filterDocuments() {
    const typeFilter = document.getElementById('docTypeFilter').value;
    const searchTerm = document.getElementById('searchDoc').value.toLowerCase();
    
    let filtered = documentsData;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(doc => doc.type === typeFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(doc => 
            doc.docNo.toLowerCase().includes(searchTerm) ||
            doc.jobNo.toLowerCase().includes(searchTerm) ||
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.customer.toLowerCase().includes(searchTerm)
        );
    }
    
    displayDocuments(filtered);
}

function showAddDocument() {
    document.getElementById('addDocumentModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addDocumentModal').style.display = 'none';
    document.getElementById('addDocumentForm').reset();
}

function viewDocument(docNo) {
    const doc = documentsData.find(d => d.docNo === docNo);
    alert(`Document Details:\n\nDoc No: ${doc.docNo}\nJob No: ${doc.jobNo}\nType: ${getDocumentTypeName(doc.type)}\nTitle: ${doc.title}\nCustomer: ${doc.customer}\nDate: ${formatDate(doc.date)}\nStatus: ${doc.status.toUpperCase()}`);
}

function downloadDocument(docNo) {
    alert(`Downloading document ${docNo}...\nPDF generation - Coming Soon!`);
}

function generateBL() {
    alert('B/L Generation:\n\n1. Select Job\n2. Enter vessel details\n3. Add cargo information\n4. Generate PDF\n\nFull B/L generator - Coming Soon!');
}

// Form submission
document.getElementById('addDocumentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newDocument = {
        docNo: generateDocNo(),
        jobNo: document.getElementById('jobNumber').value,
        type: document.getElementById('documentType').value,
        title: document.getElementById('documentTitle').value,
        customer: getCustomerFromJob(document.getElementById('jobNumber').value),
        date: document.getElementById('issueDate').value,
        status: 'pending'
    };
    
    documentsData.unshift(newDocument);
    loadDocumentsData();
    closeModal();
    alert('Document created successfully!');
});

function generateDocNo() {
    const count = documentsData.length + 1;
    return `DOC${count.toString().padStart(3, '0')}`;
}

function getCustomerFromJob(jobNo) {
    const jobCustomers = {
        'JOB001': 'ABC Industries',
        'JOB002': 'XYZ Exports',
        'JOB003': 'Global Trading'
    };
    return jobCustomers[jobNo] || 'Unknown Customer';
}

function startAutoRefresh() {
    setInterval(loadDocumentsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addDocumentModal');
    if (event.target === modal) {
        closeModal();
    }
}