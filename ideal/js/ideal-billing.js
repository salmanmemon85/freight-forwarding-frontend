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
    // Wait for workflow manager to be available
    if (!window.workflowManager) {
        setTimeout(loadBillingData, 100);
        return;
    }
    
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
                    <button class="btn-small" onclick="editInvoice('${invoice.no}')">✏️ Edit</button>
                    <button class="btn-small btn-warning" onclick="createCreditNote('${invoice.no}')">📝 Credit</button>
                    <button class="btn-small btn-info" onclick="createDebitNote('${invoice.no}')">📈 Debit</button>
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
    const customerEl = document.getElementById('customer');
    const jobNumberEl = document.getElementById('jobNumber');
    
    if (customerEl) customerEl.value = job.customer;
    if (jobNumberEl) jobNumberEl.value = job.no;
    
    // Store job reference
    document.getElementById('createInvoiceForm').dataset.jobNo = jobNo;
    
    showCreateInvoice();
    
    alert(`🧾 Creating invoice for ${jobNo}\n\n📋 Job Details:\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nCBM: ${job.cbm}\nRate: $${job.customerRate}/CBM`);
}

function updateBillingFields() {
    const invoiceType = document.getElementById('invoiceType')?.value;
    
    // Hide all fields first
    const airlineFields = document.getElementById('airlineBillingFields');
    const shippingFields = document.getElementById('shippingBillingFields');
    const courierFields = document.getElementById('courierBillingFields');
    
    if (airlineFields) airlineFields.style.display = 'none';
    if (shippingFields) shippingFields.style.display = 'none';
    if (courierFields) courierFields.style.display = 'none';
    
    // Show relevant fields
    if (invoiceType === 'airline' && airlineFields) {
        airlineFields.style.display = 'block';
    } else if (invoiceType === 'shipping' && shippingFields) {
        shippingFields.style.display = 'block';
    } else if (invoiceType === 'courier' && courierFields) {
        courierFields.style.display = 'block';
    }
    
    updateInvoiceCurrency();
    calculateBillingTotal();
}

// Currency exchange rates for billing
const billingExchangeRates = {
    PKR: 1,
    USD: 280,
    EUR: 305,
    GBP: 355,
    AED: 76,
    SAR: 75
};

function updateInvoiceCurrency() {
    const currency = document.getElementById('invoiceCurrency')?.value || 'PKR';
    const symbols = {
        PKR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        AED: 'AED',
        SAR: 'SAR'
    };
    
    const symbol = symbols[currency] || '₹';
    const currencySymbol1 = document.getElementById('invoiceCurrencySymbol');
    const currencySymbol2 = document.getElementById('invoiceCurrencySymbol2');
    
    if (currencySymbol1) currencySymbol1.textContent = symbol;
    if (currencySymbol2) currencySymbol2.textContent = symbol;
    
    // Update exchange rate
    const rate = billingExchangeRates[currency] || 1;
    const exchangeRateEl = document.getElementById('invoiceExchangeRate');
    if (exchangeRateEl) exchangeRateEl.value = rate;
    
    calculateBillingTotal();
}

function calculateTotal() {
    const amount = parseFloat(document.getElementById('invoiceAmount')?.value) || 0;
    const gst = amount * 0.18;
    const total = amount + gst;
    
    const subtotalEl = document.getElementById('subtotal');
    const gstEl = document.getElementById('gstAmount');
    const totalEl = document.getElementById('totalAmount');
    
    if (subtotalEl) subtotalEl.textContent = '₹' + amount.toFixed(2);
    if (gstEl) gstEl.textContent = '₹' + gst.toFixed(2);
    if (totalEl) totalEl.textContent = '₹' + total.toFixed(2);
}

