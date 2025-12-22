// Dashboard Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadDashboardData();
    updateMenuForRole();
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

function loadDashboardData() {
    // Get comprehensive stats from workflow manager
    const stats = window.workflowManager.getDashboardStats();
    const enquiries = window.workflowManager.getEnquiries();
    const quotations = window.workflowManager.getQuotations();
    const jobs = window.workflowManager.getJobs();
    const invoices = window.workflowManager.getInvoices();
    const payments = window.workflowManager.getPayments();
    
    // Update main stats cards
    document.getElementById('todayJobs').textContent = stats.todayEnquiries;
    document.getElementById('pendingDocs').textContent = jobs.filter(j => j.status === 'in-progress' && !j.documentsReceived).length;
    document.getElementById('pendingInvoices').textContent = '₹' + Math.round(stats.totalRevenue * 80 / 100000).toFixed(1) + 'L';
    document.getElementById('outstanding').textContent = '₹' + Math.round(invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total || 0), 0) * 80 / 100000).toFixed(1) + 'L';
    document.getElementById('shipmentStatus').textContent = stats.activeJobs;
    document.getElementById('monthlyProfit').textContent = '₹' + Math.round(stats.totalProfit * 80 / 100000).toFixed(1) + 'L';
    
    // Load recent activities
    loadRecentActivities();
    
    // Load workflow summary
    loadWorkflowSummary();
}

function loadRecentActivities() {
    const activities = [];
    
    // Get recent items from each workflow step
    const enquiries = window.workflowManager.getEnquiries().slice(0, 3);
    const quotations = window.workflowManager.getQuotations().slice(0, 3);
    const jobs = window.workflowManager.getJobs().slice(0, 3);
    const invoices = window.workflowManager.getInvoices().slice(0, 3);
    const payments = window.workflowManager.getPayments().slice(0, 3);
    
    // Add enquiries
    enquiries.forEach(enq => {
        activities.push({
            type: 'enquiry',
            icon: '📞',
            title: `New enquiry ${enq.no}`,
            description: `${enq.customer} - ${enq.origin} → ${enq.destination}`,
            time: getTimeAgo(enq.createdAt),
            status: enq.status
        });
    });
    
    // Add quotations
    quotations.forEach(quo => {
        activities.push({
            type: 'quotation',
            icon: '💰',
            title: `Quotation ${quo.no} created`,
            description: `${quo.customer} - $${quo.customerRate}/CBM`,
            time: getTimeAgo(quo.createdAt),
            status: quo.status
        });
    });
    
    // Add jobs
    jobs.forEach(job => {
        activities.push({
            type: 'job',
            icon: '💼',
            title: `Job ${job.no} started`,
            description: `${job.customer} - Profit: $${job.profit}`,
            time: getTimeAgo(job.createdAt),
            status: job.status
        });
    });
    
    // Add invoices
    invoices.forEach(inv => {
        activities.push({
            type: 'invoice',
            icon: '🧾',
            title: `Invoice ${inv.no} generated`,
            description: `${inv.customer} - $${inv.total.toFixed(2)}`,
            time: getTimeAgo(inv.createdAt),
            status: inv.status
        });
    });
    
    // Add payments
    payments.forEach(pay => {
        activities.push({
            type: 'payment',
            icon: '💳',
            title: `Payment ${pay.id} received`,
            description: `${pay.customer} - $${pay.amount.toFixed(2)}`,
            time: getTimeAgo(pay.createdAt),
            status: pay.status
        });
    });
    
    // Sort by creation time and take latest 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 10);
    
    // Display activities
    const container = document.getElementById('recentActivities');
    if (container) {
        container.innerHTML = '';
        
        recentActivities.forEach(activity => {
            const statusClass = getActivityStatusClass(activity.status);
            const activityHtml = `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                    <div class="activity-status status-${statusClass}">${activity.status.toUpperCase()}</div>
                </div>
            `;
            container.innerHTML += activityHtml;
        });
    }
}

function loadWorkflowSummary() {
    const container = document.getElementById('workflowSummary');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get recent enquiries with their complete workflow chain
    const recentEnquiries = window.workflowManager.getEnquiries().slice(0, 5);
    
    recentEnquiries.forEach(enquiry => {
        const workflow = window.workflowManager.getWorkflowChain(enquiry.no);
        const progress = getWorkflowProgress(workflow);
        
        const workflowHtml = `
            <div class="workflow-item">
                <div class="workflow-header">
                    <strong>${enquiry.no}</strong> - ${enquiry.customer}
                    <span class="workflow-status status-${getWorkflowStatusClass(workflow.status)}">
                        ${workflow.status.toUpperCase()}
                    </span>
                </div>
                <div class="workflow-details">
                    ${enquiry.origin} → ${enquiry.destination} | ${enquiry.commodity}
                </div>
                <div class="workflow-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                    <small>${progress.current}/${progress.total} steps completed</small>
                </div>
                <div class="workflow-chain">
                    ${getWorkflowChainHtml(workflow)}
                </div>
            </div>
        `;
        container.innerHTML += workflowHtml;
    });
}

