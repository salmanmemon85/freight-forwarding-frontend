// User Management System with Commission & Payroll

class UserManager {
    constructor() {
        this.initializeUserData();
    }

    initializeUserData() {
        const data = this.getData();
        if (!data.users) data.users = [];
        if (!data.commissions) data.commissions = [];
        if (!data.payrolls) data.payrolls = [];
        this.saveData(data);
    }

    getData() {
        return JSON.parse(localStorage.getItem('idealFreightData')) || {};
    }

    saveData(data) {
        localStorage.setItem('idealFreightData', JSON.stringify(data));
    }

    // Add user with enhanced role permissions
    addUser(userData) {
        const data = this.getData();
        const userId = 'USR' + Date.now().toString().slice(-6);
        
        const user = {
            id: userId,
            name: userData.name,
            email: userData.email,
            password: userData.password, // Store password (in real app, hash this)
            phone: userData.phone || '',
            cnic: userData.cnic || '',
            role: userData.role,
            branch: userData.branch,
            salary: parseFloat(userData.salary),
            joinDate: userData.joinDate,
            status: 'active',
            createdAt: new Date().toISOString(),
            // Role permissions
            permissions: this.getRolePermissions(userData.role),
            // Commission settings for sales
            commission: userData.role === 'sales' ? {
                rate: parseFloat(userData.commissionRate) || 0,
                type: userData.commissionType || 'profit',
                totalEarned: 0,
                totalPaid: 0,
                pending: 0
            } : null,
            // Employee details
            employeeDetails: {
                department: this.getRoleDepartment(userData.role),
                workingHours: '9:00-18:00',
                weeklyHours: 40,
                overtimeRate: 1.5,
                leaveBalance: 20
            }
        };

        data.users.push(user);
        this.saveData(data);
        return user;
    }

    // Get role-based permissions
    getRolePermissions(role) {
        const permissions = {
            admin: ['all'],
            manager: ['users', 'payroll', 'reports', 'jobs', 'documents', 'billing'],
            sales: ['enquiries', 'quotations', 'jobs', 'parties'],
            operations: ['jobs', 'documents', 'parties'],
            accounts: ['billing', 'payments', 'outstanding', 'payroll']
        };
        return permissions[role] || [];
    }

    // Get department by role
    getRoleDepartment(role) {
        const departments = {
            admin: 'Administration',
            manager: 'Management',
            sales: 'Sales & Marketing',
            operations: 'Operations',
            accounts: 'Accounts & Finance'
        };
        return departments[role] || 'General';
    }

    getUsers() {
        return this.getData().users || [];
    }

    getUserById(userId) {
        return this.getUsers().find(u => u.id === userId);
    }

    updateUser(userId, updates) {
        const data = this.getData();
        const userIndex = data.users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...updates };
            this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    }

    deleteUser(userId) {
        const data = this.getData();
        data.users = data.users.filter(u => u.id !== userId);
        this.saveData(data);
    }

    // Commission Management
    calculateCommission(jobNo, salesPersonId) {
        const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
        const user = this.getUserById(salesPersonId);
        
        if (!job || !user || user.role !== 'sales' || !user.commission) {
            return 0;
        }

        const jobProfit = job.totalRevenue - job.totalCost;
        let commission = 0;

        switch (user.commission.type) {
            case 'profit':
                commission = (jobProfit * user.commission.rate) / 100;
                break;
            case 'revenue':
                commission = (job.totalRevenue * user.commission.rate) / 100;
                break;
            case 'fixed':
                commission = user.commission.rate;
                break;
        }

        return Math.max(0, commission);
    }

    addCommission(jobNo, salesPersonId, amount, description = '') {
        const data = this.getData();
        const commissionId = 'COM' + Date.now().toString().slice(-6);
        
        const commission = {
            id: commissionId,
            jobNo,
            salesPersonId,
            amount: parseFloat(amount),
            description,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paidAt: null
        };

        data.commissions.push(commission);
        
        // Update user's commission totals
        const user = this.getUserById(salesPersonId);
        if (user && user.commission) {
            user.commission.totalEarned += amount;
            user.commission.pending += amount;
            this.updateUser(salesPersonId, { commission: user.commission });
        }

        this.saveData(data);
        return commission;
    }

    getCommissions(salesPersonId = null) {
        const commissions = this.getData().commissions || [];
        return salesPersonId ? 
            commissions.filter(c => c.salesPersonId === salesPersonId) : 
            commissions;
    }

    payCommission(commissionId) {
        const data = this.getData();
        const commissionIndex = data.commissions.findIndex(c => c.id === commissionId);
        
        if (commissionIndex !== -1) {
            const commission = data.commissions[commissionIndex];
            commission.status = 'paid';
            commission.paidAt = new Date().toISOString();
            
            // Update user's commission totals
            const user = this.getUserById(commission.salesPersonId);
            if (user && user.commission) {
                user.commission.totalPaid += commission.amount;
                user.commission.pending -= commission.amount;
                this.updateUser(commission.salesPersonId, { commission: user.commission });
            }
            
            this.saveData(data);
            return commission;
        }
        return null;
    }

    // Payroll Management
    generatePayroll(month, year) {
        const users = this.getUsers().filter(u => u.status === 'active');
        const payrollId = 'PAY' + Date.now().toString().slice(-6);
        
        const payrollData = {
            id: payrollId,
            month,
            year,
            generatedAt: new Date().toISOString(),
            employees: users.map(user => {
                const commissions = this.getCommissions(user.id)
                    .filter(c => c.status === 'pending');
                const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
                
                return {
                    userId: user.id,
                    name: user.name,
                    role: user.role,
                    basicSalary: user.salary,
                    commission: totalCommission,
                    totalSalary: user.salary + totalCommission,
                    status: 'pending'
                };
            })
        };

        const data = this.getData();
        data.payrolls.push(payrollData);
        this.saveData(data);
        return payrollData;
    }

    getPayrolls() {
        return this.getData().payrolls || [];
    }

    // Statistics
    getUserStats() {
        const users = this.getUsers();
        const commissions = this.getCommissions();
        
        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            salesUsers: users.filter(u => u.role === 'sales').length,
            totalCommissionDue: commissions
                .filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + c.amount, 0)
        };
    }
}

