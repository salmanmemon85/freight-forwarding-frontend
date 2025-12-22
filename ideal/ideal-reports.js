// Reports Management - Dynamic Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadReportsData();
    setDefaultDates();
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

function loadReportsData() {
    // Get real data from workflow manager
    const enquiries = window.workflowManager.getEnquiries();
    const quotations = window.workflowManager.getQuotations();
    const jobs = window.workflowManager.getJobs();
    const invoices = window.workflowManager.getInvoices();
    const payments = window.workflowManager.getPayments();
    
    // Calculate real business metrics
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalProfit = jobs.reduce((sum, job) => sum + (job.profit || 0), 0);
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const activeCustomers = [...new Set(enquiries.map(e => e.customer))].length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const outstandingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total || 0), 0);
    const gstCollected = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    
    // Update main stats
    document.getElementById('monthlyRevenue').textContent = '₹' + Math.round(totalRevenue * 80).toLocaleString('en-IN');
    document.getElementById('monthlyProfit').textContent = '₹' + Math.round(totalProfit * 80).toLocaleString('en-IN');
    document.getElementById('profitMargin').textContent = profitMargin + '%';
    document.getElementById('activeCustomers').textContent = activeCustomers;
    
    // Update report card stats
    document.getElementById('salesAmount').textContent = Math.round(totalRevenue * 80).toLocaleString('en-IN');
    document.getElementById('avgMargin').textContent = profitMargin + '%';
    document.getElementById('topCustomer').textContent = getTopCustomer(jobs);
    document.getElementById('completedJobs').textContent = completedJobs;
    document.getElementById('outstandingAmount').textContent = Math.round(outstandingAmount * 80).toLocaleString('en-IN');
    document.getElementById('gstCollected').textContent = Math.round(gstCollected * 80).toLocaleString('en-IN');
}

function getTopCustomer(jobs) {
    const customerRevenue = {};
    jobs.forEach(job => {
        const customer = job.customer;
        const revenue = (job.customerRate || 0) * (job.cbm || 0);
        customerRevenue[customer] = (customerRevenue[customer] || 0) + revenue;
    });
    
    const topCustomer = Object.keys(customerRevenue).reduce((a, b) => 
        customerRevenue[a] > customerRevenue[b] ? a : b, Object.keys(customerRevenue)[0]);
    
    return topCustomer || 'No customers';
}

function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('fromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('toDate').value = today.toISOString().split('T')[0];
}

