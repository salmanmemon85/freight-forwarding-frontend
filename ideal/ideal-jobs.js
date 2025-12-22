// Jobs Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadJobsData();
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

// Sample jobs data
const jobsData = [
    { 
        no: 'JOB001', 
        date: '2024-01-15', 
        customer: 'ABC Industries', 
        route: 'Mumbai → Dubai',
        container: 'MSCU1234567',
        mode: 'Sea',
        status: 'in-transit',
        eta: '2024-01-22',
        shipper: 'ABC Industries Ltd, Mumbai',
        consignee: 'Dubai Trading Co, Dubai',
        cargo: 'Electronics - 500 KG'
    },
    { 
        no: 'JOB002', 
        date: '2024-01-14', 
        customer: 'XYZ Exports', 
        route: 'Chennai → Singapore',
        container: 'OOLU9876543',
        mode: 'Sea',
        status: 'customs',
        eta: '2024-01-20',
        shipper: 'XYZ Exports Pvt Ltd, Chennai',
        consignee: 'Singapore Imports, Singapore',
        cargo: 'Textiles - 1200 KG'
    },
    { 
        no: 'JOB003', 
        date: '2024-01-13', 
        customer: 'Global Trading', 
        route: 'Delhi → Hamburg',
        container: 'HAPAG567890',
        mode: 'Sea',
        status: 'delivered',
        eta: '2024-01-18',
        shipper: 'Global Trading Ltd, Delhi',
        consignee: 'Hamburg Logistics, Germany',
        cargo: 'Machinery - 2500 KG'
    },
    { 
        no: 'JOB004', 
        date: '2024-01-15', 
        customer: 'Tech Solutions', 
        route: 'Bangalore → New York',
        container: 'AWB-123456789',
        mode: 'Air',
        status: 'shipped',
        eta: '2024-01-17',
        shipper: 'Tech Solutions Inc, Bangalore',
        consignee: 'NY Tech Corp, New York',
        cargo: 'Software Equipment - 800 KG'
    },
    { 
        no: 'JOB005', 
        date: '2024-01-12', 
        customer: 'Food Corp', 
        route: 'Kochi → London',
        container: 'BA-987654321',
        mode: 'Air',
        status: 'completed',
        eta: '2024-01-15',
        shipper: 'Food Corp Ltd, Kochi',
        consignee: 'London Foods, UK',
        cargo: 'Spices - 300 KG'
    }
];

function loadJobsData() {
    // Calculate stats
    const active = jobsData.filter(j => ['booking', 'documentation', 'shipped', 'in-transit', 'customs'].includes(j.status)).length;
    const inTransit = jobsData.filter(j => j.status === 'in-transit').length;
    const delivered = jobsData.filter(j => j.status === 'delivered' || j.status === 'completed').length;
    const thisMonth = jobsData.length; // All jobs are from this month in sample data
    
    document.getElementById('activeJobs').textContent = active;
    document.getElementById('inTransit').textContent = inTransit;
    document.getElementById('delivered').textContent = delivered;
    document.getElementById('monthJobs').textContent = thisMonth;
    
    // Load table data
    displayJobs(jobsData);
}

