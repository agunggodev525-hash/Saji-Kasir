// Data Storage & Management Constants are now handled by js/storage.js

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update toggle button icon if it exists
    updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        // Icons are handled by CSS based on [data-theme] attribute
        btn.title = theme === 'dark' ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap';
    }
}

// Initialize theme on load (handled in HTML head for speed, but ensuring UI sync here)
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateThemeToggleIcon(savedTheme);
});

// ============================================
// APP BRANDING / WHITE LABEL
// ============================================

function applyAppBranding() {
    const settings = getStoreSettings();

    // 1. Update Page Title
    if (settings.name) {
        // Keep the specific page part (e.g. "Login - ") but replace the app name
        const originalTitle = document.title;
        if (originalTitle.includes(' - ')) {
            const pageName = originalTitle.split(' - ')[0];
            document.title = `${pageName} - ${settings.name}`;
        } else {
            document.title = settings.name;
        }
    }

    // 2. Update Logo Images
    if (settings.logo) {
        const logos = document.querySelectorAll('.logo, .login-logo img, #appLogo');
        logos.forEach(img => {
            if (img.tagName === 'IMG') {
                img.src = settings.logo;
            }
        });
    }

    // 3. Update Store Name Text (where applicable)
    // You can add elements with class "app-name" to have them auto-updated
    if (settings.name) {
        const nameElements = document.querySelectorAll('.app-name, .store-name');
        nameElements.forEach(el => {
            el.textContent = settings.name;
        });
    }
}

// ============================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================

// User database (simple, for demo purposes)
// User database (Dynamic from LocalStorage)
StorageKeys.USERS = 'kasir_users';

