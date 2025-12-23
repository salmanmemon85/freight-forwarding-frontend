// Arrival Notices Management System

class ArrivalNoticeManager {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        const data = this.getData();
        if (!data.arrivalNotices) data.arrivalNotices = [];
        this.saveData(data);
    }

    getData() {
        return JSON.parse(localStorage.getItem('idealFreightData')) || {};
    }

    saveData(data) {
        localStorage.setItem('idealFreightData', JSON.stringify(data));
    }

    generateArrivalNotice(jobNo, arrivalData) {
        const data = this.getData();
        const noticeId = 'AN' + Date.now().toString().slice(-6);
        
        const notice = {
            id: noticeId,
            jobNo,
            vesselName: arrivalData.vesselName,
            voyageNo: arrivalData.voyageNo,
            arrivalDate: arrivalData.arrivalDate,
            port: arrivalData.port,
            status: 'arrived',
            noticeSent: false,
            documentsReady: false,
            cargoReleased: false,
            createdAt: new Date().toISOString(),
            charges: {
                demurrage: 0,
                storage: 0,
                handling: 0,
                documentation: 0
            }
        };

        data.arrivalNotices.push(notice);
        this.saveData(data);
        return notice;
    }

    getArrivalNotices() {
        return this.getData().arrivalNotices || [];
    }

    updateNoticeStatus(noticeId, status, charges = null) {
        const data = this.getData();
        const noticeIndex = data.arrivalNotices.findIndex(n => n.id === noticeId);
        
        if (noticeIndex !== -1) {
            data.arrivalNotices[noticeIndex].status = status;
            if (charges) {
                data.arrivalNotices[noticeIndex].charges = { ...data.arrivalNotices[noticeIndex].charges, ...charges };
            }
            this.saveData(data);
            return data.arrivalNotices[noticeIndex];
        }
        return null;
    }

    sendNotice(noticeId) {
        const data = this.getData();
        const noticeIndex = data.arrivalNotices.findIndex(n => n.id === noticeId);
        
        if (noticeIndex !== -1) {
            data.arrivalNotices[noticeIndex].noticeSent = true;
            data.arrivalNotices[noticeIndex].noticeSentAt = new Date().toISOString();
            data.arrivalNotices[noticeIndex].status = 'notice-sent';
            this.saveData(data);
            return data.arrivalNotices[noticeIndex];
        }
        return null;
    }
}

window.arrivalNoticeManager = new ArrivalNoticeManager();

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadArrivalNoticesData();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
}

function loadArrivalNoticesData() {
    const notices = window.arrivalNoticeManager.getArrivalNotices();
    const jobs = window.workflowManager.getJobs();
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const pendingArrivals = notices.filter(n => n.status === 'arrived' && !n.noticeSent).length;
    const arrivedToday = notices.filter(n => n.arrivalDate === today).length;
    const noticesSent = notices.filter(n => n.noticeSent).length;
    const cargoReleased = notices.filter(n => n.cargoReleased).length;
    
    document.getElementById('pendingArrivals').textContent = pendingArrivals;
    document.getElementById('arrivedToday').textContent = arrivedToday;
    document.getElementById('noticesSent').textContent = noticesSent;
    document.getElementById('cargoReleased').textContent = cargoReleased;
    
    displayArrivalNotices(notices, jobs);
}

function displayArrivalNotices(notices, jobs) {
    const tbody = document.getElementById('arrivalNoticesTable');
    tbody.innerHTML = '';
    
    notices.forEach(notice => {
        const job = jobs.find(j => j.no === notice.jobNo);
        if (!job) return;
        
        const statusClass = getNoticeStatusClass(notice.status);
        
        const row = `
            <tr>
                <td>
                    <strong>${notice.jobNo}</strong>
                    <br><small>Notice: ${notice.id}</small>
                </td>
                <td>
                    <div><strong>${job.customer}</strong></div>
                    <small>${job.contact}</small>
                </td>
                <td>
                    <div><strong>${notice.vesselName}</strong></div>
                    <small>Voyage: ${notice.voyageNo}</small>
                </td>
                <td>
                    <div>${formatDate(notice.arrivalDate)}</div>
                    <small>Port: ${notice.port}</small>
                </td>
                <td>
                    <span class="status-${statusClass}">${notice.status.toUpperCase()}</span>
                    ${notice.noticeSent ? '<br><small>✅ Notice Sent</small>' : ''}
                </td>
                <td>
                    <button class="btn-small" onclick="viewNoticeDetails('${notice.id}')">👁️ View</button>
                    ${!notice.noticeSent ? 
                        `<button class="btn-small btn-primary" onclick="sendNotice('${notice.id}')">📧 Send</button>` : 
                        `<button class="btn-small" onclick="updateCharges('${notice.id}')">💰 Charges</button>`
                    }
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getNoticeStatusClass(status) {
    switch(status) {
        case 'arrived': return 'warning';
        case 'notice-sent': return 'info';
        case 'documents-ready': return 'success';
        case 'released': return 'success';
        default: return 'default';
    }
}

function generateArrivalNotice() {
    const jobs = window.workflowManager.getJobs().filter(j => 
        ['in-progress', 'documented'].includes(j.status)
    );
    
    if (jobs.length === 0) {
        alert('❌ No jobs available for arrival notice generation!');
        return;
    }
    
    let jobList = 'Select Job for Arrival Notice:\n\n';
    jobs.forEach(job => {
        jobList += `• ${job.no} - ${job.customer} (${job.mode})\n`;
    });
    
    const selectedJob = prompt(jobList + '\nEnter Job Number:', jobs[0].no);
    
    if (selectedJob) {
        const job = jobs.find(j => j.no === selectedJob);
        if (job) {
            const vesselName = prompt('Enter Vessel/Flight Name:', job.mode === 'Sea' ? 'MV EXAMPLE' : 'EK 123');
            const voyageNo = prompt('Enter Voyage/Flight Number:', 'V001');
            const arrivalDate = prompt('Enter Arrival Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            const port = prompt('Enter Port/Airport:', job.destination);
            
            if (vesselName && voyageNo && arrivalDate && port) {
                const notice = window.arrivalNoticeManager.generateArrivalNotice(selectedJob, {
                    vesselName,
                    voyageNo,
                    arrivalDate,
                    port
                });
                
                loadArrivalNoticesData();
                alert(`✅ Arrival Notice Generated!\n\n📋 Notice ID: ${notice.id}\n🚢 Vessel: ${vesselName}\n📅 Arrival: ${formatDate(arrivalDate)}`);
            }
        }
    }
}

function sendNotice(noticeId) {
    const notices = window.arrivalNoticeManager.getArrivalNotices();
    const notice = notices.find(n => n.id === noticeId);
    const job = window.workflowManager.getJobs().find(j => j.no === notice.jobNo);
    
    if (!notice || !job) return;
    
    const confirm = window.confirm(
        `📧 Send Arrival Notice\n\n` +
        `📋 Notice: ${notice.id}\n` +
        `👤 Customer: ${job.customer}\n` +
        `🚢 Vessel: ${notice.vesselName}\n` +
        `📅 Arrival: ${formatDate(notice.arrivalDate)}\n\n` +
        `Send arrival notice to customer?`
    );
    
    if (confirm) {
        window.arrivalNoticeManager.sendNotice(noticeId);
        loadArrivalNoticesData();
        
        alert(
            `✅ Arrival Notice Sent!\n\n` +
            `📧 Sent to: ${job.customer}\n` +
            `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
            `Customer has been notified about cargo arrival.`
        );
    }
}

