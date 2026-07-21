const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const replacement = `const iconMap = {
            '\\uD83D\\uDCCA': 'layout-dashboard', // 📊
            '\\uD83D\\uDED2': 'shopping-cart',    // 🛒
            '\\uD83D\\uDCE6': 'package',          // 📦
            '\\uD83D\\uDC65': 'users',            // 👥
            '\\uD83D\\uDCDC': 'scroll-text',      // 📜
            '\\uD83D\\uDCC8': 'bar-chart-2',      // 📈
            '\\u2699\\uFE0F': 'settings'          // ⚙️
        };`;

content = content.replace(/const iconMap = \{[\s\S]*?'\?\?': 'settings'\s*\};\r?\n?/, replacement + '\n');
fs.writeFileSync('app.js', content, 'utf8');
console.log('Fixed app.js emojis using unicode escapes.');
