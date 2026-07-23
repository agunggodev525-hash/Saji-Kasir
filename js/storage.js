// Data Storage & Management Constants
const StorageKeys = {
    ITEMS: 'kasir_items',
    TRANSACTIONS: 'kasir_transactions',
    CART: 'kasir_cart',
    ITEM_CATEGORIES: 'kasir_categories',
    SETTINGS: 'kasir_settings',
    CUSTOMERS: 'kasir_customers',
    USERS: 'kasir_users',
    SESSION: 'kasir_session' // Using same format for consistency
};

// Customer Types with Auto-Discount
const CustomerTypes = {
    REGULAR: { name: 'Regular', discount: 0 },
    MEMBER: { name: 'Member', discount: 5 },
    VIP: { name: 'VIP', discount: 10 }
};

// Core Data Retrieval
function getData(key) {
    const data = localStorage.getItem(key);
    if (!data) return [];

    try {
        const parsed = JSON.parse(data);
        // Ensure it always returns an array for collections
        if (!Array.isArray(parsed) && key !== StorageKeys.SETTINGS && key !== StorageKeys.SESSION) {
            console.warn(`Data for ${key} is not an array. Resetting...`);
            localStorage.setItem(`${key}_backup_${Date.now()}`, data);
            return [];
        }
        return parsed;
    } catch (e) {
        console.error(`Error parsing data for ${key}:`, e);
        // Backup corrupt data just in case
        localStorage.setItem(`${key}_corrupt_${Date.now()}`, data);
        // Reset to empty array if it's a collection
        if (key !== StorageKeys.SETTINGS && key !== StorageKeys.SESSION) {
            return [];
        }
        return null;
    }
}

// Core Data Saving
function saveData(key, data) {
    try {
        // Validate before saving to prevent writing corrupted objects
        if (data === undefined || typeof data === 'function') {
            throw new Error('Invalid data type provided for saving');
        }
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Penyimpanan penuh! Harap hapus riwayat transaksi lama atau bersihkan cache browser.');
        }
    }
}

// ID Generator Helper
function generateUniqueId() {
    return Date.now();
}

// Ensure modules are accessible globally if using modules, but since it's a standard script, they are already global.
