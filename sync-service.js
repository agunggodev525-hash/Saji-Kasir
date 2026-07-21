// ============================================
// SYNC SERVICE - Supabase Edition
// ============================================
// Sinkronisasi real-time menggunakan Supabase
// - Realtime subscription untuk downstream (data masuk)
// - Direct upsert/delete untuk upstream (data keluar)
// - Queue offline untuk data yang belum tersinkronisasi

class SyncService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = this.loadSyncQueue();
        this.syncInProgress = false;
        this.lastSyncTime = localStorage.getItem('last_sync_time');
        this.realtimeChannels = [];
        this.sb = null; // Supabase client

        // Storage Keys
        this.KEYS = {
            ITEMS: 'kasir_items',
            TRANSACTIONS: 'kasir_transactions',
            CUSTOMERS: 'kasir_customers'
        };

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Init Supabase setelah DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // ============================================
    // INISIALISASI
    // ============================================

    async init() {
        // Tunggu sampai Supabase library tersedia
        await this.waitForSupabase();

        this.sb = window.getSupabase ? window.getSupabase() : null;

        if (!this.sb) {
            console.warn('⚠️ Supabase tidak tersedia, mode lokal saja.');
            this.emitStatusChange();
            return;
        }

        console.log('🚀 SyncService (Supabase) initialized');

        this.emitStatusChange();

        if (this.isOnline) {
            await this.pullAllFromSupabase();
            this.processSyncQueue();
        }

        // Mulai realtime subscription
        this.startRealtimeSubscriptions();
    }

    waitForSupabase(timeout = 5000) {
        return new Promise((resolve) => {
            if (typeof window.supabase !== 'undefined') {
                resolve();
                return;
            }
            const start = Date.now();
            const check = setInterval(() => {
                if (typeof window.supabase !== 'undefined' || Date.now() - start > timeout) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    // ============================================
    // ONLINE/OFFLINE DETECTION
    // ============================================

    handleOnline() {
        console.log('📡 Koneksi internet kembali');
        this.isOnline = true;
        this.emitStatusChange();
        this.showNotification('Koneksi internet tersambung', 'success');
        this.pullAllFromSupabase();
        this.processSyncQueue();
    }

    handleOffline() {
        console.log('📡 Koneksi internet terputus');
        this.isOnline = false;
        this.emitStatusChange();
        this.showNotification('Mode offline - data akan disinkronkan nanti', 'warning');
    }

    getStatus() {
        return {
            isOnline: this.isOnline,
            queueSize: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            supabaseConnected: !!this.sb
        };
    }

    emitStatusChange() {
        const event = new CustomEvent('syncStatusChange', {
            detail: this.getStatus()
        });
        window.dispatchEvent(event);
    }

    // ============================================
    // SYNC QUEUE MANAGEMENT (Offline Support)
    // ============================================

    loadSyncQueue() {
        const queue = localStorage.getItem('sync_queue');
        return queue ? JSON.parse(queue) : [];
    }

    saveSyncQueue() {
        localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    }

    addToQueue(operation) {
        const queueItem = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            operation: operation.type,   // 'create', 'update', 'delete'
            collection: operation.collection, // 'items', 'transactions', 'customers'
            data: operation.data,
            retryCount: 0,
            status: 'pending'
        };

        this.syncQueue.push(queueItem);
        this.saveSyncQueue();
        this.emitStatusChange();

        console.log('➕ Ditambahkan ke antrian:', queueItem.operation, queueItem.collection);

        // Langsung sync jika online
        if (this.isOnline && this.sb && !this.syncInProgress) {
            this.processSyncQueue();
        }

        return queueItem;
    }

    async processSyncQueue() {
        if (!this.isOnline || !this.sb || this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        this.emitStatusChange();

        console.log(`🔄 Memproses antrian sync: ${this.syncQueue.length} item`);

        const itemsToSync = [...this.syncQueue];
        const successfulIds = [];

        for (const item of itemsToSync) {
            try {
                const success = await this.syncItemToSupabase(item);
                if (success) {
                    successfulIds.push(item.id);
                } else {
                    item.retryCount++;
                    if (item.retryCount >= 5) {
                        item.status = 'failed';
                    }
                }
            } catch (error) {
                console.error('❌ Error sync item:', error);
                item.retryCount++;
            }
        }

        // Hapus item yang berhasil
        if (successfulIds.length > 0) {
            this.syncQueue = this.syncQueue.filter(i => !successfulIds.includes(i.id));
            this.saveSyncQueue();
            this.showNotification(`✅ Tersinkronisasi ${successfulIds.length} data ke cloud`, 'success');
        }

        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('last_sync_time', this.lastSyncTime);

        this.syncInProgress = false;
        this.emitStatusChange();

        console.log(`✅ Sync selesai: ${successfulIds.length} berhasil`);
    }

    async syncItemToSupabase(item) {
        const table = item.collection; // 'items', 'transactions', 'customers'

        try {
            if (item.operation === 'delete') {
                const { error } = await this.sb
                    .from(table)
                    .delete()
                    .eq('id', item.data.id);

                if (error) throw error;
                return true;

            } else {
                // 'create' atau 'update' - gunakan upsert
                const payload = this.preparePayload(item.data);
                const { error } = await this.sb
                    .from(table)
                    .upsert(payload, { onConflict: 'id' });

                if (error) throw error;
                this.updateSyncMetadata(item.collection, item.data.id);
                return true;
            }
        } catch (error) {
            console.error(`❌ Gagal sync ${item.operation} ke tabel ${table}:`, error.message);
            return false;
        }
    }

    // Bersihkan field internal sebelum dikirim ke Supabase
    preparePayload(data) {
        const payload = { ...data };
        // Hapus field internal yang tidak ada di skema Supabase
        delete payload._meta;
        return payload;
    }

    // ============================================
    // PULL DATA DARI SUPABASE
    // ============================================

    async pullAllFromSupabase() {
        if (!this.isOnline || !this.sb) return;

        console.log('📥 Menarik data dari Supabase...');

        try {
            const [itemsRes, transRes, custRes] = await Promise.all([
                this.sb.from('items').select('*'),
                this.sb.from('transactions').select('*'),
                this.sb.from('customers').select('*')
            ]);

            let changed = false;

            if (itemsRes.data && !itemsRes.error) {
                changed = this.mergeCollection(this.KEYS.ITEMS, itemsRes.data) || changed;
            }
            if (transRes.data && !transRes.error) {
                changed = this.mergeCollection(this.KEYS.TRANSACTIONS, transRes.data) || changed;
            }
            if (custRes.data && !custRes.error) {
                changed = this.mergeCollection(this.KEYS.CUSTOMERS, custRes.data) || changed;
            }

            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            this.emitStatusChange();

            if (changed) {
                console.log('📥 Data lokal diperbarui dari Supabase');
                window.dispatchEvent(new CustomEvent('dataRefreshedFromServer'));
            } else {
                console.log('📥 Data sudah sinkron, tidak ada perubahan');
            }

        } catch (error) {
            console.error('❌ Gagal menarik data dari Supabase:', error);
        }
    }

    mergeCollection(storageKey, serverItems) {
        if (!serverItems || serverItems.length === 0) return false;

        const localJson = localStorage.getItem(storageKey);
        const localItems = localJson ? JSON.parse(localJson) : [];
        const pendingIds = this.syncQueue
            .map(q => q.data ? q.data.id : null)
            .filter(id => id);

        let changed = false;

        serverItems.forEach(serverItem => {
            // Skip jika item ini sedang di antrian (perubahan lokal lebih prioritas)
            if (pendingIds.includes(serverItem.id)) return;

            const localIndex = localItems.findIndex(l => l.id === serverItem.id);

            if (localIndex === -1) {
                localItems.push(serverItem);
                changed = true;
            } else {
                const localStr = JSON.stringify(localItems[localIndex]);
                const serverStr = JSON.stringify(serverItem);
                if (localStr !== serverStr) {
                    localItems[localIndex] = serverItem;
                    changed = true;
                }
            }
        });

        if (changed) {
            localStorage.setItem(storageKey, JSON.stringify(localItems));
        }

        return changed;
    }

    // ============================================
    // REALTIME SUBSCRIPTION
    // ============================================

    startRealtimeSubscriptions() {
        if (!this.sb) return;

        const tables = ['items', 'transactions', 'customers'];

        tables.forEach(table => {
            const channel = this.sb
                .channel(`realtime-${table}`)
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    (payload) => this.handleRealtimeChange(table, payload)
                )
                .subscribe((status) => {
                    if (status === 'CHANNEL_ERROR') {
                        // This usually happens when RLS prevents anonymous subscriptions,
                        // which is normal for this demo app. We suppress this error so it doesn't alarm users.
                        console.debug(`📡 Realtime [${table}]: Channel not available (RLS restricted or offline).`);
                    } else {
                        console.log(`📡 Realtime [${table}]: ${status}`);
                    }
                });

            this.realtimeChannels.push(channel);
        });
    }

    handleRealtimeChange(table, payload) {
        const storageKeyMap = {
            'items': this.KEYS.ITEMS,
            'transactions': this.KEYS.TRANSACTIONS,
            'customers': this.KEYS.CUSTOMERS
        };
        const storageKey = storageKeyMap[table];
        if (!storageKey) return;

        // Jangan proses perubahan dari antrian sendiri
        const pendingIds = this.syncQueue
            .map(q => q.data ? q.data.id : null)
            .filter(id => id);

        const changeId = payload.new?.id || payload.old?.id;
        if (pendingIds.includes(changeId)) return;

        const localJson = localStorage.getItem(storageKey);
        const localItems = localJson ? JSON.parse(localJson) : [];

        let changed = false;

        if (payload.eventType === 'INSERT') {
            if (!localItems.find(i => i.id === payload.new.id)) {
                localItems.push(payload.new);
                changed = true;
            }
        } else if (payload.eventType === 'UPDATE') {
            const idx = localItems.findIndex(i => i.id === payload.new.id);
            if (idx !== -1) {
                localItems[idx] = payload.new;
                changed = true;
            }
        } else if (payload.eventType === 'DELETE') {
            const filtered = localItems.filter(i => i.id !== payload.old.id);
            if (filtered.length !== localItems.length) {
                localItems.length = 0;
                localItems.push(...filtered);
                changed = true;
            }
        }

        if (changed) {
            localStorage.setItem(storageKey, JSON.stringify(localItems));
            console.log(`🔄 Realtime update [${table}]:`, payload.eventType);
            window.dispatchEvent(new CustomEvent('dataRefreshedFromServer'));
        }
    }

    // ============================================
    // MANUAL SYNC
    // ============================================

    async manualSync() {
        if (!this.isOnline) {
            this.showNotification('Tidak ada koneksi internet', 'warning');
            return false;
        }
        if (!this.sb) {
            this.showNotification('Supabase belum terhubung', 'warning');
            return false;
        }
        if (this.syncInProgress) {
            this.showNotification('Sync sedang berlangsung...', 'info');
            return false;
        }

        this.showNotification('Memulai sinkronisasi cloud...', 'info');

        await this.pullAllFromSupabase();
        await this.processSyncQueue();

        return true;
    }

    // Push semua data lokal ke Supabase (untuk migrasi awal)
    async pushAllLocalToSupabase() {
        if (!this.isOnline || !this.sb) {
            this.showNotification('Tidak dapat terhubung ke Supabase', 'warning');
            return;
        }

        console.log('⬆️ Mendorong semua data lokal ke Supabase...');

        const collectionsMap = [
            { key: this.KEYS.ITEMS, table: 'items' },
            { key: this.KEYS.TRANSACTIONS, table: 'transactions' },
            { key: this.KEYS.CUSTOMERS, table: 'customers' }
        ];

        let totalPushed = 0;

        for (const { key, table } of collectionsMap) {
            const localJson = localStorage.getItem(key);
            const items = localJson ? JSON.parse(localJson) : [];

            if (items.length === 0) continue;

            const payloads = items.map(item => this.preparePayload(item));

            try {
                const { error } = await this.sb
                    .from(table)
                    .upsert(payloads, { onConflict: 'id' });

                if (error) {
                    console.error(`❌ Gagal push ${table}:`, error.message);
                } else {
                    totalPushed += payloads.length;
                    console.log(`✅ Push ${table}: ${payloads.length} item`);
                }
            } catch (err) {
                console.error(`❌ Error push ${table}:`, err);
            }
        }

        this.showNotification(`✅ Berhasil upload ${totalPushed} data ke Supabase`, 'success');
        return totalPushed;
    }

    // ============================================
    // UTILITIES
    // ============================================

    updateSyncMetadata(collection, itemId) {
        let key;
        if (collection === 'items') key = this.KEYS.ITEMS;
        else if (collection === 'transactions') key = this.KEYS.TRANSACTIONS;
        else if (collection === 'customers') key = this.KEYS.CUSTOMERS;

        if (!key) return;

        const dataStr = localStorage.getItem(key);
        if (!dataStr) return;

        const data = JSON.parse(dataStr);
        const item = data.find(d => d.id === itemId);
        if (item) {
            if (!item._meta) item._meta = {};
            item._meta.syncStatus = 'synced';
            item._meta.lastSyncAt = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type?.toUpperCase()}] ${message}`);
        }
    }

    clearQueue() {
        this.syncQueue = [];
        this.saveSyncQueue();
        this.emitStatusChange();
        console.log('🗑️ Antrian sync dikosongkan');
    }

    getQueueStats() {
        return {
            total: this.syncQueue.length,
            pending: this.syncQueue.filter(i => i.status === 'pending').length,
            failed: this.syncQueue.filter(i => i.status === 'failed').length,
            lastSync: this.lastSyncTime
        };
    }

    disconnectRealtime() {
        this.realtimeChannels.forEach(ch => {
            if (this.sb) this.sb.removeChannel(ch);
        });
        this.realtimeChannels = [];
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

const syncService = new SyncService();

if (typeof window !== 'undefined') {
    window.syncService = syncService;
}
