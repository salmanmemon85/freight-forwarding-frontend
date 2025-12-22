// Parties Management - Enhanced CRM with Rate Management

let currentTab = 'all';
let parties = [];
let rates = [];

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPartiesData();
    loadRatesData();
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

function loadPartiesData() {
    // Get existing parties or create sample data
    parties = JSON.parse(localStorage.getItem('parties')) || generateSampleParties();
    
    // Update stats
    updateStats();
    
    // Display parties based on current tab
    displayParties(filterPartiesByTab(currentTab));
}

function loadRatesData() {
    rates = JSON.parse(localStorage.getItem('rates')) || generateSampleRates();
    document.getElementById('totalRates').textContent = rates.length;
}

function generateSampleParties() {
    const sampleParties = [
        {
            id: 'CUST001',
            name: 'ABC Exports Ltd',
            type: 'customer',
            contact: 'Rajesh Kumar',
            phone: '+91-9876543210',
            email: 'rajesh@abcexports.com',
            city: 'Mumbai',
            businessVolume: '50 TEU/month',
            status: 'active',
            rateCard: true
        },
        {
            id: 'AGT001',
            name: 'Global Shipping Agency',
            type: 'agent',
            contact: 'Sarah Johnson',
            phone: '+65-98765432',
            email: 'sarah@globalship.com',
            city: 'Singapore',
            businessVolume: '200 TEU/month',
            status: 'active',
            rateCard: true,
            rates: {
                seaFreight: 1200,
                airFreight: 85
            }
        },
        {
            id: 'VEN001',
            name: 'Express Transport Services',
            type: 'vendor',
            contact: 'Amit Sharma',
            phone: '+91-9123456789',
            email: 'amit@expresstrans.com',
            city: 'Delhi',
            businessVolume: '100 trucks/month',
            status: 'active',
            rateCard: true,
            serviceType: 'transport',
            serviceRate: 25
        },
        {
            id: 'CHA001',
            name: 'Prime Customs House',
            type: 'cha',
            contact: 'Priya Patel',
            phone: '+91-9876512345',
            email: 'priya@primecha.com',
            city: 'Chennai',
            businessVolume: '300 BE/month',
            status: 'active',
            rateCard: false
        }
    ];
    
    localStorage.setItem('parties', JSON.stringify(sampleParties));
    return sampleParties;
}

function generateSampleRates() {
    const sampleRates = [
        {
            id: 'RATE001',
            partyId: 'AGT001',
            partyName: 'Global Shipping Agency',
            type: 'agent',
            route: 'Mumbai-Singapore',
            mode: 'sea',
            rate: 1200,
            unit: 'CBM',
            validFrom: '2024-01-01',
            validTo: '2024-12-31'
        },
        {
            id: 'RATE002',
            partyId: 'VEN001',
            partyName: 'Express Transport Services',
            type: 'vendor',
            service: 'Local Transport',
            rate: 25,
            unit: 'per km',
            validFrom: '2024-01-01',
            validTo: '2024-12-31'
        }
    ];
    
    localStorage.setItem('rates', JSON.stringify(sampleRates));
    return sampleRates;
}

function updateStats() {
    const customers = parties.filter(p => p.type === 'customer');
    const agents = parties.filter(p => p.type === 'agent');
    const vendors = parties.filter(p => p.type === 'vendor');
    
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('activeAgents').textContent = agents.length;
    document.getElementById('totalVendors').textContent = vendors.length;
}

function switchTab(tab) {
    currentTab = tab;
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    const buttons = document.querySelectorAll('.tab-btn');
    if (tab === 'all') buttons[0].classList.add('active');
    if (tab === 'customers') buttons[1].classList.add('active');
    if (tab === 'agents') buttons[2].classList.add('active');
    if (tab === 'vendors') buttons[3].classList.add('active');
    if (tab === 'cha') buttons[4].classList.add('active');
    
    // Filter and display parties
    displayParties(filterPartiesByTab(tab));
}

function filterPartiesByTab(tab) {
    if (tab === 'all') return parties;
    if (tab === 'customers') return parties.filter(p => p.type === 'customer');
    if (tab === 'agents') return parties.filter(p => p.type === 'agent');
    if (tab === 'vendors') return parties.filter(p => p.type === 'vendor');
    if (tab === 'cha') return parties.filter(p => p.type === 'cha');
    return parties;
}