function calculateBillingTotal() {
    const invoiceType = document.getElementById('invoiceType')?.value;
    const taxRate = parseFloat(document.getElementById('invoiceTaxRate')?.value) || 18;
    const exchangeRate = parseFloat(document.getElementById('invoiceExchangeRate')?.value) || 1;
    let subtotal = 0;
    
    if (invoiceType === 'airline') {
        const weight = parseFloat(document.getElementById('weight')?.value) || 0;
        const rate = parseFloat(document.getElementById('ratePerKg')?.value) || 0;
        const fuel = parseFloat(document.getElementById('fuelSurcharge')?.value) || 0;
        const security = parseFloat(document.getElementById('securityFee')?.value) || 0;
        subtotal = (weight * rate) + fuel + security;
    } else if (invoiceType === 'shipping') {
        const qty = parseFloat(document.getElementById('containerQty')?.value) || 0;
        const rate = parseFloat(document.getElementById('ratePerContainer')?.value) || 0;
        const port = parseFloat(document.getElementById('portCharges')?.value) || 0;
        const docs = parseFloat(document.getElementById('shippingDocs')?.value) || 0;
        subtotal = (qty * rate) + port + docs;
    } else if (invoiceType === 'courier') {
        const weight = parseFloat(document.getElementById('courierWeight')?.value) || 0;
        const rate = parseFloat(document.getElementById('courierRate')?.value) || 0;
        subtotal = weight * rate;
    }
    
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    const pkrTotal = total * exchangeRate;
    
    const subtotalEl = document.getElementById('subtotal');
    const gstEl = document.getElementById('gstAmount');
    const totalEl = document.getElementById('totalAmount');
    const pkrTotalEl = document.getElementById('pkrTotal');
    const taxPercentEl = document.getElementById('invoiceTaxPercent');
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (gstEl) gstEl.textContent = tax.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (pkrTotalEl) pkrTotalEl.textContent = '₹' + pkrTotal.toLocaleString('en-IN', {maximumFractionDigits: 2});
    if (taxPercentEl) taxPercentEl.textContent = `(${taxRate}%)`;
}

function showCreateInvoice() {
    document.getElementById('createInvoiceModal').style.display = 'block';
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
}

