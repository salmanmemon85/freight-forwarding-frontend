// Login JavaScript - Simple & Fast

const demoUsers = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', branch: 'karachi' },
    sales: { username: 'sales', password: 'sales123', role: 'sales', branch: 'karachi' },
    ops: { username: 'ops', password: 'ops123', role: 'operations', branch: 'lahore' },
    accounts: { username: 'accounts', password: 'acc123', role: 'accounts', branch: 'islamabad' }
};

function fillDemo(userType) {
    const user = demoUsers[userType];
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = user.password;
    document.getElementById('role').value = user.role;
    document.getElementById('branch').value = user.branch;
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const branch = document.getElementById('branch').value;
    
    // Simple validation
    if (!username || !password || !role || !branch) {
        alert('Please fill all fields');
        return;
    }
    
    // Check demo users
    const user = Object.values(demoUsers).find(u => 
        u.username === username && u.password === password
    );
    
    if (user) {
        // Store user session
        sessionStorage.setItem('currentUser', JSON.stringify({
            username: username,
            role: role,
            branch: branch
        }));
        
        // Redirect to dashboard
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials. Please use demo users.');
    }
}

// Auto-fill first demo user on page load
document.addEventListener('DOMContentLoaded', function() {
    fillDemo('admin');
});