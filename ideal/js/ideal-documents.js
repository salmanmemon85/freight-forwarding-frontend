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
        const requiredDocs = window.workflowManager.getRequiredDocuments(job.mode);
        const jobDocs = window.workflowManager.getJobDocuments(job.no);
        
        const totalRequired = Object.keys(requiredDocs).length;
        const uploaded = Object.keys(jobDocs).length;
        const pending = totalRequired - uploaded;
        
        const statusClass = getJobStatusClass(job.status);
        const nextAction = getNextDocAction(job, uploaded, totalRequired);
        
        const row = `
            <tr>
                <td>
                    <strong>${job.no}</strong>
                    <br><small>Mode: ${job.mode}</small>
                </td>
                <td>${formatDate(job.date)}</td>
                <td>
                    <div><strong>${job.customer}</strong></div>
                    <small>${job.contact}</small>
                </td>
                <td>
                    <div>${job.mode} | ${job.type}</div>
                    <small>${job.origin} → ${job.destination}</small>
                </td>
                <td>
                    <div>${uploaded}/${totalRequired}</div>
                    <small>${pending} pending</small>
                </td>
                <td><span class="status-${statusClass}">${job.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewJobDocuments('${job.no}')">📄 View</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${job.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getDocumentStatus(job) {
    if (!window.documentsManager) {
        // Fallback to old system
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
    
    // New enhanced system
    const allDocs = window.documentsManager.getAllDocuments();
    const requiredDocs = allDocs.filter(doc => doc.required);
    const receivedDocs = job.documents ? Object.keys(job.documents).filter(doc => job.documents[doc]) : [];
    
    return {
        total: requiredDocs.length,
        received: receivedDocs.length,
        pending: requiredDocs.length - receivedDocs.length,
        status: receivedDocs.length >= requiredDocs.length ? 'complete' : 
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

function getNextDocAction(job, uploaded, totalRequired) {
    if (uploaded === totalRequired) {
        return { action: 'viewJobDocuments', label: '✅ Complete' };
    } else if (uploaded > 0) {
        return { action: 'uploadJobDocuments', label: '📤 Upload More' };
    } else {
        return { action: 'uploadJobDocuments', label: '📤 Upload Docs' };
    }
}

function viewJobDocuments(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    const requiredDocs = window.workflowManager.getRequiredDocuments(job.mode);
    const jobDocs = window.workflowManager.getJobDocuments(jobNo);
    
    let docList = `📄 Documents Status - ${jobNo}\n\n`;
    docList += `👤 Customer: ${job.customer}\n`;
    docList += `🚢 Route: ${job.origin} → ${job.destination}\n`;
    docList += `🚚 Mode: ${job.mode}\n\n`;
    
    docList += `📋 Required Documents:\n`;
    
    Object.keys(requiredDocs).forEach(docType => {
        const doc = requiredDocs[docType];
        const isUploaded = jobDocs[docType] ? '✅' : '❌';
        const requiredText = doc.required ? ' (Required)' : ' (Optional)';
        docList += `${isUploaded} ${doc.name}${requiredText}\n`;
    });
    
    const uploaded = Object.keys(jobDocs).length;
    const total = Object.keys(requiredDocs).length;
    docList += `\n📊 Status: ${uploaded}/${total} documents uploaded`;
    
    alert(docList);
}

function uploadJobDocuments(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    const requiredDocs = window.workflowManager.getRequiredDocuments(job.mode);
    const jobDocs = window.workflowManager.getJobDocuments(jobNo);
    
    let uploadOptions = `📤 Upload Documents - ${jobNo}\n\n`;
    uploadOptions += `Select document type to upload:\n\n`;
    
    Object.keys(requiredDocs).forEach((docType, index) => {
        const doc = requiredDocs[docType];
        const status = jobDocs[docType] ? '✅ Uploaded' : '❌ Pending';
        uploadOptions += `${index + 1}. ${doc.name} - ${status}\n`;
    });
    
    uploadOptions += `\n📝 Choose document number to upload (1-${Object.keys(requiredDocs).length}):`;
    
    const choice = prompt(uploadOptions);
    if (choice && choice >= 1 && choice <= Object.keys(requiredDocs).length) {
        const docType = Object.keys(requiredDocs)[choice - 1];
        const docName = requiredDocs[docType].name;
        
        // Simulate document upload
        const documentData = {
            fileName: `${docName}_${jobNo}.pdf`,
            fileSize: '2.5 MB',
            uploadedBy: 'Current User'
        };
        
        window.workflowManager.updateJobDocuments(jobNo, docType, documentData);
        
        alert(`✅ Document Uploaded Successfully!\n\n📄 Document: ${docName}\n💾 File: ${documentData.fileName}\n📅 Uploaded: ${new Date().toLocaleString()}`);
        
        // Refresh the page
        loadDocumentsData();
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
    const docManager = window.documentsManager;
    
    let docList = `📄 Documents Status - ${jobNo}\n\n`;
    docList += `👤 Customer: ${job.customer}\n`;
    docList += `🚚 Route: ${job.origin} → ${job.destination}\n\n`;
    
    // Show documents by category
    const categories = docManager.getDocumentCategories();
    
    categories.forEach(category => {
        docList += `\n${category.icon} ${category.name.toUpperCase()}:\n`;
        const categoryDocs = docManager.getDocumentsByCategory(category.key);
        
        categoryDocs.forEach(doc => {
            const status = docs[doc.key] ? '✅' : '❌';
            docList += `${status} ${doc.name}\n`;
        });
    });
    
    const allDocs = docManager.getAllDocuments();
    const receivedCount = allDocs.filter(doc => docs[doc.key]).length;
    docList += `\n📊 Status: ${receivedCount}/${allDocs.length} documents received`;
    
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

function showDocumentCategories() {
    if (!window.documentsManager) {
        alert('Document manager not loaded!');
        return;
    }
    
    const summary = window.documentsManager.getDocumentsSummary();
    let categoryList = '📄 SHIPPING DOCUMENTS - COMPLETE GUIDE\n\n';
    
    summary.forEach((cat, index) => {
        categoryList += `${index + 1}️⃣ ${cat.icon} ${cat.name.toUpperCase()}\n`;
        categoryList += `${cat.description || ''}\n`;
        categoryList += `Total: ${cat.totalDocs} docs | Required: ${cat.requiredDocs}\n\n`;
    });
    
    categoryList += '👉 Use "View" button on any job to see detailed document checklist';
    
    alert(categoryList);
}

function generateBL() {
    showDocumentCategories();
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