// Quotations Management - Complete Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadQuotationsData();
    checkEnquiryForQuote();
    setupRateCalculation();
    setupQuotationCalculation();
    startAutoRefresh();
});

// Setup real-time quotation calculation
function setupQuotationCalculation() {
    const agentRate = document.getElementById('agentRate');
    const profitValue = document.getElementById('profitValue');
    const profitType = document.getElementById('profitType');
    
    if (agentRate) agentRate.addEventListener('input', calculateQuotation);
    if (profitValue) profitValue.addEventListener('input', calculateQuotation);
    if (profitType) profitType.addEventListener('change', toggleProfitType);
}

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('currentUser').textContent = 
        `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)} Branch`;
}

// Check if coming from enquiry
function checkEnquiryForQuote() {
    const enquiryNo = sessionStorage.getItem('createQuoteFromEnquiry');
    if (enquiryNo) {
        sessionStorage.removeItem('createQuoteFromEnquiry');
        showAddQuotationForEnquiry(enquiryNo);
    }
}

function loadQuotationsData() {
    // Get quotations from workflow manager
    const quotations = window.workflowManager.getQuotations();
    
    // Calculate stats
    const pending = quotations.filter(q => q.status === 'sent').length;
    const approved = quotations.filter(q => q.status === 'approved').length;
    const converted = quotations.filter(q => q.status === 'converted').length;
    
    const totalProfit = quotations.reduce((sum, q) => sum + (q.profit || 0), 0);
    const totalRevenue = quotations.reduce((sum, q) => sum + ((q.customerRate || 0) * (q.cbm || 0)), 0);
    const avgProfit = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    
    document.getElementById('pendingQuotes').textContent = pending;
    document.getElementById('approvedQuotes').textContent = approved;
    document.getElementById('avgProfit').textContent = avgProfit + '%';
    document.getElementById('monthValue').textContent = '₹' + Math.round(totalRevenue * 80).toLocaleString('en-IN');
    
    // Load table data
    displayQuotations(quotations);
}

