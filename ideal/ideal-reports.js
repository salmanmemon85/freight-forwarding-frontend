// Reports Management JavaScript

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

// Sample business data for reports
const businessData = {
    sales: [
        { customer: 'ABC Industries', amount: 51920, jobs: 2, profit: 15920 },
        { customer: 'XYZ Exports', amount: 45312, jobs: 1, profit: 12312 },
        { customer: 'Global Trading', amount: 73632, jobs: 1, profit: 23632 },
        { customer: 'Tech Solutions', amount: 30925, jobs: 1, profit: 8925 },
        { customer: 'Food Corp', amount: 22656, jobs: 1, profit: 6656 }
    ],
    jobs: [
        { jobNo: 'JOB001', customer: 'ABC Industries', revenue: 51920, cost: 36000, profit: 15920, margin: 30.6 },
        { jobNo: 'JOB002', customer: 'XYZ Exports', revenue: 45312, cost: 33000, profit: 12312, margin: 27.2 },
        { jobNo: 'JOB003', customer: 'Global Trading', revenue: 73632, cost: 50000, profit: 23632, margin: 32.1 },
        { jobNo: 'JOB004', customer: 'Tech Solutions', revenue: 30925, cost: 22000, profit: 8925, margin: 28.9 },
        { jobNo: 'JOB005', customer: 'Food Corp', revenue: 22656, cost: 16000, profit: 6656, margin: 29.4 }
    ],
    outstanding: [
        { customer: 'ABC Industries', amount: 51920, days: 15 },
        { customer: 'Tech Solutions', amount: 30925, days: 45 },
        { customer: 'Food Corp', amount: 22656, days: 8 }
    ]
};

function loadReportsData() {
    // Calculate summary stats
    const totalRevenue = businessData.sales.reduce((sum, item) => sum + item.amount, 0);
    const totalProfit = businessData.sales.reduce((sum, item) => sum + item.profit, 0);
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const activeCustomers = businessData.sales.length;
    const avgMargin = businessData.jobs.reduce((sum, job) => sum + job.margin, 0) / businessData.jobs.length;
    const topCustomer = businessData.sales.reduce((max, customer) => 
        customer.amount > max.amount ? customer : max, businessData.sales[0]);
    const completedJobs = businessData.jobs.length;
    const outstandingAmount = businessData.outstanding.reduce((sum, item) => sum + item.amount, 0);
    const gstCollected = Math.round(totalRevenue * 0.18);
    
    // Update main stats
    document.getElementById('monthlyRevenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN');
    document.getElementById('monthlyProfit').textContent = '₹' + totalProfit.toLocaleString('en-IN');
    document.getElementById('profitMargin').textContent = profitMargin + '%';
    document.getElementById('activeCustomers').textContent = activeCustomers;
    
    // Update report card stats
    document.getElementById('salesAmount').textContent = totalRevenue.toLocaleString('en-IN');
    document.getElementById('avgMargin').textContent = avgMargin.toFixed(1);
    document.getElementById('topCustomer').textContent = topCustomer.customer;
    document.getElementById('completedJobs').textContent = completedJobs;
    document.getElementById('outstandingAmount').textContent = outstandingAmount.toLocaleString('en-IN');
    document.getElementById('gstCollected').textContent = gstCollected.toLocaleString('en-IN');
}

function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('fromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('toDate').value = today.toISOString().split('T')[0];
}

