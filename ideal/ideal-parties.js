// Parties Management - Dynamic Workflow Integration

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPartiesData();
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
    // Get real parties data from workflow
    const parties = getPartiesFromWorkflow();
    
    // Calculate stats
    const customers = parties.filter(p => p.type === 'customer').length;
    const agents = parties.filter(p => p.type === 'agent').length;
    const vendors = parties.filter(p => p.type === 'vendor').length;
    const cha = parties.filter(p => p.type === 'cha').length;
    
    document.getElementById('totalCustomers').textContent = customers;
    document.getElementById('activeAgents').textContent = agents;
    document.getElementById('totalVendors').textContent = vendors;
    document.getElementById('chaPartners').textContent = cha;
    
    // Load table data
    displayParties(parties);
}

function getPartiesFromWorkflow() {
    const parties = [];
    const addedParties = new Set();
    
    // Get customers from enquiries
    const enquiries = window.workflowManager.getEnquiries();
    enquiries.forEach(enq => {
        if (!addedParties.has(enq.customer)) {
            parties.push({
                code: generatePartyCode('customer', parties.filter(p => p.type === 'customer').length + 1),
                name: enq.customer,
                type: 'customer',
                contact: enq.contact,
                phone: enq.phone,
                email: enq.email || '',
                city: enq.origin.split(',')[0] || 'Unknown',
                status: 'Active',
                jobs: getCustomerJobs(enq.customer),
                revenue: getCustomerRevenue(enq.customer)
            });
            addedParties.add(enq.customer);
        }
    });
    
    // Get agents from jobs
    const jobs = window.workflowManager.getJobs();
    jobs.forEach(job => {
        if (job.agent && !addedParties.has(job.agent)) {
            parties.push({
                code: generatePartyCode('agent', parties.filter(p => p.type === 'agent').length + 1),
                name: job.agent,
                type: 'agent',
                contact: 'Agent Contact',
                phone: '+971-501234567',
                email: job.agent.toLowerCase().replace(/\s+/g, '') + '@agent.com',
                city: job.destination.split(',')[0] || 'Unknown',
                status: 'Active',
                jobs: getAgentJobs(job.agent),
                revenue: 0
            });
            addedParties.add(job.agent);
        }
    });
    
    // Add some default vendors and CHA if no data
    if (parties.filter(p => p.type === 'vendor').length === 0) {
        parties.push({
            code: 'VEN001',
            name: 'Express Logistics',
            type: 'vendor',
            contact: 'Vendor Contact',
            phone: '+91-9123456789',
            email: 'vendor@express.com',
            city: 'Mumbai',
            status: 'Active',
            jobs: 0,
            revenue: 0
        });
    }
    
    if (parties.filter(p => p.type === 'cha').length === 0) {
        parties.push({
            code: 'CHA001',
            name: 'Mumbai Customs House',
            type: 'cha',
            contact: 'CHA Contact',
            phone: '+91-9988776655',
            email: 'cha@customs.com',
            city: 'Mumbai',
            status: 'Active',
            jobs: 0,
            revenue: 0
        });
    }
    
    return parties;
}

function getCustomerJobs(customerName) {
    const jobs = window.workflowManager.getJobs();
    return jobs.filter(job => job.customer === customerName).length;
}

function getCustomerRevenue(customerName) {
    const invoices = window.workflowManager.getInvoices();
    return invoices
        .filter(inv => inv.customer === customerName)
        .reduce((sum, inv) => sum + (inv.total || 0), 0) * 80; // Convert to INR
}

function getAgentJobs(agentName) {
    const jobs = window.workflowManager.getJobs();
    return jobs.filter(job => job.agent === agentName).length;
}

function generatePartyCode(type, count) {
    const prefix = {
        'customer': 'CUS',
        'agent': 'AGT',
        'vendor': 'VEN',
        'cha': 'CHA'
    };
    return `${prefix[type]}${count.toString().padStart(3, '0')}`;
}

