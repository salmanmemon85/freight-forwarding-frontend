// Billing Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadBillingData();
    checkJobForInvoice();
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

// Check if coming from job for invoice creation
function checkJobForInvoice() {
    const jobNo = sessionStorage.getItem('createInvoiceFromJob');
    if (jobNo) {
        sessionStorage.removeItem('createInvoiceFromJob');
        showCreateInvoiceForJob(jobNo);
    }
}

function loadBillingData() {
    // Get invoices from workflow manager
    const invoices = window.workflowManager.getInvoices();
    
    // Calculate stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
    const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    
    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('paidInvoices').textContent = paidInvoices;
    document.getElementById('pendingAmount').textContent = '₹' + Math.round(invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total || 0), 0) * 80).toLocaleString('en-IN');
    document.getElementById('monthGST').textContent = '₹' + Math.round(invoices.reduce((sum, i) => sum + (i.tax || 0), 0) * 80).toLocaleString('en-IN');
    
    // Load table data
    displayInvoices(invoices);
}

function displayInvoices(invoices) {
    const tbody = document.getElementById('invoicesTable');
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const statusClass = getInvoiceStatusClass(invoice.status);
        const nextAction = getNextInvoiceAction(invoice.status);
        
        const row = `
            <tr>
                <td>
                    <strong>${invoice.no}</strong>
                    <br><small>Job: ${invoice.jobNo}</small>
                </td>
                <td>${formatDate(invoice.date)}</td>
                <td>
                    <div><strong>${invoice.customer}</strong></div>
                    <small>${invoice.contact}</small>
                </td>
                <td>
                    <div>Freight: ₹${Math.round((invoice.freightCharges || 0) * 80).toLocaleString('en-IN')}</div>
                    <small>Local: ₹${Math.round((invoice.localCharges || 0) * 80).toLocaleString('en-IN')}</small>
                </td>
                <td>
                    <div><strong>₹${Math.round((invoice.total || 0) * 80).toLocaleString('en-IN')}</strong></div>
                    <small>Tax: ₹${Math.round((invoice.tax || 0) * 80).toLocaleString('en-IN')}</small>
                </td>
                <td><span class="status-${statusClass}">${invoice.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewInvoice('${invoice.no}')">👁️ View</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${invoice.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getInvoiceStatusClass(status) {
    switch(status) {
        case 'sent': return 'warning';
        case 'paid': return 'success';
        case 'overdue': return 'danger';
        default: return 'default';
    }
}

function getNextInvoiceAction(status) {
    switch(status) {
        case 'sent': return { action: 'recordPayment', label: '💳 Payment' };
        case 'paid': return { action: 'viewInvoice', label: '✅ Paid' };
        default: return { action: 'viewInvoice', label: '👁️ View' };
    }
}

// Show invoice creation modal for specific job
function showCreateInvoiceForJob(jobNo) {
    const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
    if (!job) {
        alert('Job not found!');
        return;
    }
    
    console.log('Creating invoice for job:', job);
    
    // Pre-fill form with job data
    document.getElementById('customer').value = job.customer;
    document.getElementById('jobNumber').value = job.no;
    document.getElementById('item1Desc').value = 'Freight Charges - ' + job.origin + ' to ' + job.destination;
    document.getElementById('item1Qty').value = job.cbm || 1;
    document.getElementById('item1Rate').value = job.customerRate || 100;
    
    // Store job reference
    document.getElementById('createInvoiceForm').dataset.jobNo = jobNo;
    
    showCreateInvoice();
    
    // Trigger calculation after form is shown
    setTimeout(() => {
        const event = new Event('input');
        document.getElementById('item1Qty').dispatchEvent(event);
    }, 100);
    
    alert(`🧾 Creating invoice for ${jobNo}\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nCBM: ${job.cbm}\nRate: $${job.customerRate}/CBM`);
}

function updateBillingFields() {
    const invoiceType = document.getElementById('invoiceType').value;
    
    // Hide all fields first
    document.getElementById('airlineBillingFields').style.display = 'none';
    document.getElementById('shippingBillingFields').style.display = 'none';
    document.getElementById('courierBillingFields').style.display = 'none';
    
    // Show relevant fields
    if (invoiceType === 'airline') {
        document.getElementById('airlineBillingFields').style.display = 'block';
    } else if (invoiceType === 'shipping') {
        document.getElementById('shippingBillingFields').style.display = 'block';
    } else if (invoiceType === 'courier') {
        document.getElementById('courierBillingFields').style.display = 'block';
    }
    
    calculateBillingTotal();
}

function calculateBillingTotal() {
    const invoiceType = document.getElementById('invoiceType').value;
    let subtotal = 0;
    let typeSpecificCharges = 0;
    
    if (invoiceType === 'airline') {
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        const rate = parseFloat(document.getElementById('ratePerKg').value) || 0;
        const fuel = parseFloat(document.getElementById('fuelSurcharge').value) || 0;
        const security = parseFloat(document.getElementById('securityFee').value) || 0;
        subtotal = weight * rate;
        typeSpecificCharges = fuel + security;
    } else if (invoiceType === 'shipping') {
        const qty = parseFloat(document.getElementById('containerQty').value) || 0;
        const rate = parseFloat(document.getElementById('ratePerContainer').value) || 0;
        const port = parseFloat(document.getElementById('portCharges').value) || 0;
        const docs = parseFloat(document.getElementById('shippingDocs').value) || 0;
        subtotal = qty * rate;
        typeSpecificCharges = port + docs;
    } else if (invoiceType === 'courier') {
        const pieces = parseFloat(document.getElementById('pieces').value) || 0;
        const rate = parseFloat(document.getElementById('ratePerPiece').value) || 0;
        const cod = parseFloat(document.getElementById('codCharges').value) || 0;
        const insurance = parseFloat(document.getElementById('insurance').value) || 0;
        subtotal = pieces * rate;
        typeSpecificCharges = cod + insurance;
    }
    
    const netAmount = subtotal + typeSpecificCharges;
    const gst = netAmount * 0.18; // 18% GST
    const total = netAmount + gst;
    
    document.getElementById('subtotal').textContent = '₹' + netAmount.toFixed(2);
    document.getElementById('gstAmount').textContent = '₹' + gst.toFixed(2);
    document.getElementById('totalAmount').textContent = '₹' + total.toFixed(2);
}

function showCreateInvoice() {
    document.getElementById('createInvoiceModal').style.display = 'block';
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
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
        
        const gst = amount * 0.18;
        const total = amount + gst;
        
        document.getElementById('subtotal').textContent = '$' + amount.toFixed(2);
        document.getElementById('gstAmount').textContent = '$' + gst.toFixed(2);
        document.getElementById('totalAmount').textContent = '$' + total.toFixed(2);
    }
    
    qtyInput.addEventListener('input', calculateInvoice);
    rateInput.addEventListener('input', calculateInvoice);
}

function recordPayment(invoiceNo) {
    sessionStorage.setItem('recordPaymentForInvoice', invoiceNo);
    
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    alert(`💳 Record payment for ${invoiceNo}\n\n📋 Invoice Details:\nCustomer: ${invoice.customer}\nAmount: $${invoice.total}\n\n➡️ Redirecting to Payments page...`);
    
    window.location.href = 'ideal-payments.html';
}

function viewInvoice(invoiceNo) {
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    let details = `🧾 Invoice Details - ${invoiceNo}\n\n`;
    details += `👤 Customer: ${invoice.customer}\n`;
    details += `📞 Contact: ${invoice.contact}\n`;
    details += `💼 Job: ${invoice.jobNo}\n`;
    details += `📅 Date: ${formatDate(invoice.date)}\n\n`;
    
    details += `💰 Charges:\n`;
    details += `Freight: $${(invoice.freightCharges || 0).toFixed(2)}\n`;
    details += `Local: $${(invoice.localCharges || 0).toFixed(2)}\n`;
    details += `Tax (18%): $${(invoice.tax || 0).toFixed(2)}\n`;
    details += `Total: $${(invoice.total || 0).toFixed(2)}\n\n`;
    
    details += `📋 Status: ${invoice.status.toUpperCase()}`;
    
    if (invoice.paidAt) {
        details += `\n✅ Paid on: ${formatDate(invoice.paidAt)}`;
    }
    
    alert(details);
}

function filterInvoices() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInvoice').value.toLowerCase();
    
    let invoices = window.workflowManager.getInvoices();
    
    if (statusFilter !== 'all') {
        invoices = invoices.filter(invoice => invoice.status === statusFilter);
    }
    
    if (searchTerm) {
        invoices = invoices.filter(invoice => 
            invoice.no.toLowerCase().includes(searchTerm) ||
            invoice.customer.toLowerCase().includes(searchTerm) ||
            invoice.jobNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayInvoices(invoices);
}

function closeModal() {
    document.getElementById('createInvoiceModal').style.display = 'none';
    document.getElementById('createInvoiceForm').reset();
    delete document.getElementById('createInvoiceForm').dataset.jobNo;
    document.getElementById('subtotal').textContent = '$0.00';
    document.getElementById('gstAmount').textContent = '$0.00';
    document.getElementById('totalAmount').textContent = '$0.00';
}

function downloadInvoice(invoiceNo) {
    alert(`Downloading invoice ${invoiceNo} as PDF...\nPDF generation - Coming Soon!`);
}

function showGSTReport() {
    const invoices = window.workflowManager.getInvoices();
    const totalGST = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    const paidGST = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.tax || 0), 0);
    
    alert(`GST Report - This Month:\n\nTotal GST Collected: $${totalGST.toFixed(2)}\nPaid Invoices GST: $${paidGST.toFixed(2)}\nPending GST: $${(totalGST - paidGST).toFixed(2)}\n\nDetailed GST report - Coming Soon!`);
}

// Form submission for invoice creation
document.getElementById('createInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const jobNo = this.dataset.jobNo;
    if (!jobNo) {
        alert('No job selected!');
        return;
    }
    
    const qty = parseFloat(document.getElementById('item1Qty').value) || 0;
    const rate = parseFloat(document.getElementById('item1Rate').value) || 0;
    const freightCharges = qty * rate;
    const localCharges = 50;
    const subtotal = freightCharges + localCharges;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    const invoiceData = {
        freightCharges: freightCharges,
        localCharges: localCharges,
        tax: tax,
        total: total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: '30 days',
        notes: ''
    };
    
    const invoice = window.workflowManager.createInvoiceFromJob(jobNo, invoiceData);
    
    if (invoice) {
        alert(`✅ Invoice Created Successfully!\n\n🧾 Invoice: ${invoice.no}\n👤 Customer: ${invoice.customer}\n💰 Amount: $${invoice.total.toFixed(2)}\n\n🎯 Next: Send to customer and record payment`);
        
        loadBillingData();
        closeModal();
    } else {
        alert('❌ Failed to create invoice!');
    }
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadBillingData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

window.onclick = function(event) {
    const modal = document.getElementById('createInvoiceModal');
    if (event.target === modal) {
        closeModal();
    }
}