function displayQuotations(quotations) {
    const tbody = document.getElementById('quotationsTable');
    tbody.innerHTML = '';
    
    quotations.forEach(quote => {
        const statusClass = getStatusClass(quote.status);
        const profitMargin = quote.customerRate && quote.agentRate ? 
            Math.round(((quote.customerRate - quote.agentRate) / quote.customerRate) * 100) : 0;
        const nextAction = getNextQuoteAction(quote.status);
        
        const row = `
            <tr>
                <td>
                    <strong>${quote.no}</strong>
                    <br><small>ENQ: ${quote.enquiryNo}</small>
                </td>
                <td>${formatDate(quote.date)}</td>
                <td>${quote.customer}</td>
                <td>${quote.origin} → ${quote.destination}</td>
                <td>$${quote.agentRate || 0}/CBM</td>
                <td>$${quote.customerRate || 0}/CBM</td>
                <td>
                    <div>$${(quote.profit || 0).toFixed(1)}</div>
                    <small>${profitMargin}% margin</small>
                </td>
                <td><span class="status-${statusClass}">${quote.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewQuote('${quote.no}')">👁️ View</button>
                    <button class="btn-small btn-primary" onclick="${nextAction.action}('${quote.no}')">${nextAction.label}</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getNextQuoteAction(status) {
    switch(status) {
        case 'sent': return { action: 'approveQuotation', label: '✅ Approve' };
        case 'approved': return { action: 'convertQuoteToJob', label: '💼 Job' };
        case 'converted': return { action: 'viewQuote', label: '✓ Done' };
        default: return { action: 'viewQuote', label: '👁️ View' };
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'sent': return 'pending';
        case 'approved': return 'success';
        case 'converted': return 'info';
        default: return 'default';
    }
}

// Show quotation modal for specific enquiry
function showAddQuotationForEnquiry(enquiryNo) {
    console.log('Loading quotation modal for enquiry:', enquiryNo);
    
    // Try to find enquiry from both sources
    let enquiry = null;
    
    // First try localStorage
    const localEnquiries = JSON.parse(localStorage.getItem('enquiries')) || [];
    enquiry = localEnquiries.find(e => e.no === enquiryNo);
    console.log('Found in localStorage:', enquiry ? 'Yes' : 'No');
    
    // If not found, try workflow manager
    if (!enquiry && window.workflowManager && window.workflowManager.getEnquiries) {
        const workflowEnquiries = window.workflowManager.getEnquiries();
        enquiry = workflowEnquiries.find(e => e.no === enquiryNo);
        console.log('Found in workflow manager:', enquiry ? 'Yes' : 'No');
    }
    
    if (!enquiry) {
        alert('❌ Enquiry not found!');
        return;
    }
    
    console.log('Enquiry data:', enquiry);
    
    // Wait for DOM to be ready, then fill form
    setTimeout(() => {
        try {
            // Pre-fill enquiry details
            const enquiryNoField = document.getElementById('enquiryNo');
            const enquiryDateField = document.getElementById('enquiryDate');
            if (enquiryNoField) enquiryNoField.value = enquiry.no;
            if (enquiryDateField) enquiryDateField.value = formatDate(enquiry.date);
            
            // Pre-fill customer details
            const customerNameField = document.getElementById('customerName');
            const contactPersonField = document.getElementById('contactPerson');
            const customerPhoneField = document.getElementById('customerPhone');
            const customerEmailField = document.getElementById('customerEmail');
            
            if (customerNameField) customerNameField.value = enquiry.customer;
            if (contactPersonField) contactPersonField.value = enquiry.contact;
            if (customerPhoneField) customerPhoneField.value = enquiry.phone;
            if (customerEmailField) customerEmailField.value = enquiry.email || '';
            
            // Pre-fill shipment details
            const routeField = document.getElementById('route');
            const transportModeField = document.getElementById('transportMode');
            const commodityField = document.getElementById('commodity');
            const weightCbmField = document.getElementById('weightCbm');
            
            if (routeField) routeField.value = `${enquiry.origin} → ${enquiry.destination}`;
            if (transportModeField) transportModeField.value = enquiry.mode;
            if (commodityField) commodityField.value = enquiry.commodity;
            if (weightCbmField) weightCbmField.value = `${enquiry.weight} KG / ${enquiry.cbm || 0} CBM`;
            
            // Store enquiry reference
            const form = document.getElementById('addQuotationForm');
            if (form) {
                form.dataset.enquiryNo = enquiryNo;
                form.dataset.cbm = enquiry.cbm || 0;
            }
            
            console.log('Form pre-filled successfully');
        } catch (error) {
            console.error('Error filling form:', error);
        }
    }, 100);
    
    showAddQuotation();
}

function showAddQuotation() {
    document.getElementById('addQuotationModal').style.display = 'block';
}

// Agent Selection Functions
function selectAgentRate(agentType, rate) {
    try {
        // Remove previous selection
        document.querySelectorAll('.rate-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select current card
        if (event && event.target) {
            const card = event.target.closest('.rate-card');
            if (card) card.classList.add('selected');
        }
        
        // Set agent and rate
        const selectedAgentField = document.getElementById('selectedAgent');
        const agentRateField = document.getElementById('agentRate');
        
        if (selectedAgentField) selectedAgentField.value = agentType;
        if (agentRateField) agentRateField.value = rate;
        
        console.log('Agent selected:', agentType, 'Rate:', rate);
        
        // Trigger calculation
        calculateQuotation();
    } catch (error) {
        console.error('Error selecting agent:', error);
    }
}

// Toggle between percentage and fixed profit
function toggleProfitType() {
    const profitType = document.getElementById('profitType').value;
    const profitLabel = document.getElementById('profitLabel');
    
    if (profitType === 'percentage') {
        profitLabel.textContent = 'Profit Percentage (%)';
    } else {
        profitLabel.textContent = 'Fixed Profit Amount ($)';
    }
    
    calculateQuotation();
}

// Calculate quotation based on agent rate and profit
function calculateQuotation() {
    try {
        const agentRateField = document.getElementById('agentRate');
        const profitValueField = document.getElementById('profitValue');
        const profitTypeField = document.getElementById('profitType');
        const form = document.getElementById('addQuotationForm');
        
        if (!agentRateField || !profitValueField || !profitTypeField || !form) {
            console.log('Required fields not found for calculation');
            return;
        }
        
        const agentRate = parseFloat(agentRateField.value) || 0;
        const profitValue = parseFloat(profitValueField.value) || 0;
        const profitType = profitTypeField.value;
        const cbm = parseFloat(form.dataset.cbm) || 0;
        
        console.log('Calculation inputs:', { agentRate, profitValue, profitType, cbm });
        
        if (agentRate > 0 && profitValue > 0 && cbm > 0) {
            let customerRate, totalProfit, profitMargin;
            
            if (profitType === 'percentage') {
                // Percentage-based profit
                customerRate = agentRate * (1 + profitValue / 100);
                totalProfit = (customerRate - agentRate) * cbm;
                profitMargin = profitValue;
            } else {
                // Fixed amount profit
                customerRate = agentRate + (profitValue / cbm);
                totalProfit = profitValue;
                profitMargin = ((customerRate - agentRate) / customerRate) * 100;
            }
            
            const totalAmount = customerRate * cbm;
            
            console.log('Calculation results:', { customerRate, totalProfit, profitMargin, totalAmount });
            
            // Update fields safely
            const customerRateField = document.getElementById('customerRate');
            const totalProfitField = document.getElementById('totalProfit');
            const totalAmountField = document.getElementById('totalAmount');
            const profitMarginField = document.getElementById('profitMargin');
            
            if (customerRateField) customerRateField.value = customerRate.toFixed(2);
            if (totalProfitField) totalProfitField.value = totalProfit.toFixed(2);
            if (totalAmountField) totalAmountField.value = totalAmount.toFixed(2);
            if (profitMarginField) profitMarginField.value = profitMargin.toFixed(2);
            
            console.log('Fields updated successfully');
        }
    } catch (error) {
        console.error('Error in calculation:', error);
    }
}

function showRateComparison() {
    document.getElementById('rateComparisonModal').style.display = 'block';
}

// Agent Rate Comparison with Multiple Agents
function setupRateCalculation() {
    const agent1 = document.getElementById('agent1Rate');
    const agent2 = document.getElementById('agent2Rate');
    const agent3 = document.getElementById('agent3Rate');
    const profitMargin = document.getElementById('profitMargin');
    const cbm = document.getElementById('cbm');
    const customerRate = document.getElementById('customerRate');
    const totalAmount = document.getElementById('totalAmount');
    
    function calculateRates() {
        const rates = [
            { agent: 'Dubai Agent', rate: parseFloat(agent1.value) || 0, transit: '7 days' },
            { agent: 'Singapore Agent', rate: parseFloat(agent2.value) || 0, transit: '5 days' },
            { agent: 'Hamburg Agent', rate: parseFloat(agent3.value) || 0, transit: '10 days' }
        ].filter(r => r.rate > 0);
        
        if (rates.length > 0) {
            const bestRate = rates.reduce((min, current) => current.rate < min.rate ? current : min);
            document.getElementById('bestRate').innerHTML = `
                <strong>Best Rate: $${bestRate.rate}/CBM</strong><br>
                <small>${bestRate.agent} - ${bestRate.transit}</small>
            `;
            
            const profit = parseFloat(profitMargin.value) || 0;
            const volume = parseFloat(cbm.value) || 0;
            
            if (profit > 0 && volume > 0) {
                const customerRateValue = bestRate.rate + (profit / volume);
                customerRate.value = customerRateValue.toFixed(2);
                totalAmount.value = (customerRateValue * volume).toFixed(2);
                
                // Store best agent rate for profit calculation
                customerRate.dataset.agentRate = bestRate.rate;
                customerRate.dataset.bestAgent = bestRate.agent;
            }
        }
    }
    
    [agent1, agent2, agent3, profitMargin, cbm].forEach(input => {
        if (input) input.addEventListener('input', calculateRates);
    });
}

// Approve Quotation
function approveQuotation(quoteNo) {
    const quotation = window.workflowManager.approveQuotation(quoteNo);
    
    if (quotation) {
        alert(`✅ Quotation Approved!\n\n💰 Quote: ${quotation.no}\n👤 Customer: ${quotation.customer}\n💵 Rate: $${quotation.customerRate}/CBM\n💰 Profit: $${quotation.profit}\n\n🎯 Next Step: Convert to Job`);
        loadQuotationsData();
    }
}

// Convert Quotation to Job
function convertQuoteToJob(quoteNo) {
    const job = window.workflowManager.convertQuotationToJob(quoteNo);
    
    if (job) {
        alert(`✅ Job Created Successfully!\n\n💼 Job: ${job.no}\n👤 Customer: ${job.customer}\n🚚 Route: ${job.origin} → ${job.destination}\n💰 Profit: $${job.profit}\n\n➡️ Redirecting to Jobs page...`);
        
        loadQuotationsData();
        window.location.href = 'ideal-jobs.html';
    } else {
        alert('❌ Failed to create job! Quotation must be approved first.');
    }
}

function viewQuote(no) {
    const quote = window.workflowManager.getQuotations().find(q => q.no === no);
    if (!quote) return;
    
    const profitMargin = quote.customerRate && quote.agentRate ? 
        Math.round(((quote.customerRate - quote.agentRate) / quote.customerRate) * 100) : 0;
    
    alert(`💰 Quotation Details - ${no}\n\n👤 Customer: ${quote.customer}\n🚚 Route: ${quote.origin} → ${quote.destination}\n📦 Cargo: ${quote.commodity}\n📊 Volume: ${quote.cbm} CBM\n\n💵 Agent Rate: $${quote.agentRate || 0}/CBM\n💰 Customer Rate: $${quote.customerRate || 0}/CBM\n📈 Total Profit: $${quote.profit || 0}\n📊 Profit Margin: ${profitMargin}%\n\n📋 Status: ${quote.status.toUpperCase()}`);
}

function filterQuotations() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchQuote').value.toLowerCase();
    
    let quotations = window.workflowManager.getQuotations();
    
    if (statusFilter !== 'all') {
        quotations = quotations.filter(quote => quote.status === statusFilter);
    }
    
    if (searchTerm) {
        quotations = quotations.filter(quote => 
            quote.no.toLowerCase().includes(searchTerm) ||
            quote.customer.toLowerCase().includes(searchTerm) ||
            quote.enquiryNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayQuotations(quotations);
}

function closeModal() {
    document.getElementById('addQuotationModal').style.display = 'none';
    document.getElementById('addQuotationForm').reset();
    delete document.getElementById('addQuotationForm').dataset.enquiryNo;
}

function closeRateModal() {
    document.getElementById('rateComparisonModal').style.display = 'none';
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addQuotationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const enquiryNo = this.dataset.enquiryNo;
            if (!enquiryNo) {
                alert('No enquiry selected!');
                return;
            }
            
            // Get values safely
            const agentRateField = document.getElementById('agentRate');
            const customerRateField = document.getElementById('customerRate');
            const totalProfitField = document.getElementById('totalProfit');
            const selectedAgentField = document.getElementById('selectedAgent');
            
            if (!agentRateField || !customerRateField || !totalProfitField) {
                alert('❌ Please fill all required fields!');
                return;
            }
            
            const agentRate = parseFloat(agentRateField.value) || 0;
            const customerRateValue = parseFloat(customerRateField.value) || 0;
            const totalProfit = parseFloat(totalProfitField.value) || 0;
            const selectedAgent = selectedAgentField ? selectedAgentField.value : 'Unknown Agent';
            
            if (agentRate === 0 || customerRateValue === 0) {
                alert('❌ Please select an agent and set rates!');
                return;
            }
            
            const quoteData = {
                agentRate: agentRate,
                customerRate: customerRateValue,
                profit: totalProfit,
                bestAgent: selectedAgent,
                validityDays: 7
            };
            
            console.log('Creating quotation with data:', quoteData);
            
            // Create quotation from enquiry
            if (window.workflowManager && window.workflowManager.createQuotationFromEnquiry) {
                const quotation = window.workflowManager.createQuotationFromEnquiry(enquiryNo, quoteData);
                
                if (quotation) {
                    alert(`✅ Quotation Created Successfully!\n\n💰 Quote: ${quotation.no}\n👤 Customer: ${quotation.customer}\n💵 Rate: $${quotation.customerRate}/CBM\n💰 Profit: $${quotation.profit.toFixed(2)}\n\n🎯 Next: Send to customer for approval`);
                    
                    loadQuotationsData();
                    closeModal();
                } else {
                    alert('❌ Failed to create quotation!');
                }
            } else {
                alert('❌ Workflow manager not available!');
            }
        });
    }
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(loadQuotationsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addQuotationModal');
    const rateModal = document.getElementById('rateComparisonModal');
    
    if (event.target === addModal) {
        closeModal();
    }
    if (event.target === rateModal) {
        closeRateModal();
    }
}