function setupInvoiceCalculation() {
    const qtyInput = document.getElementById('item1Qty');
    const rateInput = document.getElementById('item1Rate');
    const amountInput = document.getElementById('item1Amount');
    
    // Check if elements exist before adding event listeners
    if (!qtyInput || !rateInput || !amountInput) {
        console.log('Invoice calculation elements not found, skipping setup');
        return;
    }
    
    function calculateInvoice() {
        const qty = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;
        
        amountInput.value = amount.toFixed(2);
        
        const gst = amount * 0.18;
        const total = amount + gst;
        
        const subtotalEl = document.getElementById('subtotal');
        const gstEl = document.getElementById('gstAmount');
        const totalEl = document.getElementById('totalAmount');
        
        if (subtotalEl) subtotalEl.textContent = '$' + amount.toFixed(2);
        if (gstEl) gstEl.textContent = '$' + gst.toFixed(2);
        if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
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

// Credit/Debit Note Functions
function createCreditNote(invoiceNo) {
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    document.getElementById('noteModalTitle').textContent = 'Create Credit Note';
    document.getElementById('createNoteBtn').textContent = 'Create Credit Note';
    document.getElementById('originalInvoiceId').value = invoiceNo;
    document.getElementById('originalInvoiceNo').value = invoiceNo;
    document.getElementById('originalAmount').value = '₹' + Math.round((invoice.total || 0) * 80).toLocaleString('en-IN');
    document.getElementById('noteType').value = 'credit';
    document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('creditDebitModal').style.display = 'block';
}

function createDebitNote(invoiceNo) {
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    document.getElementById('noteModalTitle').textContent = 'Create Debit Note';
    document.getElementById('createNoteBtn').textContent = 'Create Debit Note';
    document.getElementById('originalInvoiceId').value = invoiceNo;
    document.getElementById('originalInvoiceNo').value = invoiceNo;
    document.getElementById('originalAmount').value = '₹' + Math.round((invoice.total || 0) * 80).toLocaleString('en-IN');
    document.getElementById('noteType').value = 'debit';
    document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('creditDebitModal').style.display = 'block';
}

function calculateNoteTotal() {
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value) || 0;
    const originalAmount = parseFloat(document.getElementById('originalAmount').value.replace('₹', '').replace(/,/g, '')) || 0;
    const noteType = document.getElementById('noteType').value;
    
    const gst = adjustmentAmount * 0.18;
    const totalAdjustment = adjustmentAmount + gst;
    
    let newAmount;
    if (noteType === 'credit') {
        newAmount = originalAmount - totalAdjustment;
    } else {
        newAmount = originalAmount + totalAdjustment;
    }
    
    document.getElementById('adjustmentGST').value = gst.toFixed(2);
    document.getElementById('totalAdjustment').value = totalAdjustment.toFixed(2);
    document.getElementById('newInvoiceAmount').value = newAmount.toFixed(2);
}

function closeCreditDebitModal() {
    document.getElementById('creditDebitModal').style.display = 'none';
    document.getElementById('creditDebitForm').reset();
}

// Edit Invoice Functions
function editInvoice(invoiceNo) {
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (!invoice) return;
    
    document.getElementById('editInvoiceId').value = invoiceNo;
    document.getElementById('editInvoiceNo').value = invoiceNo;
    document.getElementById('editCustomer').value = invoice.customer;
    document.getElementById('editJobNumber').value = invoice.jobNo;
    document.getElementById('editInvoiceDate').value = invoice.date;
    document.getElementById('editAmount').value = Math.round((invoice.total || 0) * 80 / 1.18).toFixed(2);
    document.getElementById('editStatus').value = invoice.status;
    document.getElementById('editNotes').value = invoice.notes || '';
    
    calculateEditTotal();
    document.getElementById('editInvoiceModal').style.display = 'block';
}

function calculateEditTotal() {
    const amount = parseFloat(document.getElementById('editAmount').value) || 0;
    const gst = amount * 0.18;
    const total = amount + gst;
    
    document.getElementById('editGST').value = gst.toFixed(2);
    document.getElementById('editTotal').value = total.toFixed(2);
}

function closeEditModal() {
    document.getElementById('editInvoiceModal').style.display = 'none';
    document.getElementById('editInvoiceForm').reset();
}

// Form Submissions
document.getElementById('creditDebitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const noteType = document.getElementById('noteType').value;
    const invoiceNo = document.getElementById('originalInvoiceId').value;
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value);
    const reason = document.getElementById('adjustmentReason').value;
    const description = document.getElementById('adjustmentDescription').value;
    const newAmount = parseFloat(document.getElementById('newInvoiceAmount').value);
    
    const noteNo = (noteType === 'credit' ? 'CN' : 'DN') + Date.now().toString().slice(-6);
    
    // Update original invoice amount
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (invoice) {
        invoice.total = newAmount / 80; // Convert back to USD
        invoice.tax = (newAmount / 80) * 0.18;
    }
    
    alert(`✅ ${noteType === 'credit' ? 'Credit' : 'Debit'} Note Created!\n\n📋 Note: ${noteNo}\n📄 Original Invoice: ${invoiceNo}\n💰 Adjustment: ₹${adjustmentAmount.toLocaleString('en-IN')}\n💵 New Amount: ₹${newAmount.toLocaleString('en-IN')}\n📝 Reason: ${reason}`);
    
    loadBillingData();
    closeCreditDebitModal();
});

document.getElementById('editInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const invoiceNo = document.getElementById('editInvoiceId').value;
    const customer = document.getElementById('editCustomer').value;
    const jobNumber = document.getElementById('editJobNumber').value;
    const date = document.getElementById('editInvoiceDate').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const status = document.getElementById('editStatus').value;
    const notes = document.getElementById('editNotes').value;
    
    // Update invoice
    const invoice = window.workflowManager.getInvoices().find(i => i.no === invoiceNo);
    if (invoice) {
        invoice.customer = customer;
        invoice.jobNo = jobNumber;
        invoice.date = date;
        invoice.total = amount / 80; // Convert to USD
        invoice.tax = (amount / 80) * 0.18;
        invoice.status = status;
        invoice.notes = notes;
    }
    
    alert(`✅ Invoice Updated!\n\n📋 Invoice: ${invoiceNo}\n👥 Customer: ${customer}\n💰 Amount: ₹${amount.toLocaleString('en-IN')}\n📅 Status: ${status.toUpperCase()}`);
    
    loadBillingData();
    closeEditModal();
});

window.onclick = function(event) {
    const modal = document.getElementById('createInvoiceModal');
    if (event.target === modal) {
        closeModal();
    }
}