function displayJobs(jobs) {
    const tbody = document.getElementById('jobsTable');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const statusClass = getStatusClass(job.status);
        const modeIcon = getModeIcon(job.mode);
        
        const row = `
            <tr>
                <td><strong>${job.no}</strong></td>
                <td>${formatDate(job.date)}</td>
                <td>${job.customer}</td>
                <td>
                    <div>${modeIcon} ${job.route}</div>
                </td>
                <td>
                    <div><strong>${job.container}</strong></div>
                    <small>${job.mode} Freight</small>
                </td>
                <td><span class="status-${statusClass}">${job.status.toUpperCase().replace('-', ' ')}</span></td>
                <td>${formatDate(job.eta)}</td>
                <td>
                    <button class="btn-small" onclick="viewJob('${job.no}')">👁️ View</button>
                    <button class="btn-small" onclick="trackJob('${job.no}')">📍 Track</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'booking': return 'new';
        case 'documentation': return 'pending';
        case 'shipped': return 'info';
        case 'in-transit': return 'warning';
        case 'customs': return 'pending';
        case 'delivered': return 'success';
        case 'completed': return 'success';
        default: return 'default';
    }
}

function getModeIcon(mode) {
    switch(mode) {
        case 'Sea': return '🚢';
        case 'Air': return '✈️';
        case 'Road': return '🚛';
        default: return '📦';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function filterJobs() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchJob').value.toLowerCase();
    
    let filtered = jobsData;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(job => 
            job.no.toLowerCase().includes(searchTerm) ||
            job.customer.toLowerCase().includes(searchTerm) ||
            job.container.toLowerCase().includes(searchTerm) ||
            job.route.toLowerCase().includes(searchTerm)
        );
    }
    
    displayJobs(filtered);
}

function showAddJob() {
    document.getElementById('addJobModal').style.display = 'block';
}

function showJobTracking() {
    document.getElementById('jobTrackingModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addJobModal').style.display = 'none';
    document.getElementById('addJobForm').reset();
}

function closeTrackingModal() {
    document.getElementById('jobTrackingModal').style.display = 'none';
}

function viewJob(no) {
    const job = jobsData.find(j => j.no === no);
    alert(`Job Details:\n\nJob No: ${job.no}\nCustomer: ${job.customer}\nRoute: ${job.route}\nMode: ${job.mode}\nContainer/AWB: ${job.container}\nShipper: ${job.shipper}\nConsignee: ${job.consignee}\nCargo: ${job.cargo}\nStatus: ${job.status.toUpperCase()}\nETA: ${formatDate(job.eta)}`);
}

function trackJob(no) {
    const job = jobsData.find(j => j.no === no);
    let trackingInfo = '';
    
    switch(job.status) {
        case 'booking':
            trackingInfo = 'Booking confirmed with agent\nDocumentation in progress';
            break;
        case 'documentation':
            trackingInfo = 'Documents prepared\nWaiting for cargo pickup';
            break;
        case 'shipped':
            trackingInfo = 'Cargo shipped from origin\nIn transit to destination';
            break;
        case 'in-transit':
            trackingInfo = 'Shipment in transit\nExpected arrival: ' + formatDate(job.eta);
            break;
        case 'customs':
            trackingInfo = 'Arrived at destination\nCustoms clearance in progress';
            break;
        case 'delivered':
            trackingInfo = 'Delivered to consignee\nPOD received';
            break;
        case 'completed':
            trackingInfo = 'Job completed successfully\nAll documents closed';
            break;
    }
    
    alert(`Tracking Info - ${job.no}:\n\n${trackingInfo}`);
}

// Form submission
document.getElementById('addJobForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const mode = document.getElementById('transportMode').value;
    const containerNo = mode === 'Air' ? 'AWB-' + Math.random().toString().substr(2, 9) : 
                      mode === 'Sea' ? 'MSCU' + Math.random().toString().substr(2, 7) :
                      'TRK-' + Math.random().toString().substr(2, 8);
    
    const newJob = {
        no: generateJobNo(),
        date: new Date().toISOString().split('T')[0],
        customer: document.getElementById('customer').value,
        route: `${document.getElementById('originPort').value} → ${document.getElementById('destinationPort').value}`,
        container: containerNo,
        mode: mode,
        status: 'booking',
        eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        shipper: `${document.getElementById('shipperName').value}, ${document.getElementById('shipperAddress').value}`,
        consignee: `${document.getElementById('consigneeName').value}, ${document.getElementById('consigneeAddress').value}`,
        cargo: `${document.getElementById('cargoDescription').value} - ${document.getElementById('weight').value} KG`
    };
    
    jobsData.unshift(newJob);
    loadJobsData();
    closeModal();
    alert('Job created successfully!');
});

function generateJobNo() {
    const count = jobsData.length + 1;
    return `JOB${count.toString().padStart(3, '0')}`;
}

function startAutoRefresh() {
    setInterval(loadJobsData, 60000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addJobModal');
    const trackModal = document.getElementById('jobTrackingModal');
    
    if (event.target === addModal) {
        closeModal();
    }
    if (event.target === trackModal) {
        closeTrackingModal();
    }
}