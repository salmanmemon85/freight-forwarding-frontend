// Documents Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadDocumentsData();
    checkJobForDocuments();
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

// Check if coming from job for document upload
function checkJobForDocuments() {
    const jobNo = sessionStorage.getItem('uploadDocsForJob');
    if (jobNo) {
        sessionStorage.removeItem('uploadDocsForJob');
        showUploadDocumentsForJob(jobNo);
    }
}

function loadDocumentsData() {
    // Get jobs from workflow manager
    const jobs = window.workflowManager.getJobs();
    
    // Calculate document stats
    const totalJobs = jobs.length;
    const documentsReceived = jobs.filter(j => j.documentsReceived).length;
    const pendingDocs = jobs.filter(j => j.status === 'in-progress' && !j.documentsReceived).length;
    const completedDocs = jobs.filter(j => j.documentsReceived && j.status !== 'open').length;
    
    document.getElementById('pendingDocs').textContent = pendingDocs;
    document.getElementById('blGenerated').textContent = jobs.filter(j => j.documents && j.documents.mbl).length;
    document.getElementById('customsDocs').textContent = jobs.filter(j => j.documents && j.documents.shippingBill).length;
    document.getElementById('completedDocs').textContent = completedDocs;
    
    // Load table data
    displayDocuments(jobs);
}