function displayParties(partiesToShow) {
    const tbody = document.getElementById('partiesTable');
    tbody.innerHTML = '';
    
    if (partiesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No parties found</td></tr>';
        return;
    }
    
    partiesToShow.forEach(party => {
        const typeIcon = getTypeIcon(party.type);
        const rateStatus = party.rateCard ? '✅ Active' : '❌ Missing';
        const rateClass = party.rateCard ? 'success' : 'danger';
        
        const row = `
            <tr>
                <td><strong>${party.id}</strong></td>
                <td>
                    <div><strong>${party.name}</strong></div>
                    <small>${party.contact}</small>
                </td>
                <td>${typeIcon} ${party.type.toUpperCase()}</td>
                <td>
                    <div>📞 ${party.phone}</div>
                    <small>📧 ${party.email}</small>
                </td>
                <td>📍 ${party.city}</td>
                <td>${party.businessVolume}</td>
                <td><span class="status-${rateClass}">${rateStatus}</span></td>
                <td>
                    <button class="btn-small" onclick="viewParty('${party.id}')" title="View Details">👁️</button>
                    <button class="btn-small btn-primary" onclick="manageRates('${party.id}')" title="Manage Rates">💰</button>
                    <button class="btn-small" onclick="editParty('${party.id}')" title="Edit">✏️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getTypeIcon(type) {
    switch(type) {
        case 'customer': return '👤';
        case 'agent': return '🤝';
        case 'vendor': return '🏭';
        case 'cha': return '📋';
        default: return '👥';
    }
}

function toggleRateFields() {
    const partyType = document.getElementById('partyType').value;
    const agentFields = document.getElementById('agentRateFields');
    const vendorFields = document.getElementById('vendorFields');
    
    agentFields.style.display = partyType === 'agent' ? 'flex' : 'none';
    vendorFields.style.display = partyType === 'vendor' ? 'flex' : 'none';
}

function showAddParty() {
    document.getElementById('addPartyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addPartyModal').style.display = 'none';
    document.getElementById('addPartyForm').reset();
    toggleRateFields();
}

function showRateManager() {
    document.getElementById('rateManagerModal').style.display = 'block';
    switchRateTab('agent');
}

function closeRateModal() {
    document.getElementById('rateManagerModal').style.display = 'none';
}

function switchRateTab(tab) {
    // Remove active class from all buttons
    document.querySelectorAll('.rate-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    const buttons = document.querySelectorAll('.rate-tab-btn');
    if (tab === 'agent') buttons[0].classList.add('active');
    if (tab === 'vendor') buttons[1].classList.add('active');
    if (tab === 'compare') buttons[2].classList.add('active');
    
    const content = document.getElementById('rateContent');
    
    if (tab === 'agent') {
        content.innerHTML = generateAgentRatesContent();
    } else if (tab === 'vendor') {
        content.innerHTML = generateVendorRatesContent();
    } else if (tab === 'compare') {
        content.innerHTML = generateRateComparisonContent();
    }
}

function generateAgentRatesContent() {
    const agentRates = rates.filter(r => r.type === 'agent');
    
    let content = `
        <div class="rate-section">
            <h4>🤝 Agent Rate Cards</h4>
            <button class="btn-primary" onclick="addAgentRate()">+ Add Agent Rate</button>
            <table class="rate-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Route</th>
                        <th>Mode</th>
                        <th>Rate</th>
                        <th>Valid Until</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    agentRates.forEach(rate => {
        content += `
            <tr>
                <td>${rate.partyName}</td>
                <td>${rate.route}</td>
                <td>${rate.mode.toUpperCase()}</td>
                <td>₹${rate.rate}/${rate.unit}</td>
                <td>${formatDate(rate.validTo)}</td>
                <td>
                    <button class="btn-small" onclick="editRate('${rate.id}')">✏️</button>
                    <button class="btn-small btn-danger" onclick="deleteRate('${rate.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    content += `
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

function generateVendorRatesContent() {
    const vendorRates = rates.filter(r => r.type === 'vendor');
    
    let content = `
        <div class="rate-section">
            <h4>🏭 Vendor Rate Cards</h4>
            <button class="btn-primary" onclick="addVendorRate()">+ Add Vendor Rate</button>
            <table class="rate-table">
                <thead>
                    <tr>
                        <th>Vendor</th>
                        <th>Service</th>
                        <th>Rate</th>
                        <th>Valid Until</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    vendorRates.forEach(rate => {
        content += `
            <tr>
                <td>${rate.partyName}</td>
                <td>${rate.service}</td>
                <td>₹${rate.rate}/${rate.unit}</td>
                <td>${formatDate(rate.validTo)}</td>
                <td>
                    <button class="btn-small" onclick="editRate('${rate.id}')">✏️</button>
                    <button class="btn-small btn-danger" onclick="deleteRate('${rate.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    content += `
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

function generateRateComparisonContent() {
    return `
        <div class="rate-comparison">
            <h4>📊 Rate Comparison Tool</h4>
            <p class="comparison-desc">Compare rates from different agents for the same route and mode to get the best pricing.</p>
            
            <div class="comparison-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Select Route</label>
                        <select id="compareRoute">
                            <option value="">Choose Route</option>
                            <option value="Mumbai-Singapore">Mumbai → Singapore</option>
                            <option value="Delhi-Dubai">Delhi → Dubai</option>
                            <option value="Chennai-Colombo">Chennai → Colombo</option>
                            <option value="Bangalore-London">Bangalore → London</option>
                            <option value="Kolkata-Hamburg">Kolkata → Hamburg</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Select Mode</label>
                        <select id="compareMode">
                            <option value="">Choose Mode</option>
                            <option value="sea">🚢 Sea Freight</option>
                            <option value="air">✈️ Air Freight</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button class="btn-compare" onclick="compareRates()">🔍 Compare Rates</button>
                    </div>
                </div>
            </div>
            
            <div id="comparisonResults" class="comparison-results">
                <div class="no-results">
                    <div class="icon">📊</div>
                    <h5>Ready to Compare</h5>
                    <p>Select route and mode above to compare rates from different agents</p>
                </div>
            </div>
        </div>
    `;
}

function compareRates() {
    const route = document.getElementById('compareRoute').value;
    const mode = document.getElementById('compareMode').value;
    
    if (!route || !mode) {
        alert('⚠️ Please select both route and mode to compare rates');
        return;
    }
    
    // Filter rates based on route and mode
    const matchingRates = rates.filter(r => 
        r.type === 'agent' && 
        r.route === route && 
        r.mode === mode
    );
    
    const results = document.getElementById('comparisonResults');
    
    if (matchingRates.length === 0) {
        results.innerHTML = `
            <div class="no-results">
                <div class="icon">🚫</div>
                <h5>No Rates Found</h5>
                <p>No agent rates available for <strong>${route}</strong> via <strong>${mode.toUpperCase()}</strong></p>
                <small>Add agent rates first to see comparisons</small>
            </div>
        `;
        return;
    }
    
    // Sort rates by price (lowest first)
    matchingRates.sort((a, b) => a.rate - b.rate);
    
    let tableHTML = `
        <div class="comparison-header">
            <h5>📊 Rate Comparison Results</h5>
            <p><strong>Route:</strong> ${route} | <strong>Mode:</strong> ${mode.toUpperCase()}</p>
        </div>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Agent</th>
                    <th>Rate</th>
                    <th>Unit</th>
                    <th>Validity</th>
                    <th>Savings</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const highestRate = Math.max(...matchingRates.map(r => r.rate));
    
    matchingRates.forEach((rate, index) => {
        const savings = highestRate - rate.rate;
        const savingsPercent = ((savings / highestRate) * 100).toFixed(1);
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
        const bestDeal = index === 0 ? '<span class="best-deal">🎆 Best Deal</span>' : '';
        
        tableHTML += `
            <tr class="${index === 0 ? 'best-rate' : ''}">
                <td class="rank">${rankIcon}</td>
                <td>
                    <strong>${rate.partyName}</strong>
                    ${bestDeal}
                </td>
                <td class="rate-amount">₹${rate.rate.toLocaleString('en-IN')}</td>
                <td>${rate.unit}</td>
                <td>${formatDate(rate.validTo)}</td>
                <td class="savings">
                    ${savings > 0 ? `₹${savings.toLocaleString('en-IN')} (${savingsPercent}%)` : '-'}
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
        <div class="comparison-summary">
            <div class="summary-item">
                <strong>Total Agents:</strong> ${matchingRates.length}
            </div>
            <div class="summary-item">
                <strong>Price Range:</strong> ₹${Math.min(...matchingRates.map(r => r.rate)).toLocaleString('en-IN')} - ₹${highestRate.toLocaleString('en-IN')}
            </div>
            <div class="summary-item">
                <strong>Max Savings:</strong> ₹${(highestRate - Math.min(...matchingRates.map(r => r.rate))).toLocaleString('en-IN')}
            </div>
        </div>
    `;
    
    results.innerHTML = tableHTML;
}

function addAgentRate() {
    const agentSelect = parties.filter(p => p.type === 'agent').map(agent => 
        `<option value="${agent.id}">${agent.name}</option>`
    ).join('');
    
    const content = document.getElementById('rateContent');
    content.innerHTML = `
        <div class="add-rate-form">
            <h4>🤝 Add Agent Rate Card</h4>
            <form id="agentRateForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Select Agent</label>
                        <select id="agentSelect" required>
                            <option value="">Choose Agent</option>
                            ${agentSelect}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Route</label>
                        <input type="text" id="routeInput" placeholder="Mumbai-Singapore" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Mode</label>
                        <select id="modeSelect" required>
                            <option value="">Select Mode</option>
                            <option value="sea">Sea Freight</option>
                            <option value="air">Air Freight</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Rate (₹)</label>
                        <input type="number" id="rateInput" placeholder="1200" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Unit</label>
                        <select id="unitSelect" required>
                            <option value="CBM">CBM</option>
                            <option value="KG">KG</option>
                            <option value="TEU">TEU</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Valid Until</label>
                        <input type="date" id="validUntil" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="switchRateTab('agent')">Cancel</button>
                    <button type="submit">💾 Save Rate</button>
                </div>
            </form>
        </div>
    `;
    
    // Set default date (1 year from now)
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('validUntil').value = nextYear.toISOString().split('T')[0];
    
    // Handle form submission
    document.getElementById('agentRateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAgentRate();
    });
}

function saveAgentRate() {
    const agentId = document.getElementById('agentSelect').value;
    const route = document.getElementById('routeInput').value;
    const mode = document.getElementById('modeSelect').value;
    const rate = document.getElementById('rateInput').value;
    const unit = document.getElementById('unitSelect').value;
    const validUntil = document.getElementById('validUntil').value;
    
    const agent = parties.find(p => p.id === agentId);
    
    const newRate = {
        id: 'RATE' + (rates.length + 1).toString().padStart(3, '0'),
        partyId: agentId,
        partyName: agent.name,
        type: 'agent',
        route: route,
        mode: mode,
        rate: parseFloat(rate),
        unit: unit,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: validUntil
    };
    
    rates.push(newRate);
    localStorage.setItem('rates', JSON.stringify(rates));
    
    // Update party rate card status
    const partyIndex = parties.findIndex(p => p.id === agentId);
    if (partyIndex !== -1) {
        parties[partyIndex].rateCard = true;
        localStorage.setItem('parties', JSON.stringify(parties));
    }
    
    alert(`✅ Agent Rate Added Successfully!\n\n🤝 Agent: ${agent.name}\n🛣️ Route: ${route}\n🚢 Mode: ${mode.toUpperCase()}\n💰 Rate: ₹${rate}/${unit}\n📅 Valid Until: ${validUntil}`);
    
    // Go back to agent rates list
    switchRateTab('agent');
    loadRatesData();
}

function addVendorRate() {
    const vendorSelect = parties.filter(p => p.type === 'vendor').map(vendor => 
        `<option value="${vendor.id}">${vendor.name}</option>`
    ).join('');
    
    const content = document.getElementById('rateContent');
    content.innerHTML = `
        <div class="add-rate-form">
            <h4>🏭 Add Vendor Rate Card</h4>
            <form id="vendorRateForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Select Vendor</label>
                        <select id="vendorSelect" required>
                            <option value="">Choose Vendor</option>
                            ${vendorSelect}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Service Type</label>
                        <select id="serviceSelect" required>
                            <option value="">Select Service</option>
                            <option value="Local Transport">Local Transport</option>
                            <option value="Customs Clearance">Customs Clearance</option>
                            <option value="Warehousing">Warehousing</option>
                            <option value="Insurance">Insurance</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Rate (₹)</label>
                        <input type="number" id="vendorRateInput" placeholder="25" required>
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <select id="vendorUnitSelect" required>
                            <option value="per km">per km</option>
                            <option value="per shipment">per shipment</option>
                            <option value="per CBM">per CBM</option>
                            <option value="per day">per day</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Valid Until</label>
                        <input type="date" id="vendorValidUntil" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="switchRateTab('vendor')">Cancel</button>
                    <button type="submit">💾 Save Rate</button>
                </div>
            </form>
        </div>
    `;
    
    // Set default date
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('vendorValidUntil').value = nextYear.toISOString().split('T')[0];
    
    // Handle form submission
    document.getElementById('vendorRateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveVendorRate();
    });
}

function saveVendorRate() {
    const vendorId = document.getElementById('vendorSelect').value;
    const service = document.getElementById('serviceSelect').value;
    const rate = document.getElementById('vendorRateInput').value;
    const unit = document.getElementById('vendorUnitSelect').value;
    const validUntil = document.getElementById('vendorValidUntil').value;
    
    const vendor = parties.find(p => p.id === vendorId);
    
    const newRate = {
        id: 'RATE' + (rates.length + 1).toString().padStart(3, '0'),
        partyId: vendorId,
        partyName: vendor.name,
        type: 'vendor',
        service: service,
        rate: parseFloat(rate),
        unit: unit,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: validUntil
    };
    
    rates.push(newRate);
    localStorage.setItem('rates', JSON.stringify(rates));
    
    // Update party rate card status
    const partyIndex = parties.findIndex(p => p.id === vendorId);
    if (partyIndex !== -1) {
        parties[partyIndex].rateCard = true;
        localStorage.setItem('parties', JSON.stringify(parties));
    }
    
    alert(`✅ Vendor Rate Added Successfully!\n\n🏭 Vendor: ${vendor.name}\n🔧 Service: ${service}\n💰 Rate: ₹${rate}/${unit}\n📅 Valid Until: ${validUntil}`);
    
    // Go back to vendor rates list
    switchRateTab('vendor');
    loadRatesData();
}

function editRate(rateId) {
    alert(`Edit Rate: ${rateId}\n\nRate editing form will open`);
}

function deleteRate(rateId) {
    if (confirm('Delete this rate card?')) {
        alert(`Rate ${rateId} deleted successfully`);
    }
}

function showShipmentTracker() {
    document.getElementById('shipmentTrackerModal').style.display = 'block';
}

function closeShipmentModal() {
    document.getElementById('shipmentTrackerModal').style.display = 'none';
}

function trackShipment() {
    const trackingNumber = document.getElementById('trackingNumber').value;
    
    if (!trackingNumber) {
        alert('Please enter a tracking number');
        return;
    }
    
    // Simulate shipment tracking
    const results = document.getElementById('shipmentResults');
    results.innerHTML = `
        <div class="tracking-result">
            <h4>🚢 Shipment Status: ${trackingNumber}</h4>
            <div class="tracking-timeline">
                <div class="tracking-step completed">
                    <div class="step-icon">✅</div>
                    <div class="step-info">
                        <strong>Cargo Received</strong>
                        <small>Mumbai Port - 15/01/2024 10:30 AM</small>
                    </div>
                </div>
                <div class="tracking-step completed">
                    <div class="step-icon">✅</div>
                    <div class="step-info">
                        <strong>Customs Cleared</strong>
                        <small>Mumbai Port - 16/01/2024 02:15 PM</small>
                    </div>
                </div>
                <div class="tracking-step active">
                    <div class="step-icon">🚢</div>
                    <div class="step-info">
                        <strong>In Transit</strong>
                        <small>Vessel: MSC MAYA - ETA: 22/01/2024</small>
                    </div>
                </div>
                <div class="tracking-step pending">
                    <div class="step-icon">📍</div>
                    <div class="step-info">
                        <strong>Arrival at Destination</strong>
                        <small>Singapore Port - Expected: 22/01/2024</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function manageRates(partyId) {
    const party = parties.find(p => p.id === partyId);
    if (!party) return;
    
    if (party.type === 'agent') {
        const rateInfo = `💰 Agent Rate Management - ${party.name}\n\n` +
            `Current Rates:\n` +
            `🚢 Sea Freight: ₹${party.rates?.seaFreight || 'Not Set'}/CBM\n` +
            `✈️ Air Freight: ₹${party.rates?.airFreight || 'Not Set'}/KG\n\n` +
            `📊 Last 30 Days Volume: ${party.businessVolume}\n` +
            `💼 Rate Card Status: ${party.rateCard ? 'Active' : 'Inactive'}`;
        
        alert(rateInfo);
    } else if (party.type === 'vendor') {
        const rateInfo = `💰 Vendor Rate Management - ${party.name}\n\n` +
            `Service: ${party.serviceType}\n` +
            `Rate: ₹${party.serviceRate || 'Not Set'}/unit\n\n` +
            `📊 Monthly Volume: ${party.businessVolume}\n` +
            `💼 Rate Card Status: ${party.rateCard ? 'Active' : 'Inactive'}`;
        
        alert(rateInfo);
    } else {
        alert(`Rate management not applicable for ${party.type}`);
    }
}

function viewParty(partyId) {
    const party = parties.find(p => p.id === partyId);
    if (!party) return;
    
    const partyInfo = `👥 Party Details - ${party.name}\n\n` +
        `🆔 Code: ${party.id}\n` +
        `📋 Type: ${party.type.toUpperCase()}\n` +
        `👤 Contact: ${party.contact}\n` +
        `📞 Phone: ${party.phone}\n` +
        `📧 Email: ${party.email}\n` +
        `📍 Location: ${party.city}\n` +
        `📊 Business Volume: ${party.businessVolume}\n` +
        `💼 Rate Card: ${party.rateCard ? 'Active' : 'Inactive'}\n` +
        `🔄 Status: ${party.status}`;
    
    alert(partyInfo);
}

function editParty(partyId) {
    alert(`✏️ Edit Party: ${partyId}\n\nEdit functionality will open party details form with pre-filled data`);
}

function filterParties() {
    const typeFilter = document.getElementById('partyTypeFilter').value;
    const searchTerm = document.getElementById('searchParty').value.toLowerCase();
    
    let filteredParties = parties;
    
    if (typeFilter !== 'all') {
        filteredParties = filteredParties.filter(party => party.type === typeFilter);
    }
    
    if (searchTerm) {
        filteredParties = filteredParties.filter(party =>
            party.name.toLowerCase().includes(searchTerm) ||
            party.contact.toLowerCase().includes(searchTerm) ||
            party.email.toLowerCase().includes(searchTerm) ||
            party.phone.includes(searchTerm) ||
            party.id.toLowerCase().includes(searchTerm)
        );
    }
    
    displayParties(filteredParties);
}

function exportParties() {
    alert('📤 Export Parties\n\n✅ Data exported to Excel\n📧 Email sent with attachment\n💾 Saved to downloads folder');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

function startAutoRefresh() {
    setInterval(() => {
        loadPartiesData();
        loadRatesData();
    }, 60000); // Refresh every minute
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Form submission
document.getElementById('addPartyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newParty = {
        id: generatePartyId(),
        name: document.getElementById('companyName').value,
        type: document.getElementById('partyType').value,
        contact: document.getElementById('contactPerson').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        city: document.getElementById('city').value,
        businessVolume: '0',
        status: 'active',
        rateCard: false
    };
    
    // Add rate information for agents and vendors
    if (newParty.type === 'agent') {
        newParty.rates = {
            seaFreight: document.getElementById('seaRate').value || 0,
            airFreight: document.getElementById('airRate').value || 0
        };
        newParty.rateCard = !!(newParty.rates.seaFreight || newParty.rates.airFreight);
    } else if (newParty.type === 'vendor') {
        newParty.serviceType = document.getElementById('serviceType').value;
        newParty.serviceRate = document.getElementById('serviceRate').value || 0;
        newParty.rateCard = !!newParty.serviceRate;
    }
    
    parties.push(newParty);
    localStorage.setItem('parties', JSON.stringify(parties));
    
    alert(`✅ Party Added Successfully\n\n${newParty.name} has been added to the system`);
    
    closeModal();
    loadPartiesData();
});

function generatePartyId() {
    const prefix = {
        'customer': 'CUST',
        'agent': 'AGT',
        'vendor': 'VEN',
        'cha': 'CHA'
    };
    
    const type = document.getElementById('partyType').value;
    const count = parties.filter(p => p.type === type).length + 1;
    return `${prefix[type]}${count.toString().padStart(3, '0')}`;
}

// Auto-filter on input change
document.getElementById('searchParty').addEventListener('input', filterParties);
document.getElementById('partyTypeFilter').addEventListener('change', filterParties);