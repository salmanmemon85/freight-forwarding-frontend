// Enhanced Documents Management - Complete Shipping Documents A to Z

document.addEventListener('DOMContentLoaded', function() {
    loadDocumentsData();
    startAutoRefresh();
});

function loadDocumentsData() {
    // Get all jobs and their document status
    const jobs = window.workflowManager.getJobs();
    let totalDocs = 0;
    let completedDocs = 0;
    let pendingDocs = 0;
    let blGenerated = 0;
    
    jobs.forEach(job => {
        const status = window.workflowManager.getDocumentCompletionStatus(job.no);
        totalDocs += status.total;
        completedDocs += status.received;
        pendingDocs += status.pending;
        
        // Count B/L documents
        const documents = window.workflowManager.getJobDocumentChecklist(job.no);
        blGenerated += documents.filter(d => 
            ['mbl', 'hbl', 'mawb', 'hawb'].includes(d.docKey) && d.status === 'received'
        ).length;
    });
    
    document.getElementById('pendingDocs').textContent = pendingDocs;
    document.getElementById('blGenerated').textContent = blGenerated;
    document.getElementById('customsDocs').textContent = Math.floor(completedDocs * 0.3); // Estimate customs docs
    document.getElementById('completedDocs').textContent = completedDocs;
    
    // Load documents by job
    displayDocumentsByJob(jobs);
}