function showSalesReport() {
    document.getElementById('reportTitle').textContent = '💰 Sales Report';
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Sales Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Revenue:</label>
                    <span>₹${businessData.sales.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Total Jobs:</label>
                    <span>${businessData.sales.reduce((sum, item) => sum + item.jobs, 0)}</span>
                </div>
                <div class="summary-item">
                    <label>Average Deal Size:</label>
                    <span>₹${Math.round(businessData.sales.reduce((sum, item) => sum + item.amount, 0) / businessData.sales.length).toLocaleString('en-IN')}</span>
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
    
    businessData.sales.forEach(item => {
        const avgPerJob = Math.round(item.amount / item.jobs);
        reportHTML += `
            <tr>
                <td>${item.customer}</td>
                <td>₹${item.amount.toLocaleString('en-IN')}</td>
                <td>${item.jobs}</td>
                <td>₹${avgPerJob.toLocaleString('en-IN')}</td>
                <td>₹${item.profit.toLocaleString('en-IN')}</td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showProfitReport() {
    document.getElementById('reportTitle').textContent = '📊 Profit Analysis Report';
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Profit Analysis</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Profit:</label>
                    <span>₹${businessData.jobs.reduce((sum, job) => sum + job.profit, 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Average Margin:</label>
                    <span>${(businessData.jobs.reduce((sum, job) => sum + job.margin, 0) / businessData.jobs.length).toFixed(1)}%</span>
                </div>
                <div class="summary-item">
                    <label>Best Margin:</label>
                    <span>${Math.max(...businessData.jobs.map(job => job.margin)).toFixed(1)}%</span>
                </div>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Job No</th>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Margin %</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    businessData.jobs.forEach(job => {
        reportHTML += `
            <tr>
                <td>${job.jobNo}</td>
                <td>${job.customer}</td>
                <td>₹${job.revenue.toLocaleString('en-IN')}</td>
                <td>₹${job.cost.toLocaleString('en-IN')}</td>
                <td>₹${job.profit.toLocaleString('en-IN')}</td>
                <td><strong>${job.margin.toFixed(1)}%</strong></td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showCustomerReport() {
    document.getElementById('reportTitle').textContent = '👥 Customer Analysis Report';
    
    const sortedCustomers = [...businessData.sales].sort((a, b) => b.amount - a.amount);
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Customer Analysis</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Customers:</label>
                    <span>${businessData.sales.length}</span>
                </div>
                <div class="summary-item">
                    <label>Top Customer:</label>
                    <span>${sortedCustomers[0].customer}</span>
                </div>
                <div class="summary-item">
                    <label>Outstanding:</label>
                    <span>₹${businessData.outstanding.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Jobs</th>
                    <th>Outstanding</th>
                    <th>Payment Days</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedCustomers.forEach((customer, index) => {
        const outstanding = businessData.outstanding.find(o => o.customer === customer.customer);
        reportHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${customer.customer}</td>
                <td>₹${customer.amount.toLocaleString('en-IN')}</td>
                <td>${customer.jobs}</td>
                <td>₹${outstanding ? outstanding.amount.toLocaleString('en-IN') : '0'}</td>
                <td>${outstanding ? outstanding.days + ' days' : 'Paid'}</td>
            </tr>
        `;
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showOperationsReport() {
    document.getElementById('reportTitle').textContent = '🚢 Operations Performance Report';
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Operations Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Jobs:</label>
                    <span>${businessData.jobs.length}</span>
                </div>
                <div class="summary-item">
                    <label>Completion Rate:</label>
                    <span>100%</span>
                </div>
                <div class="summary-item">
                    <label>Avg Transit:</label>
                    <span>8 days</span>
                </div>
            </div>
        </div>
        <div class="operations-metrics">
            <h4>Performance Metrics</h4>
            <ul>
                <li>✅ On-time delivery: 95%</li>
                <li>✅ Document accuracy: 98%</li>
                <li>✅ Customer satisfaction: 4.8/5</li>
                <li>✅ Agent performance: Excellent</li>
                <li>✅ Cost efficiency: 92%</li>
            </ul>
        </div>
    `;
    
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showFinancialReport() {
    document.getElementById('reportTitle').textContent = '💳 Financial Summary Report';
    
    const totalRevenue = businessData.sales.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = businessData.jobs.reduce((sum, job) => sum + job.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const outstandingAmount = businessData.outstanding.reduce((sum, item) => sum + item.amount, 0);
    
    let reportHTML = `
        <div class="report-summary">
            <h4>Financial Overview</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>Total Revenue:</label>
                    <span>₹${totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Total Cost:</label>
                    <span>₹${totalCost.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>Net Profit:</label>
                    <span>₹${totalProfit.toLocaleString('en-IN')}</span>
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
                        <td>₹${(totalRevenue - outstandingAmount).toLocaleString('en-IN')}</td>
                        <td>${Math.round(((totalRevenue - outstandingAmount) / totalRevenue) * 100)}%</td>
                    </tr>
                    <tr>
                        <td>Outstanding Receivables</td>
                        <td>₹${outstandingAmount.toLocaleString('en-IN')}</td>
                        <td>${Math.round((outstandingAmount / totalRevenue) * 100)}%</td>
                    </tr>
                    <tr>
                        <td>Agent Payments</td>
                        <td>₹${totalCost.toLocaleString('en-IN')}</td>
                        <td>${Math.round((totalCost / totalRevenue) * 100)}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('reportData').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function showGSTReport() {
    document.getElementById('reportTitle').textContent = '🧾 GST Compliance Report';
    
    const totalRevenue = businessData.sales.reduce((sum, item) => sum + item.amount, 0);
    const gstCollected = Math.round(totalRevenue * 0.18);
    const gstPaid = Math.round(gstCollected * 0.8); // Assuming 80% paid
    
    let reportHTML = `
        <div class="report-summary">
            <h4>GST Summary</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <label>GST Collected:</label>
                    <span>₹${gstCollected.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>GST Paid:</label>
                    <span>₹${gstPaid.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                    <label>GST Pending:</label>
                    <span>₹${(gstCollected - gstPaid).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
        <div class="gst-breakdown">
            <h4>Invoice-wise GST</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Invoice Amount</th>
                        <th>GST (18%)</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    businessData.sales.forEach(sale => {
        const gst = Math.round(sale.amount * 0.18);
        const total = sale.amount + gst;
        reportHTML += `
            <tr>
                <td>${sale.customer}</td>
                <td>₹${sale.amount.toLocaleString('en-IN')}</td>
                <td>₹${gst.toLocaleString('en-IN')}</td>
                <td>₹${total.toLocaleString('en-IN')}</td>
                <td><span class="status-success">COLLECTED</span></td>
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