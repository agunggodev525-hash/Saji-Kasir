// ============================================
// SYNC UI COMPONENTS
// ============================================
// UI components for displaying sync status and controls

function createSyncIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'syncIndicator';
    indicator.className = 'sync-indicator';
    indicator.innerHTML = `
        <div class="sync-status">
            <span class="sync-icon" id="syncIcon">●</span>
            <span class="sync-text" id="syncText">Checking...</span>
        </div>
        <div class="sync-details" id="syncDetails"></div>
    `;
    return indicator;
}

function updateSyncIndicator(status) {
    const icon = document.getElementById('syncIcon');
    const text = document.getElementById('syncText');
    const details = document.getElementById('syncDetails');
    const indicator = document.getElementById('syncIndicator');

    if (!icon || !text || !indicator) return;

    // Remove all status classes
    indicator.classList.remove('online', 'offline', 'syncing');

    if (status.syncInProgress) {
        indicator.classList.add('syncing');
        icon.textContent = '⟳';
        text.textContent = 'Syncing...';
    } else if (status.isOnline) {
        indicator.classList.add('online');
        icon.textContent = '●';
        if (status.queueSize > 0) {
            text.textContent = `Online (${status.queueSize} pending)`;
        } else {
            text.textContent = 'Online';
        }
    } else {
        indicator.classList.add('offline');
        icon.textContent = '●';
        text.textContent = 'Offline';
    }

    // Update details
    if (status.lastSyncTime) {
        const lastSync = new Date(status.lastSyncTime);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSync) / 60000);

        if (diffMinutes < 1) {
            details.textContent = 'Synced just now';
        } else if (diffMinutes < 60) {
            details.textContent = `Synced ${diffMinutes}m ago`;
        } else {
            details.textContent = `Synced ${Math.floor(diffMinutes / 60)}h ago`;
        }
    } else {
        details.textContent = 'Not synced yet';
    }
}

function createManualSyncButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary btn-sync-manual';
    button.innerHTML = '<span>🔄</span><span>Sync Now</span>';
    button.onclick = async () => {
        button.disabled = true;
        button.innerHTML = '<span>⟳</span><span>Syncing...</span>';

        if (window.syncService) {
            await window.syncService.manualSync();
        }

        button.disabled = false;
        button.innerHTML = '<span>🔄</span><span>Sync Now</span>';
    };
    return button;
}

function initSyncUI() {
    // Add sync indicator to header
    const header = document.querySelector('.content-header');
    if (header && !document.getElementById('syncIndicator')) {
        const indicator = createSyncIndicator();
        header.appendChild(indicator);
    }

    // Add manual sync button to sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter && !document.querySelector('.btn-sync-manual')) {
        const syncButton = createManualSyncButton();
        sidebarFooter.appendChild(syncButton);
    }

    // Listen for sync status changes
    window.addEventListener('syncStatusChange', (event) => {
        updateSyncIndicator(event.detail);
    });

    // Initial status update
    if (window.syncService) {
        updateSyncIndicator(window.syncService.getStatus());
    }
}

// Initialize sync UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSyncUI);
} else {
    initSyncUI();
}