function viewNoticeDetails(noticeId) {
    const notices = window.arrivalNoticeManager.getArrivalNotices();
    const notice = notices.find(n => n.id === noticeId);
    const job = window.workflowManager.getJobs().find(j => j.no === notice.jobNo);
    
    if (!notice || !job) return;
    
    let details = `📋 Arrival Notice Details\n\n`;
    details += `🆔 Notice ID: ${notice.id}\n`;
    details += `💼 Job: ${notice.jobNo}\n`;
    details += `👤 Customer: ${job.customer}\n`;
    details += `🚢 Vessel: ${notice.vesselName}\n`;
    details += `🔢 Voyage: ${notice.voyageNo}\n`;
    details += `📅 Arrival: ${formatDate(notice.arrivalDate)}\n`;
    details += `🏢 Port: ${notice.port}\n`;
    details += `📊 Status: ${notice.status.toUpperCase()}\n`;
    details += `📧 Notice Sent: ${notice.noticeSent ? 'Yes' : 'No'}\n\n`;
    
    if (notice.charges) {
        const totalCharges = Object.values(notice.charges).reduce((sum, charge) => sum + charge, 0);
        if (totalCharges > 0) {
            details += `💰 Charges:\n`;
            details += `• Demurrage: ₹${notice.charges.demurrage.toLocaleString('en-IN')}\n`;
            details += `• Storage: ₹${notice.charges.storage.toLocaleString('en-IN')}\n`;
            details += `• Handling: ₹${notice.charges.handling.toLocaleString('en-IN')}\n`;
            details += `• Documentation: ₹${notice.charges.documentation.toLocaleString('en-IN')}\n`;
            details += `• Total: ₹${totalCharges.toLocaleString('en-IN')}\n`;
        }
    }
    
    alert(details);
}

function updateCharges(noticeId) {
    const demurrage = parseFloat(prompt('Enter Demurrage Charges (₹):', '0')) || 0;
    const storage = parseFloat(prompt('Enter Storage Charges (₹):', '0')) || 0;
    const handling = parseFloat(prompt('Enter Handling Charges (₹):', '0')) || 0;
    const documentation = parseFloat(prompt('Enter Documentation Charges (₹):', '0')) || 0;
    
    const charges = { demurrage, storage, handling, documentation };
    const totalCharges = Object.values(charges).reduce((sum, charge) => sum + charge, 0);
    
    if (totalCharges > 0) {
        window.arrivalNoticeManager.updateNoticeStatus(noticeId, 'documents-ready', charges);
        loadArrivalNoticesData();
        
        alert(`✅ Charges Updated!\n\n💰 Total Charges: ₹${totalCharges.toLocaleString('en-IN')}\n📊 Status: Documents Ready`);
    }
}

function sendNotifications() {
    const pendingNotices = window.arrivalNoticeManager.getArrivalNotices()
        .filter(n => n.status === 'arrived' && !n.noticeSent);
    
    if (pendingNotices.length === 0) {
        alert('❌ No pending arrival notices to send!');
        return;
    }
    
    const confirm = window.confirm(
        `📧 Send All Pending Notices\n\n` +
        `📋 Total Notices: ${pendingNotices.length}\n\n` +
        `Send all pending arrival notices?`
    );
    
    if (confirm) {
        pendingNotices.forEach(notice => {
            window.arrivalNoticeManager.sendNotice(notice.id);
        });
        
        loadArrivalNoticesData();
        alert(`✅ All Notices Sent!\n\n📧 Sent: ${pendingNotices.length} notices\n📅 Date: ${new Date().toLocaleDateString('en-IN')}`);
    }
}

function filterNotices() {
    loadArrivalNoticesData();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}