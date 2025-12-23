// Purchase Orders Management System

class PurchaseOrderManager {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        const data = this.getData();
        if (!data.purchaseOrders) data.purchaseOrders = [];
        if (!data.vendors) data.vendors = [];
        this.saveData(data);
    }

    getData() {
        return JSON.parse(localStorage.getItem('idealFreightData')) || {};
    }

    saveData(data) {
        localStorage.setItem('idealFreightData', JSON.stringify(data));
    }

    createPurchaseOrder(poData) {
        const data = this.getData();
        const poNumber = 'PO' + Date.now().toString().slice(-6);
        
        const purchaseOrder = {
            id: poNumber,
            vendorId: poData.vendorId,
            vendorName: poData.vendorName,
            items: poData.items,
            totalAmount: poData.totalAmount,
            currency: poData.currency || 'PKR',
            status: 'pending',
            createdAt: new Date().toISOString(),
            requiredDate: poData.requiredDate,
            deliveryAddress: poData.deliveryAddress,
            terms: poData.terms || 'Net 30',
            notes: poData.notes || '',
            jobNo: poData.jobNo || null,
            approvedBy: null,
            approvedAt: null,
            receivedAt: null
        };

        data.purchaseOrders.push(purchaseOrder);
        this.saveData(data);
        return purchaseOrder;
    }

    getPurchaseOrders() {
        return this.getData().purchaseOrders || [];
    }

    updatePOStatus(poId, status, notes = '') {
        const data = this.getData();
        const poIndex = data.purchaseOrders.findIndex(po => po.id === poId);
        
        if (poIndex !== -1) {
            data.purchaseOrders[poIndex].status = status;
            data.purchaseOrders[poIndex].statusNotes = notes;
            data.purchaseOrders[poIndex].updatedAt = new Date().toISOString();
            
            if (status === 'approved') {
                data.purchaseOrders[poIndex].approvedAt = new Date().toISOString();
            } else if (status === 'received') {
                data.purchaseOrders[poIndex].receivedAt = new Date().toISOString();
            }
            
            this.saveData(data);
            return data.purchaseOrders[poIndex];
        }
        return null;
    }

    addVendor(vendorData) {
        const data = this.getData();
        const vendorId = 'VEN' + Date.now().toString().slice(-6);
        
        const vendor = {
            id: vendorId,
            name: vendorData.name,
            contact: vendorData.contact,
            email: vendorData.email,
            phone: vendorData.phone,
            address: vendorData.address,
            category: vendorData.category,
            paymentTerms: vendorData.paymentTerms || 'Net 30',
            status: 'active',
            createdAt: new Date().toISOString()
        };

        data.vendors.push(vendor);
        this.saveData(data);
        return vendor;
    }

    getVendors() {
        return this.getData().vendors || [];
    }
}

window.purchaseOrderManager = new PurchaseOrderManager();

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPurchaseOrdersData();
    initializeDefaultVendors();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
}

function initializeDefaultVendors() {
    const vendors = window.purchaseOrderManager.getVendors();
    
    if (vendors.length === 0) {
        // Add default vendors
        const defaultVendors = [
            {
                name: 'Karachi Port Trust',
                contact: 'Port Manager',
                email: 'info@kpt.gov.pk',
                phone: '+92-21-99201000',
                address: 'Karachi Port, Karachi',
                category: 'Port Services'
            },
            {
                name: 'Pakistan Customs',
                contact: 'Customs Officer',
                email: 'info@customs.gov.pk',
                phone: '+92-21-99201100',
                address: 'Customs House, Karachi',
                category: 'Government'
            },
            {
                name: 'Freight Forwarders Association',
                contact: 'Association Head',
                email: 'info@pfa.org.pk',
                phone: '+92-21-32456789',
                address: 'Karachi Chamber, Karachi',
                category: 'Services'
            }
        ];
        
        defaultVendors.forEach(vendor => {
            window.purchaseOrderManager.addVendor(vendor);
        });
    }
}

function loadPurchaseOrdersData() {
    const purchaseOrders = window.purchaseOrderManager.getPurchaseOrders();
    
    // Calculate stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const pendingPOs = purchaseOrders.filter(po => po.status === 'pending').length;
    const monthlyPOs = purchaseOrders.filter(po => {
        const poDate = new Date(po.createdAt);
        return poDate.getMonth() === currentMonth && poDate.getFullYear() === currentYear;
    }).length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const receivedPOs = purchaseOrders.filter(po => po.status === 'received').length;
    
    document.getElementById('pendingPOs').textContent = pendingPOs;
    document.getElementById('monthlyPOs').textContent = monthlyPOs;
    document.getElementById('totalValue').textContent = '₹' + totalValue.toLocaleString('en-IN');
    document.getElementById('receivedPOs').textContent = receivedPOs;
    
    displayPurchaseOrders(purchaseOrders);
}