// Initialize User Manager
window.userManager = new UserManager();

document.addEventListener('DOMContentLoaded', function() {
    loadUsersData();
});

function loadUsersData() {
    const stats = window.userManager.getUserStats();
    
    const totalUsersEl = document.getElementById('totalUsers');
    const salesUsersEl = document.getElementById('salesUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const commissionDueEl = document.getElementById('commissionDue');
    
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
    if (salesUsersEl) salesUsersEl.textContent = stats.salesUsers;
    if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers;
    if (commissionDueEl) commissionDueEl.textContent = '₹' + stats.totalCommissionDue.toLocaleString('en-IN');
    
    displayUsers(window.userManager.getUsers());
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const commissionInfo = user.commission ? 
            `${user.commission.rate}% (₹${user.commission.pending.toLocaleString('en-IN')} pending)` : 
            'N/A';
        
        const statusClass = user.status === 'active' ? 'success' : 'danger';
        
        const row = `
            <tr>
                <td>
                    <strong>${user.id}</strong>
                    <br><small>Joined: ${formatDate(user.joinDate)}</small>
                </td>
                <td>
                    <div><strong>${user.name}</strong></div>
                    <small>📧 ${user.email}</small>
                    ${user.phone ? `<br><small>📱 ${user.phone}</small>` : ''}
                </td>
                <td>
                    <div><strong>${user.role.toUpperCase()}</strong></div>
                    <small>📍 ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)}</small>
                </td>
                <td>₹${user.salary.toLocaleString('en-IN')}</td>
                <td>${commissionInfo}</td>
                <td><span class="status-${statusClass}">${user.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="editUser('${user.id}')">✏️ Edit</button>
                    <button class="btn-small btn-primary" onclick="viewUserDetails('${user.id}')">👁️ View</button>
                    ${user.role === 'sales' ? `<button class="btn-small" onclick="viewCommissions('${user.id}')">💰 Commission</button>` : ''}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function showAddUser() {
    document.getElementById('addUserModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

function toggleCommissionFields() {
    const role = document.getElementById('userRole').value;
    const commissionSection = document.getElementById('commissionSection');
    commissionSection.style.display = role === 'sales' ? 'block' : 'none';
}

function editUser(userId) {
    const user = window.userManager.getUserById(userId);
    if (!user) return;
    
    // Pre-fill form with user data
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone;
    document.getElementById('userCnic').value = user.cnic;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userBranch').value = user.branch;
    document.getElementById('userSalary').value = user.salary;
    document.getElementById('joinDate').value = user.joinDate;
    
    if (user.commission) {
        document.getElementById('commissionRate').value = user.commission.rate;
        document.getElementById('commissionType').value = user.commission.type;
        toggleCommissionFields();
    }
    
    // Store user ID for update
    document.getElementById('addUserForm').dataset.editUserId = userId;
    showAddUser();
}

function viewUserDetails(userId) {
    const user = window.userManager.getUserById(userId);
    if (!user) return;
    
    let details = `👤 User Details - ${user.name}\n\n`;
    details += `🆔 ID: ${user.id}\n`;
    details += `📧 Email: ${user.email}\n`;
    details += `📱 Phone: ${user.phone || 'N/A'}\n`;
    details += `🏢 Role: ${user.role.toUpperCase()}\n`;
    details += `📍 Branch: ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)}\n`;
    details += `💰 Salary: ₹${user.salary.toLocaleString('en-IN')}\n`;
    details += `📅 Join Date: ${formatDate(user.joinDate)}\n`;
    details += `📊 Status: ${user.status.toUpperCase()}\n`;
    
    if (user.commission) {
        details += `\n💰 Commission Details:\n`;
        details += `• Rate: ${user.commission.rate}%\n`;
        details += `• Type: ${user.commission.type}\n`;
        details += `• Total Earned: ₹${user.commission.totalEarned.toLocaleString('en-IN')}\n`;
        details += `• Total Paid: ₹${user.commission.totalPaid.toLocaleString('en-IN')}\n`;
        details += `• Pending: ₹${user.commission.pending.toLocaleString('en-IN')}\n`;
    }
    
    alert(details);
}

function viewCommissions(userId) {
    const user = window.userManager.getUserById(userId);
    const commissions = window.userManager.getCommissions(userId);
    
    if (!user || commissions.length === 0) {
        alert('No commissions found for this user.');
        return;
    }
    
    let report = `💰 Commission Report - ${user.name}\n\n`;
    report += `📊 Summary:\n`;
    report += `• Total Earned: ₹${user.commission.totalEarned.toLocaleString('en-IN')}\n`;
    report += `• Total Paid: ₹${user.commission.totalPaid.toLocaleString('en-IN')}\n`;
    report += `• Pending: ₹${user.commission.pending.toLocaleString('en-IN')}\n\n`;
    
    report += `📋 Recent Commissions:\n`;
    commissions.slice(-5).forEach(comm => {
        report += `• Job ${comm.jobNo}: ₹${comm.amount.toLocaleString('en-IN')} (${comm.status})\n`;
    });
    
    alert(report);
}

function showCommissionReport() {
    const salesUsers = window.userManager.getUsers().filter(u => u.role === 'sales');
    
    if (salesUsers.length === 0) {
        alert('No sales persons found.');
        return;
    }
    
    let report = `💰 Commission Report - All Sales Team\n\n`;
    
    salesUsers.forEach(user => {
        if (user.commission) {
            report += `👤 ${user.name}:\n`;
            report += `  • Pending: ₹${user.commission.pending.toLocaleString('en-IN')}\n`;
            report += `  • Total Earned: ₹${user.commission.totalEarned.toLocaleString('en-IN')}\n\n`;
        }
    });
    
    const totalPending = salesUsers.reduce((sum, u) => 
        sum + (u.commission ? u.commission.pending : 0), 0);
    
    report += `📊 Total Commission Due: ₹${totalPending.toLocaleString('en-IN')}`;
    
    alert(report);
}

// Form submission
const addUserForm = document.getElementById('addUserForm');
if (addUserForm) {
    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('userPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Password validation
        if (password !== confirmPassword) {
            alert('❌ Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            alert('❌ Password must be at least 6 characters long!');
            return;
        }
        
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: password,
            phone: document.getElementById('userPhone').value,
            cnic: document.getElementById('userCnic').value,
            role: document.getElementById('userRole').value,
            branch: document.getElementById('userBranch').value,
            salary: document.getElementById('userSalary').value,
            joinDate: document.getElementById('joinDate').value,
            commissionRate: document.getElementById('commissionRate').value,
            commissionType: document.getElementById('commissionType').value
        };
        
        const editUserId = this.dataset.editUserId;
        
        if (editUserId) {
            // Update existing user
            window.userManager.updateUser(editUserId, userData);
            delete this.dataset.editUserId;
            alert('✅ User updated successfully!');
        } else {
            // Create new user
            const user = window.userManager.addUser(userData);
            alert(`✅ User created successfully!\n\n👤 Name: ${user.name}\n🆔 ID: ${user.id}\n🏢 Role: ${user.role}`);
        }
        
        loadUsersData();
        closeModal();
    });
}

function filterUsers() {
    const roleFilter = document.getElementById('roleFilter').value;
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    
    let users = window.userManager.getUsers();
    
    if (roleFilter !== 'all') {
        users = users.filter(u => u.role === roleFilter);
    }
    
    if (searchTerm) {
        users = users.filter(u => 
            u.name.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm) ||
            u.id.toLowerCase().includes(searchTerm)
        );
    }
    
    displayUsers(users);
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
    const modal = document.getElementById('addUserModal');
    if (event.target === modal) {
        closeModal();
    }
}