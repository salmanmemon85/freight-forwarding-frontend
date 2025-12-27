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
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = 
            `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)} Branch`;
    }
}

function loadEnquiriesData() {
    let enquiries = [];
    
    // Always try localStorage first for manual enquiries
    const localEnquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
    console.log('Loaded from localStorage:', localEnquiries.length);
    
    // Try to get enquiries from workflow manager and merge
    if (window.workflowManager && window.workflowManager.getEnquiries) {
        try {
            const workflowEnquiries = window.workflowManager.getEnquiries();
            console.log('Loaded from workflow manager:', workflowEnquiries.length);
            
            // Merge both arrays, avoiding duplicates
            enquiries = [...localEnquiries];
            workflowEnquiries.forEach(wfEnq => {
                if (!enquiries.find(e => e.no === wfEnq.no)) {
                    enquiries.push(wfEnq);
                }
            });
            console.log('Merged enquiries total:', enquiries.length);
        } catch (e) {
            console.log('Workflow manager not available, using localStorage only');
            enquiries = localEnquiries;
        }
    } else {
        enquiries = localEnquiries;
    }
    
    // Add sample data if no enquiries exist
    if (enquiries.length === 0) {
        enquiries = createSampleEnquiries();
        localStorage.setItem('enquiries', JSON.stringify(enquiries));
        console.log('Created sample enquiries:', enquiries.length);
    }
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayCount = enquiries.filter(e => e.date === today).length;
    const pendingCount = enquiries.filter(e => e.status === 'new').length;
    const quotedCount = enquiries.filter(e => e.status === 'quoted').length;
    const convertedCount = enquiries.filter(e => e.status === 'converted').length;
    const successRate = enquiries.length > 0 ? Math.round((convertedCount / enquiries.length) * 100) : 0;
    
    // Update stats safely
    const todayEl = document.getElementById('todayEnquiries');
    const pendingEl = document.getElementById('pendingResponse');
    const quotedEl = document.getElementById('convertedQuotes');
    const successEl = document.getElementById('successRate');
    
    if (todayEl) todayEl.textContent = todayCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (quotedEl) quotedEl.textContent = quotedCount;
    if (successEl) successEl.textContent = successRate + '%';
    
    // Load table data
    displayEnquiries(enquiries);
}

// Create sample enquiries for testing
function createSampleEnquiries() {
    const today = new Date().toISOString().split('T')[0];
    return [
        {
            no: 'ENQ001',
            date: today,
            status: 'new',
            customer: 'ABC Industries',
            contact: 'John Smith',
            phone: '+92-300-1234567',
            email: 'john@abc.com',
            mode: 'Sea',
            type: 'FCL',
            origin: 'Karachi Port',
            destination: 'Dubai Port',
            weight: '1000',
            cbm: '28',
            commodity: 'Electronics',
            hsCode: '8517',
            remarks: 'Urgent shipment',
            createdAt: new Date().toISOString()
        },
        {
            no: 'ENQ002',
            date: today,
            status: 'quoted',
            customer: 'XYZ Trading',
            contact: 'Sarah Ahmed',
            phone: '+92-321-9876543',
            email: 'sarah@xyz.com',
            mode: 'Air',
            type: 'General',
            origin: 'Karachi Airport',
            destination: 'London Airport',
            weight: '500',
            cbm: '3',
            commodity: 'Textiles',
            hsCode: '6204',
            remarks: 'Temperature controlled',
            createdAt: new Date().toISOString()
        }
    ];
}