function displayDocuments(jobs) {
    const tbody = document.getElementById('documentsTable');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const docStatus = getDocumentStatus(job);
        const statusClass = getJobStatusClass(job.status); // Use job status instead of doc status
        const nextAction = getNextDocAction(job);
        
        const row = `
            <tr>
                <td>
                    <strong>${job.no}</strong>
                    <br><small>QUO: ${job.quotationNo}</small>
                </td>
                <td>${formatDate(job.date)}</td>
                <td>
                    <div><strong>${job.customer}</strong></div>
                    <small>${job.contact}</small>
                </td>
                <td>
                    <div>${job.type} | ${job.mode}</div>
                    <small>${job.origin} → ${job.destination}</small>
                </td>
                <td>
                    <div>${docStatus.received}/${docStatus.total}</div>
                    <small>${docStatus.pending} pending</small>
                </td>
                <td><span class="status-${statusClass}">${job.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewDocuments('${job.no}')">📄 View</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${job.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getDocumentStatus(job) {
    const requiredDocs = ['mbl', 'hbl', 'invoice', 'packingList', 'shippingBill', 'formE'];
    const receivedDocs = job.documents ? Object.keys(job.documents).filter(doc => job.documents[doc]) : [];
    
    return {
        total: requiredDocs.length,
        received: receivedDocs.length,
        pending: requiredDocs.length - receivedDocs.length,
        status: receivedDocs.length === requiredDocs.length ? 'complete' : 
                receivedDocs.length > 0 ? 'partial' : 'pending'
    };
}

function getJobStatusClass(status) {
    switch(status) {
        case 'open': return 'new';
        case 'in-progress': return 'warning';
        case 'documented': return 'success';
        case 'invoiced': return 'info';
        case 'completed': return 'success';
        default: return 'default';
    }
}

function getDocStatusClass(status) {
    switch(status) {
        case 'pending': return 'danger';
        case 'partial': return 'warning';
        case 'complete': return 'success';
        default: return 'default';
    }
}

function getNextDocAction(job) {
    // Check job status instead of document status
    if (job.status === 'documented') {
        return { action: 'viewDocuments', label: '✅ Done' };
    } else if (job.status === 'in-progress') {
        const docStatus = getDocumentStatus(job);
        if (docStatus.status === 'complete') {
            return { action: 'markDocumentsComplete', label: '✅ Complete' };
        } else {
            return { action: 'uploadDocuments', label: '📤 Upload' };
        }
    } else {
        return { action: 'viewDocuments', label: '👁️ View' };
    }
}

// Show document upload modal for specific job
function showUploadDocumentsForJob(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) return;
    
    // Store job reference
    document.getElementById('addDocumentForm').dataset.jobNo = jobNo;
    
    showAddDocument();
    
    alert(`📄 Upload Documents for ${jobNo}\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nCargo: ${job.commodity}\n\n🎯 Required: Upload all B/L and shipping documents`);
}

function showAddDocument() {
    document.getElementById('addDocumentModal').style.display = 'block';
}

function uploadDocuments(jobNo) {
    document.getElementById('addDocumentForm').dataset.jobNo = jobNo;
    showAddDocument();
}

function markDocumentsComplete(jobNo) {
    const data = window.workflowManager.getData();
    const jobIndex = data.jobs.findIndex(j => j.no === jobNo);
    
    if (jobIndex !== -1) {
        console.log('Before update:', data.jobs[jobIndex].status);
        data.jobs[jobIndex].status = 'documented';
        data.jobs[jobIndex].documentsReceived = true;
        data.jobs[jobIndex].documentsCompletedAt = new Date().toISOString();
        window.workflowManager.saveData(data);
        console.log('After update:', data.jobs[jobIndex].status);
        
        // Verify the data was saved
        const savedData = window.workflowManager.getData();
        const savedJob = savedData.jobs.find(j => j.no === jobNo);
        console.log('Saved job status:', savedJob ? savedJob.status : 'Job not found');
    }
    
    alert(`✅ Documents Marked Complete for ${jobNo}\n\n📄 All required documents received\n🎯 Next Step: Go to Jobs page and create invoice`);
    
    // Refresh the page to show updated status
    loadDocumentsData();
}

function viewDocuments(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) return;
    
    const docs = job.documents || {};
    
    let docList = `📄 Documents Status - ${jobNo}\n\n`;
    docList += `👤 Customer: ${job.customer}\n`;
    docList += `🚚 Route: ${job.origin} → ${job.destination}\n\n`;
    
    docList += `📋 Document Checklist:\n`;
    docList += `${docs.mbl ? '✅' : '❌'} MBL/MAWB\n`;
    docList += `${docs.hbl ? '✅' : '❌'} HBL/HAWB\n`;
    docList += `${docs.invoice ? '✅' : '❌'} Shipper Invoice\n`;
    docList += `${docs.packingList ? '✅' : '❌'} Packing List\n`;
    docList += `${docs.shippingBill ? '✅' : '❌'} Shipping Bill\n`;
    docList += `${docs.formE ? '✅' : '❌'} Form E (if required)\n`;
    
    const docStatus = getDocumentStatus(job);
    docList += `\n📊 Status: ${docStatus.received}/${docStatus.total} received`;
    
    alert(docList);
}

function filterDocuments() {
    const statusFilter = document.getElementById('docTypeFilter').value;
    const searchTerm = document.getElementById('searchDoc').value.toLowerCase();
    
    let jobs = window.workflowManager.getJobs();
    
    if (statusFilter !== 'all') {
        jobs = jobs.filter(job => {
            const docStatus = getDocumentStatus(job);
            return docStatus.status === statusFilter;
        });
    }
    
    if (searchTerm) {
        jobs = jobs.filter(job => 
            job.no.toLowerCase().includes(searchTerm) ||
            job.customer.toLowerCase().includes(searchTerm) ||
            job.quotationNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayDocuments(jobs);
}

function closeModal() {
    document.getElementById('addDocumentModal').style.display = 'none';
    document.getElementById('addDocumentForm').reset();
    delete document.getElementById('addDocumentForm').dataset.jobNo;
}

function generateBL() {
    alert('B/L Generation:\n\n1. Select Job\n2. Enter vessel details\n3. Add cargo information\n4. Generate PDF\n\nFull B/L generator - Coming Soon!');
}

// Form submission for document upload
document.getElementById('addDocumentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const jobNo = this.dataset.jobNo;
    if (!jobNo) {
        alert('No job selected!');
        return;
    }
    
    // Simulate document upload (in real app, files would be uploaded to server)
    const documents = {
        mbl: document.getElementById('mblFile').files.length > 0,
        hbl: document.getElementById('hblFile').files.length > 0,
        invoice: document.getElementById('invoiceFile').files.length > 0,
        packingList: document.getElementById('packingFile').files.length > 0,
        shippingBill: document.getElementById('shippingFile').files.length > 0,
        formE: document.getElementById('formEFile').files.length > 0
    };
    
    // Update job with documents
    const data = window.workflowManager.getData();
    const jobIndex = data.jobs.findIndex(j => j.no === jobNo);
    
    if (jobIndex !== -1) {
        data.jobs[jobIndex].documents = {
            ...data.jobs[jobIndex].documents,
            ...documents
        };
        data.jobs[jobIndex].lastDocumentUpdate = new Date().toISOString();
        
        // Check if all required documents are uploaded
        const allDocsUploaded = documents.mbl && documents.hbl && documents.invoice && 
                                documents.packingList && documents.shippingBill;
        
        if (allDocsUploaded) {
            // Automatically mark as documented
            data.jobs[jobIndex].status = 'documented';
            data.jobs[jobIndex].documentsReceived = true;
            data.jobs[jobIndex].documentsCompletedAt = new Date().toISOString();
        }
        
        window.workflowManager.saveData(data);
    }
    
    const uploadedCount = Object.values(documents).filter(Boolean).length;
    
    alert(`✅ Documents Uploaded Successfully!\n\n📄 Job: ${jobNo}\n📤 Uploaded: ${uploadedCount} documents\n\n🎯 ${uploadedCount >= 5 ? 'All documents complete! You can now create invoice.' : 'Upload remaining documents to proceed.'}`);
    
    loadDocumentsData();
    closeModal();
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
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