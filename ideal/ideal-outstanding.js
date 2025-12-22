// Outstanding Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadOutstandingData();
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

// Sample outstanding data
const outstandingData = [
    { 
        customer: 'ABC Industries', 
        invoiceNo: 'INV001', 
        invoiceDate: '2024-01-15', 
        dueDate: '2024-02-14',
        amount: 51920,
        status: 'pending'
    },
    { 
        customer: 'Tech Solutions', 
        invoiceNo: 'INV004', 
        invoiceDate: '2024-01-12', 
        dueDate: '2024-02-11',
        amount: 30925,
        status: 'overdue'
    },
    { 
        customer: 'Food Corp', 
        invoiceNo: 'INV005', 
        invoiceDate: '2024-01-16', 
        dueDate: '2024-02-15',
        amount: 22656,
        status: 'pending'
    },
    { 
        customer: 'Manufacturing Ltd', 
        invoiceNo: 'INV006', 
        invoiceDate: '2023-12-15', 
        dueDate: '2024-01-14',
        amount: 45000,
        status: 'critical'
    },
    { 
        customer: 'Export House', 
        invoiceNo: 'INV007', 
        invoiceDate: '2023-11-20', 
        dueDate: '2023-12-20',
        amount: 67500,
        status: 'critical'
    }
];

function loadOutstandingData() {
    // Calculate aging
    const today = new Date();
    const outstandingWithAging = outstandingData.map(item => {
        const dueDate = new Date(item.dueDate);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        return { ...item, daysOverdue };
    });
    
    // Calculate stats
    const totalOutstanding = outstandingWithAging.reduce((sum, item) => sum + item.amount, 0);
    const overdue30 = outstandingWithAging
        .filter(item => item.daysOverdue > 30 && item.daysOverdue <= 60)
        .reduce((sum, item) => sum + item.amount, 0);
    const overdue60 = outstandingWithAging
        .filter(item => item.daysOverdue > 60)
        .reduce((sum, item) => sum + item.amount, 0);
    const uniqueCustomers = [...new Set(outstandingWithAging.map(item => item.customer))].length;
    
    document.getElementById('totalOutstanding').textContent = '₹' + totalOutstanding.toLocaleString('en-IN');
    document.getElementById('overdue30').textContent = '₹' + overdue30.toLocaleString('en-IN');
    document.getElementById('overdue60').textContent = '₹' + overdue60.toLocaleString('en-IN');
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
    
    // Load table data
    displayOutstanding(outstandingWithAging);
}

