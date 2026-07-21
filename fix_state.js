const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Change default to visible (active)
appJs = appJs.replace(/const isSidebarActive = localStorage\.getItem\('sidebar_active'\) === 'true';/, "const isSidebarActive = localStorage.getItem('sidebar_active') !== 'false';");
fs.writeFileSync('app.js', appJs, 'utf8');

let styleCss = fs.readFileSync('style.css', 'utf8');
// Sidebar should be visible by default, and hidden when collapsed
// Wait, currently .sidebar has transform: translateX(-100%) and .sidebar.active has translateX(0)
// If I just change the app.js default to true, it will add .active on load!
fs.writeFileSync('style.css', styleCss, 'utf8');
console.log('Fixed app.js default state');
