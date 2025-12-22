// Payments Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPaymentsData();
    checkInvoiceForPayment();
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

// Check if coming from invoice for payment recording
function checkInvoiceForPayment() {
    const invoiceNo = sessionStorage.getItem('recordPaymentForInvoice');
    if (invoiceNo) {
        sessionStorage.removeItem('recordPaymentForInvoice');
        showRecordPaymentForInvoice(invoiceNo);
    }
}

function loadPaymentsData() {
    // Get payments from workflow manager
    const payments = window.workflowManager.getPayments();
    const invoices = window.workflowManager.getInvoices();
    
    // Calculate stats
    const totalPayments = payments.length;
    const todayPayments = payments.filter(p => p.date === new Date().toISOString().split('T')[0]).length;
    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
    
    document.getElementById('totalReceived').textContent = '₹' + Math.round(totalReceived * 80).toLocaleString('en-IN');
    document.getElementById('totalPaid').textContent = '₹0'; // Agent payments not implemented yet
    document.getElementById('netBalance').textContent = '₹' + Math.round(totalReceived * 80).toLocaleString('en-IN');
    document.getElementById('monthPayments').textContent = '₹' + Math.round(totalReceived * 80).toLocaleString('en-IN');
    
    // Load table data
    displayPayments(payments);
}

function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTable');
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const statusClass = getPaymentStatusClass(payment.status);
        
        const row = `
            <tr>
                <td>
                    <strong>${payment.id}</strong>
                    <br><small>INV: ${payment.invoiceNo}</small>
                </td>
                <td>${formatDate(payment.date)}</td>
                <td>
                    <span class="payment-type received">
                        📥 RECEIVED
                    </span>
                </td>
                <td>${payment.customer}</td>
                <td>${payment.invoiceNo}</td>
                <td>${payment.method || 'Bank Transfer'}</td>
                <td class="received">
                    +₹${Math.round((payment.amount || 0) * 80).toLocaleString('en-IN')}
                </td>
                <td><span class="status-${statusClass}">${payment.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewPayment('${payment.id}')">👁️ View</button>
                    <button class="btn-small" onclick="printReceipt('${payment.id}')">🖨️ Receipt</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getPaymentStatusClass(status) {
    switch(status) {
        case 'cleared': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        default: return 'default';
    }
}

// Show payment recording modal for specific invoice
function showRecordPaymentForInvoice(invoiceNo) {
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    // Pre-fill form with invoice data
    document.getElementById('reference').value = invoiceNo;
    document.getElementById('party').value = invoice.customer;
    document.getElementById('amount').value = (invoice.total || 0).toFixed(2);
    
    // Store invoice reference
    document.getElementById('addPaymentForm').dataset.invoiceNo = invoiceNo;
    
    showAddPayment();
    
    alert(`💳 Record payment for ${invoiceNo}\n\n📋 Invoice Details:\nCustomer: ${invoice.customer}\nAmount: $${invoice.total}\n\n🎯 Enter payment details to complete transaction`);
}

function showAddPayment() {
    document.getElementById('addPaymentModal').style.display = 'block';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
}

function viewPayment(paymentId) {
    const payment = window.workflowManager.getPayments().find(p => p.id === paymentId);
    if (!payment) return;
    
    let details = `💳 Payment Details - ${paymentId}\n\n`;
    details += `👤 Customer: ${payment.customer}\n`;
    details += `🧾 Invoice: ${payment.invoiceNo}\n`;
    details += `💼 Job: ${payment.jobNo}\n`;
    details += `📅 Date: ${formatDate(payment.date)}\n\n`;
    
    details += `💰 Payment Details:\n`;
    details += `Amount: $${(payment.amount || 0).toFixed(2)}\n`;
    details += `Method: ${payment.method || 'Bank Transfer'}\n`;
    details += `Reference: ${payment.reference || 'N/A'}\n`;
    details += `Bank: ${payment.bank || 'Default Bank'}\n\n`;
    
    details += `📋 Status: ${payment.status.toUpperCase()}`;
    
    alert(details);
}

function printReceipt(paymentId) {
    const payment = window.workflowManager.getPayments().find(p => p.id === paymentId);
    if (!payment) return;
    
    alert(`🖨️ Printing receipt for ${paymentId}\n\nReceipt Details:\nCustomer: ${payment.customer}\nAmount: $${payment.amount}\nDate: ${formatDate(payment.date)}\n\nPDF generation - Coming Soon!`);
}

function filterPayments() {
    const typeFilter = document.getElementById('typeFilter').value;
    const methodFilter = document.getElementById('methodFilter').value;
    const searchTerm = document.getElementById('searchPayment').value.toLowerCase();
    
    let payments = window.workflowManager.getPayments();
    
    if (typeFilter !== 'all') {
        // For now, all payments are 'received' type
        if (typeFilter !== 'received') {
            payments = [];
        }
    }
    
    if (methodFilter !== 'all') {
        payments = payments.filter(payment => (payment.method || 'bank') === methodFilter);
    }
    
    if (searchTerm) {
        payments = payments.filter(payment => 
            payment.id.toLowerCase().includes(searchTerm) ||
            payment.customer.toLowerCase().includes(searchTerm) ||
            payment.invoiceNo.toLowerCase().includes(searchTerm) ||
            payment.jobNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayPayments(payments);
}

function closeModal() {
    document.getElementById('addPaymentModal').style.display = 'none';
    document.getElementById('addPaymentForm').reset();
    delete document.getElementById('addPaymentForm').dataset.invoiceNo;
}

function showPaymentReport() {
    const payments = window.workflowManager.getPayments();
    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const clearedPayments = payments.filter(p => p.status === 'cleared');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    let report = `📊 Payment Report\n\n`;
    report += `Total Received: $${totalReceived.toFixed(2)}\n`;
    report += `Cleared Payments: ${clearedPayments.length}\n`;
    report += `Pending Payments: ${pendingPayments.length}\n\n`;
    
    if (clearedPayments.length > 0) {
        report += `Recent Payments:\n`;
        clearedPayments.slice(0, 3).forEach(p => {
            report += `${p.id}: ${p.customer} - $${p.amount.toFixed(2)}\n`;
        });
    }
    
    alert(report);
}

// Form submission for payment recording
document.getElementById('addPaymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const invoiceNo = this.dataset.invoiceNo;
    if (!invoiceNo) {
        alert('No invoice selected!');
        return;
    }
    
    const paymentData = {
        amount: parseFloat(document.getElementById('amount').value) || 0,
        method: document.getElementById('paymentMethod').value,
        reference: document.getElementById('transactionRef').value || '',
        bank: 'Default Bank',
        notes: ''
    };
    
    // Record payment for invoice
    const payment = window.workflowManager.recordPayment(invoiceNo, paymentData);
    
    if (payment) {
        alert(`✅ Payment Recorded Successfully!\n\n💳 Payment: ${payment.id}\n👤 Customer: ${payment.customer}\n💰 Amount: $${payment.amount.toFixed(2)}\n\n🎯 Job completed and workflow closed!`);
        
        loadPaymentsData();
        closeModal();
    } else {
        alert('❌ Failed to record payment!');
    }
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadPaymentsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addPaymentModal');
    if (event.target === modal) {
        closeModal();
    }
}