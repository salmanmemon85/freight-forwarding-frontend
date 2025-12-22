// Universal Responsive Sidebar Script
// Include this in all HTML pages for mobile responsiveness

// Mobile Sidebar Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Auto-close sidebar when clicking nav items on mobile
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    // Close sidebar on window resize if desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
});

// Add mobile menu toggle to all pages
function addMobileMenuToPage() {
    // Check if mobile menu already exists
    if (document.querySelector('.mobile-menu-toggle')) return;
    
    // Create mobile menu toggle
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.onclick = toggleSidebar;
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Create mobile overlay
    const mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-overlay';
    mobileOverlay.onclick = closeSidebar;
    
    // Add to body
    document.body.insertBefore(mobileToggle, document.body.firstChild);
    document.body.insertBefore(mobileOverlay, document.body.firstChild);
}

// Auto-add mobile menu when page loads
document.addEventListener('DOMContentLoaded', addMobileMenuToPage);