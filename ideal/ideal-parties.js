// Parties Management JavaScript - Simple Display & Add

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

// Sample parties data
const partiesData = [
    { code: 'CUS001', name: 'ABC Industries Ltd', type: 'customer', contact: 'Rajesh Kumar', phone: '+91-9876543210', email: 'rajesh@abc.com', city: 'Mumbai', status: 'Active' },
    { code: 'AGT001', name: 'Dubai Freight Services', type: 'agent', contact: 'Ahmed Ali', phone: '+971-501234567', email: 'ahmed@dfs.ae', city: 'Dubai', status: 'Active' },
    { code: 'VEN001', name: 'Express Logistics', type: 'vendor', contact: 'Suresh Patel', phone: '+91-9123456789', email: 'suresh@express.com', city: 'Delhi', status: 'Active' },
    { code: 'CHA001', name: 'Mumbai Customs House', type: 'cha', contact: 'Prakash Sharma', phone: '+91-9988776655', email: 'prakash@mch.com', city: 'Mumbai', status: 'Active' },
    { code: 'CUS002', name: 'XYZ Exports', type: 'customer', contact: 'Priya Singh', phone: '+91-8765432109', email: 'priya@xyz.com', city: 'Chennai', status: 'Active' },
    { code: 'AGT002', name: 'Singapore Cargo Hub', type: 'agent', contact: 'Li Wei', phone: '+65-91234567', email: 'li@sch.sg', city: 'Singapore', status: 'Active' }
];

function loadPartiesData() {
    // Update stats
    const customers = partiesData.filter(p => p.type === 'customer').length;
    const agents = partiesData.filter(p => p.type === 'agent').length;
    const vendors = partiesData.filter(p => p.type === 'vendor').length;
    const cha = partiesData.filter(p => p.type === 'cha').length;
    
    document.getElementById('totalCustomers').textContent = customers;
    document.getElementById('activeAgents').textContent = agents;
    document.getElementById('totalVendors').textContent = vendors;
    document.getElementById('chaPartners').textContent = cha;
    
    // Load table data
    displayParties(partiesData);
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
                <td><span class="status-active">${party.status}</span></td>
                <td>
                    <button class="btn-small" onclick="viewParty('${party.code}')">👁️ View</button>
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
    
    let filtered = partiesData;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(party => party.type === typeFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(party => 
            party.name.toLowerCase().includes(searchTerm) ||
            party.contact.toLowerCase().includes(searchTerm) ||
            party.phone.includes(searchTerm) ||
            party.email.toLowerCase().includes(searchTerm)
        );
    }
    
    displayParties(filtered);
}

function showAddParty() {
    document.getElementById('addPartyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addPartyModal').style.display = 'none';
    document.getElementById('addPartyForm').reset();
}

function viewParty(code) {
    const party = partiesData.find(p => p.code === code);
    alert(`Party Details:\n\nCode: ${party.code}\nName: ${party.name}\nType: ${party.type}\nContact: ${party.contact}\nPhone: ${party.phone}\nEmail: ${party.email}\nCity: ${party.city}`);
}

function editParty(code) {
    alert(`Edit functionality for ${code} - Coming Soon!`);
}

function exportParties() {
    alert('Export functionality - Coming Soon!');
}

// Form submission
document.getElementById('addPartyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newParty = {
        code: generatePartyCode(),
        name: document.getElementById('companyName').value,
        type: document.getElementById('partyType').value,
        contact: document.getElementById('contactPerson').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        city: document.getElementById('city').value,
        status: 'Active'
    };
    
    partiesData.push(newParty);
    loadPartiesData();
    closeModal();
    alert('Party added successfully!');
});

function generatePartyCode() {
    const type = document.getElementById('partyType').value.toUpperCase().substring(0, 3);
    const count = partiesData.filter(p => p.type === document.getElementById('partyType').value).length + 1;
    return `${type}${count.toString().padStart(3, '0')}`;
}

function startAutoRefresh() {
    setInterval(loadPartiesData, 60000); // Refresh every minute
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