function displayOutstanding(outstanding) {
    const tbody = document.getElementById('outstandingTable');
    tbody.innerHTML = '';
    
    outstanding.forEach(item => {
        const statusClass = getAgingStatusClass(item.daysOverdue);
        const statusText = getAgingStatusText(item.daysOverdue);
        
        const row = `
            <tr class="${statusClass}">
                <td><strong>${item.customer}</strong></td>
                <td>${item.invoiceNo}</td>
                <td>${formatDate(item.invoiceDate)}</td>
                <td>${formatDate(item.dueDate)}</td>
                <td>
                    <span class="days-overdue ${statusClass}">
                        ${item.daysOverdue > 0 ? item.daysOverdue : 0} days
                    </span>
                </td>
                <td><strong>₹${item.amount.toLocaleString('en-IN')}</strong></td>
                <td><span class="status-${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-small" onclick="sendReminder('${item.invoiceNo}')">📧 Remind</button>
                    <button class="btn-small" onclick="viewInvoice('${item.invoiceNo}')">👁️ View</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getAgingStatusClass(daysOverdue) {
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 30) return 'current';
    if (daysOverdue <= 60) return 'warning';
    return 'danger';
}

function getAgingStatusText(daysOverdue) {
    if (daysOverdue <= 0) return 'CURRENT';
    if (daysOverdue <= 30) return 'CURRENT';
    if (daysOverdue <= 60) return 'OVERDUE';
    return 'CRITICAL';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function filterOutstanding() {
    const agingFilter = document.getElementById('agingFilter').value;
    const searchTerm = document.getElementById('searchOutstanding').value.toLowerCase();
    
    // Calculate aging for filtering
    const today = new Date();
    let filtered = outstandingData.map(item => {
        const dueDate = new Date(item.dueDate);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        return { ...item, daysOverdue };
    });
    
    // Apply aging filter
    if (agingFilter !== 'all') {
        switch(agingFilter) {
            case 'current':
                filtered = filtered.filter(item => item.daysOverdue <= 30);
                break;
            case 'overdue30':
                filtered = filtered.filter(item => item.daysOverdue > 30 && item.daysOverdue <= 60);
                break;
            case 'overdue60':
                filtered = filtered.filter(item => item.daysOverdue > 60);
                break;
        }
    }
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.customer.toLowerCase().includes(searchTerm) ||
            item.invoiceNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayOutstanding(filtered);
}

function sendReminders() {
    const overdueCount = outstandingData.filter(item => {
        const today = new Date();
        const dueDate = new Date(item.dueDate);
        return today > dueDate;
    }).length;
    
    alert(`Sending payment reminders to ${overdueCount} customers...\n\nReminder emails will be sent for all overdue invoices.\n\nEmail automation - Coming Soon!`);
}

function sendReminder(invoiceNo) {
    const invoice = outstandingData.find(item => item.invoiceNo === invoiceNo);
    alert(`Sending payment reminder to ${invoice.customer} for ${invoiceNo}...\n\nReminder sent successfully!\n\nEmail automation - Coming Soon!`);
}

function viewInvoice(invoiceNo) {
    const invoice = outstandingData.find(item => item.invoiceNo === invoiceNo);
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    alert(`Outstanding Invoice Details:\n\nInvoice No: ${invoice.invoiceNo}\nCustomer: ${invoice.customer}\nInvoice Date: ${formatDate(invoice.invoiceDate)}\nDue Date: ${formatDate(invoice.dueDate)}\nDays Overdue: ${daysOverdue > 0 ? daysOverdue : 0}\nAmount: ₹${invoice.amount.toLocaleString('en-IN')}\nStatus: ${getAgingStatusText(daysOverdue)}`);
}

function showAgingReport() {
    calculateAgingBuckets();
    document.getElementById('agingReportModal').style.display = 'block';
}

function calculateAgingBuckets() {
    const today = new Date();
    const buckets = {
        '0to30': { amount: 0, count: 0 },
        '31to60': { amount: 0, count: 0 },
        '61to90': { amount: 0, count: 0 },
        '90plus': { amount: 0, count: 0 }
    };
    
    outstandingData.forEach(item => {
        const dueDate = new Date(item.dueDate);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 30) {
            buckets['0to30'].amount += item.amount;
            buckets['0to30'].count++;
        } else if (daysOverdue <= 60) {
            buckets['31to60'].amount += item.amount;
            buckets['31to60'].count++;
        } else if (daysOverdue <= 90) {
            buckets['61to90'].amount += item.amount;
            buckets['61to90'].count++;
        } else {
            buckets['90plus'].amount += item.amount;
            buckets['90plus'].count++;
        }
    });
    
    // Update modal content
    document.getElementById('bucket0to30').textContent = '₹' + buckets['0to30'].amount.toLocaleString('en-IN');
    document.getElementById('count0to30').textContent = buckets['0to30'].count + ' invoices';
    
    document.getElementById('bucket31to60').textContent = '₹' + buckets['31to60'].amount.toLocaleString('en-IN');
    document.getElementById('count31to60').textContent = buckets['31to60'].count + ' invoices';
    
    document.getElementById('bucket61to90').textContent = '₹' + buckets['61to90'].amount.toLocaleString('en-IN');
    document.getElementById('count61to90').textContent = buckets['61to90'].count + ' invoices';
    
    document.getElementById('bucket90plus').textContent = '₹' + buckets['90plus'].amount.toLocaleString('en-IN');
    document.getElementById('count90plus').textContent = buckets['90plus'].count + ' invoices';
}

function closeAgingModal() {
    document.getElementById('agingReportModal').style.display = 'none';
}

function exportAging() {
    alert('Exporting aging report to Excel...\nExport functionality - Coming Soon!');
}

function printAging() {
    alert('Printing aging report...\nPrint functionality - Coming Soon!');
}

function startAutoRefresh() {
    setInterval(loadOutstandingData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('agingReportModal');
    if (event.target === modal) {
        closeAgingModal();
    }
}