function displayDocumentsByJob(jobs) {
    const tbody = document.getElementById('documentsTable');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const documents = window.workflowManager.getJobDocumentChecklist(job.no);
        const status = window.workflowManager.getDocumentCompletionStatus(job.no);
        
        if (documents.length > 0) {
            // Job header row
            const headerRow = `
                <tr class="job-header-row">
                    <td colspan="7">
                        <div class="job-header">
                            <strong>💼 ${job.no} - ${job.customer}</strong>
                            <span class="document-progress">
                                ${status.received}/${status.total} Documents 
                                (${status.completionRate}% Complete)
                            </span>
                            <button class="btn-small" onclick="viewJobDocuments('${job.no}')">📋 View All</button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += headerRow;
            
            // Show recent documents (limit 3 per job)
            const recentDocs = documents.slice(0, 3);
            recentDocs.forEach(doc => {
                const docInfo = window.documentsManager.getDocumentInfo(doc.docKey);
                const statusClass = getDocumentStatusClass(doc.status);
                
                const row = `
                    <tr class="document-row">
                        <td>${docInfo.categoryIcon} ${doc.docKey.toUpperCase()}</td>
                        <td>${job.no}</td>
                        <td>
                            <div><strong>${docInfo.name}</strong></div>
                            <small>${docInfo.categoryName}</small>
                        </td>
                        <td>${job.customer}</td>
                        <td>${doc.receivedDate ? formatDate(doc.receivedDate) : '-'}</td>
                        <td><span class="status-${statusClass}">${doc.status.toUpperCase()}</span></td>
                        <td>
                            <button class="btn-small" onclick="updateDocumentStatus('${job.no}', '${doc.docKey}')">✏️ Update</button>
                            <button class="btn-small" onclick="viewDocumentDetails('${job.no}', '${doc.docKey}')">👁️ View</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
            
            if (documents.length > 3) {
                const moreRow = `
                    <tr class="more-docs-row">
                        <td colspan="7" style="text-align: center; padding: 10px;">
                            <button class="btn-secondary" onclick="viewJobDocuments('${job.no}')">
                                📄 View ${documents.length - 3} More Documents
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += moreRow;
            }
        }
    });
    
    if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No jobs with documents found</td></tr>';
    }
}

function getDocumentStatusClass(status) {
    switch(status) {
        case 'received': return 'success';
        case 'pending': return 'pending';
        case 'missing': return 'danger';
        default: return 'default';
    }
}

// View all documents for a job
function viewJobDocuments(jobNo) {
    const report = window.workflowManager.generateDocumentReport(jobNo);
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    
    let reportText = `📋 Complete Document Report - ${jobNo}\\n\\n`;
    reportText += `🏢 Customer: ${job.customer}\\n`;
    reportText += `🚢 Mode: ${job.mode} | Type: ${job.type}\\n`;
    reportText += `📊 Progress: ${report.status.received}/${report.status.total} (${report.status.completionRate}%)\\n\\n`;
    
    report.categories.forEach(category => {
        if (category.documents.length > 0) {
            reportText += `${category.icon} ${category.name.toUpperCase()}:\\n`;
            category.documents.forEach(doc => {
                const statusIcon = doc.status === 'received' ? '✅' : 
                                 doc.status === 'pending' ? '⏳' : '❌';
                reportText += `  ${statusIcon} ${doc.docName}\\n`;
                if (doc.receivedDate) {
                    reportText += `     📅 Received: ${formatDate(doc.receivedDate)}\\n`;
                }
                if (doc.remarks) {
                    reportText += `     💬 ${doc.remarks}\\n`;
                }
            });
            reportText += '\\n';
        }
    });
    
    alert(reportText);
}

// Update document status
function updateDocumentStatus(jobNo, docKey) {
    const docInfo = window.documentsManager.getDocumentInfo(docKey);
    const currentDoc = window.workflowManager.getJobDocumentChecklist(jobNo)
        .find(d => d.docKey === docKey);
    
    const newStatus = prompt(`Update Status for: ${docInfo.name}\\n\\nCurrent Status: ${currentDoc.status.toUpperCase()}\\n\\nEnter new status:\\n- received\\n- pending\\n- missing`, currentDoc.status);
    
    if (newStatus && ['received', 'pending', 'missing'].includes(newStatus.toLowerCase())) {
        const receivedDate = newStatus.toLowerCase() === 'received' ? 
            new Date().toISOString().split('T')[0] : null;
        
        const remarks = prompt('Add remarks (optional):', currentDoc.remarks || '');
        
        window.workflowManager.updateDocumentChecklist(
            jobNo, 
            docKey, 
            newStatus.toLowerCase(), 
            receivedDate, 
            remarks || ''
        );
        
        loadDocumentsData();
        alert(`✅ Document status updated!\\n\\n📄 Document: ${docInfo.name}\\n📊 Status: ${newStatus.toUpperCase()}\\n📅 Date: ${receivedDate ? formatDate(receivedDate) : 'N/A'}`);
    }
}

// View document details
function viewDocumentDetails(jobNo, docKey) {
    const docInfo = window.documentsManager.getDocumentInfo(docKey);
    const currentDoc = window.workflowManager.getJobDocumentChecklist(jobNo)
        .find(d => d.docKey === docKey);
    
    let detailText = `📄 Document Details\\n\\n`;
    detailText += `📋 Name: ${docInfo.name}\\n`;
    detailText += `📂 Category: ${docInfo.categoryName}\\n`;
    detailText += `🏢 Issuer: ${docInfo.issuer}\\n`;
    detailText += `⚠️ Required: ${docInfo.required ? 'Yes' : 'No'}\\n`;
    detailText += `📊 Status: ${currentDoc.status.toUpperCase()}\\n`;
    
    if (currentDoc.receivedDate) {
        detailText += `📅 Received: ${formatDate(currentDoc.receivedDate)}\\n`;
    }
    
    if (currentDoc.remarks) {
        detailText += `💬 Remarks: ${currentDoc.remarks}\\n`;
    }
    
    detailText += `\\n🎯 Purpose:\\n`;
    
    // Add document purpose based on type
    switch(docKey) {
        case 'mbl':
        case 'hbl':
            detailText += '• Cargo ownership proof\\n• Required for cargo release\\n• Contains shipping details';
            break;
        case 'do':
            detailText += '• Permission to release cargo\\n• Required at destination\\n• Issued by shipping line';
            break;
        case 'commercial_invoice':
            detailText += '• Shows cargo value\\n• Required for customs\\n• Duty calculation basis';
            break;
        case 'coo':
            detailText += '• Proves country of origin\\n• Required for preferential duty\\n• Issued by Chamber of Commerce';
            break;
        default:
            detailText += '• Essential shipping document\\n• Required for clearance';
    }
    
    alert(detailText);
}

// Show add document modal
function showAddDocument() {
    // Check if modal exists
    const modal = document.getElementById('addDocumentModal');
    if (!modal) {
        alert('❌ Modal not found! Please check HTML structure.');
        return;
    }
    
    // Get active jobs
    const jobs = window.workflowManager.getJobs().filter(j => 
        !['closed', 'completed'].includes(j.status)
    );
    
    if (jobs.length === 0) {
        alert('❌ No active jobs found!\n\nCreate a job first to add documents.');
        return;
    }
    
    // Show modal with current structure
    modal.style.display = 'block';
    
    // Show job selection info
    alert(`📄 Document Upload Ready\n\nActive Jobs Available:\n${jobs.map(j => `• ${j.no} - ${j.customer}`).join('\n')}\n\nSelect files to upload for any job.`);
}

function closeModal() {
    document.getElementById('addDocumentModal').style.display = 'none';
    document.getElementById('addDocumentForm').reset();
}

function generateBL() {
    const jobs = window.workflowManager.getJobs().filter(j => 
        ['in-progress', 'documentation'].includes(j.status)
    );
    
    if (jobs.length === 0) {
        alert('❌ No jobs available for B/L generation!\\n\\nJobs must be in progress or documentation stage.');
        return;
    }
    
    let jobList = 'Available Jobs for B/L Generation:\\n\\n';
    jobs.forEach(job => {
        jobList += `• ${job.no} - ${job.customer} (${job.mode})\\n`;
    });
    
    const selectedJob = prompt(jobList + '\\nEnter Job Number:', jobs[0].no);
    
    if (selectedJob) {
        const job = jobs.find(j => j.no === selectedJob);
        if (job) {
            // Generate appropriate B/L based on mode
            const blType = job.mode === 'Sea' ? 'hbl' : 'hawb';
            const blName = job.mode === 'Sea' ? 'House Bill of Lading' : 'House Air Waybill';
            
            window.workflowManager.addShippingDocument(selectedJob, {
                type: blType,
                title: `${blName} - ${selectedJob}`,
                status: 'received',
                receivedDate: new Date().toISOString().split('T')[0],
                remarks: 'Auto-generated B/L'
            });
            
            loadDocumentsData();
            alert(`✅ ${blName} Generated!\\n\\n📄 Document: ${blName}\\n💼 Job: ${selectedJob}\\n🏢 Customer: ${job.customer}\\n📅 Date: ${new Date().toLocaleDateString('en-IN')}`);
        }
    }
}

// Form submission
document.getElementById('addDocumentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get first active job for demo
    const jobs = window.workflowManager.getJobs().filter(j => 
        !['closed', 'completed'].includes(j.status)
    );
    
    if (jobs.length === 0) {
        alert('❌ No active jobs found!');
        return;
    }
    
    const jobNo = jobs[0].no; // Use first active job
    
    // Check which files are uploaded
    const documents = {
        mbl: document.getElementById('mblFile').files.length > 0,
        hbl: document.getElementById('hblFile').files.length > 0,
        commercial_invoice: document.getElementById('invoiceFile').files.length > 0,
        packing_list: document.getElementById('packingFile').files.length > 0,
        shipping_bill: document.getElementById('shippingFile').files.length > 0,
        form_e: document.getElementById('formEFile').files.length > 0
    };
    
    // Add documents to job
    Object.keys(documents).forEach(docType => {
        if (documents[docType]) {
            window.workflowManager.addShippingDocument(jobNo, {
                type: docType,
                title: window.documentsManager.getDocumentInfo(docType).name,
                status: 'received',
                receivedDate: new Date().toISOString().split('T')[0],
                remarks: 'Uploaded via document form'
            });
        }
    });
    
    const uploadedCount = Object.values(documents).filter(Boolean).length;
    
    loadDocumentsData();
    closeModal();
    
    alert(`✅ Documents Uploaded Successfully!\n\n📄 Job: ${jobNo}\n📤 Uploaded: ${uploadedCount} documents\n\n🎯 ${uploadedCount >= 5 ? 'All documents complete!' : 'Upload remaining documents to proceed.'}`);
});

function filterDocuments() {
    // Simple filter - reload data for now
    loadDocumentsData();
}

function exportDocuments() {
    alert('📤 Export Documents Report\\n\\nFeatures:\\n• PDF Document Report\\n• Excel Document Checklist\\n• Document Status Summary\\n\\nExport functionality - Coming Soon!');
}

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