function getWorkflowProgress(workflow) {
    let completed = 0;
    const total = 5; // ENQ, QUO, JOB, INV, PAY
    
    if (workflow.enquiry) completed++;
    if (workflow.quotation) completed++;
    if (workflow.job) completed++;
    if (workflow.invoice) completed++;
    if (workflow.payment) completed++;
    
    return {
        current: completed,
        total: total,
        percentage: Math.round((completed / total) * 100)
    };
}

function getWorkflowChainHtml(workflow) {
    const steps = [
        { key: 'enquiry', icon: '📞', label: 'ENQ' },
        { key: 'quotation', icon: '💰', label: 'QUO' },
        { key: 'job', icon: '💼', label: 'JOB' },
        { key: 'invoice', icon: '🧾', label: 'INV' },
        { key: 'payment', icon: '💳', label: 'PAY' }
    ];
    
    return steps.map(step => {
        const isCompleted = workflow[step.key] !== undefined;
        const statusClass = isCompleted ? 'completed' : 'pending';
        return `<span class="workflow-step ${statusClass}">${step.icon} ${step.label}</span>`;
    }).join(' → ');
}

function getActivityStatusClass(status) {
    switch(status) {
        case 'new': case 'open': return 'new';
        case 'sent': case 'quoted': case 'in-progress': return 'pending';
        case 'approved': case 'converted': case 'documented': return 'info';
        case 'paid': case 'completed': case 'cleared': case 'closed': return 'success';
        default: return 'default';
    }
}

function getWorkflowStatusClass(status) {
    switch(status) {
        case 'enquiry': return 'new';
        case 'quoted': case 'approved': return 'pending';
        case 'in-progress': case 'invoiced': return 'info';
        case 'completed': return 'success';
        default: return 'default';
    }
}

function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else {
        return `${diffDays} days ago`;
    }
}

function showQuickActions() {
    alert('🎯 Quick Actions\n\n1. 📞 Create New Enquiry\n2. 💰 Generate Quotation\n3. 💼 Start New Job\n4. 🧾 Create Invoice\n5. 💳 Record Payment\n\nClick on respective modules to perform these actions!');
}

function showWorkflowGuide() {
    alert('🔄 Complete Workflow Guide\n\nSTEP 1: Customer Enquiry\n• Customer calls/emails\n• Create enquiry with details\n\nSTEP 2: Rate Check & Quotation\n• Get agent rates\n• Add profit margin\n• Send quotation to customer\n\nSTEP 3: Quotation Approved\n• Customer approves\n• Convert to job\n\nSTEP 4: Operations Start\n• Book with agent\n• Upload B/L documents\n• Track shipment\n\nSTEP 5: Create Invoice\n• Calculate charges\n• Generate invoice\n• Send to customer\n\nSTEP 6: Payment & Close\n• Receive payment\n• Close job\n• Complete workflow');
}

// Role-based menu visibility
function updateMenuForRole() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) return;
    
    const navItems = document.querySelectorAll('.nav-item');
    
    // Hide/show menu items based on role
    switch(user.role) {
        case 'sales':
            // Sales can only see: Dashboard, CRM, Enquiries, Quotations
            hideMenuItems(['ideal-jobs.html', 'ideal-documents.html', 'ideal-billing.html', 'ideal-payments.html', 'ideal-outstanding.html']);
            break;
        case 'operations':
            // Operations can see: Dashboard, Jobs, Documents
            hideMenuItems(['ideal-parties.html', 'ideal-enquiries.html', 'ideal-quotations.html', 'ideal-billing.html', 'ideal-payments.html', 'ideal-outstanding.html', 'ideal-reports.html']);
            break;
        case 'accounts':
            // Accounts can see: Dashboard, Billing, Payments, Outstanding, Reports
            hideMenuItems(['ideal-parties.html', 'ideal-enquiries.html', 'ideal-quotations.html', 'ideal-jobs.html', 'ideal-documents.html']);
            break;
        // Admin can see everything
    }
}

function hideMenuItems(pagesToHide) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (pagesToHide.includes(href)) {
            item.style.display = 'none';
        }
    });
}

function startAutoRefresh() {
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}