// Payments Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPaymentsData();
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

// Sample payments data
const paymentsData = [
    { 
        id: 'PAY001', 
        date: '2024-01-16', 
        type: 'received', 
        party: 'ABC Industries', 
        reference: 'INV001',
        method: 'bank',
        amount: 51920,
        status: 'cleared',
        transactionRef: 'TXN123456789'
    },
    { 
        id: 'PAY002', 
        date: '2024-01-15', 
        type: 'paid', 
        party: 'Dubai Agent', 
        reference: 'JOB001',
        method: 'bank',
        amount: 36000,
        status: 'cleared',
        transactionRef: 'TXN987654321'
    },
    { 
        id: 'PAY003', 
        date: '2024-01-14', 
        type: 'received', 
        party: 'XYZ Exports', 
        reference: 'INV002',
        method: 'online',
        amount: 45312,
        status: 'cleared',
        transactionRef: 'UPI123456'
    },
    { 
        id: 'PAY004', 
        date: '2024-01-13', 
        type: 'paid', 
        party: 'Singapore Agent', 
        reference: 'JOB002',
        method: 'bank',
        amount: 30720,
        status: 'cleared',
        transactionRef: 'SWIFT789012'
    },
    { 
        id: 'PAY005', 
        date: '2024-01-12', 
        type: 'received', 
        party: 'Global Trading', 
        reference: 'INV003',
        method: 'cheque',
        amount: 73632,
        status: 'pending',
        transactionRef: 'CHQ001234'
    }
];

function loadPaymentsData() {
    // Calculate stats
    const totalReceived = paymentsData
        .filter(p => p.type === 'received' && p.status === 'cleared')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPaid = paymentsData
        .filter(p => p.type === 'paid' && p.status === 'cleared')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const netBalance = totalReceived - totalPaid;
    
    const monthPayments = paymentsData
        .filter(p => p.status === 'cleared')
        .reduce((sum, p) => sum + p.amount, 0);
    
    document.getElementById('totalReceived').textContent = '₹' + totalReceived.toLocaleString('en-IN');
    document.getElementById('totalPaid').textContent = '₹' + totalPaid.toLocaleString('en-IN');
    document.getElementById('netBalance').textContent = '₹' + netBalance.toLocaleString('en-IN');
    document.getElementById('monthPayments').textContent = '₹' + monthPayments.toLocaleString('en-IN');
    
    // Load table data
    displayPayments(paymentsData);
}

function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTable');
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const statusClass = payment.status === 'cleared' ? 'success' : 'pending';
        const typeIcon = payment.type === 'received' ? '📥' : '📤';
        const typeClass = payment.type === 'received' ? 'received' : 'paid';
        
        const row = `
            <tr>
                <td><strong>${payment.id}</strong></td>
                <td>${formatDate(payment.date)}</td>
                <td>
                    <span class="payment-type ${typeClass}">
                        ${typeIcon} ${payment.type.toUpperCase()}
                    </span>
                </td>
                <td>${payment.party}</td>
                <td>${payment.reference}</td>
                <td>${getMethodName(payment.method)}</td>
                <td class="${typeClass}">
                    ${payment.type === 'received' ? '+' : '-'}₹${payment.amount.toLocaleString('en-IN')}
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

function getMethodName(method) {
    const methods = {
        'bank': 'Bank Transfer',
        'cash': 'Cash',
        'cheque': 'Cheque',
        'online': 'Online Payment'
    };
    return methods[method] || method;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function filterPayments() {
    const typeFilter = document.getElementById('typeFilter').value;
    const methodFilter = document.getElementById('methodFilter').value;
    const searchTerm = document.getElementById('searchPayment').value.toLowerCase();
    
    let filtered = paymentsData;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(payment => payment.type === typeFilter);
    }
    
    if (methodFilter !== 'all') {
        filtered = filtered.filter(payment => payment.method === methodFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(payment => 
            payment.id.toLowerCase().includes(searchTerm) ||
            payment.party.toLowerCase().includes(searchTerm) ||
            payment.reference.toLowerCase().includes(searchTerm) ||
            payment.transactionRef.toLowerCase().includes(searchTerm)
        );
    }
    
    displayPayments(filtered);
}

function showAddPayment() {
    document.getElementById('addPaymentModal').style.display = 'block';
    // Set today's date
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
    document.getElementById('addPaymentModal').style.display = 'none';
    document.getElementById('addPaymentForm').reset();
}

function viewPayment(id) {
    const payment = paymentsData.find(p => p.id === id);
    const typeText = payment.type === 'received' ? 'Payment Received' : 'Payment Made';
    
    alert(`Payment Details:\n\nPayment ID: ${payment.id}\nDate: ${formatDate(payment.date)}\nType: ${typeText}\nParty: ${payment.party}\nReference: ${payment.reference}\nMethod: ${getMethodName(payment.method)}\nAmount: ₹${payment.amount.toLocaleString('en-IN')}\nTransaction Ref: ${payment.transactionRef}\nStatus: ${payment.status.toUpperCase()}`);
}

function printReceipt(id) {
    alert(`Printing payment receipt for ${id}...\nReceipt generation - Coming Soon!`);
}

function showPaymentReport() {
    const received = paymentsData
        .filter(p => p.type === 'received' && p.status === 'cleared')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const paid = paymentsData
        .filter(p => p.type === 'paid' && p.status === 'cleared')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const pending = paymentsData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
    
    alert(`Payment Report - This Month:\n\nTotal Received: ₹${received.toLocaleString('en-IN')}\nTotal Paid: ₹${paid.toLocaleString('en-IN')}\nNet Balance: ₹${(received - paid).toLocaleString('en-IN')}\nPending Clearance: ₹${pending.toLocaleString('en-IN')}\n\nDetailed payment report - Coming Soon!`);
}

// Form submission
document.getElementById('addPaymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newPayment = {
        id: generatePaymentId(),
        date: document.getElementById('paymentDate').value,
        type: document.getElementById('paymentType').value,
        party: document.getElementById('party').value,
        reference: document.getElementById('reference').value,
        method: document.getElementById('paymentMethod').value,
        amount: parseFloat(document.getElementById('amount').value),
        status: 'cleared', // Default to cleared for demo
        transactionRef: document.getElementById('transactionRef').value || 'N/A'
    };
    
    paymentsData.unshift(newPayment);
    loadPaymentsData();
    closeModal();
    alert('Payment recorded successfully!');
});

function generatePaymentId() {
    const count = paymentsData.length + 1;
    return `PAY${count.toString().padStart(3, '0')}`;
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