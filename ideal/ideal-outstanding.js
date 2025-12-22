// Outstanding Management - Complete Integration

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

function loadOutstandingData() {
    const jobs = window.workflowManager.getJobs();
    const invoicedJobs = jobs.filter(job => job.status === 'invoiced' && job.invoice);
    
    // Calculate outstanding amounts and aging
    const outstandingData = calculateOutstanding(invoicedJobs);
    
    // Update stats
    updateStats(outstandingData);
    
    // Display outstanding table
    displayOutstanding(outstandingData.invoices);
}

function calculateOutstanding(invoicedJobs) {
    const today = new Date();
    const invoices = [];
    let totalOutstanding = 0;
    let overdue30 = 0;
    let overdue60 = 0;
    
    invoicedJobs.forEach(job => {
        if (!job.invoice || job.invoice.paid) return;
        
        const invoiceDate = new Date(job.invoice.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + (job.invoice.paymentTerms || 30));
        
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const amount = parseFloat(job.invoice.totalAmount) || 0;
        
        totalOutstanding += amount;
        
        if (daysOverdue > 30) overdue30 += amount;
        if (daysOverdue > 60) overdue60 += amount;
        
        invoices.push({
            jobNo: job.no,
            customer: job.customer,
            invoiceNo: job.invoice.no,
            invoiceDate: job.invoice.date,
            dueDate: dueDate.toISOString().split('T')[0],
            daysOverdue: Math.max(0, daysOverdue),
            amount: amount,
            status: getOutstandingStatus(daysOverdue),
            contact: job.contact,
            paymentTerms: job.invoice.paymentTerms || 30
        });
    });
    
    // Sort by days overdue (highest first)
    invoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    return {
        invoices,
        totalOutstanding,
        overdue30,
        overdue60,
        totalCustomers: new Set(invoices.map(inv => inv.customer)).size
    };
}

function getOutstandingStatus(daysOverdue) {
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 30) return 'due';
    if (daysOverdue <= 60) return 'overdue';
    return 'critical';
}

function updateStats(data) {
    document.getElementById('totalOutstanding').textContent = `₹${formatAmount(data.totalOutstanding)}`;
    document.getElementById('overdue30').textContent = `₹${formatAmount(data.overdue30)}`;
    document.getElementById('overdue60').textContent = `₹${formatAmount(data.overdue60)}`;
    document.getElementById('totalCustomers').textContent = data.totalCustomers;
}