function getUsers() {
    const stored = localStorage.getItem(StorageKeys.USERS);
    if (!stored) {
        // Seed default users if empty
        const defaults = [
            {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrator'
            },
            {
                username: 'kasir',
                password: 'kasir123',
                role: 'kasir',
                name: 'Kasir User'
            }
        ];
        localStorage.setItem(StorageKeys.USERS, JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(stored);
}

function saveUsers(users) {
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
}

function updateUserCredentials(role, newUsername, newPassword) {
    const users = getUsers();
    const index = users.findIndex(u => u.role === role);

    if (index !== -1) {
        if (newUsername) users[index].username = newUsername;
        if (newPassword) users[index].password = newPassword;
        saveUsers(users);
        return true;
    }
    return false;
}

// Login function
function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const session = {
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(StorageKeys.SESSION, JSON.stringify(session));
        return { success: true, user: session };
    }

    return { success: false, message: 'Username atau password salah' };
}

// Logout function
function logout() {
    localStorage.removeItem(StorageKeys.SESSION);
    window.location.href = 'login.html';
}

// Get current logged-in user
function getCurrentUser() {
    const sessionData = localStorage.getItem(StorageKeys.SESSION);
    return sessionData ? JSON.parse(sessionData) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Check if user has specific role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Require authentication (redirect to login if not logged in)
function requireAuth() {
    if (!isLoggedIn()) {
        // Prevent infinite reload if already on login page
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
    return true;
}

// Require specific role (redirect if doesn't have role)
function requireRole(role) {
    if (!requireAuth()) return false;

    if (!hasRole(role)) {
        // Redirect to appropriate page based on actual role
        const user = getCurrentUser();
        // Prevent infinite reload if already on target page
        if (user.role === 'kasir') {
            if (!window.location.href.includes('kasir.html')) {
                window.location.href = 'kasir.html';
            }
        } else {
            // Assume admin or others go to index
            if (!window.location.href.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }
        return false;
    }

    return true;
}

// Require admin role
function requireAdmin() {
    return requireRole('admin');
}

// Update sidebar with user info
function updateSidebarUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Check if footer already exists
    let footer = sidebar.querySelector('.sidebar-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'sidebar-footer';
        sidebar.appendChild(footer);
    }

    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    footer.innerHTML = `
        <div class="user-info">
            <div class="user-avatar-circle">
                ${initial}
            </div>
            <div class="user-details">
                <div class="user-name" title="${user.name}">${user.name}</div>
                <div class="user-role">${user.role === 'admin' ? 'Administrator' : 'Kasir'}</div>
            </div>
            <button id="themeToggleBtn" class="theme-toggle-btn" onclick="toggleTheme()" title="Ganti Tema">
                <!-- Moon Icon (for Light Mode -> Dark Mode) -->
                <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                <!-- Sun Icon (for Dark Mode -> Light Mode) -->
                <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </button>
        </div>
        <button class="btn btn-secondary btn-logout" onclick="logout()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Keluar</span>
        </button>
    `;

    // Initialize icon state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeToggleIcon(currentTheme);
}

// Filter navigation menu based on role
function filterNavigation() {
    const user = getCurrentUser();
    if (!user) {
        console.log('Use not logged in, navigation filtering skipped');
        return;
    }
    console.log('Filtering navigation for role:', user.role);

    if (user.role === 'kasir') {
        // Hide admin-only menu items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            const page = link ? link.dataset.page : null;

            // Hide admin-only pages for kasir
            if (['dashboard', 'data-barang', 'riwayat', 'laporan', 'pengaturan'].includes(page)) {
                item.style.display = 'none';
            }
        });
    }
}

// Initialize sample data if empty
function initializeData() {
    const storedItems = localStorage.getItem(StorageKeys.ITEMS);
    let shouldSeed = false;

    if (!storedItems) {
        shouldSeed = true;
    } else {
        try {
            const items = JSON.parse(storedItems);
            // Verify it's actually an array
            if (!Array.isArray(items)) {
                shouldSeed = true;
            } else if (items.length === 0) {
                shouldSeed = true;
            }
        } catch (e) {
            console.error('Data corrupted, resetting...', e);
            shouldSeed = true;
        }
    }

    if (shouldSeed) {
        const sampleItems = [
            { id: 1, name: 'Indomie Goreng', price: 3500, buyPrice: 3000, stock: 100, category: 'Makanan', barcode: '8998866200578' },
            { id: 2, name: 'Aqua 600ml', price: 4000, buyPrice: 3000, stock: 80, category: 'Minuman', barcode: '8886008101053' },
            { id: 3, name: 'Pulpen Pilot', price: 5000, buyPrice: 3500, stock: 50, category: 'Alat Tulis', barcode: '4902505086057' },
            { id: 4, name: 'Kopi Kapal Api', price: 2000, buyPrice: 1500, stock: 120, category: 'Minuman', barcode: '8991002101150' },
            { id: 5, name: 'Roti Tawar', price: 15000, buyPrice: 12000, stock: 30, category: 'Makanan', barcode: '8992770041019' }
        ];
        localStorage.setItem(StorageKeys.ITEMS, JSON.stringify(sampleItems));
        console.log('Sample data seeded');
    }

    if (!localStorage.getItem(StorageKeys.TRANSACTIONS)) {
        localStorage.setItem(StorageKeys.TRANSACTIONS, JSON.stringify([]));
    }
}

// getData and saveData are now handled by js/storage.js

// Items Management
function getItems() {
    return getData(StorageKeys.ITEMS);
}

function getItemById(id) {
    const items = getItems();
    return items.find(item => item.id == id);
}

function addItem(item) {
    // Strict Validation
    if (!item || typeof item !== 'object') {
        console.error('Invalid item payload');
        return null;
    }
    
    if (!item.name || item.name.trim() === '') {
        alert('Nama barang tidak boleh kosong');
        return null;
    }

    const price = parseFloat(item.price);
    if (isNaN(price) || price < 0) {
        alert('Harga jual tidak valid');
        return null;
    }

    const stock = parseInt(item.stock);
    if (isNaN(stock) || stock < 0) {
        alert('Stok tidak valid');
        return null;
    }

    const items = getItems();
    // Ensure IDs are always numbers
    const newId = items.length > 0 ? Math.max(...items.map(i => parseInt(i.id) || 0)) + 1 : 1;
    const now = new Date().toISOString();
    
    const newItem = {
        id: newId,
        name: item.name.trim(),
        price: price,
        buyPrice: parseFloat(item.buyPrice) || 0,
        stock: stock,
        category: item.category || 'Lainnya',
        barcode: item.barcode || '',
        _meta: {
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            lastSyncAt: null,
            version: 1
        }
    };
    
    items.push(newItem);
    saveData(StorageKeys.ITEMS, items);

    // Add to sync queue
    if (window.syncService) {
        window.syncService.addToQueue({
            type: 'create',
            collection: 'items',
            data: newItem
        });
    }

    return newItem;
}

function updateItem(id, updates) {
    console.log(`[updateItem] ID: ${id}`, updates); // Debug log
    const items = getItems();
    const index = items.findIndex(item => item.id == id);
    if (index !== -1) {
        const now = new Date().toISOString();
        items[index] = {
            ...items[index],
            ...updates,
            _meta: {
                ...items[index]._meta,
                updatedAt: now,
                syncStatus: 'pending',
                version: (items[index]._meta?.version || 0) + 1
            }
        };
        console.log("[updateItem] New item state:", items[index]); // Debug log
        saveData(StorageKeys.ITEMS, items);

        // Add to sync queue
        if (window.syncService) {
            window.syncService.addToQueue({
                type: 'update',
                collection: 'items',
                data: items[index]
            });
        }

        return items[index];
    }
    return null;
}

function deleteItem(id) {
    const items = getItems();
    const itemToDelete = items.find(item => item.id == id);
    const filtered = items.filter(item => item.id != id);
    saveData(StorageKeys.ITEMS, filtered);

    // Add to sync queue
    if (window.syncService && itemToDelete) {
        window.syncService.addToQueue({
            type: 'delete',
            collection: 'items',
            data: itemToDelete
        });
    }
}

function searchItems(query) {
    const items = getItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        (item.barcode && item.barcode.includes(lowerQuery)) // Search by Barcode
    );
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

function getCustomers() {
    return getData(StorageKeys.CUSTOMERS) || [];
}

function getCustomerById(id) {
    const customers = getCustomers();
    return customers.find(c => c.id === parseInt(id));
}

function addCustomer(customer) {
    const customers = getCustomers();
    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newCustomer = {
        id: newId,
        name: customer.name,
        phone: customer.phone || '',
        type: customer.type || 'REGULAR',
        debt: parseFloat(customer.debt) || 0, // Add debt field
        createdAt: now
    };
    customers.push(newCustomer);
    saveData(StorageKeys.CUSTOMERS, customers);

    // Add to sync queue
    if (window.syncService) {
        window.syncService.addToQueue({
            type: 'create',
            collection: 'customers',
            data: newCustomer
        });
    }

    return newCustomer;
}

function updateCustomer(id, updates) {
    const customers = getCustomers();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
        customers[index] = { ...customers[index], ...updates };
        saveData(StorageKeys.CUSTOMERS, customers);

        // Add to sync queue
        if (window.syncService) {
            window.syncService.addToQueue({
                type: 'update',
                collection: 'customers',
                data: customers[index]
            });
        }

        return customers[index];
    }
    return null;
}