function displayPurchaseOrders(purchaseOrders) {
    const tbody = document.getElementById('purchaseOrdersTable');
    tbody.innerHTML = '';
    
    purchaseOrders.forEach(po => {
        const statusClass = getPOStatusClass(po.status);
        const itemsCount = po.items ? po.items.length : 0;
        const itemsPreview = po.items ? po.items.slice(0, 2).map(item => item.name).join(', ') : 'No items';
        
        const row = `
            <tr>
                <td>
                    <strong>${po.id}</strong>
                    <br><small>Created: ${formatDate(po.createdAt)}</small>
                </td>
                <td>
                    <div><strong>${po.vendorName}</strong></div>
                    <small>ID: ${po.vendorId}</small>
                </td>
                <td>
                    <div>${itemsPreview}</div>
                    <small>${itemsCount} item(s)</small>
                </td>
                <td>
                    <strong>₹${po.totalAmount.toLocaleString('en-IN')}</strong>
                    <br><small>${po.currency}</small>
                </td>
                <td>
                    <div>${formatDate(po.createdAt)}</div>
                    ${po.requiredDate ? `<small>Due: ${formatDate(po.requiredDate)}</small>` : ''}
                </td>
                <td><span class="status-${statusClass}">${po.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewPO('${po.id}')">👁️ View</button>
                    ${po.status === 'pending' ? 
                        `<button class="btn-small btn-primary" onclick="approvePO('${po.id}')">✅ Approve</button>` : 
                        `<button class="btn-small" onclick="updatePOStatus('${po.id}')">📝 Update</button>`
                    }
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getPOStatusClass(status) {
    switch(status) {
        case 'pending': return 'warning';
        case 'approved': return 'info';
        case 'sent': return 'primary';
        case 'received': return 'success';
        case 'cancelled': return 'danger';
        default: return 'default';
    }
}

function createPurchaseOrder() {
    const vendors = window.purchaseOrderManager.getVendors();
    
    if (vendors.length === 0) {
        alert('❌ No vendors found! Please add vendors first.');
        return;
    }
    
    // Load vendors in dropdown
    const vendorSelect = document.getElementById('vendorSelect');
    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    vendors.forEach(vendor => {
        vendorSelect.innerHTML += `<option value="${vendor.id}">${vendor.name} - ${vendor.category}</option>`;
    });
    
    document.getElementById('createPOModal').style.display = 'block';
}

function updateInvoiceFields() {
    const invoiceType = document.getElementById('invoiceType').value;
    
    // Hide all fields first
    document.getElementById('airlineFields').style.display = 'none';
    document.getElementById('shippingFields').style.display = 'none';
    document.getElementById('courierFields').style.display = 'none';
    
    // Show relevant fields
    if (invoiceType === 'airline') {
        document.getElementById('airlineFields').style.display = 'block';
    } else if (invoiceType === 'shipping') {
        document.getElementById('shippingFields').style.display = 'block';
    } else if (invoiceType === 'courier') {
        document.getElementById('courierFields').style.display = 'block';
    }
    
    calculateTotal();
}

function calculateTotal() {
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
    
    const additional = parseFloat(document.getElementById('additionalCharges').value) || 0;
    const total = subtotal + typeSpecificCharges + additional;
    
    document.getElementById('subtotal').value = subtotal.toFixed(2);
    document.getElementById('totalAmount').value = total.toFixed(2);
}

function closePOModal() {
    document.getElementById('createPOModal').style.display = 'none';
    document.getElementById('createPOForm').reset();
    updateInvoiceFields();
}

function viewPO(poId) {
    const purchaseOrders = window.purchaseOrderManager.getPurchaseOrders();
    const po = purchaseOrders.find(p => p.id === poId);
    
    if (!po) return;
    
    let details = `📋 Purchase Order Details\n\n`;
    details += `🆔 PO Number: ${po.id}\n`;
    details += `👥 Vendor: ${po.vendorName} (${po.vendorId})\n`;
    details += `📅 Created: ${formatDate(po.createdAt)}\n`;
    details += `📅 Required: ${po.requiredDate ? formatDate(po.requiredDate) : 'Not specified'}\n`;
    details += `📊 Status: ${po.status.toUpperCase()}\n`;
    details += `💰 Total: ₹${po.totalAmount.toLocaleString('en-IN')} ${po.currency}\n\n`;
    
    details += `📦 Items:\n`;
    if (po.items && po.items.length > 0) {
        po.items.forEach(item => {
            details += `• ${item.name} - Qty: ${item.quantity} @ ₹${item.unitPrice} = ₹${item.totalPrice.toLocaleString('en-IN')}\n`;
        });
    }
    
    if (po.deliveryAddress) {
        details += `\n📍 Delivery: ${po.deliveryAddress}\n`;
    }
    
    if (po.notes) {
        details += `📝 Notes: ${po.notes}\n`;
    }
    
    if (po.approvedAt) {
        details += `\n✅ Approved: ${formatDate(po.approvedAt)}\n`;
    }
    
    if (po.receivedAt) {
        details += `📦 Received: ${formatDate(po.receivedAt)}\n`;
    }
    
    alert(details);
}

function approvePO(poId) {
    const purchaseOrders = window.purchaseOrderManager.getPurchaseOrders();
    const po = purchaseOrders.find(p => p.id === poId);
    
    if (!po) return;
    
    const confirm = window.confirm(
        `✅ Approve Purchase Order\n\n` +
        `📋 PO: ${po.id}\n` +
        `👥 Vendor: ${po.vendorName}\n` +
        `💰 Amount: ₹${po.totalAmount.toLocaleString('en-IN')}\n\n` +
        `Approve this purchase order?`
    );
    
    if (confirm) {
        window.purchaseOrderManager.updatePOStatus(poId, 'approved', 'Approved for processing');
        loadPurchaseOrdersData();
        
        alert(`✅ Purchase Order Approved!\n\n📋 PO: ${po.id}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}`);
    }
}

function updatePOStatus(poId) {
    const statusOptions = ['approved', 'sent', 'received', 'cancelled'];
    
    let statusList = 'Select New Status:\n\n';
    statusOptions.forEach(status => {
        statusList += `• ${status}\n`;
    });
    
    const newStatus = prompt(statusList + '\nEnter Status:', 'sent');
    
    if (newStatus && statusOptions.includes(newStatus)) {
        const notes = prompt('Enter Status Notes (optional):', '');
        
        window.purchaseOrderManager.updatePOStatus(poId, newStatus, notes);
        loadPurchaseOrdersData();
        
        alert(`✅ Status Updated!\n\n📋 PO: ${poId}\n📊 Status: ${newStatus.toUpperCase()}`);
    }
}

function showVendors() {
    const vendors = window.purchaseOrderManager.getVendors();
    
    let vendorList = '👥 Registered Vendors:\n\n';
    vendors.forEach(vendor => {
        vendorList += `🏢 ${vendor.name}\n`;
        vendorList += `   ID: ${vendor.id}\n`;
        vendorList += `   Category: ${vendor.category}\n`;
        vendorList += `   Contact: ${vendor.contact}\n`;
        vendorList += `   Phone: ${vendor.phone}\n\n`;
    });
    
    vendorList += `\n📊 Total Vendors: ${vendors.length}`;
    
    alert(vendorList);
}

function filterPOs() {
    loadPurchaseOrdersData();
}

// Form submission
const createPOForm = document.getElementById('createPOForm');
if (createPOForm) {
    createPOForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const invoiceType = document.getElementById('invoiceType').value;
        const vendorId = document.getElementById('vendorSelect').value;
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);
        
        if (!invoiceType || !vendorId || !totalAmount) {
            alert('❌ Please fill all required fields!');
            return;
        }
        
        const vendor = window.purchaseOrderManager.getVendors().find(v => v.id === vendorId);
        let itemDescription = '';
        let items = [];
        
        // Build item description based on type
        if (invoiceType === 'airline') {
            const weight = document.getElementById('weight').value;
            const rate = document.getElementById('ratePerKg').value;
            const flight = document.getElementById('flightNumber').value;
            itemDescription = `Airline Freight - ${flight} (${weight}kg @ ₹${rate}/kg)`;
            items = [{
                name: itemDescription,
                quantity: parseFloat(weight),
                unitPrice: parseFloat(rate),
                totalPrice: totalAmount
            }];
        } else if (invoiceType === 'shipping') {
            const qty = document.getElementById('containerQty').value;
            const rate = document.getElementById('ratePerContainer').value;
            const vessel = document.getElementById('vesselName').value;
            const containerType = document.getElementById('containerType').value;
            itemDescription = `Sea Freight - ${vessel} (${qty}x ${containerType} @ ₹${rate})`;
            items = [{
                name: itemDescription,
                quantity: parseFloat(qty),
                unitPrice: parseFloat(rate),
                totalPrice: totalAmount
            }];
        } else if (invoiceType === 'courier') {
            const pieces = document.getElementById('pieces').value;
            const rate = document.getElementById('ratePerPiece').value;
            const service = document.getElementById('serviceType').value;
            const destination = document.getElementById('destination').value;
            itemDescription = `Courier Service - ${service} to ${destination} (${pieces} pieces @ ₹${rate})`;
            items = [{
                name: itemDescription,
                quantity: parseFloat(pieces),
                unitPrice: parseFloat(rate),
                totalPrice: totalAmount
            }];
        }
        
        const poData = {
            vendorId: vendor.id,
            vendorName: vendor.name,
            invoiceType: invoiceType,
            items: items,
            totalAmount: totalAmount,
            notes: document.getElementById('notes').value
        };
        
        const po = window.purchaseOrderManager.createPurchaseOrder(poData);
        
        loadPurchaseOrdersData();
        closePOModal();
        
        alert(`✅ Purchase Order Created!\n\n📋 PO: ${po.id}\n👥 Vendor: ${po.vendorName}\n📦 Type: ${invoiceType}\n💰 Amount: ₹${po.totalAmount.toLocaleString('en-IN')}`);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}