function displayEnquiries(enquiries) {
    const tbody = document.getElementById('enquiriesTable');
    if (!tbody) {
        console.log('Table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (enquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No enquiries found</td></tr>';
        return;
    }
    
    enquiries.forEach(enquiry => {
        const statusClass = getStatusClass(enquiry.status);
        const nextAction = getNextAction(enquiry.status);
        
        // Safe workflow chain check
        let workflow = { enquiry: enquiry };
        if (window.workflowManager && window.workflowManager.getWorkflowChain) {
            try {
                workflow = window.workflowManager.getWorkflowChain(enquiry.no);
            } catch (e) {
                console.log('Workflow chain not available for:', enquiry.no);
            }
        }
        
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
    
    console.log('Displayed', enquiries.length, 'enquiries');
}

function getWorkflowProgress(workflow) {
    if (!workflow) return '📅 New';
    
    const steps = [];
    if (workflow.enquiry) steps.push('📞 ENQ');
    if (workflow.quotation) steps.push('💰 QUO');
    if (workflow.job) steps.push('💼 JOB');
    if (workflow.invoice) steps.push('🧾 INV');
    if (workflow.payment) steps.push('💳 PAY');
    
    return steps.length > 0 ? steps.join(' → ') : '📅 New';
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
    const modal = document.getElementById('addEnquiryModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.log('Add enquiry modal not found');
    }
}

// STEP 2: Create Quotation from Enquiry
function createQuotation(enquiryNo) {
    console.log('Creating quotation for enquiry:', enquiryNo);
    
    // Store enquiry number for quotation creation
    sessionStorage.setItem('createQuoteFromEnquiry', enquiryNo);
    console.log('Stored enquiry number in session:', enquiryNo);
    
    // Redirect to quotations page
    window.location.href = 'ideal-quotations.html';
}

// STEP 3: Convert Approved Quotation to Job
function convertToJob(enquiryNo) {
    if (!window.workflowManager || !window.workflowManager.getWorkflowChain) {
        alert('❌ Workflow system not available!');
        return;
    }
    
    let workflow;
    try {
        workflow = window.workflowManager.getWorkflowChain(enquiryNo);
    } catch (e) {
        alert('❌ Cannot access workflow for this enquiry!');
        return;
    }
    
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
    
    let workflow = { quotation: null };
    if (window.workflowManager && window.workflowManager.getWorkflowChain) {
        try {
            workflow = window.workflowManager.getWorkflowChain(enquiryNo);
        } catch (e) {
            console.log('Workflow not available for follow-up');
        }
    }
    
    alert(`📞 Follow-up Required\n\n👤 Customer: ${enquiry.customer}\n📧 Contact: ${enquiry.contact}\n📱 Phone: ${enquiry.phone}\n\n💰 Quotation: ${workflow.quotation ? workflow.quotation.no : 'Not created'}\n📋 Status: Waiting for customer approval\n\n🎯 Action: Call customer for confirmation`);
}

// View Complete Workflow
function viewWorkflow(enquiryNo) {
    if (!window.workflowManager || !window.workflowManager.getWorkflowChain) {
        alert('❌ Workflow system not available!');
        return;
    }
    
    let workflow;
    try {
        workflow = window.workflowManager.getWorkflowChain(enquiryNo);
    } catch (e) {
        alert(`🔄 Basic Workflow - ${enquiryNo}\n\n📞 ENQUIRY: ${enquiryNo}\n   Status: Active\n\n📋 Note: Full workflow tracking not available yet.`);
        return;
    }
    
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
    
    workflowText += `📊 Overall Status: ${workflow.status ? workflow.status.toUpperCase() : 'IN PROGRESS'}`;
    
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

function closeQuotationModal() {
    const modal = document.getElementById('createQuotationModal');
    const form = document.getElementById('createQuotationForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function closeModal() {
    const modal = document.getElementById('addEnquiryModal');
    const form = document.getElementById('addEnquiryForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function exportEnquiries() {
    alert('Export functionality - Coming Soon!');
}

// Form submission for new enquiry
document.addEventListener('DOMContentLoaded', function() {
    const addEnquiryForm = document.getElementById('addEnquiryForm');
    if (addEnquiryForm) {
        addEnquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted - starting enquiry creation');
            
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
            
            console.log('Enquiry data collected:', enquiryData);
            
            // Create enquiry directly if workflow manager not available
            let enquiry;
            if (window.workflowManager && window.workflowManager.createEnquiry) {
                console.log('Using workflow manager to create enquiry');
                enquiry = window.workflowManager.createEnquiry(enquiryData);
            } else {
                console.log('Using manual enquiry creation');
                // Create enquiry manually
                enquiry = createEnquiryManually(enquiryData);
            }
            
            console.log('Enquiry created:', enquiry);
            
            // Check localStorage after creation
            const allEnquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
            console.log('All enquiries in localStorage:', allEnquiries.length, allEnquiries);
            
            // Refresh the table immediately
            console.log('Refreshing table data...');
            setTimeout(loadEnquiriesData, 100);
            closeModal();
            alert(`✅ Enquiry ${enquiry.no} created successfully!\n\n📋 Details:\nCustomer: ${enquiry.customer}\nRoute: ${enquiry.origin} → ${enquiry.destination}\nCargo: ${enquiry.commodity}\n\n🎯 Next Step: Create quotation`);
        });
    }
    
    // Form submission for quotation creation
    const createQuotationForm = document.getElementById('createQuotationForm');
    if (createQuotationForm) {
        createQuotationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const enquiryNo = document.getElementById('quotationEnquiryNo').value;
            const quotationData = {
                customerRate: document.getElementById('customerRate').value,
                vendorRate: document.getElementById('vendorRate').value,
                validUntil: document.getElementById('validUntil').value,
                currency: document.getElementById('currency').value,
                terms: document.getElementById('terms').value || '',
                remarks: document.getElementById('quotationRemarks').value || ''
            };
            
            let quotation;
            if (window.workflowManager && window.workflowManager.createQuotation) {
                quotation = window.workflowManager.createQuotation(enquiryNo, quotationData);
            } else {
                // Manual quotation creation
                quotation = createQuotationManually(enquiryNo, quotationData);
            }
            
            closeQuotationModal();
            loadEnquiriesData();
            alert(`✅ Quotation ${quotation.no} created successfully!\n\n💰 Details:\nRate: ${quotationData.currency} ${quotationData.customerRate}/CBM\nValid Until: ${quotationData.validUntil}\n\n🎯 Next Step: Send to customer for approval`);
        });
    }
});

// Manual enquiry creation when workflow manager not available
function createEnquiryManually(enquiryData) {
    console.log('Starting manual enquiry creation with data:', enquiryData);
    
    const enquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
    console.log('Existing enquiries count:', enquiries.length);
    
    const enquiryNo = 'ENQ' + Date.now().toString().slice(-6);
    console.log('Generated enquiry number:', enquiryNo);
    
    const enquiry = {
        no: enquiryNo,
        date: new Date().toISOString().split('T')[0],
        status: 'new',
        ...enquiryData,
        createdAt: new Date().toISOString()
    };
    
    console.log('New enquiry object:', enquiry);
    
    enquiries.push(enquiry);
    console.log('Updated enquiries array length:', enquiries.length);
    
    localStorage.setItem('enquiries', JSON.stringify(enquiries));
    console.log('Saved to localStorage. Verifying...');
    
    // Verify save
    const savedEnquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
    console.log('Verification - enquiries in localStorage:', savedEnquiries.length);
    console.log('Last enquiry saved:', savedEnquiries[savedEnquiries.length - 1]);
    
    return enquiry;
}

// Manual quotation creation when workflow manager not available
function createQuotationManually(enquiryNo, quotationData) {
    const quotations = JSON.parse(localStorage.getItem('quotations')) || [];
    const enquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
    
    const enquiry = enquiries.find(e => e.no === enquiryNo);
    if (!enquiry) {
        throw new Error('Enquiry not found');
    }
    
    const quotationNo = 'QUO' + Date.now().toString().slice(-6);
    
    const quotation = {
        no: quotationNo,
        enquiryNo: enquiryNo,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        customer: enquiry.customer,
        origin: enquiry.origin,
        destination: enquiry.destination,
        commodity: enquiry.commodity,
        weight: enquiry.weight,
        cbm: enquiry.cbm,
        ...quotationData,
        createdAt: new Date().toISOString()
    };
    
    quotations.push(quotation);
    localStorage.setItem('quotations', JSON.stringify(quotations));
    
    // Update enquiry status to quoted
    enquiry.status = 'quoted';
    localStorage.setItem('enquiries', JSON.stringify(enquiries));
    
    return quotation;
}

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
    const quotationModal = document.getElementById('createQuotationModal');
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === quotationModal) {
        closeQuotationModal();
    }
}