function deleteCustomer(id) {
    const customers = getCustomers();
    const customerToDelete = customers.find(c => c.id === parseInt(id));
    const filtered = customers.filter(c => c.id !== parseInt(id));
    saveData(StorageKeys.CUSTOMERS, filtered);

    // Add to sync queue
    if (window.syncService && customerToDelete) {
        window.syncService.addToQueue({
            type: 'delete',
            collection: 'customers',
            data: customerToDelete
        });
    }
}

function searchCustomers(query) {
    const customers = getCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.phone && c.phone.includes(lowerQuery))
    );
}

function getCustomerDiscount(customerId) {
    const customer = getCustomerById(customerId);
    if (customer && CustomerTypes[customer.type]) {
        return CustomerTypes[customer.type].discount;
    }
    if (customer && CustomerTypes[customer.type]) {
        return CustomerTypes[customer.type].discount;
    }
    return 0;
}

// Pay Debt Function
function payDebt(customerId, amount) {
    const customers = getCustomers();
    const index = customers.findIndex(c => c.id === parseInt(customerId));

    if (index !== -1 && amount > 0) {
        const customer = customers[index];
        const currentDebt = parseFloat(customer.debt) || 0;

        // Update customer debt
        const newDebt = Math.max(0, currentDebt - amount);
        customers[index] = { ...customer, debt: newDebt };
        saveData(StorageKeys.CUSTOMERS, customers);

        // Record Transaction
        const transaction = {
            items: [{
                name: 'Pembayaran Hutang',
                price: amount,
                quantity: 1,
                id: 'DEBT_PAY',
                category: 'Keuangan' // Add category
            }],
            total: amount,
            payment: amount,
            change: 0,
            customerId: customer.id,
            customerName: customer.name,
            transactionType: 'DEBT_PAYMENT', // Special marker
            note: `Pembayaran hutang sisa Rp ${formatCurrency(newDebt)}`
        };
        addTransaction(transaction);

        return true;
    }
    return false;
}

