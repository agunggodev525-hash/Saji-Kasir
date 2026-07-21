const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// Replace toggleSidebar
const toggleSidebarRegex = /function toggleSidebar\(\) \{[\s\S]*?(?=\n\/\/ Close sidebar when clicking outside on mobile)/;
const newToggleSidebar = `function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth > 768) {
        // Desktop Toggle
        sidebar.classList.toggle('active');
        const isActive = sidebar.classList.contains('active');
        
        if (menuToggle) {
            menuToggle.innerHTML = isActive ? '&#10094;' : '&#10095;'; // < or >
        }
        localStorage.setItem('sidebar_active', isActive ? 'true' : 'false');
    } else {
        // Mobile Toggle
        sidebar.classList.toggle('active');
        const isActive = sidebar.classList.contains('active');
        
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                if (menuToggle) menuToggle.innerHTML = '&#10095;';
            });
        }

        if (isActive) {
            overlay.classList.add('active');
            if (menuToggle) menuToggle.innerHTML = '&#10094;';
        } else {
            overlay.classList.remove('active');
            if (menuToggle) menuToggle.innerHTML = '&#10095;';
        }
    }
}
`;
content = content.replace(toggleSidebarRegex, newToggleSidebar);

// Replace DOMContentLoaded initialization
const initRegex = /\/\/ --- Desktop Sidebar Collapse Logic ---[\s\S]*?(?=\n\/\/ --- Lucide Icons Injection for Sidebar ---)/;
const newInit = `// --- Desktop Sidebar Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    // Default is false (hidden)
    const isSidebarActive = localStorage.getItem('sidebar_active') === 'true';
    
    if (isSidebarActive && window.innerWidth > 768) {
        if (sidebar) sidebar.classList.add('active');
        if (menuToggle) menuToggle.innerHTML = '&#10094;';
    } else {
        if (sidebar) sidebar.classList.remove('active');
        if (menuToggle) menuToggle.innerHTML = '&#10095;';
    }
});
`;
content = content.replace(initRegex, newInit);

fs.writeFileSync('app.js', content, 'utf8');
console.log('Patched app.js successfully.');
