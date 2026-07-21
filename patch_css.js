const fs = require('fs');
let content = fs.readFileSync('style.css', 'utf8');

// Replace .sidebar
const sidebarRegex = /\.sidebar\s*\{[\s\S]*?box-shadow: 4px 0 24px rgba\(15, 23, 42, 0\.03\);\n\}/;
const newSidebar = `.sidebar {
    width: 280px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-right: 1px solid rgba(255, 255, 255, 0.5);
    padding: var(--spacing-xl);
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    transition: transform 0.3s ease, background 0.3s ease;
    z-index: 1000;
    box-shadow: 4px 0 24px rgba(15, 23, 42, 0.03);
    transform: translateX(-100%); /* HIDDEN BY DEFAULT */
}

/* Make it show when active */
.sidebar.active {
    transform: translateX(0) !important;
}`;
content = content.replace(sidebarRegex, newSidebar);

// Replace .main-content (Desktop)
const mainContentRegex = /\.main-content\s*\{\s*flex: 1;\s*margin-left: 280px;/;
const newMainContent = `.main-content {
    flex: 1;
    margin-left: 0;
    transition: margin-left 0.3s ease;`;
content = content.replace(mainContentRegex, newMainContent);

// Add Desktop CSS for sidebar active margin push
// We will just append this to the end of the file
const desktopActiveCss = `
@media (min-width: 769px) {
    .sidebar.active ~ .main-content {
        margin-left: 280px;
    }
    
    .menu-toggle {
        display: flex !important;
    }
}
`;
content += desktopActiveCss;

fs.writeFileSync('style.css', content, 'utf8');
console.log('Patched style.css successfully.');
