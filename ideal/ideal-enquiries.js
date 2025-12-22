// Enquiries Management - Complete A to Z Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadEnquiriesData();
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

function loadEnquiriesData() {
    // Get enquiries from workflow manager
    const enquiries = window.workflowManager.getEnquiries();
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayCount = enquiries.filter(e => e.date === today).length;
    const pendingCount = enquiries.filter(e => e.status === 'new').length;
    const quotedCount = enquiries.filter(e => e.status === 'quoted').length;
    const convertedCount = enquiries.filter(e => e.status === 'converted').length;
    const successRate = enquiries.length > 0 ? Math.round((convertedCount / enquiries.length) * 100) : 0;
    
    document.getElementById('todayEnquiries').textContent = todayCount;
    document.getElementById('pendingResponse').textContent = pendingCount;
    document.getElementById('convertedQuotes').textContent = quotedCount;
    document.getElementById('successRate').textContent = successRate + '%';
    
    // Load table data
    displayEnquiries(enquiries);
}

function displayEnquiries(enquiries) {
    const tbody = document.getElementById('enquiriesTable');
    tbody.innerHTML = '';
    
    enquiries.forEach(enquiry => {
        const statusClass = getStatusClass(enquiry.status);
        const nextAction = getNextAction(enquiry.status);
        const workflow = window.workflowManager.getWorkflowChain(enquiry.no);
        
        const row = `
            <tr>
                <td>
                    <strong>${enquiry.no}</strong>
                    <br><small>${getWorkflowProgress(workflow)}</small>
                </td>
                <td>${formatDate(enquiry.date)}</td>
                <td>
                    <div><strong>${enquiry.customer}</strong></div>
                    <small>${enquiry.contact} | ${enquiry.phone}</small>
                </td>
                <td>
                    <div>${enquiry.type} | ${enquiry.mode}</div>
                    <small>${enquiry.origin} → ${enquiry.destination}</small>
                </td>
                <td>
                    <div>${enquiry.commodity}</div>
                    <small>${enquiry.weight} KG | ${enquiry.cbm} CBM</small>
                </td>
                <td><span class="status-${statusClass}">${enquiry.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewWorkflow('${enquiry.no}')">🔄 Flow</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${enquiry.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getWorkflowProgress(workflow) {
    const steps = [];
    if (workflow.enquiry) steps.push('📞 ENQ');
    if (workflow.quotation) steps.push('💰 QUO');
    if (workflow.job) steps.push('💼 JOB');
    if (workflow.invoice) steps.push('🧾 INV');
    if (workflow.payment) steps.push('💳 PAY');
    return steps.join(' → ');
}

function getStatusClass(status) {
    switch(status) {
        case 'new': return 'new';
        case 'quoted': return 'pending';
        case 'approved': return 'success';
        case 'converted': return 'info';
        default: return 'default';
    }
}

function getNextAction(status) {
    switch(status) {
        case 'new': return { action: 'createQuotation', label: '💰 Quote' };
        case 'quoted': return { action: 'followUpCustomer', label: '📞 Follow' };
        case 'approved': return { action: 'convertToJob', label: '💼 Job' };
        case 'converted': return { action: 'viewWorkflow', label: '✅ Done' };
        default: return { action: 'viewWorkflow', label: '👁️ View' };
    }
}

// STEP 1: Create New Enquiry
function showAddEnquiry() {
    document.getElementById('addEnquiryModal').style.display = 'block';
}

// STEP 2: Create Quotation from Enquiry
function createQuotation(enquiryNo) {
    // Store enquiry number for quotation creation
    sessionStorage.setItem('createQuoteFromEnquiry', enquiryNo);
    
    const enquiry = window.workflowManager.getEnquiries().find(e => e.no === enquiryNo);
    if (!enquiry) return;
    
    alert(`Creating quotation for ${enquiryNo}...\n\n📋 Enquiry Details:\nCustomer: ${enquiry.customer}\nRoute: ${enquiry.origin} → ${enquiry.destination}\nCargo: ${enquiry.commodity} - ${enquiry.weight} KG\n\n➡️ Redirecting to Quotations page...`);
    
    // Redirect to quotations page
    window.location.href = 'ideal-quotations.html';
}

// STEP 3: Convert Approved Quotation to Job
function convertToJob(enquiryNo) {
    const workflow = window.workflowManager.getWorkflowChain(enquiryNo);
    
    if (!workflow.quotation || workflow.quotation.status !== 'approved') {
        alert('❌ Quotation must be approved first!\n\nCurrent Status: ' + (workflow.quotation ? workflow.quotation.status : 'No quotation'));
        return;
    }
    
    // Convert quotation to job
    const job = window.workflowManager.convertQuotationToJob(workflow.quotation.no);
    
    if (job) {
        alert(`✅ Job Created Successfully!\n\n💼 Job Details:\nJob No: ${job.no}\nCustomer: ${job.customer}\nRoute: ${job.origin} → ${job.destination}\nProfit: $${job.profit}\n\n➡️ Redirecting to Jobs page...`);
        
        loadEnquiriesData(); // Refresh data
        window.location.href = 'ideal-jobs.html';
    } else {
        alert('❌ Failed to create job!');
    }
}

function followUpCustomer(enquiryNo) {
    const enquiry = window.workflowManager.getEnquiries().find(e => e.no === enquiryNo);
    const workflow = window.workflowManager.getWorkflowChain(enquiryNo);
    
    alert(`📞 Follow-up Required\n\n👤 Customer: ${enquiry.customer}\n📧 Contact: ${enquiry.contact}\n📱 Phone: ${enquiry.phone}\n\n💰 Quotation: ${workflow.quotation ? workflow.quotation.no : 'Not created'}\n📋 Status: Waiting for customer approval\n\n🎯 Action: Call customer for confirmation`);
}

// View Complete Workflow
function viewWorkflow(enquiryNo) {
    const workflow = window.workflowManager.getWorkflowChain(enquiryNo);
    
    let workflowText = `🔄 Complete Workflow - ${enquiryNo}\n\n`;
    
    if (workflow.enquiry) {
        workflowText += `📞 ENQUIRY: ${workflow.enquiry.no}\n`;
        workflowText += `   Date: ${formatDate(workflow.enquiry.date)}\n`;
        workflowText += `   Status: ${workflow.enquiry.status.toUpperCase()}\n\n`;
    }
    
    if (workflow.quotation) {
        workflowText += `💰 QUOTATION: ${workflow.quotation.no}\n`;
        workflowText += `   Date: ${formatDate(workflow.quotation.date)}\n`;
        workflowText += `   Status: ${workflow.quotation.status.toUpperCase()}\n`;
        workflowText += `   Rate: $${workflow.quotation.customerRate || 0}/CBM\n\n`;
    }
    
    if (workflow.job) {
        workflowText += `💼 JOB: ${workflow.job.no}\n`;
        workflowText += `   Date: ${formatDate(workflow.job.date)}\n`;
        workflowText += `   Status: ${workflow.job.status.toUpperCase()}\n`;
        workflowText += `   Profit: $${workflow.job.profit || 0}\n\n`;
    }
    
    if (workflow.invoice) {
        workflowText += `🧾 INVOICE: ${workflow.invoice.no}\n`;
        workflowText += `   Date: ${formatDate(workflow.invoice.date)}\n`;
        workflowText += `   Status: ${workflow.invoice.status.toUpperCase()}\n`;
        workflowText += `   Amount: ₹${workflow.invoice.total || 0}\n\n`;
    }
    
    if (workflow.payment) {
        workflowText += `💳 PAYMENT: ${workflow.payment.id}\n`;
        workflowText += `   Date: ${formatDate(workflow.payment.date)}\n`;
        workflowText += `   Status: ${workflow.payment.status.toUpperCase()}\n`;
        workflowText += `   Amount: ₹${workflow.payment.amount || 0}\n\n`;
    }
    
    workflowText += `📊 Overall Status: ${workflow.status.toUpperCase()}`;
    
    alert(workflowText);
}

function filterEnquiries() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchEnquiry').value.toLowerCase();
    
    let enquiries = window.workflowManager.getEnquiries();
    
    if (statusFilter !== 'all') {
        enquiries = enquiries.filter(enquiry => enquiry.status === statusFilter);
    }
    
    if (searchTerm) {
        enquiries = enquiries.filter(enquiry => 
            enquiry.customer.toLowerCase().includes(searchTerm) ||
            enquiry.origin.toLowerCase().includes(searchTerm) ||
            enquiry.destination.toLowerCase().includes(searchTerm) ||
            enquiry.commodity.toLowerCase().includes(searchTerm) ||
            enquiry.no.toLowerCase().includes(searchTerm)
        );
    }
    
    displayEnquiries(enquiries);
}

function closeModal() {
    document.getElementById('addEnquiryModal').style.display = 'none';
    document.getElementById('addEnquiryForm').reset();
}

function exportEnquiries() {
    alert('Export functionality - Coming Soon!');
}

// Form submission for new enquiry
document.getElementById('addEnquiryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const enquiryData = {
        customer: document.getElementById('customerName').value,
        contact: document.getElementById('contactPerson').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value || '',
        mode: document.getElementById('transportMode').value,
        type: document.getElementById('shipmentType').value,
        origin: document.getElementById('originPort').value,
        destination: document.getElementById('destinationPort').value,
        weight: document.getElementById('weight').value,
        cbm: document.getElementById('cbm').value || '0',
        commodity: document.getElementById('cargoType').value,
        hsCode: document.getElementById('hsCode').value || '',
        remarks: document.getElementById('requirements').value || ''
    };
    
    // Create enquiry using workflow manager
    const enquiry = window.workflowManager.createEnquiry(enquiryData);
    
    loadEnquiriesData();
    closeModal();
    alert(`✅ Enquiry ${enquiry.no} created successfully!\n\n📋 Details:\nCustomer: ${enquiry.customer}\nRoute: ${enquiry.origin} → ${enquiry.destination}\nCargo: ${enquiry.commodity}\n\n🎯 Next Step: Create quotation`);
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadEnquiriesData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addEnquiryModal');
    if (event.target === modal) {
        closeModal();
    }
}