// Transactions Management
function getTransactions() {
    return getData(StorageKeys.TRANSACTIONS);
}

// Helper to generate transaction number (Daily Sequence per Terminal)
function generateTransactionNumber() {
    const transactions = getTransactions();
    const settings = getStoreSettings();
    const terminalId = settings.terminalId || '01';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateCode = `${year}${month}${day}`;
    // Format: TRX-YYYYMMDD-TID-XXX
    const prefix = `TRX-${dateCode}-${terminalId}-`;

    // Filter transactions for today and this terminal
    const todayTransactions = transactions.filter(t =>
        t.nomor_transaksi && t.nomor_transaksi.startsWith(prefix)
    );

    let nextSequence = 1;
    if (todayTransactions.length > 0) {
        // Extract sequences
        const sequences = todayTransactions.map(t => {
            const parts = t.nomor_transaksi.split('-');
            // TRX-YYYYMMDD-TID-XXX -> parts[3]
            return parseInt(parts[3]) || 0;
        });
        const maxSeq = Math.max(...sequences);
        nextSequence = maxSeq + 1;
    }

    return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

function addTransaction(transaction) {
    // Strict Validation
    if (!transaction || !transaction.items || !Array.isArray(transaction.items) || transaction.items.length === 0) {
        console.error('Transaksi tidak valid: Kosong atau format salah');
        return null;
    }

    if (isNaN(parseFloat(transaction.total)) || parseFloat(transaction.total) < 0) {
        console.error('Transaksi tidak valid: Total salah');
        return null;
    }

    const transactions = getTransactions();
    // Use Timestamp for internal ID to minimize collision risk across devices
    const newId = Date.now();
    const now = new Date().toISOString();

    // Generate unique transaction number
    const nomorTransaksi = generateTransactionNumber();

    const newTransaction = {
        id: newId,
        nomor_transaksi: nomorTransaksi, // Add new mandatory field
        items: transaction.items, // Ensure only necessary fields are mapped
        total: parseFloat(transaction.total) || 0,
        payment: parseFloat(transaction.payment) || 0,
        change: parseFloat(transaction.change) || 0,
        customerId: transaction.customerId || null,
        customerName: transaction.customerName || 'Umum',
        transactionType: transaction.transactionType || 'REGULAR',
        note: transaction.note || '',
        paymentMethod: transaction.paymentMethod || 'cash', // Ensure default
        date: now,
        _meta: {
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            lastSyncAt: null,
            version: 1
        }
    };
    transactions.push(newTransaction);
    saveData(StorageKeys.TRANSACTIONS, transactions);

    // Update stock
    transaction.items.forEach(item => {
        // Handle Debt Payment special item
        if (item.id === 'DEBT_PAY') return;
        
        const product = getItemById(item.id);
        if (product) {
            updateItem(item.id, { stock: Math.max(0, product.stock - item.quantity) });
        }
    });

    // Add to sync queue
    if (window.syncService) {
        window.syncService.addToQueue({
            type: 'create',
            collection: 'transactions',
            data: newTransaction
        });
    }

    return newTransaction;
}

function getTransactionById(id) {
    const transactions = getTransactions();
    return transactions.find(t => t.id === parseInt(id));
}

// Cart Management
function getCart() {
    return getData(StorageKeys.CART) || [];
}

function saveCart(cart) {
    saveData(StorageKeys.CART, cart);
}

function addToCart(item, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(i => i.id === item.id);

    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ ...item, quantity });
    }

    saveCart(cart);

    // Trigger animation via event (will be handled by UI script)
    document.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { itemId: item.id, action: 'add' }
    }));

    return cart;
}

