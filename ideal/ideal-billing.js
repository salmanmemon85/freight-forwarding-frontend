// Billing Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadBillingData();
    setupInvoiceCalculation();
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

// Sample invoices data
const invoicesData = [
    { 
        invoiceNo: 'INV001', 
        date: '2024-01-15', 
        customer: 'ABC Industries', 
        jobNo: 'JOB001',
        amount: 44000,
        gst: 7920,
        total: 51920,
        status: 'sent'
    },
    { 
        invoiceNo: 'INV002', 
        date: '2024-01-14', 
        customer: 'XYZ Exports', 
        jobNo: 'JOB002',
        amount: 38400,
        gst: 6912,
        total: 45312,
        status: 'paid'
    },
    { 
        invoiceNo: 'INV003', 
        date: '2024-01-13', 
        customer: 'Global Trading', 
        jobNo: 'JOB003',
        amount: 62400,
        gst: 11232,
        total: 73632,
        status: 'paid'
    },
    { 
        invoiceNo: 'INV004', 
        date: '2024-01-12', 
        customer: 'Tech Solutions', 
        jobNo: 'JOB004',
        amount: 26208,
        gst: 4717,
        total: 30925,
        status: 'overdue'
    },
    { 
        invoiceNo: 'INV005', 
        date: '2024-01-16', 
        customer: 'Food Corp', 
        jobNo: 'JOB005',
        amount: 19200,
        gst: 3456,
        total: 22656,
        status: 'draft'
    }
];

function loadBillingData() {
    // Calculate stats
    const totalInvoices = invoicesData.length;
    const pendingAmount = invoicesData
        .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total, 0);
    const monthGST = invoicesData.reduce((sum, inv) => sum + inv.gst, 0);
    const paidInvoices = invoicesData.filter(inv => inv.status === 'paid').length;
    
    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('pendingAmount').textContent = '₹' + pendingAmount.toLocaleString('en-IN');
    document.getElementById('monthGST').textContent = '₹' + monthGST.toLocaleString('en-IN');
    document.getElementById('paidInvoices').textContent = paidInvoices;
    
    // Load table data
    displayInvoices(invoicesData);
}

function displayInvoices(invoices) {
    const tbody = document.getElementById('invoicesTable');
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const statusClass = getStatusClass(invoice.status);
        
        const row = `
            <tr>
                <td><strong>${invoice.invoiceNo}</strong></td>
                <td>${formatDate(invoice.date)}</td>
                <td>${invoice.customer}</td>
                <td>${invoice.jobNo}</td>
                <td>₹${invoice.amount.toLocaleString('en-IN')}</td>
                <td>₹${invoice.gst.toLocaleString('en-IN')}</td>
                <td><strong>₹${invoice.total.toLocaleString('en-IN')}</strong></td>
                <td><span class="status-${statusClass}">${invoice.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewInvoice('${invoice.invoiceNo}')">👁️ View</button>
                    <button class="btn-small" onclick="downloadInvoice('${invoice.invoiceNo}')">📥 PDF</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'draft': return 'draft';
        case 'sent': return 'pending';
        case 'paid': return 'success';
        case 'overdue': return 'danger';
        default: return 'default';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function setupInvoiceCalculation() {
    const qtyInput = document.getElementById('item1Qty');
    const rateInput = document.getElementById('item1Rate');
    const amountInput = document.getElementById('item1Amount');
    
    function calculateInvoice() {
        const qty = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;
        
        amountInput.value = amount.toFixed(2);
        
        // Calculate GST and total
        const gst = amount * 0.18; // 18% GST
        const total = amount + gst;
        
        document.getElementById('subtotal').textContent = '₹' + amount.toLocaleString('en-IN', {minimumFractionDigits: 2});
        document.getElementById('gstAmount').textContent = '₹' + gst.toLocaleString('en-IN', {minimumFractionDigits: 2});
        document.getElementById('totalAmount').textContent = '₹' + total.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }
    
    qtyInput.addEventListener('input', calculateInvoice);
    rateInput.addEventListener('input', calculateInvoice);
}

function filterInvoices() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInvoice').value.toLowerCase();
    
    let filtered = invoicesData;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(invoice => 
            invoice.invoiceNo.toLowerCase().includes(searchTerm) ||
            invoice.customer.toLowerCase().includes(searchTerm) ||
            invoice.jobNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayInvoices(filtered);
}

function showCreateInvoice() {
    document.getElementById('createInvoiceModal').style.display = 'block';
    // Set today's date
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
    document.getElementById('createInvoiceModal').style.display = 'none';
    document.getElementById('createInvoiceForm').reset();
    // Reset summary
    document.getElementById('subtotal').textContent = '₹0.00';
    document.getElementById('gstAmount').textContent = '₹0.00';
    document.getElementById('totalAmount').textContent = '₹0.00';
}

function viewInvoice(invoiceNo) {
    const invoice = invoicesData.find(inv => inv.invoiceNo === invoiceNo);
    alert(`Invoice Details:\n\nInvoice No: ${invoice.invoiceNo}\nDate: ${formatDate(invoice.date)}\nCustomer: ${invoice.customer}\nJob No: ${invoice.jobNo}\nAmount: ₹${invoice.amount.toLocaleString('en-IN')}\nGST (18%): ₹${invoice.gst.toLocaleString('en-IN')}\nTotal: ₹${invoice.total.toLocaleString('en-IN')}\nStatus: ${invoice.status.toUpperCase()}`);
}

function downloadInvoice(invoiceNo) {
    alert(`Downloading invoice ${invoiceNo} as PDF...\nPDF generation - Coming Soon!`);
}

function showGSTReport() {
    const totalGST = invoicesData.reduce((sum, inv) => sum + inv.gst, 0);
    const paidGST = invoicesData
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.gst, 0);
    
    alert(`GST Report - This Month:\n\nTotal GST Collected: ₹${totalGST.toLocaleString('en-IN')}\nPaid Invoices GST: ₹${paidGST.toLocaleString('en-IN')}\nPending GST: ₹${(totalGST - paidGST).toLocaleString('en-IN')}\n\nDetailed GST report - Coming Soon!`);
}

// Form submission
document.getElementById('createInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const qty = parseFloat(document.getElementById('item1Qty').value);
    const rate = parseFloat(document.getElementById('item1Rate').value);
    const amount = qty * rate;
    const gst = amount * 0.18;
    const total = amount + gst;
    
    const newInvoice = {
        invoiceNo: generateInvoiceNo(),
        date: document.getElementById('invoiceDate').value,
        customer: getCustomerFromJob(document.getElementById('jobNumber').value),
        jobNo: document.getElementById('jobNumber').value,
        amount: Math.round(amount),
        gst: Math.round(gst),
        total: Math.round(total),
        status: 'draft'
    };
    
    invoicesData.unshift(newInvoice);
    loadBillingData();
    closeModal();
    alert('Invoice created successfully!');
});

function generateInvoiceNo() {
    const count = invoicesData.length + 1;
    return `INV${count.toString().padStart(3, '0')}`;
}

function getCustomerFromJob(jobNo) {
    const jobCustomers = {
        'JOB001': 'ABC Industries',
        'JOB002': 'XYZ Exports',
        'JOB003': 'Global Trading'
    };
    return jobCustomers[jobNo] || 'Unknown Customer';
}

function startAutoRefresh() {
    setInterval(loadBillingData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('createInvoiceModal');
    if (event.target === modal) {
        closeModal();
    }
}