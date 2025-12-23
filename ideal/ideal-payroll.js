// Payroll Management System

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadPayrollData();
    setCurrentMonth();
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

function setCurrentMonth() {
    const now = new Date();
    document.getElementById('monthFilter').value = now.getMonth() + 1;
    document.getElementById('yearFilter').value = now.getFullYear();
}

function loadPayrollData() {
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    const stats = calculatePayrollStats(users);
    
    document.getElementById('totalEmployees').textContent = stats.totalEmployees;
    document.getElementById('monthlySalary').textContent = '₹' + stats.monthlySalary.toLocaleString('en-IN');
    document.getElementById('commissionDue').textContent = '₹' + stats.commissionDue.toLocaleString('en-IN');
    document.getElementById('totalPayroll').textContent = '₹' + stats.totalPayroll.toLocaleString('en-IN');
    
    displayPayrollData(users);
}

function calculatePayrollStats(users) {
    const monthlySalary = users.reduce((sum, u) => sum + u.salary, 0);
    const commissionDue = users.reduce((sum, u) => 
        sum + (u.commission ? u.commission.pending : 0), 0);
    
    return {
        totalEmployees: users.length,
        monthlySalary,
        commissionDue,
        totalPayroll: monthlySalary + commissionDue
    };
}

function displayPayrollData(users) {
    const tbody = document.getElementById('payrollTable');
    tbody.innerHTML = '';
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    users.forEach(user => {
        const commission = user.commission ? user.commission.pending : 0;
        
        // Get attendance data for salary calculation
        const attendanceData = window.attendanceManager ? 
            window.attendanceManager.getPayrollAttendance(user.id, month, year) : 
            { attendanceRate: 100, present: 30, totalHours: 240 };
        
        // Calculate salary based on attendance
        const baseSalary = user.salary;
        const attendanceAdjustedSalary = (baseSalary * attendanceData.attendanceRate) / 100;
        const totalSalary = attendanceAdjustedSalary + commission;
        
        const row = `
            <tr>
                <td>
                    <div><strong>${user.name}</strong></div>
                    <small>ID: ${user.id}</small>
                </td>
                <td>
                    <div><strong>${user.role.toUpperCase()}</strong></div>
                    <small>📍 ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)}</small>
                </td>
                <td>
                    <div>₹${baseSalary.toLocaleString('en-IN')}</div>
                    <small>Attendance: ${attendanceData.attendanceRate}% (${attendanceData.present} days)</small>
                </td>
                <td>
                    ${commission > 0 ? 
                        `₹${commission.toLocaleString('en-IN')}` : 
                        '<span class="text-muted">N/A</span>'
                    }
                </td>
                <td>
                    <div><strong>₹${Math.round(totalSalary).toLocaleString('en-IN')}</strong></div>
                    <small>Adjusted: ₹${Math.round(attendanceAdjustedSalary).toLocaleString('en-IN')}</small>
                </td>
                <td><span class="status-pending">PENDING</span></td>
                <td>
                    <button class="btn-small" onclick="viewPayrollDetails('${user.id}')">👁️ View</button>
                    <button class="btn-small btn-primary" onclick="processSalary('${user.id}')">💳 Pay</button>
                    ${user.commission && commission > 0 ? 
                        `<button class="btn-small" onclick="payUserCommission('${user.id}')">💰 Commission</button>` : 
                        ''
                    }
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function generatePayroll() {
    const month = document.getElementById('monthFilter').value;
    const year = document.getElementById('yearFilter').value;
    
    if (!month || !year) {
        alert('❌ Please select month and year first!');
        return;
    }
    
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const payroll = window.userManager.generatePayroll(parseInt(month), parseInt(year));
    
    let report = `📊 Payroll Generated - ${monthNames[month]} ${year}\n\n`;
    report += `📅 Generated: ${formatDate(payroll.generatedAt)}\n`;
    report += `👥 Employees: ${payroll.employees.length}\n\n`;
    
    let totalBasic = 0;
    let totalCommission = 0;
    let totalPayroll = 0;
    
    payroll.employees.forEach(emp => {
        totalBasic += emp.basicSalary;
        totalCommission += emp.commission;
        totalPayroll += emp.totalSalary;
    });
    
    report += `💰 Summary:\n`;
    report += `• Basic Salaries: ₹${totalBasic.toLocaleString('en-IN')}\n`;
    report += `• Commissions: ₹${totalCommission.toLocaleString('en-IN')}\n`;
    report += `• Total Payroll: ₹${totalPayroll.toLocaleString('en-IN')}\n\n`;
    
    report += `📋 Top Earners:\n`;
    const topEarners = payroll.employees
        .sort((a, b) => b.totalSalary - a.totalSalary)
        .slice(0, 5);
    
    topEarners.forEach(emp => {
        report += `• ${emp.name}: ₹${emp.totalSalary.toLocaleString('en-IN')}\n`;
    });
    
    alert(report);
}

function payCommissions() {
    const salesUsers = window.userManager.getUsers().filter(u => 
        u.role === 'sales' && u.commission && u.commission.pending > 0
    );
    
    if (salesUsers.length === 0) {
        alert('❌ No pending commissions found!');
        return;
    }
    
    let report = `💰 Commission Payment Summary\n\n`;
    let totalCommission = 0;
    
    salesUsers.forEach(user => {
        const pendingCommissions = window.userManager.getCommissions(user.id)
            .filter(c => c.status === 'pending');
        
        // Mark all pending commissions as paid
        pendingCommissions.forEach(comm => {
            window.userManager.payCommission(comm.id);
        });
        
        totalCommission += user.commission.pending;
        report += `✅ ${user.name}: ₹${user.commission.pending.toLocaleString('en-IN')}\n`;
    });
    
    report += `\n💳 Total Paid: ₹${totalCommission.toLocaleString('en-IN')}`;
    
    loadPayrollData(); // Refresh data
    alert(report);
}

function viewPayrollDetails(userId) {
    const user = window.userManager.getUserById(userId);
    if (!user) return;
    
    const commissions = window.userManager.getCommissions(userId);
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    
    let details = `💰 Payroll Details - ${user.name}\n\n`;
    details += `🆔 Employee ID: ${user.id}\n`;
    details += `🏢 Role: ${user.role.toUpperCase()}\n`;
    details += `📍 Branch: ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)}\n`;
    details += `📅 Join Date: ${formatDate(user.joinDate)}\n\n`;
    
    details += `💰 Salary Breakdown:\n`;
    details += `• Basic Salary: ₹${user.salary.toLocaleString('en-IN')}\n`;
    
    if (user.commission) {
        details += `• Commission Rate: ${user.commission.rate}%\n`;
        details += `• Pending Commission: ₹${user.commission.pending.toLocaleString('en-IN')}\n`;
        details += `• Total Commission Earned: ₹${user.commission.totalEarned.toLocaleString('en-IN')}\n`;
    }
    
    const totalSalary = user.salary + (user.commission ? user.commission.pending : 0);
    details += `• Total This Month: ₹${totalSalary.toLocaleString('en-IN')}\n\n`;
    
    if (pendingCommissions.length > 0) {
        details += `📋 Pending Commissions (${pendingCommissions.length}):\n`;
        pendingCommissions.slice(0, 5).forEach(comm => {
            details += `• Job ${comm.jobNo}: ₹${comm.amount.toLocaleString('en-IN')}\n`;
        });
    }
    
    alert(details);
}

function processSalary(userId) {
    const user = window.userManager.getUserById(userId);
    if (!user) return;
    
    const commission = user.commission ? user.commission.pending : 0;
    const totalSalary = user.salary + commission;
    
    const confirm = window.confirm(
        `💳 Process Salary Payment\n\n` +
        `👤 Employee: ${user.name}\n` +
        `💰 Basic Salary: ₹${user.salary.toLocaleString('en-IN')}\n` +
        `💰 Commission: ₹${commission.toLocaleString('en-IN')}\n` +
        `💰 Total Amount: ₹${totalSalary.toLocaleString('en-IN')}\n\n` +
        `Proceed with payment?`
    );
    
    if (confirm) {
        // In real system, integrate with payment gateway
        alert(
            `✅ Salary Processed Successfully!\n\n` +
            `👤 Employee: ${user.name}\n` +
            `💳 Amount: ₹${totalSalary.toLocaleString('en-IN')}\n` +
            `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
            `Payment has been initiated.`
        );
    }
}