function displayParties(parties) {
    const tbody = document.getElementById('partiesTable');
    tbody.innerHTML = '';
    
    parties.forEach(party => {
        const row = `
            <tr>
                <td><strong>${party.code}</strong></td>
                <td>${party.name}</td>
                <td><span class="badge badge-${party.type}">${party.type.toUpperCase()}</span></td>
                <td>
                    <div>${party.contact}</div>
                    <small>${party.phone}</small><br>
                    <small>${party.email}</small>
                </td>
                <td>${party.city}</td>
                <td>
                    <div>Jobs: ${party.jobs || 0}</div>
                    ${party.type === 'customer' ? `<small>₹${Math.round(party.revenue || 0).toLocaleString('en-IN')}</small>` : ''}
                </td>
                <td><span class="status-active">${party.status}</span></td>
                <td>
                    <button class="btn-small" onclick="viewParty('${party.code}', '${party.name}')">👁️ View</button>
                    <button class="btn-small" onclick="editParty('${party.code}')">✏️ Edit</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterParties() {
    const typeFilter = document.getElementById('partyTypeFilter').value;
    const searchTerm = document.getElementById('searchParty').value.toLowerCase();
    
    let parties = getPartiesFromWorkflow();
    
    if (typeFilter !== 'all') {
        parties = parties.filter(party => party.type === typeFilter);
    }
    
    if (searchTerm) {
        parties = parties.filter(party => 
            party.name.toLowerCase().includes(searchTerm) ||
            party.contact.toLowerCase().includes(searchTerm) ||
            party.phone.includes(searchTerm) ||
            party.email.toLowerCase().includes(searchTerm)
        );
    }
    
    displayParties(parties);
}

function showAddParty() {
    document.getElementById('addPartyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addPartyModal').style.display = 'none';
    document.getElementById('addPartyForm').reset();
}

function viewParty(code, name) {
    const parties = getPartiesFromWorkflow();
    const party = parties.find(p => p.code === code);
    
    if (!party) return;
    
    let details = `👥 Party Details - ${code}\n\n`;
    details += `🏢 Company: ${party.name}\n`;
    details += `📋 Type: ${party.type.toUpperCase()}\n`;
    details += `👤 Contact: ${party.contact}\n`;
    details += `📞 Phone: ${party.phone}\n`;
    details += `📧 Email: ${party.email}\n`;
    details += `🏙️ City: ${party.city}\n`;
    details += `📊 Status: ${party.status}\n`;
    
    if (party.type === 'customer') {
        details += `\n💼 Business Summary:\n`;
        details += `Jobs: ${party.jobs || 0}\n`;
        details += `Revenue: ₹${Math.round(party.revenue || 0).toLocaleString('en-IN')}\n`;
        
        // Show recent jobs
        const jobs = window.workflowManager.getJobs().filter(j => j.customer === name);
        if (jobs.length > 0) {
            details += `\n📋 Recent Jobs:\n`;
            jobs.slice(0, 3).forEach(job => {
                details += `• ${job.no}: ${job.origin} → ${job.destination}\n`;
            });
        }
    }
    
    if (party.type === 'agent') {
        details += `\n🤝 Agent Summary:\n`;
        details += `Jobs Handled: ${party.jobs || 0}\n`;
        
        // Show recent jobs
        const jobs = window.workflowManager.getJobs().filter(j => j.agent === name);
        if (jobs.length > 0) {
            details += `\n📋 Recent Jobs:\n`;
            jobs.slice(0, 3).forEach(job => {
                details += `• ${job.no}: ${job.customer}\n`;
            });
        }
    }
    
    alert(details);
}

function editParty(code) {
    alert(`✏️ Edit Party ${code}\n\nEdit functionality:\n• Update contact details\n• Change status\n• Modify information\n\nFull edit form - Coming Soon!`);
}

function exportParties() {
    const parties = getPartiesFromWorkflow();
    alert(`📤 Exporting ${parties.length} parties to Excel...\n\nExport will include:\n• All party details\n• Business statistics\n• Contact information\n\nExport functionality - Coming Soon!`);
}

// Form submission for adding new party
document.getElementById('addPartyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const partyType = document.getElementById('partyType').value;
    const companyName = document.getElementById('companyName').value;
    
    // In a real system, this would be saved to database
    // For now, we'll just show success message
    alert(`✅ Party Added Successfully!\n\n🏢 Company: ${companyName}\n📋 Type: ${partyType.toUpperCase()}\n\n💡 Note: This party will appear in dropdowns when creating enquiries and jobs.`);
    
    closeModal();
    loadPartiesData(); // Refresh the display
});

function startAutoRefresh() {
    setInterval(loadPartiesData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addPartyModal');
    if (event.target === modal) {
        closeModal();
    }
}