function showSalesReport() {
    const jobs = window.workflowManager.getJobs();
    const customerSales = {};
    
    // Group sales by customer
    jobs.forEach(job => {
        const customer = job.customer;
        const revenue = (job.customerRate || 0) * (job.cbm || 0) * 80; // Convert to INR
        const profit = (job.profit || 0) * 80;
        
        if (!customerSales[customer]) {
            customerSales[customer] = { revenue: 0, jobs: 0, profit: 0 };
        }
        customerSales[customer].revenue += revenue;
        customerSales[customer].jobs += 1;
        customerSales[customer].profit += profit;
    });
    
    document.getElementById('reportTitle').textContent = '💰 Sales Report';
    
    const totalRevenue = Object.values(customerSales).reduce((sum, c) => sum + c.revenue, 0);
    const totalJobs = Object.values(customerSales).reduce((sum, c) => sum + c.jobs, 0);
    const totalProfit = Object.values(customerSales).reduce((sum, c) => sum + c.profit, 0);
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Sales Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Revenue:</label>
                    <span>₹${Math.round(totalRevenue).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Total Jobs:</label>
                    <span>${totalJobs}</span>
                </div>
                <div class="summary-item">
                    <label>Total Profit:</label>
                    <span>₹${Math.round(totalProfit).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Jobs</th>
                    <th>Avg per Job</th>
                    <th>Profit</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.entries(customerSales).forEach(([customer, data]) => {
        const avgPerJob = data.jobs > 0 ? Math.round(data.revenue / data.jobs) : 0;
        reportHTML += `
            <tr>
                <td>${customer}</td>
                <td>₹${Math.round(data.revenue).toLocaleString('en-IN')}</td>
                <td>${data.jobs}</td>
                <td>₹${avgPerJob.toLocaleString('en-IN')}</td>
                <td>₹${Math.round(data.profit).toLocaleString('en-IN')}</td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showProfitReport() {
    const jobs = window.workflowManager.getJobs();
    
    document.getElementById('reportTitle').textContent = '📊 Profit Analysis Report';
    
    const totalProfit = jobs.reduce((sum, job) => sum + (job.profit || 0), 0) * 80;
    const avgMargin = jobs.length > 0 ? jobs.reduce((sum, job) => {
        const revenue = (job.customerRate || 0) * (job.cbm || 0);
        return sum + (revenue > 0 ? ((job.profit || 0) / revenue) * 100 : 0);
    }, 0) / jobs.length : 0;
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Profit Analysis</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Profit:</label>
                    <span>₹${Math.round(totalProfit).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Average Margin:</label>
                    <span>${avgMargin.toFixed(1)}%</span>
                </div>
                <div class="summary-item">
                    <label>Total Jobs:</label>
                    <span>${jobs.length}</span>
                </div>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Job No</th>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Margin %</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    jobs.forEach(job => {
        const revenue = (job.customerRate || 0) * (job.cbm || 0) * 80;
        const profit = (job.profit || 0) * 80;
        const margin = revenue > 0 ? ((job.profit || 0) / ((job.customerRate || 0) * (job.cbm || 0))) * 100 : 0;
        
        reportHTML += `
            <tr>
                <td>${job.no}</td>
                <td>${job.customer}</td>
                <td>₹${Math.round(revenue).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(profit).toLocaleString('en-IN')}</td>
                <td><strong>${margin.toFixed(1)}%</strong></td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showCustomerReport() {
    const enquiries = window.workflowManager.getEnquiries();
    const jobs = window.workflowManager.getJobs();
    const invoices = window.workflowManager.getInvoices();
    
    const customerData = {};
    
    // Collect customer data
    enquiries.forEach(enq => {
        if (!customerData[enq.customer]) {
            customerData[enq.customer] = { enquiries: 0, jobs: 0, revenue: 0, outstanding: 0 };
        }
        customerData[enq.customer].enquiries++;
    });
    
    jobs.forEach(job => {
        if (customerData[job.customer]) {
            customerData[job.customer].jobs++;
            customerData[job.customer].revenue += (job.customerRate || 0) * (job.cbm || 0) * 80;
        }
    });
    
    invoices.filter(i => i.status === 'sent').forEach(inv => {
        if (customerData[inv.customer]) {
            customerData[inv.customer].outstanding += (inv.total || 0) * 80;
        }
    });
    
    document.getElementById('reportTitle').textContent = '👥 Customer Analysis Report';
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Customer Analysis</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Customers:</label>
                    <span>${Object.keys(customerData).length}</span>
                </div>
                <div class="summary-item">
                    <label>Active Customers:</label>
                    <span>${Object.values(customerData).filter(c => c.jobs > 0).length}</span>
                </div>
                <div class="summary-item">
                    <label>Conversion Rate:</label>
                    <span>${Object.keys(customerData).length > 0 ? Math.round((Object.values(customerData).filter(c => c.jobs > 0).length / Object.keys(customerData).length) * 100) : 0}%</span>
                </div>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Enquiries</th>
                    <th>Jobs</th>
                    <th>Revenue</th>
                    <th>Outstanding</th>
                    <th>Conversion</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.entries(customerData).forEach(([customer, data]) => {
        const conversion = data.enquiries > 0 ? Math.round((data.jobs / data.enquiries) * 100) : 0;
        reportHTML += `
            <tr>
                <td>${customer}</td>
                <td>${data.enquiries}</td>
                <td>${data.jobs}</td>
                <td>₹${Math.round(data.revenue).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(data.outstanding).toLocaleString('en-IN')}</td>
                <td>${conversion}%</td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showOperationsReport() {
    const jobs = window.workflowManager.getJobs();
    
    document.getElementById('reportTitle').textContent = '🚢 Operations Performance Report';
    
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const inProgressJobs = jobs.filter(j => j.status === 'in-progress').length;
    const documentedJobs = jobs.filter(j => j.status === 'documented').length;
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Operations Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Jobs:</label>
                    <span>${totalJobs}</span>
                </div>
                <div class="summary-item">
                    <label>Completed:</label>
                    <span>${completedJobs}</span>
                </div>
                <div class="summary-item">
                    <label>In Progress:</label>
                    <span>${inProgressJobs}</span>
                </div>
            </div>
        </div>
        <div class="operations-metrics">
            <h4>Job Status Breakdown</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Completed</td>
                        <td>${completedJobs}</td>
                        <td>${totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%</td>
                    </tr>
                    <tr>
                        <td>Documented</td>
                        <td>${documentedJobs}</td>
                        <td>${totalJobs > 0 ? Math.round((documentedJobs / totalJobs) * 100) : 0}%</td>
                    </tr>
                    <tr>
                        <td>In Progress</td>
                        <td>${inProgressJobs}</td>
                        <td>${totalJobs > 0 ? Math.round((inProgressJobs / totalJobs) * 100) : 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showFinancialReport() {
    const invoices = window.workflowManager.getInvoices();
    const payments = window.workflowManager.getPayments();
    
    document.getElementById('reportTitle').textContent = '💳 Financial Summary Report';
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0) * 80;
    const totalReceived = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0) * 80;
    const outstanding = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total || 0), 0) * 80;
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Financial Overview</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Invoiced:</label>
                    <span>₹${Math.round(totalInvoiced).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Total Received:</label>
                    <span>₹${Math.round(totalReceived).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Outstanding:</label>
                    <span>₹${Math.round(outstanding).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
        <div class="financial-breakdown">
            <h4>Cash Flow Analysis</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Revenue Collected</td>
                        <td>₹${Math.round(totalReceived).toLocaleString('en-IN')}</td>
                        <td>${totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0}%</td>
                    </tr>
                    <tr>
                        <td>Outstanding Receivables</td>
                        <td>₹${Math.round(outstanding).toLocaleString('en-IN')}</td>
                        <td>${totalInvoiced > 0 ? Math.round((outstanding / totalInvoiced) * 100) : 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showGSTReport() {
    const invoices = window.workflowManager.getInvoices();
    
    document.getElementById('reportTitle').textContent = '🧾 GST Compliance Report';
    
    const totalGST = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0) * 80;
    const paidGST = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.tax || 0), 0) * 80;
    
    let reportHTML = `
        <div class="report-summary">
            <h4>GST Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>GST Collected:</label>
                    <span>₹${Math.round(totalGST).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>GST on Paid Invoices:</label>
                    <span>₹${Math.round(paidGST).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>GST Pending:</label>
                    <span>₹${Math.round(totalGST - paidGST).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
        <div class="gst-breakdown">
            <h4>Invoice-wise GST</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Invoice No</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>GST (18%)</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    invoices.forEach(inv => {
        const amount = (inv.total || 0) - (inv.tax || 0);
        const gst = inv.tax || 0;
        const total = inv.total || 0;
        
        reportHTML += `
            <tr>
                <td>${inv.no}</td>
                <td>${inv.customer}</td>
                <td>₹${Math.round(amount * 80).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(gst * 80).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(total * 80).toLocaleString('en-IN')}</td>
                <td><span class="status-${inv.status === 'paid' ? 'success' : 'warning'}">${inv.status.toUpperCase()}</span></td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table></div>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function generateReport() {
    alert('Custom Report Generator:\n\n1. Select report type\n2. Choose date range\n3. Apply filters\n4. Generate PDF/Excel\n\nAdvanced report builder - Coming Soon!');
}

function exportAllReports() {
    alert('Exporting all reports to Excel...\nBulk export functionality - Coming Soon!');
}

function applyReportFilters() {
    alert('Applying filters to current report...\nFiltered data will be displayed.\n\nAdvanced filtering - Coming Soon!');
}

function exportReport() {
    alert('Exporting current report to Excel...\nExport functionality - Coming Soon!');
}

function printReport() {
    alert('Printing current report...\nPrint functionality - Coming Soon!');
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function startAutoRefresh() {
    setInterval(loadReportsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        closeReportModal();
    }
}