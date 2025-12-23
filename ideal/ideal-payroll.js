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
        
        // Get shifts and leaves data
        const shiftsData = getEmployeeShifts(user.id, month, year);
        const leavesData = getEmployeeLeaves(user.id, month, year);
        
        // Calculate salary based on shifts and leaves
        const baseSalary = user.salary;
        const workingDays = 30;
        const actualWorkingDays = workingDays - leavesData.totalDays;
        const attendanceRate = (actualWorkingDays / workingDays) * 100;
        const attendanceAdjustedSalary = (baseSalary * attendanceRate) / 100;
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
                    <small>Attendance: ${attendanceRate.toFixed(1)}%</small>
                </td>
                <td>
                    <div><strong>${shiftsData.totalShifts}</strong> shifts</div>
                    <small>${shiftsData.overtimeHours}h overtime</small>
                </td>
                <td>
                    <div><strong>${leavesData.totalDays}</strong> days</div>
                    <small>${leavesData.pending} pending</small>
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

// Shifts Management
let shiftsData = JSON.parse(localStorage.getItem('employeeShifts')) || [];
let leavesData = JSON.parse(localStorage.getItem('employeeLeaves')) || [];

function manageShifts() {
    loadEmployeeOptions('shiftEmployee');
    loadShiftsData();
    document.getElementById('shiftsModal').style.display = 'block';
}

function manageLeaves() {
    loadEmployeeOptions('leaveEmployee');
    loadLeavesData();
    document.getElementById('leavesModal').style.display = 'block';
}

function loadEmployeeOptions(selectId) {
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Employee</option>';
    
    users.forEach(user => {
        select.innerHTML += `<option value="${user.id}">${user.name} - ${user.role}</option>`;
    });
}

function addShift() {
    const employeeId = document.getElementById('shiftEmployee').value;
    const date = document.getElementById('shiftDate').value;
    const shiftType = document.getElementById('shiftType').value;
    const hoursWorked = parseFloat(document.getElementById('hoursWorked').value) || 8;
    const status = document.getElementById('shiftStatus').value;
    const notes = document.getElementById('shiftNotes').value;
    
    if (!employeeId || !date || !shiftType) {
        alert('❌ Please fill all required fields!');
        return;
    }
    
    const employee = window.userManager.getUserById(employeeId);
    const shift = {
        id: Date.now().toString(),
        employeeId,
        employeeName: employee.name,
        date,
        shiftType,
        hoursWorked,
        status,
        notes,
        createdAt: new Date().toISOString()
    };
    
    shiftsData.push(shift);
    localStorage.setItem('employeeShifts', JSON.stringify(shiftsData));
    
    loadShiftsData();
    document.getElementById('shiftEmployee').value = '';
    document.getElementById('shiftDate').value = '';
    document.getElementById('shiftType').value = '';
    document.getElementById('hoursWorked').value = '8';
    document.getElementById('shiftStatus').value = 'present';
    document.getElementById('shiftNotes').value = '';
    
    alert(`✅ Shift added successfully!\n\n👤 Employee: ${employee.name}\n📅 Date: ${formatDate(date)}\n🕰️ Shift: ${shiftType}\n⏱️ Hours: ${hoursWorked}`);
}

