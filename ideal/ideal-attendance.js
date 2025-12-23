// Attendance Management System

class AttendanceManager {
    constructor() {
        this.initializeAttendanceData();
    }

    initializeAttendanceData() {
        const data = this.getData();
        if (!data.attendance) data.attendance = [];
        this.saveData(data);
    }

    getData() {
        return JSON.parse(localStorage.getItem('idealFreightData')) || {};
    }

    saveData(data) {
        localStorage.setItem('idealFreightData', JSON.stringify(data));
    }

    // Mark attendance for employee
    markAttendance(attendanceData) {
        const data = this.getData();
        const attendanceId = 'ATT' + Date.now().toString().slice(-6);
        
        const attendance = {
            id: attendanceId,
            employeeId: attendanceData.employeeId,
            date: attendanceData.date,
            checkIn: attendanceData.checkIn || null,
            checkOut: attendanceData.checkOut || null,
            status: attendanceData.status,
            remarks: attendanceData.remarks || '',
            hoursWorked: this.calculateHours(attendanceData.checkIn, attendanceData.checkOut),
            createdAt: new Date().toISOString()
        };

        // Check if attendance already exists for this employee and date
        const existingIndex = data.attendance.findIndex(a => 
            a.employeeId === attendanceData.employeeId && a.date === attendanceData.date
        );

        if (existingIndex !== -1) {
            data.attendance[existingIndex] = attendance;
        } else {
            data.attendance.push(attendance);
        }

        this.saveData(data);
        return attendance;
    }

    // Calculate working hours
    calculateHours(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;
        
        const start = new Date(`2000-01-01 ${checkIn}`);
        const end = new Date(`2000-01-01 ${checkOut}`);
        const diff = (end - start) / (1000 * 60 * 60); // Convert to hours
        
        return Math.max(0, diff);
    }

    // Get attendance records
    getAttendance(employeeId = null, date = null) {
        let attendance = this.getData().attendance || [];
        
        if (employeeId) {
            attendance = attendance.filter(a => a.employeeId === employeeId);
        }
        
        if (date) {
            attendance = attendance.filter(a => a.date === date);
        }
        
        return attendance;
    }

    // Get today's attendance
    getTodayAttendance() {
        const today = new Date().toISOString().split('T')[0];
        return this.getAttendance(null, today);
    }

    // Get monthly attendance for employee
    getMonthlyAttendance(employeeId, month, year) {
        const attendance = this.getAttendance(employeeId);
        return attendance.filter(a => {
            const date = new Date(a.date);
            return date.getMonth() + 1 === month && date.getFullYear() === year;
        });
    }

    // Calculate attendance statistics
    getAttendanceStats(employeeId = null, month = null, year = null) {
        let attendance = this.getAttendance(employeeId);
        
        if (month && year) {
            attendance = attendance.filter(a => {
                const date = new Date(a.date);
                return date.getMonth() + 1 === month && date.getFullYear() === year;
            });
        }

        const total = attendance.length;
        const present = attendance.filter(a => ['present', 'late'].includes(a.status)).length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const leaves = attendance.filter(a => a.status === 'leave').length;

        return {
            total,
            present,
            absent,
            late,
            leaves,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0
        };
    }

    // Get attendance summary for payroll
    getPayrollAttendance(employeeId, month, year) {
        const monthlyAttendance = this.getMonthlyAttendance(employeeId, month, year);
        const stats = this.getAttendanceStats(employeeId, month, year);
        
        // Calculate working days (excluding weekends)
        const daysInMonth = new Date(year, month, 0).getDate();
        const workingDays = Math.floor(daysInMonth * (5/7)); // Approximate working days
        
        return {
            ...stats,
            workingDays,
            attendanceRate: workingDays > 0 ? Math.round((stats.present / workingDays) * 100) : 0,
            totalHours: monthlyAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
        };
    }
}

// Initialize Attendance Manager
window.attendanceManager = new AttendanceManager();

document.addEventListener('DOMContentLoaded', function() {
    loadAttendanceData();
    setTodayDate();
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    document.getElementById('attendanceFormDate').value = today;
}

function loadAttendanceData() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = window.attendanceManager.getTodayAttendance();
    const allUsers = window.userManager.getUsers().filter(u => u.status === 'active');
    
    // Calculate today's stats
    const presentToday = todayAttendance.filter(a => ['present', 'late'].includes(a.status)).length;
    const absentToday = allUsers.length - presentToday;
    const lateArrivals = todayAttendance.filter(a => a.status === 'late').length;
    
    // Calculate average attendance (last 30 days)
    const avgAttendance = calculateAverageAttendance();
    
    const presentTodayEl = document.getElementById('presentToday');
    const absentTodayEl = document.getElementById('absentToday');
    const lateArrivalsEl = document.getElementById('lateArrivals');
    const avgAttendanceEl = document.getElementById('avgAttendance');
    
    if (presentTodayEl) presentTodayEl.textContent = presentToday;
    if (absentTodayEl) absentTodayEl.textContent = absentToday;
    if (lateArrivalsEl) lateArrivalsEl.textContent = lateArrivals;
    if (avgAttendanceEl) avgAttendanceEl.textContent = avgAttendance + '%';
    
    displayAttendanceData(today);
}

function calculateAverageAttendance() {
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    if (users.length === 0) return 0;
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let totalPercentage = 0;
    users.forEach(user => {
        const stats = window.attendanceManager.getAttendanceStats(user.id, month, year);
        totalPercentage += stats.percentage;
    });
    
    return Math.round(totalPercentage / users.length);
}

