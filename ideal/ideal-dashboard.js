// Dashboard JavaScript - Auto Display Only (No Data Entry)

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadDashboardData();
    startAutoRefresh();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    document.getElementById('currentUser').textContent = 
        `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)} Branch`;
}

function loadDashboardData() {
    // Simulate real-time data (in real app, this would come from API)
    const dashboardData = {
        todayJobs: Math.floor(Math.random() * 20) + 10,
        pendingDocs: Math.floor(Math.random() * 15) + 5,
        pendingInvoices: (Math.random() * 5 + 1).toFixed(1) + 'L',
        outstanding: (Math.random() * 10 + 5).toFixed(1) + 'L',
        shipmentStatus: Math.floor(Math.random() * 50) + 30,
        monthlyProfit: (Math.random() * 15 + 8).toFixed(1) + 'L'
    };
    
    // Update dashboard stats
    document.getElementById('todayJobs').textContent = dashboardData.todayJobs;
    document.getElementById('pendingDocs').textContent = dashboardData.pendingDocs;
    document.getElementById('pendingInvoices').textContent = '₹' + dashboardData.pendingInvoices;
    document.getElementById('outstanding').textContent = '₹' + dashboardData.outstanding;
    document.getElementById('shipmentStatus').textContent = dashboardData.shipmentStatus;
    document.getElementById('monthlyProfit').textContent = '₹' + dashboardData.monthlyProfit;
}

function startAutoRefresh() {
    // Auto-refresh dashboard every 30 seconds
    setInterval(loadDashboardData, 30000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
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

// Call role-based menu update
document.addEventListener('DOMContentLoaded', function() {
    updateMenuForRole();
});