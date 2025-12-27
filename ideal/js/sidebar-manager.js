// Sidebar Manager - Dynamic Navigation System

if (!window.SidebarManager) {
    class SidebarManager {
        constructor() {
            this.config = null;
            this.currentPage = this.getCurrentPageId();
            this.loadConfig();
        }

        async loadConfig() {
            try {
                // Check if we're in root or views folder
                const configPath = window.location.pathname.includes('/views/') 
                    ? '../config/sidebar-config.json' 
                    : 'config/sidebar-config.json';
                const response = await fetch(configPath);
                this.config = await response.json();
                this.renderSidebar();
            } catch (error) {
                console.error('Failed to load sidebar config:', error);
                this.renderFallbackSidebar();
            }
        }

        getCurrentPageId() {
            const currentFile = window.location.pathname.split('/').pop();
            const pageMap = {
                'ideal-dashboard.html': 'dashboard',
                'ideal-parties.html': 'parties',
                'ideal-enquiries.html': 'enquiries',
                'ideal-quotations.html': 'quotations',
                'ideal-jobs.html': 'jobs',
                'ideal-documents.html': 'documents',
                'bill-of-lading.html': 'documents',
                'delivery-order.html': 'documents',
                'air-waybill.html': 'documents',
                'arrival-notice.html': 'documents',
                'commercial-invoice.html': 'documents',
                'packing-list.html': 'documents',
                'ideal-purchase-orders.html': 'purchase-orders',
                'ideal-billing.html': 'billing',
                'ideal-payments.html': 'payments',
                'ideal-outstanding.html': 'outstanding',
                'ideal-users.html': 'users',
                'ideal-attendance.html': 'attendance',
                'ideal-payroll.html': 'payroll',
                'ideal-reports.html': 'reports',
                'accounts.html': 'accounts'
            };
            return pageMap[currentFile] || 'dashboard';
        }

        getUserRole() {
            return 'admin'; // Always return admin to show all menu items
        }

        renderSidebar() {
            if (!this.config) return;

            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;

            const userRole = this.getUserRole();
            
            // Filter menu items based on user role
            const allowedMenuItems = this.config.menuItems.filter(item => 
                item.roles.includes(userRole) || userRole === 'admin'
            );

            const sidebarHTML = `
                <div class="logo">
                    <h2>${this.config.logo.title}</h2>
                    <p>${this.config.logo.subtitle}</p>
                </div>
                <ul class="nav-menu">
                    ${allowedMenuItems.map(item => this.renderMenuItem(item)).join('')}
                </ul>
                <div class="user-info">
                    <button onclick="logout()" class="logout-btn">Logout</button>
                </div>
                <style>
                    .sub-menu {
                        display: none;
                        padding-left: 20px;
                        background: rgba(0,0,0,0.1);
                    }
                    .nav-item.active + .sub-menu,
                    .nav-menu li:hover .sub-menu {
                        display: block;
                    }
                    .sub-item {
                        display: block;
                        padding: 8px 15px;
                        color: #ccc;
                        text-decoration: none;
                        font-size: 14px;
                        border-left: 2px solid transparent;
                    }
                    .sub-item:hover {
                        background: rgba(255,255,255,0.1);
                        border-left-color: #007bff;
                        color: white;
                    }
                </style>
            `;

            sidebar.innerHTML = sidebarHTML;
            this.updateUserInfo();
        }

        renderMenuItem(item) {
            const isActive = item.id === this.currentPage ? 'active' : '';
            
            // Adjust URL based on current location
            const adjustUrl = (url) => {
                if (!url) return '#';
                
                // Special handling for index.html (dashboard)
                if (url === 'index.html') {
                    return window.location.pathname.includes('/views/') ? '../index.html' : 'index.html';
                }
                
                // If we're in views folder and URL starts with views/, remove the views/ prefix
                if (window.location.pathname.includes('/views/') && url.startsWith('views/')) {
                    return url.replace('views/', '');
                }
                // If we're in root and URL doesn't start with views/, add views/ prefix
                if (!window.location.pathname.includes('/views/') && !url.startsWith('views/')) {
                    return 'views/' + url;
                }
                return url;
            };
            
            if (item.submenu && item.submenu.length > 0) {
                const submenuHTML = item.submenu.map(subItem => 
                    `<li><a href="${adjustUrl(subItem.url)}" class="sub-item">${subItem.icon} ${subItem.label}</a></li>`
                ).join('');
                
                return `
                    <li>
                        <a href="${adjustUrl(item.url)}" class="nav-item ${isActive}">
                            ${item.icon} ${item.label}
                        </a>
                        <ul class="sub-menu">
                            ${submenuHTML}
                        </ul>
                    </li>
                `;
            }
            
            return `
                <li>
                    <a href="${adjustUrl(item.url)}" class="nav-item ${isActive}">
                        ${item.icon} ${item.label}
                    </a>
                </li>
            `;
        }

        updateUserInfo() {
            // No user info to display, just logout button
        }

        renderFallbackSidebar() {
            // Fallback sidebar if JSON fails to load
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;

            const fallbackHTML = `
                <div class="logo">
                    <h2>FreightW</h2>
                    <p>Ideal Freight Software</p>
                </div>
                <ul class="nav-menu">
                    <li><a href="ideal-dashboard.html" class="nav-item">📊 Dashboard</a></li>
                    <li><a href="ideal-parties.html" class="nav-item">👥 Parties</a></li>
                    <li><a href="ideal-jobs.html" class="nav-item">💼 Jobs</a></li>
                    <li><a href="ideal-documents.html" class="nav-item">📄 Documents</a></li>
                    <li><a href="ideal-purchase-orders.html" class="nav-item">🛒 Purchase Orders</a></li>
                    <li><a href="ideal-billing.html" class="nav-item">🧾 Billing</a></li>
                    <li><a href="accounts.html" class="nav-item">🧮 Accounts</a></li>
                    <li><a href="ideal-users.html" class="nav-item">👤 Users</a></li>
                    <li><a href="ideal-payroll.html" class="nav-item">💰 Payroll</a></li>
                </ul>
                <div class="user-info">
                    <button onclick="logout()" class="logout-btn">Logout</button>
                </div>
            `;

            sidebar.innerHTML = fallbackHTML;
            this.updateUserInfo();
        }

        // Method to add new menu item dynamically
        addMenuItem(item) {
            if (this.config) {
                this.config.menuItems.push(item);
                this.renderSidebar();
            }
        }

        // Method to update menu item
        updateMenuItem(id, updates) {
            if (this.config) {
                const itemIndex = this.config.menuItems.findIndex(item => item.id === id);
                if (itemIndex !== -1) {
                    this.config.menuItems[itemIndex] = { ...this.config.menuItems[itemIndex], ...updates };
                    this.renderSidebar();
                }
            }
        }

        // Method to hide/show menu items based on permissions
        updateMenuPermissions(userRole) {
            this.renderSidebar();
        }
    }

    window.SidebarManager = SidebarManager;
}

// Initialize sidebar manager
if (!window.sidebarManager) {
    window.sidebarManager = new window.SidebarManager();
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar if not already done
    if (!window.sidebarManager) {
        window.sidebarManager = new window.SidebarManager();
    }
});

// Global logout function
if (!window.logout) {
    window.logout = function() {
        // Simple redirect to dashboard
        const dashboardPath = window.location.pathname.includes('/views/') ? '../index.html' : 'index.html';
        window.location.href = dashboardPath;
    };
}