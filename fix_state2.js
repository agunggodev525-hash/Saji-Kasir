const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Change default to hidden
appJs = appJs.replace(/const isSidebarActive = localStorage\.getItem\('sidebar_active'\) !== 'false';/, "const isSidebarActive = localStorage.getItem('sidebar_active') === 'true';");
fs.writeFileSync('app.js', appJs, 'utf8');

// Also update CSS to make sure main-content has padding for the button
let styleCss = fs.readFileSync('style.css', 'utf8');
styleCss = styleCss.replace(/\.main-content\s*\{\s*flex: 1;\s*margin-left: 0;\s*transition: margin-left 0\.3s ease;\s*padding: var\(--spacing-2xl\);/, 
`.main-content {
    flex: 1;
    margin-left: 0;
    transition: margin-left 0.3s ease;
    padding: var(--spacing-2xl);
    padding-left: 80px; /* Space for the floating button when full width */`);

// BUT when sidebar is active, we don't need padding-left: 80px
const desktopActiveCss = `
@media (min-width: 769px) {
    .sidebar.active ~ .main-content {
        margin-left: 280px;
        padding-left: var(--spacing-2xl); /* Reset padding since sidebar is open */
    }
    
    .menu-toggle {
        display: flex !important;
    }
}
`;
styleCss = styleCss.replace(/@media \(min-width: 769px\) \{[\s\S]*?display: flex !important;\n    \}\n\}/, desktopActiveCss);
fs.writeFileSync('style.css', styleCss, 'utf8');
console.log('Fixed app.js default state back to hidden');
