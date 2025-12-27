// Jobs Management - Complete Shipping Operations

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadJobsData();
    checkJobFromQuotation();
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

// Check if coming from quotation conversion
function checkJobFromQuotation() {
    // Jobs are automatically created by workflow manager
    // This function can show welcome message for new jobs
}

function loadJobsData() {
    // Get jobs from enhanced workflow manager
    const jobs = window.workflowManager.getJobs();
    
    // Calculate stats
    const active = jobs.filter(j => ['open', 'in-progress', 'documentation'].includes(j.status)).length;
    const inTransit = jobs.filter(j => j.status === 'in-transit').length;
    const delivered = jobs.filter(j => ['delivered', 'completed', 'closed'].includes(j.status)).length;
    const thisMonth = jobs.length;
    
    document.getElementById('activeJobs').textContent = active;
    document.getElementById('inTransit').textContent = inTransit;
    document.getElementById('delivered').textContent = delivered;
    document.getElementById('monthJobs').textContent = thisMonth;
    
    // Load table data
    displayJobs(jobs);
}

function displayJobs(jobs) {
    const tbody = document.getElementById('jobsTable');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const statusClass = getStatusClass(job.status);
        const modeIcon = getModeIcon(job.mode);
        const nextAction = getNextJobAction(job.status);
        const profitability = window.workflowManager.calculateJobProfitability(job.no);
        
        const row = `
            <tr>
                <td>
                    <strong>${job.no}</strong>
                    <br><small>QUO: ${job.quotationNo}</small>
                </td>
                <td>${formatDate(job.date)}</td>
                <td>${job.customer}</td>
                <td>
                    <div>${modeIcon} ${job.origin} → ${job.destination}</div>
                    <small>${job.mode} Freight</small>
                </td>
                <td>
                    <div><strong>${job.commodity}</strong></div>
                    <small>${job.weight} KG | ${job.cbm} CBM</small>
                </td>
                <td><span class="status-${statusClass}">${job.status.toUpperCase().replace('-', ' ')}</span></td>
                <td>
                    <div>Revenue: $${profitability?.revenue || 0}</div>
                    <small>Profit: $${profitability?.profit || 0}</small>
                </td>
                <td>
                    <button class="btn-small" onclick="viewJobDetails('${job.no}')">👁️ View</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${job.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getNextJobAction(status) {
    switch(status) {
        case 'open': return { action: 'startOperations', label: '🚚 Ops' };
        case 'in-progress': return { action: 'manageDocuments', label: '📄 Docs' };
        case 'documentation': return { action: 'recordPurchases', label: '💰 Purchase' };
        case 'in-transit': return { action: 'generateArrival', label: '📢 Arrival' };
        case 'delivered': return { action: 'createInvoice', label: '🧾 Invoice' };
        case 'completed': return { action: 'closeJob', label: '✅ Close' };
        default: return { action: 'viewJobDetails', label: '👁️ View' };
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'open': return 'new';
        case 'in-progress': return 'pending';
        case 'documentation': return 'info';
        case 'in-transit': return 'warning';
        case 'delivered': return 'success';
        case 'completed': return 'success';
        case 'closed': return 'info';
        default: return 'default';
    }
}

function getModeIcon(mode) {
    switch(mode) {
        case 'Sea': return '🚢';
        case 'Air': return '✈️';
        case 'Road': return '🚛';
        default: return '📦';
    }
}

// STEP 4A: Start Operations
function startOperations(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) return;
    
    // Update job status to in-progress
    window.workflowManager.updateJobStatus(jobNo, 'in-progress', {
        operationsStarted: new Date().toISOString(),
        eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    });
    
    alert(`🚚 Operations Started - ${jobNo}\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nCargo: ${job.commodity}\n\n🎯 Next Steps:\n1. Coordinate with agent\n2. Arrange pickup\n3. Prepare documents`);
    
    loadJobsData();
}

// STEP 4B: Manage Documents
function manageDocuments(jobNo) {
    showDocumentModal(jobNo);
}

// STEP 4C: Record Agent Purchases
function recordPurchases(jobNo) {
    showPurchaseModal(jobNo);
}

// STEP 4D: Generate Arrival Notice
function generateArrival(jobNo) {
    const arrivalNotice = window.workflowManager.generateArrivalNotice(jobNo);
    
    if (arrivalNotice) {
        alert(`📢 Arrival Notice Generated!\n\nNotice No: ${arrivalNotice.no}\nCustomer: ${arrivalNotice.customer}\nVessel: ${arrivalNotice.vessel}\nETA: ${formatDate(arrivalNotice.eta)}\nPort: ${arrivalNotice.port}\nCargo: ${arrivalNotice.cargo}\n\n➡️ Customer will be notified`);
        
        // Update job status
        window.workflowManager.updateJobStatus(jobNo, 'delivered');
        loadJobsData();
    }
}

// STEP 4E: Create Invoice
function createInvoice(jobNo) {
    // Store job number for invoice creation
    sessionStorage.setItem('createInvoiceFromJob', jobNo);
    
    alert(`🧾 Creating Invoice for ${jobNo}...\n\n➡️ Redirecting to Billing page...`);
    window.location.href = 'ideal-billing.html';
}

// STEP 4F: Close Job
function closeJob(jobNo) {
    const canClose = window.workflowManager.canCloseJob(jobNo);
    
    if (!canClose.canClose) {
        alert(`❌ Cannot Close Job\n\nReason: ${canClose.reason}\n\n📋 Required:\n✓ All documents received\n✓ Invoice paid\n✓ Agent purchases recorded`);
        return;
    }
    
    const result = window.workflowManager.closeJob(jobNo);
    
    if (result.success) {
        const profitability = window.workflowManager.calculateJobProfitability(jobNo);
        alert(`✅ Job Closed Successfully!\n\n💼 Job: ${jobNo}\n💰 Final Profit: $${profitability.profit.toFixed(2)}\n📈 Margin: ${profitability.margin.toFixed(1)}%\n\n🎉 Job completed successfully!`);
        loadJobsData();
    } else {
        alert(`❌ Failed to close job: ${result.reason}`);
    }
}

// View Complete Job Details
function viewJobDetails(jobNo) {
    const details = window.workflowManager.getJobCompleteDetails(jobNo);
    
    let detailsText = `💼 Complete Job Details - ${jobNo}\n\n`;
    
    // Job Info
    detailsText += `📋 JOB INFORMATION:\n`;
    detailsText += `Customer: ${details.job.customer}\n`;
    detailsText += `Route: ${details.job.origin} → ${details.job.destination}\n`;
    detailsText += `Cargo: ${details.job.commodity} (${details.job.weight} KG)\n`;
    detailsText += `Status: ${details.job.status.toUpperCase()}\n\n`;
    
    // Documents
    detailsText += `📄 DOCUMENTS (${details.documents.length}):\n`;
    details.documents.forEach(doc => {
        detailsText += `• ${doc.title} - ${doc.status.toUpperCase()}\n`;
    });
    detailsText += '\n';
    
    // Purchases
    detailsText += `💰 AGENT PURCHASES (${details.purchases.length}):\n`;
    details.purchases.forEach(purchase => {
        detailsText += `• ${purchase.vendor}: $${purchase.amount} (${purchase.service})\n`;
    });
    detailsText += '\n';
    
    // Profitability
    if (details.profitability) {
        detailsText += `📈 PROFITABILITY:\n`;
        detailsText += `Revenue: $${details.profitability.revenue}\n`;
        detailsText += `Cost: $${details.profitability.totalCost}\n`;
        detailsText += `Profit: $${details.profitability.profit}\n`;
        detailsText += `Margin: ${details.profitability.margin}%\n`;
    }
    
    alert(detailsText);
}

// Show Document Management Modal
function showDocumentModal(jobNo) {
    const documents = window.workflowManager.getJobDocuments(jobNo);
    
    let docText = `📄 Document Management - ${jobNo}\n\n`;
    docText += `Required Documents:\n`;
    docText += `• Bill of Lading (B/L)\n`;
    docText += `• Commercial Invoice\n`;
    docText += `• Packing List\n`;
    docText += `• Certificate of Origin\n`;
    docText += `• Delivery Order (DO)\n\n`;
    
    docText += `Current Documents (${documents.length}):\n`;
    documents.forEach(doc => {
        docText += `• ${doc.title} - ${doc.status.toUpperCase()}\n`;
    });
    
    docText += `\n🎯 Actions:\n1. Upload documents\n2. Mark as received\n3. Generate DO\n\nDocument management - Coming Soon!`;
    
    alert(docText);
    
    // Add sample documents for demo
    if (documents.length === 0) {
        addSampleDocuments(jobNo);
    }
}

// Show Purchase Management Modal
function showPurchaseModal(jobNo) {
    const purchases = window.workflowManager.getJobPurchases(jobNo);
    
    let purchaseText = `💰 Agent Purchases - ${jobNo}\n\n`;
    purchaseText += `Purchase Types:\n`;
    purchaseText += `• Freight Charges (Agent)\n`;
    purchaseText += `• Delivery Order (DO)\n`;
    purchaseText += `• Documentation Fees\n`;
    purchaseText += `• Handling Charges\n\n`;
    
    purchaseText += `Current Purchases (${purchases.length}):\n`;
    purchases.forEach(purchase => {
        purchaseText += `• ${purchase.vendor}: $${purchase.amount} (${purchase.service})\n`;
    });
    
    const profitability = window.workflowManager.calculateJobProfitability(jobNo);
    purchaseText += `\n📈 Current Profit: $${profitability?.profit || 0}\n`;
    
    alert(purchaseText);
    
    // Add sample purchase for demo
    if (purchases.length === 0) {
        addSamplePurchase(jobNo);
    }
}

// Add sample documents for demo
function addSampleDocuments(jobNo) {
    const sampleDocs = [
        { type: 'bl', title: 'Bill of Lading', status: 'received' },
        { type: 'invoice', title: 'Commercial Invoice', status: 'received' },
        { type: 'packing_list', title: 'Packing List', status: 'pending' },
        { type: 'do', title: 'Delivery Order', status: 'pending' }
    ];
    
    sampleDocs.forEach(doc => {
        window.workflowManager.addShippingDocument(jobNo, doc);
    });
    
    // Update job status
    window.workflowManager.updateJobStatus(jobNo, 'documentation');
    loadJobsData();
}

// Add sample purchase for demo
function addSamplePurchase(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    const agentRate = job.agentRate || 45;
    const cbm = job.cbm || 1;
    
    const samplePurchases = [
        {
            vendor: 'Dubai Shipping Agent',
            service: 'Freight Charges',
            amount: agentRate * cbm,
            currency: 'USD',
            description: `Sea freight charges for ${cbm} CBM`
        },
        {
            vendor: 'Port Authority',
            service: 'Delivery Order (DO)',
            amount: 150,
            currency: 'USD',
            description: 'DO charges and port fees'
        }
    ];
    
    samplePurchases.forEach(purchase => {
        window.workflowManager.recordAgentPurchase(jobNo, purchase);
    });
    
    // Update job status
    window.workflowManager.updateJobStatus(jobNo, 'in-transit');
    loadJobsData();
}

function filterJobs() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchJob').value.toLowerCase();
    
    let jobs = window.workflowManager.getJobs();
    
    if (statusFilter !== 'all') {
        jobs = jobs.filter(job => job.status === statusFilter);
    }
    
    if (searchTerm) {
        jobs = jobs.filter(job => 
            job.no.toLowerCase().includes(searchTerm) ||
            job.customer.toLowerCase().includes(searchTerm) ||
            job.commodity.toLowerCase().includes(searchTerm)
        );
    }
    
    displayJobs(jobs);
}

function showAddJob() {
    alert('💼 Jobs are created automatically from approved quotations!\n\n🎯 Process:\n1. Create Enquiry\n2. Generate Quotation\n3. Get Approval\n4. Convert to Job\n\n➡️ Go to Quotations page to convert approved quotes.');
}

function showJobTracking() {
    const jobs = window.workflowManager.getJobs();
    const activeJobs = jobs.filter(j => !['closed', 'completed'].includes(j.status));
    
    alert(`📍 Job Tracking Overview\n\n🚢 Sea Freight: ${activeJobs.filter(j => j.mode === 'Sea').length} active\n✈️ Air Freight: ${activeJobs.filter(j => j.mode === 'Air').length} active\n🚛 Road Transport: ${activeJobs.filter(j => j.mode === 'Road').length} active\n\n📈 Total Active: ${activeJobs.length} jobs\n\nDetailed tracking - Coming Soon!`);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadJobsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}