function removeFromCart(itemId) {
    const cart = getCart();
    const filtered = cart.filter(item => item.id !== itemId);
    saveCart(filtered);

    document.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { itemId: itemId, action: 'remove' }
    }));

    return filtered;
}

function updateCartQuantity(itemId, quantity) {
    const cart = getCart();
    const index = cart.findIndex(item => item.id === itemId);

    if (index !== -1) {
        if (quantity <= 0) {
            return removeFromCart(itemId);
        }
        cart[index].quantity = quantity;
        saveCart(cart);

        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { itemId: itemId, action: 'update' }
        }));
    }

    return cart;
}

function clearCart() {
    saveCart([]);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Navigation
function setActivePage(pageName) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle') || document.querySelector('.karts-menu-btn');
    
    if (window.innerWidth > 768) {
        // Desktop Toggle
        sidebar.classList.toggle('active');
        const isActive = sidebar.classList.contains('active');
        
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
            });
        }

        if (isActive) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const kartsMenuToggle = document.querySelector('.karts-menu-btn');

    // Make sure we check both button types
    let isMenuToggleClick = false;
    if (menuToggle && menuToggle.contains(e.target)) isMenuToggleClick = true;
    if (kartsMenuToggle && kartsMenuToggle.contains(e.target)) isMenuToggleClick = true;

    if (sidebar && window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !isMenuToggleClick) {
            sidebar.classList.remove('active');
        }
    }
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '3000';
    notification.style.minWidth = '300px';
    notification.style.animation = 'slideInRight 0.3s ease-out';

    const icon = type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ';
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Alias for compatibility with older code that uses showToast
window.showToast = showNotification;

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Statistics Functions
function getTodayTransactions() {
    const transactions = getTransactions();
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.date).toDateString() === today);
}

function getTodayRevenue() {
    const todayTransactions = getTodayTransactions();
    return todayTransactions.reduce((sum, t) => sum + t.total, 0);
}

function getWeekRevenue() {
    const transactions = getTransactions();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return transactions
        .filter(t => new Date(t.date) >= weekAgo)
        .reduce((sum, t) => sum + t.total, 0);
}

function getMonthRevenue() {
    const transactions = getTransactions();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return transactions
        .filter(t => new Date(t.date) >= monthAgo)
        .reduce((sum, t) => sum + t.total, 0);
}

function getTopSellingItems(limit = 5) {
    const transactions = getTransactions();
    const itemCount = {};

    transactions.forEach(t => {
        t.items.forEach(item => {
            if (!itemCount[item.id]) {
                itemCount[item.id] = { ...item, totalSold: 0 };
            }
            itemCount[item.id].totalSold += item.quantity;
        });
    });

    return Object.values(itemCount)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);
}

function getLowStockItems(threshold = 20) {
    const items = getItems();
    return items.filter(item => item.stock <= threshold);
}

// Chart Data Helpers
function getDailySalesData(days = 7) {
    const transactions = getTransactions();
    const labels = [];
    const data = [];

    // Generate last n days
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);

        labels.push(dayName);

        // Sum revenue for this day
        const dayRevenue = transactions
            .filter(t => new Date(t.date).toDateString() === dateStr)
            .reduce((sum, t) => sum + t.total, 0);

        data.push(dayRevenue);
    }

    return { labels, data };
}