function loadShiftsData() {
    const tbody = document.getElementById('shiftsTable');
    tbody.innerHTML = '';
    
    const recentShifts = shiftsData.slice(-20).reverse();
    
    recentShifts.forEach(shift => {
        const statusClass = shift.status === 'present' ? 'success' : 
                           shift.status === 'absent' ? 'danger' : 'warning';
        
        const row = `
            <tr>
                <td>${shift.employeeName}</td>
                <td>${formatDate(shift.date)}</td>
                <td>${shift.shiftType}</td>
                <td>${shift.hoursWorked}h</td>
                <td><span class="status-${statusClass}">${shift.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="editShift('${shift.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteShift('${shift.id}')">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function applyLeave() {
    const employeeId = document.getElementById('leaveEmployee').value;
    const leaveType = document.getElementById('leaveType').value;
    const fromDate = document.getElementById('leaveFromDate').value;
    const toDate = document.getElementById('leaveToDate').value;
    const reason = document.getElementById('leaveReason').value;
    const status = document.getElementById('leaveStatus').value;
    
    if (!employeeId || !leaveType || !fromDate || !toDate || !reason) {
        alert('❌ Please fill all required fields!');
        return;
    }
    
    const employee = window.userManager.getUserById(employeeId);
    const days = calculateLeaveDays(fromDate, toDate);
    
    const leave = {
        id: Date.now().toString(),
        employeeId,
        employeeName: employee.name,
        leaveType,
        fromDate,
        toDate,
        days,
        reason,
        status,
        appliedAt: new Date().toISOString()
    };
    
    leavesData.push(leave);
    localStorage.setItem('employeeLeaves', JSON.stringify(leavesData));
    
    loadLeavesData();
    document.getElementById('leaveEmployee').value = '';
    document.getElementById('leaveType').value = '';
    document.getElementById('leaveFromDate').value = '';
    document.getElementById('leaveToDate').value = '';
    document.getElementById('leaveDays').value = '';
    document.getElementById('leaveReason').value = '';
    document.getElementById('leaveStatus').value = 'pending';
    
    alert(`✅ Leave application submitted!\n\n👤 Employee: ${employee.name}\n🏠 Type: ${leaveType}\n📅 Duration: ${formatDate(fromDate)} to ${formatDate(toDate)}\n📆 Days: ${days}`);
}

function loadLeavesData() {
    const tbody = document.getElementById('leavesTable');
    tbody.innerHTML = '';
    
    const recentLeaves = leavesData.slice(-20).reverse();
    
    recentLeaves.forEach(leave => {
        const statusClass = leave.status === 'approved' ? 'success' : 
                           leave.status === 'rejected' ? 'danger' : 'warning';
        
        const row = `
            <tr>
                <td>${leave.employeeName}</td>
                <td>${leave.leaveType}</td>
                <td>${formatDate(leave.fromDate)} - ${formatDate(leave.toDate)}</td>
                <td>${leave.days}</td>
                <td><span class="status-${statusClass}">${leave.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="approveLeave('${leave.id}')">Approve</button>
                    <button class="btn-small btn-danger" onclick="rejectLeave('${leave.id}')">Reject</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function calculateLeaveDays(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('leaveDays').value = diffDays;
    return diffDays;
}

function getEmployeeShifts(employeeId, month, year) {
    const employeeShifts = shiftsData.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shift.employeeId === employeeId && 
               shiftDate.getMonth() + 1 === month && 
               shiftDate.getFullYear() === year;
    });
    
    const totalShifts = employeeShifts.length;
    const overtimeHours = employeeShifts
        .filter(s => s.shiftType === 'overtime')
        .reduce((sum, s) => sum + s.hoursWorked, 0);
    
    return { totalShifts, overtimeHours };
}

function getEmployeeLeaves(employeeId, month, year) {
    const employeeLeaves = leavesData.filter(leave => {
        const fromDate = new Date(leave.fromDate);
        const toDate = new Date(leave.toDate);
        return leave.employeeId === employeeId && 
               ((fromDate.getMonth() + 1 === month && fromDate.getFullYear() === year) ||
                (toDate.getMonth() + 1 === month && toDate.getFullYear() === year));
    });
    
    const totalDays = employeeLeaves
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + l.days, 0);
    const pending = employeeLeaves.filter(l => l.status === 'pending').length;
    
    return { totalDays, pending };
}

function approveLeave(leaveId) {
    const leave = leavesData.find(l => l.id === leaveId);
    if (leave) {
        leave.status = 'approved';
        localStorage.setItem('employeeLeaves', JSON.stringify(leavesData));
        loadLeavesData();
        loadPayrollData(); // Refresh payroll to reflect leave impact
        alert(`✅ Leave approved for ${leave.employeeName}`);
    }
}

function rejectLeave(leaveId) {
    const leave = leavesData.find(l => l.id === leaveId);
    if (leave) {
        leave.status = 'rejected';
        localStorage.setItem('employeeLeaves', JSON.stringify(leavesData));
        loadLeavesData();
        alert(`❌ Leave rejected for ${leave.employeeName}`);
    }
}

function closeShiftsModal() {
    document.getElementById('shiftsModal').style.display = 'none';
}

function closeLeavesModal() {
    document.getElementById('leavesModal').style.display = 'none';
}

// Auto-calculate leave days when dates change
document.addEventListener('DOMContentLoaded', function() {
    const fromDateEl = document.getElementById('leaveFromDate');
    const toDateEl = document.getElementById('leaveToDate');
    
    if (fromDateEl && toDateEl) {
        fromDateEl.addEventListener('change', function() {
            if (fromDateEl.value && toDateEl.value) {
                calculateLeaveDays(fromDateEl.value, toDateEl.value);
            }
        });
        
        toDateEl.addEventListener('change', function() {
            if (fromDateEl.value && toDateEl.value) {
                calculateLeaveDays(fromDateEl.value, toDateEl.value);
            }
        });
    }
});