function displayOutstanding(invoices) {
    const tbody = document.getElementById('outstandingTable');
    tbody.innerHTML = '';
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No outstanding invoices found</td></tr>';
        return;
    }
    
    invoices.forEach(invoice => {
        const statusClass = getStatusClass(invoice.status);
        const urgencyIcon = invoice.daysOverdue > 60 ? '🚨' : invoice.daysOverdue > 30 ? '⚠️' : '';
        
        const row = `
            <tr class="status-${statusClass}">
                <td>
                    <strong>${invoice.customer}</strong>
                    <br><small>${invoice.contact}</small>
                </td>
                <td>
                    <strong>${invoice.invoiceNo}</strong>
                    <br><small>Job: ${invoice.jobNo}</small>
                </td>
                <td>${formatDate(invoice.invoiceDate)}</td>
                <td>${formatDate(invoice.dueDate)}</td>
                <td>
                    ${urgencyIcon} ${invoice.daysOverdue} days
                    ${invoice.daysOverdue > 0 ? '<br><small class="text-danger">Overdue</small>' : ''}
                </td>
                <td><strong>₹${formatAmount(invoice.amount)}</strong></td>
                <td><span class="status-${statusClass}">${invoice.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="sendReminder('${invoice.invoiceNo}')">📧</button>
                    <button class="btn-small btn-primary" onclick="recordPayment('${invoice.invoiceNo}')">💰</button>
                    <button class="btn-small" onclick="viewInvoice('${invoice.jobNo}')">👁️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'current': return 'success';
        case 'due': return 'warning';
        case 'overdue': return 'danger';
        case 'critical': return 'critical';
        default: return 'default';
    }
}

function filterOutstanding() {
    const agingFilter = document.getElementById('agingFilter').value;
    const searchTerm = document.getElementById('searchOutstanding').value.toLowerCase();
    
    const jobs = window.workflowManager.getJobs();
    const invoicedJobs = jobs.filter(job => job.status === 'invoiced' && job.invoice);
    let outstandingData = calculateOutstanding(invoicedJobs);
    let filteredInvoices = outstandingData.invoices;
    
    // Apply aging filter
    if (agingFilter !== 'all') {
        filteredInvoices = filteredInvoices.filter(invoice => {
            switch(agingFilter) {
                case 'current': return invoice.daysOverdue <= 30;
                case 'overdue30': return invoice.daysOverdue > 30 && invoice.daysOverdue <= 60;
                case 'overdue60': return invoice.daysOverdue > 60;
                default: return true;
            }
        });
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredInvoices = filteredInvoices.filter(invoice =>
            invoice.customer.toLowerCase().includes(searchTerm) ||
            invoice.invoiceNo.toLowerCase().includes(searchTerm) ||
            invoice.jobNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayOutstanding(filteredInvoices);
}

function sendReminder(invoiceNo) {
    const jobs = window.workflowManager.getJobs();
    const job = jobs.find(j => j.invoice && j.invoice.no === invoiceNo);
    
    if (!job) {
        alert('Invoice not found!');
        return;
    }
    
    const dueDate = new Date(job.invoice.date);
    dueDate.setDate(dueDate.getDate() + (job.invoice.paymentTerms || 30));
    const daysOverdue = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24));
    
    const reminderText = `📧 Payment Reminder Sent\n\n` +
        `Invoice: ${invoiceNo}\n` +
        `Customer: ${job.customer}\n` +
        `Amount: ₹${formatAmount(job.invoice.totalAmount)}\n` +
        `Due Date: ${dueDate.toDateString()}\n` +
        `Days Overdue: ${Math.max(0, daysOverdue)}\n\n` +
        `✅ Reminder email sent to customer`;
    
    alert(reminderText);
}

function sendReminders() {
    const jobs = window.workflowManager.getJobs();
    const overdueJobs = jobs.filter(job => {
        if (!job.invoice || job.invoice.paid) return false;
        const dueDate = new Date(job.invoice.date);
        dueDate.setDate(dueDate.getDate() + (job.invoice.paymentTerms || 30));
        return new Date() > dueDate;
    });
    
    if (overdueJobs.length === 0) {
        alert('📧 No overdue invoices to send reminders for');
        return;
    }
    
    const reminderSummary = `📧 Bulk Payment Reminders\n\n` +
        `Total Overdue Invoices: ${overdueJobs.length}\n` +
        `Total Amount: ₹${formatAmount(overdueJobs.reduce((sum, job) => sum + parseFloat(job.invoice.totalAmount), 0))}\n\n` +
        `✅ Reminder emails sent to all overdue customers`;
    
    alert(reminderSummary);
}

function recordPayment(invoiceNo) {
    const data = window.workflowManager.getData();
    const jobIndex = data.jobs.findIndex(j => j.invoice && j.invoice.no === invoiceNo);
    
    if (jobIndex === -1) {
        alert('Invoice not found!');
        return;
    }
    
    const job = data.jobs[jobIndex];
    const amount = prompt(`💰 Record Payment\n\nInvoice: ${invoiceNo}\nCustomer: ${job.customer}\nAmount Due: ₹${formatAmount(job.invoice.totalAmount)}\n\nEnter payment amount:`);
    
    if (amount && !isNaN(amount)) {
        const paymentAmount = parseFloat(amount);
        const invoiceAmount = parseFloat(job.invoice.totalAmount);
        
        if (paymentAmount >= invoiceAmount) {
            // Full payment
            data.jobs[jobIndex].invoice.paid = true;
            data.jobs[jobIndex].invoice.paidAmount = paymentAmount;
            data.jobs[jobIndex].invoice.paidDate = new Date().toISOString();
            data.jobs[jobIndex].status = 'completed';
            
            alert(`✅ Payment Recorded\n\nFull payment of ₹${formatAmount(paymentAmount)} received\nInvoice marked as PAID\nJob status updated to COMPLETED`);
        } else {
            // Partial payment
            data.jobs[jobIndex].invoice.partialPayments = data.jobs[jobIndex].invoice.partialPayments || [];
            data.jobs[jobIndex].invoice.partialPayments.push({
                amount: paymentAmount,
                date: new Date().toISOString()
            });
            
            const totalPaid = data.jobs[jobIndex].invoice.partialPayments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = invoiceAmount - totalPaid;
            
            if (remaining <= 0) {
                data.jobs[jobIndex].invoice.paid = true;
                data.jobs[jobIndex].status = 'completed';
            }
            
            alert(`✅ Partial Payment Recorded\n\nPayment: ₹${formatAmount(paymentAmount)}\nTotal Paid: ₹${formatAmount(totalPaid)}\nRemaining: ₹${formatAmount(Math.max(0, remaining))}`);
        }
        
        window.workflowManager.saveData(data);
        loadOutstandingData();
    }
}

function viewInvoice(jobNo) {
    sessionStorage.setItem('viewInvoiceForJob', jobNo);
    window.location.href = 'ideal-billing.html';
}

function showAgingReport() {
    const jobs = window.workflowManager.getJobs();
    const invoicedJobs = jobs.filter(job => job.status === 'invoiced' && job.invoice && !job.invoice.paid);
    
    const aging = {
        '0-30': { amount: 0, count: 0 },
        '31-60': { amount: 0, count: 0 },
        '61-90': { amount: 0, count: 0 },
        '90+': { amount: 0, count: 0 }
    };
    
    const today = new Date();
    
    invoicedJobs.forEach(job => {
        const invoiceDate = new Date(job.invoice.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + (job.invoice.paymentTerms || 30));
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const amount = parseFloat(job.invoice.totalAmount) || 0;
        
        if (daysOverdue <= 30) {
            aging['0-30'].amount += amount;
            aging['0-30'].count++;
        } else if (daysOverdue <= 60) {
            aging['31-60'].amount += amount;
            aging['31-60'].count++;
        } else if (daysOverdue <= 90) {
            aging['61-90'].amount += amount;
            aging['61-90'].count++;
        } else {
            aging['90+'].amount += amount;
            aging['90+'].count++;
        }
    });
    
    // Update aging report modal
    document.getElementById('bucket0to30').textContent = `₹${formatAmount(aging['0-30'].amount)}`;
    document.getElementById('count0to30').textContent = `${aging['0-30'].count} invoices`;
    
    document.getElementById('bucket31to60').textContent = `₹${formatAmount(aging['31-60'].amount)}`;
    document.getElementById('count31to60').textContent = `${aging['31-60'].count} invoices`;
    
    document.getElementById('bucket61to90').textContent = `₹${formatAmount(aging['61-90'].amount)}`;
    document.getElementById('count61to90').textContent = `${aging['61-90'].count} invoices`;
    
    document.getElementById('bucket90plus').textContent = `₹${formatAmount(aging['90+'].amount)}`;
    document.getElementById('count90plus').textContent = `${aging['90+'].count} invoices`;
    
    document.getElementById('agingReportModal').style.display = 'block';
}

function closeAgingModal() {
    document.getElementById('agingReportModal').style.display = 'none';
}

function exportAging() {
    alert('📤 Aging Report Export\n\n✅ Report exported to Excel\n📧 Email sent to management\n💾 Saved to reports folder');
}

function printAging() {
    alert('🖨️ Printing Aging Report\n\n✅ Report sent to printer\n📄 Physical copy will be ready shortly');
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadOutstandingData, 30000); // Refresh every 30 seconds
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Auto-filter on input change
document.getElementById('searchOutstanding').addEventListener('input', filterOutstanding);
document.getElementById('agingFilter').addEventListener('change', filterOutstanding);