function getMonthlySalesData(months = 12) {
    const transactions = getTransactions();
    const labels = [];
    const data = [];

    // Generate last n months
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        // First day of month to ensure consistent month formatting
        d.setDate(1);

        const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
        const monthKey = `${d.getMonth()}-${d.getFullYear()}`;

        labels.push(monthYear);

        // Sum revenue for this month
        const monthRevenue = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return `${tDate.getMonth()}-${tDate.getFullYear()}` === monthKey;
            })
            .reduce((sum, t) => sum + t.total, 0);

        data.push(monthRevenue);
    }

    return { labels, data };
}

// Store Settings Management
function getStoreSettings() {
    const defaultSettings = {
        name: 'Saji Kasir',
        address: 'Jl Lintas Sumatra Km 75 Depan Masjid Umar Bin Khattab, Terbanggi Besar, Lampung Tengah',
        phone: '',
        footerMessage: 'Terima kasih atas kunjungan Anda!',
        logo: null,
        paperSize: '58mm',
        terminalId: '01' // Default Terminal ID
    };

    const saved = getData(StorageKeys.SETTINGS);

    // Handle if saved is array (old getData behavior for empty) or object
    if (!saved || (Array.isArray(saved) && saved.length === 0)) {
        return defaultSettings;
    }

    // Protection against corrupted settings that might be "true" or non-object
    if (typeof saved !== 'object') {
        return defaultSettings;
    }

    return { ...defaultSettings, ...saved };
}

function saveStoreSettings(settings) {
    // Only save what's necessary, preserve existing if partial update
    const current = getStoreSettings();
    const updated = { ...current, ...settings };
    saveData(StorageKeys.SETTINGS, updated);
    return updated;
}

// ============================================
// SCANNER INTEGRATION (USB & CAMERA)
// ============================================

let html5QrCode = null;
let scannerType = 'camera'; // 'camera' or 'usb'

// USB Scanner Variables
let scanBuffer = '';
let scanBufferTimer;
const SCAN_TIMEOUT = 50; // ms between keystrokes for scanner detection

// Initialize Global Scanner Listener
document.addEventListener('keydown', (e) => {
    // Ignore input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Typical scanner ends with 'Enter'
    if (e.key === 'Enter') {
        if (scanBuffer.length > 2) {
            handleScannedCode(scanBuffer);
        }
        scanBuffer = '';
        return;
    }

    // Filter potential scanner characters (alphanumeric)
    if (e.key.length === 1) {
        scanBuffer += e.key;

        // Reset buffer if typing too slow (human input)
        clearTimeout(scanBufferTimer);
        scanBufferTimer = setTimeout(() => {
            scanBuffer = '';
        }, SCAN_TIMEOUT);
    }
});

// Start Camera Scanner
function startScanner() {
    openModal('scannerModal');

    // Slight delay to allow modal to render
    setTimeout(() => {
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(err => {
                console.error("Error starting scanner", err);
                showNotification('Gagal mengakses kamera.', 'danger');
                closeModal('scannerModal');
            });
    }, 300);
}

// Stop Camera Scanner
function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            closeModal('scannerModal');
        }).catch(err => {
            console.error("Failed to stop scanner", err);
            closeModal('scannerModal');
        });
    } else {
        closeModal('scannerModal');
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Handle the scanned code
    handleScannedCode(decodedText);

    // Optional: Stop scanning after success or keep open?
    // Let's stop for now.
    stopScanner();
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
}

// Central Handler for Scanned Codes
function handleScannedCode(code) {
    console.log("Scanned:", code);

    // 1. Determine Context (Cashier or Data Barang)
    const currentPage = document.querySelector('.nav-link.active')?.dataset.page;

    if (currentPage === 'kasir') {
        handleCashierScan(code);
    } else if (currentPage === 'data-barang') {
        // Auto-fill search or open add modal
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = code;
            filterItems(); // Trigger search
            showNotification(`Barcode scanned: ${code}`, 'info');
        }

        // If "Add Item" modal is open, fill barcode field
        if (document.getElementById('addItemModal') && document.getElementById('addItemModal').classList.contains('active')) {
            document.getElementById('addItemBarcode').value = code;
            showNotification('Barcode terisi!', 'success');
        }
        else if (document.getElementById('editItemModal') && document.getElementById('editItemModal').classList.contains('active')) {
            document.getElementById('editItemBarcode').value = code;
            showNotification('Barcode terisi!', 'success');
        }
    } else {
        showNotification(`Scanned: ${code}`, 'info');
    }
}