function payUserCommission(userId) {
    const user = window.userManager.getUserById(userId);
    if (!user || !user.commission || user.commission.pending <= 0) {
        alert('❌ No pending commission for this user!');
        return;
    }
    
    const pendingCommissions = window.userManager.getCommissions(userId)
        .filter(c => c.status === 'pending');
    
    const confirm = window.confirm(
        `💰 Pay Commission\n\n` +
        `👤 Sales Person: ${user.name}\n` +
        `💰 Total Commission: ₹${user.commission.pending.toLocaleString('en-IN')}\n` +
        `📋 Jobs: ${pendingCommissions.length}\n\n` +
        `Proceed with commission payment?`
    );
    
    if (confirm) {
        // Mark all pending commissions as paid
        pendingCommissions.forEach(comm => {
            window.userManager.payCommission(comm.id);
        });
        
        loadPayrollData(); // Refresh data
        
        alert(
            `✅ Commission Paid Successfully!\n\n` +
            `👤 Sales Person: ${user.name}\n` +
            `💳 Amount: ₹${user.commission.pending.toLocaleString('en-IN')}\n` +
            `📅 Date: ${new Date().toLocaleDateString('en-IN')}`
        );
    }
}

function filterPayroll() {
    // For now, just reload current data
    // In full system, filter by selected month/year
    loadPayrollData();
}

function exportPayroll() {
    const month = document.getElementById('monthFilter').value;
    const year = document.getElementById('yearFilter').value;
    
    if (!month || !year) {
        alert('❌ Please select month and year first!');
        return;
    }
    
    alert(
        `📤 Export Payroll Report\n\n` +
        `📅 Period: ${getMonthName(month)} ${year}\n\n` +
        `Available Formats:\n` +
        `• PDF Payroll Report\n` +
        `• Excel Salary Sheet\n` +
        `• Commission Summary\n` +
        `• Bank Transfer File\n\n` +
        `Export functionality - Coming Soon!`
    );
}

function getMonthName(monthNum) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNum)];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}