function displayAttendanceData(date) {
    const tbody = document.getElementById('attendanceTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    const attendanceRecords = window.attendanceManager.getAttendance(null, date);
    
    users.forEach(user => {
        const attendance = attendanceRecords.find(a => a.employeeId === user.id);
        const status = attendance ? attendance.status : 'absent';
        const checkIn = attendance ? attendance.checkIn || '-' : '-';
        const checkOut = attendance ? attendance.checkOut || '-' : '-';
        const hours = attendance ? (attendance.hoursWorked || 0).toFixed(1) : '0.0';
        
        const statusClass = getAttendanceStatusClass(status);
        
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
                <td>${checkIn}</td>
                <td>${checkOut}</td>
                <td>${hours}h</td>
                <td><span class="status-${statusClass}">${status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="editAttendance('${user.id}', '${date}')">✏️ Edit</button>
                    <button class="btn-small" onclick="viewAttendanceHistory('${user.id}')">📊 History</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getAttendanceStatusClass(status) {
    switch(status) {
        case 'present': return 'success';
        case 'late': return 'warning';
        case 'absent': return 'danger';
        case 'leave': return 'info';
        case 'half-day': return 'warning';
        default: return 'default';
    }
}

function markAttendance() {
    // Load employees in dropdown
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    const employeeSelect = document.getElementById('employeeSelect');
    
    employeeSelect.innerHTML = '<option value="">Select Employee</option>';
    users.forEach(user => {
        employeeSelect.innerHTML += `<option value="${user.id}">${user.name} (${user.role})</option>`;
    });
    
    document.getElementById('attendanceModal').style.display = 'block';
}

function editAttendance(employeeId, date) {
    const user = window.userManager.getUserById(employeeId);
    const attendance = window.attendanceManager.getAttendance(employeeId, date)[0];
    
    if (!user) return;
    
    // Pre-fill form
    document.getElementById('employeeSelect').value = employeeId;
    document.getElementById('attendanceFormDate').value = date;
    
    if (attendance) {
        document.getElementById('checkInTime').value = attendance.checkIn || '';
        document.getElementById('checkOutTime').value = attendance.checkOut || '';
        document.getElementById('attendanceStatus').value = attendance.status;
        document.getElementById('attendanceRemarks').value = attendance.remarks || '';
    }
    
    markAttendance();
}

function viewAttendanceHistory(employeeId) {
    const user = window.userManager.getUserById(employeeId);
    if (!user) return;
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const stats = window.attendanceManager.getAttendanceStats(employeeId, month, year);
    const recentAttendance = window.attendanceManager.getAttendance(employeeId)
        .slice(-10)
        .reverse();
    
    let history = `📊 Attendance History - ${user.name}\n\n`;
    history += `📅 Current Month (${getMonthName(month)} ${year}):\n`;
    history += `• Present: ${stats.present} days\n`;
    history += `• Absent: ${stats.absent} days\n`;
    history += `• Late: ${stats.late} days\n`;
    history += `• Leaves: ${stats.leaves} days\n`;
    history += `• Attendance Rate: ${stats.percentage}%\n\n`;
    
    history += `📋 Recent Records:\n`;
    recentAttendance.forEach(att => {
        const statusIcon = att.status === 'present' ? '✅' : 
                          att.status === 'late' ? '⚠️' : 
                          att.status === 'absent' ? '❌' : '📅';
        history += `${statusIcon} ${formatDate(att.date)}: ${att.status.toUpperCase()}\n`;
    });
    
    alert(history);
}

function showAttendanceReport() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const users = window.userManager.getUsers().filter(u => u.status === 'active');
    
    let report = `📊 Monthly Attendance Report - ${getMonthName(month)} ${year}\n\n`;
    
    let totalPresent = 0;
    let totalDays = 0;
    
    users.forEach(user => {
        const stats = window.attendanceManager.getAttendanceStats(user.id, month, year);
        totalPresent += stats.present;
        totalDays += stats.total;
        
        report += `👤 ${user.name} (${user.role}):\n`;
        report += `  • Present: ${stats.present}/${stats.total} (${stats.percentage}%)\n`;
        report += `  • Late: ${stats.late} days\n\n`;
    });
    
    const overallPercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
    report += `📈 Overall Attendance: ${overallPercentage}%`;
    
    alert(report);
}

// Form submission
const attendanceForm = document.getElementById('attendanceForm');
if (attendanceForm) {
    attendanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const attendanceData = {
            employeeId: document.getElementById('employeeSelect').value,
            date: document.getElementById('attendanceFormDate').value,
            checkIn: document.getElementById('checkInTime').value,
            checkOut: document.getElementById('checkOutTime').value,
            status: document.getElementById('attendanceStatus').value,
            remarks: document.getElementById('attendanceRemarks').value
        };
        
        if (!attendanceData.employeeId || !attendanceData.date || !attendanceData.status) {
            alert('❌ Please fill all required fields!');
            return;
        }
        
        const user = window.userManager.getUserById(attendanceData.employeeId);
        window.attendanceManager.markAttendance(attendanceData);
        
        loadAttendanceData();
        closeModal();
        
        alert(`✅ Attendance Marked Successfully!\n\n👤 Employee: ${user.name}\n📅 Date: ${formatDate(attendanceData.date)}\n📊 Status: ${attendanceData.status.toUpperCase()}`);
    });
}

function filterAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const branch = document.getElementById('branchFilter').value;
    
    if (!date) {
        alert('❌ Please select a date!');
        return;
    }
    
    displayAttendanceData(date);
}

function closeModal() {
    document.getElementById('attendanceModal').style.display = 'none';
    document.getElementById('attendanceForm').reset();
    setTodayDate();
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('attendanceModal');
    if (event.target === modal) {
        closeModal();
    }
}