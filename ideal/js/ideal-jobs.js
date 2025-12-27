// Jobs Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadJobsData();
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

function loadJobsData() {
    // Get jobs from workflow manager
    const jobs = window.workflowManager.getJobs();
    
    console.log('Loading jobs:', jobs.map(j => ({no: j.no, status: j.status})));
    
    // Calculate stats
    const activeJobs = jobs.filter(j => ['open', 'in-progress'].includes(j.status)).length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const totalProfit = jobs.reduce((sum, j) => sum + (j.profit || 0), 0);
    const avgProfit = jobs.length > 0 ? Math.round(totalProfit / jobs.length) : 0;
    
    document.getElementById('activeJobs').textContent = activeJobs;
    document.getElementById('inTransit').textContent = jobs.filter(j => j.status === 'in-progress').length;
    document.getElementById('delivered').textContent = completedJobs;
    document.getElementById('monthJobs').textContent = jobs.length;
    
    // Load table data
    displayJobs(jobs);
}

function displayJobs(jobs) {
    const tbody = document.getElementById('jobsTable');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const statusClass = getStatusClass(job.status);
        const nextAction = getNextJobAction(job.status);
        const workflow = window.workflowManager.getWorkflowChain(job.enquiryNo);
        
        const row = `
            <tr>
                <td>
                    <strong>${job.no}</strong>
                    <br><small>QUO: ${job.quotationNo}</small>
                </td>
                <td>${formatDate(job.date)}</td>
                <td>
                    <div><strong>${job.customer}</strong></div>
                    <small>${job.contact} | ${job.phone}</small>
                </td>
                <td>
                    <div>${job.type} | ${job.mode}</div>
                    <small>${job.origin} → ${job.destination}</small>
                </td>
                <td>
                    <div>${job.commodity}</div>
                    <small>${job.weight} KG | ${job.cbm} CBM</small>
                </td>
                <td>
                    <div>$${(job.profit || 0).toFixed(1)}</div>
                    <small>${job.customerRate || 0}/CBM</small>
                </td>
                <td><span class="status-${statusClass}">${job.status.toUpperCase()}</span></td>
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
        case 'open': return { action: 'startOperations', label: '🚚 Start Ops' };
        case 'in-progress': return { action: 'uploadDocuments', label: '📄 B/L Docs' };
        case 'documented': return { action: 'createInvoice', label: '🧾 Invoice' };
        case 'invoiced': return { action: 'viewJobDetails', label: '💳 Payment' };
        case 'completed': return { action: 'closeJob', label: '🔒 Close' };
        default: return { action: 'viewJobDetails', label: '👁️ View' };
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'open': return 'new';
        case 'in-progress': return 'pending';
        case 'documented': return 'info';
        case 'invoiced': return 'warning';
        case 'completed': return 'success';
        default: return 'default';
    }
}

// Start Operations for a Job
function startOperations(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) return;
    
    // Update job status to in-progress
    const data = window.workflowManager.getData();
    const jobIndex = data.jobs.findIndex(j => j.no === jobNo);
    if (jobIndex !== -1) {
        data.jobs[jobIndex].status = 'in-progress';
        data.jobs[jobIndex].operationsStarted = new Date().toISOString();
        data.jobs[jobIndex].etd = prompt('Enter ETD (Expected Time of Departure):') || '';
        data.jobs[jobIndex].eta = prompt('Enter ETA (Expected Time of Arrival):') || '';
        data.jobs[jobIndex].agent = prompt('Select Agent:') || 'Default Agent';
        window.workflowManager.saveData(data);
    }
    
    alert(`🚚 Operations Started for ${jobNo}\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nCargo: ${job.commodity}\n\n🎯 Next Steps:\n• Upload B/L documents\n• Track shipment\n• Update ETA\n• Create invoice`);
    
    loadJobsData();
}

// Upload Documents (B/L, HAWB, etc.)
function uploadDocuments(jobNo) {
    sessionStorage.setItem('uploadDocsForJob', jobNo);
    
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) return;
    
    alert(`📄 Upload Documents for ${jobNo}\n\n📋 Required Documents:\n• MBL/MAWB\n• HBL/HAWB\n• Shipper Invoice\n• Packing List\n• Shipping Bill\n• Form E (if required)\n\n➡️ Redirecting to Documents page...`);
    
    window.location.href = 'ideal-documents.html';
}

// Create Invoice from Job
function createInvoice(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) {
        alert('Job not found!');
        return;
    }
    
    // Check if job has documents uploaded
    if (job.status !== 'documented') {
        alert('❌ Cannot create invoice!\n\nRequired: Documents must be uploaded first.\n\nCurrent Status: ' + job.status.toUpperCase() + '\n\nPlease upload B/L documents first.');
        return;
    }
    
    // Store job number for invoice creation
    sessionStorage.setItem('createInvoiceFromJob', jobNo);
    
    alert(`🧾 Creating invoice for ${jobNo}...\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nProfit: $${job.profit}\n\n➡️ Redirecting to Billing page...`);
    
    // Redirect to billing page
    window.location.href = 'ideal-billing.html';
}

// Close Job
function closeJob(jobNo) {
    const workflow = window.workflowManager.getWorkflowChain(
        window.workflowManager.getJobs().find(j => j.no === jobNo).enquiryNo
    );
    
    if (!workflow.invoice || !workflow.payment) {
        alert('❌ Cannot close job!\n\nRequired:\n✓ Invoice created\n✓ Payment received\n\nCurrent Status:\n' + 
              (workflow.invoice ? '✅ Invoice: ' + workflow.invoice.no : '❌ No invoice') + '\n' +
              (workflow.payment ? '✅ Payment: ' + workflow.payment.id : '❌ No payment'));
        return;
    }
    
    const data = window.workflowManager.getData();
    const jobIndex = data.jobs.findIndex(j => j.no === jobNo);
    if (jobIndex !== -1) {
        data.jobs[jobIndex].status = 'closed';
        data.jobs[jobIndex].closedAt = new Date().toISOString();
        window.workflowManager.saveData(data);
    }
    
    alert(`🔒 Job Closed Successfully!\n\n💼 Job: ${jobNo}\n✅ All documents complete\n✅ Invoice generated\n✅ Payment received\n\n📊 Job Status: CLOSED`);
    
    loadJobsData();
}

function viewJobDetails(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    const workflow = window.workflowManager.getWorkflowChain(job.enquiryNo);
    
    if (!job) return;
    
    let details = `💼 Job Details - ${jobNo}\n\n`;
    details += `👤 Customer: ${job.customer}\n`;
    details += `📞 Contact: ${job.contact}\n`;
    details += `🚚 Route: ${job.origin} → ${job.destination}\n`;
    details += `📦 Cargo: ${job.commodity}\n`;
    details += `⚖️ Weight: ${job.weight} KG\n`;
    details += `📊 Volume: ${job.cbm} CBM\n`;
    details += `💰 Profit: $${job.profit || 0}\n`;
    details += `📋 Status: ${job.status.toUpperCase()}\n`;
    
    if (job.etd) details += `🛫 ETD: ${job.etd}\n`;
    if (job.eta) details += `🛬 ETA: ${job.eta}\n`;
    if (job.agent) details += `🤝 Agent: ${job.agent}\n`;
    
    details += '\n';
    
    if (workflow.invoice) {
        details += `🧾 Invoice: ${workflow.invoice.no}\n`;
        details += `💵 Amount: ₹${workflow.invoice.total || 0}\n`;
    }
    
    if (workflow.payment) {
        details += `💳 Payment: ${workflow.payment.id}\n`;
        details += `✅ Paid: ₹${workflow.payment.amount || 0}\n`;
    }
    
    alert(details);
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
            job.origin.toLowerCase().includes(searchTerm) ||
            job.destination.toLowerCase().includes(searchTerm) ||
            job.commodity.toLowerCase().includes(searchTerm)
        );
    }
    
    displayJobs(jobs);
}

function showAddJob() {
    alert('Job creation from scratch not available.\n\nJobs are created automatically when quotations are approved.\n\nWorkflow: Enquiry → Quotation → Job\n\nPlease go to Quotations page to convert approved quotations to jobs.');
}

function showJobTracking() {
    document.getElementById('jobTrackingModal').style.display = 'block';
}

function closeModal() {
    // No modal to close for job creation
}

function closeTrackingModal() {
    document.getElementById('jobTrackingModal').style.display = 'none';
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

// Mobile Sidebar Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}