// Cashier Specific Logic
function handleCashierScan(code) {
    const items = getItems();
    // Search by exact barcode match or Name match (if QR contains name?) - stick to barcode/ID
    // Assuming 'barcode' field exists in item items (we added it in data-barang.html, need to ensure data schema supports it)

    const item = items.find(i => i.barcode === code || i.id.toString() === code);

    if (item) {
        if (item.stock > 0) {
            addToCart(item, 1);
            showNotification(`${item.name} ditambahkan`, 'success');

            // Audio Feedback
            playBeep();
        } else {
            showNotification(`Stok ${item.name} habis!`, 'error');
            playErrorSound();
        }
    } else {
        // Product Not Found logic
        if (confirm(`Produk dengan barcode "${code}" tidak ditemukan. Tambahkan produk baru?`)) {
            // Redirect to Data Barang or Open Add Modal (if we implement quick add in cashier later)
            // For now, let's just notify. Or redirect.
            // window.location.href = `data-barang.html?newBarcode=${code}`; // Advanced flow
            showNotification('Produk tidak ditemukan', 'warning');
            playErrorSound();
        }
    }
}

// Audio Feedback
function playBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = 1500;
    gain.gain.value = 0.1;

    osc.start();
    setTimeout(() => {
        osc.stop();
    }, 100);
}

function playErrorSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.value = 200;
    gain.gain.value = 0.1;

    osc.start();
    setTimeout(() => {
        osc.stop();
    }, 200);
}


// Initialize app
initializeData();
applyAppBranding();

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getItems,
        getItemById,
        addItem,
        updateItem,
        deleteItem,
        searchItems,
        getTransactions,
        addTransaction,
        getTransactionById,
        getCart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        formatCurrency,
        formatDate,
        formatDateShort,
        setActivePage,
        toggleSidebar,
        openModal,
        closeModal,
        showNotification,
        getTodayTransactions,
        getTodayRevenue,
        getWeekRevenue,
        getMonthRevenue,
        getTopSellingItems,
        getLowStockItems,
        getDailySalesData,
        getMonthlySalesData,
        applyAppBranding,
        resizeImage
    };
}

// ============================================
// IMAGE HANDLING UTILITIES
// ============================================
// ============================================
// IMAGE HANDLING UTILITIES
// ============================================
function resizeImage(file, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve, reject) => {
        // Timeout 5 seconds
        const timer = setTimeout(() => {
            reject(new Error("Timeout: Gagal memproses gambar dalam 5 detik."));
        }, 5000);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                clearTimeout(timer); // Success
                // Compress to JPEG with 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => {
                clearTimeout(timer);
                reject(err);
            };
        };
        reader.onerror = (err) => {
            clearTimeout(timer);
            reject(err);
        };
    });
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Global Error Caught:', msg, url, lineNo, error);

    // Ignore harmless resize observer loop errors
    if (msg.includes('ResizeObserver loop')) return false;

    // Show user-friendly notification with error details
    if (typeof showNotification === 'function') {
        const errorMsg = error && error.message ? error.message : msg;
        showNotification(`System Error: ${errorMsg}`, 'danger');
    }

    return false;
};

// --- Desktop Sidebar Initialization ---
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

// --- Lucide Icons Injection for Sidebar ---
document.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = () => {
        const iconMap = {
            '📊': 'layout-dashboard',
            '🛒': 'shopping-cart',
            '📦': 'package',
            '👥': 'users',
            '📜': 'scroll-text',
            '📈': 'bar-chart-2',
            '⚙️': 'settings'
        };

        document.querySelectorAll('.nav-icon').forEach(iconEl => {
            const emoji = iconEl.textContent.trim();
            if (iconMap[emoji]) {
                iconEl.innerHTML = '<i data-lucide="' + iconMap[emoji] + '"></i>';
            }
        });
        
        // Render lucide icons
        lucide.createIcons();
    };
    document.head.appendChild(script);
});
