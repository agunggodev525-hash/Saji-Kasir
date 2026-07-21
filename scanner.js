/**
 * scanner.js
 * Handles USB Barcode Scanner (Keyboard Mode) and Camera Scanner (HTML5-QRCode)
 */

var barcodeBuffer = '';
var barcodeLastKeyTime = 0;
const BARCODE_DELAY = 50; // Max ms between keystrokes to be considered part of a barcode
var html5QrcodeScanner = null;
var isScanning = false;

// ============================================
// USB SCANNER (Keyboard Listener)
// ============================================

document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input field (except body/document)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    const currentTime = Date.now();

    if (currentTime - barcodeLastKeyTime > BARCODE_DELAY) {
        barcodeBuffer = ''; // Reset buffer if too slow (likely manual typing)
    }

    if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) { // Minimum length to avoid accidental single key enters
            handleBarcode(barcodeBuffer);
            barcodeBuffer = '';
        }
    } else if (e.key.length === 1) { // Only printable characters
        barcodeBuffer += e.key;
    }

    barcodeLastKeyTime = currentTime;
});

// ============================================
// LOGIC HANDLER
// ============================================

function handleBarcode(code) {
    console.log("Scanned Barcode:", code);

    // 1. Search for product using existing default search
    // We assume getItems() is available globally from app.js
    const items = getItems();

    // Exact match preference
    let item = items.find(i => i.barcode === code || i.id.toString() === code);

    // Fallback: Try name match or contains if no exact match (optional, maybe stick to exact for scanner)
    if (!item) {
        // Try searching by name if the code looks like text? No, scanner usually gives numbers.
    }

    if (item) {
        // PRODUCT FOUND
        addProductToCart(item.id);
        playSuccessBeep();

        // Visual Feedback
        showScannerFeedback('success', `Found: ${item.name}`);
    } else {
        // PRODUCT NOT FOUND
        playErrorBeep();
        showScannerFeedback('error', 'Produk tidak ditemukan');

        // Open Quick Add Modal
        openQuickAddModal(code);
    }
}

function showScannerFeedback(type, message) {
    // Flash background
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0.3';
    overlay.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';

    document.body.appendChild(overlay);

    showNotification(message, type === 'success' ? 'success' : 'danger');

    setTimeout(() => {
        overlay.remove();
    }, 300);
}

function playSuccessBeep() {
    // Re-use logic from app.js if possible, or simple beep
    if (typeof playBeep === 'function') {
        playBeep();
    }
}

function playErrorBeep() {
    // Low pitch long beep
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

// ============================================
// CAMERA SCANNER (HTML5-QRCode)
// ============================================

function startScanner() {
    openModal('scannerModal');

    // Reset reader div
    document.getElementById('reader').innerHTML = '';

    html5QrcodeScanner = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
            // Success callback
            if (!isScanning) { // Debounce
                isScanning = true;
                stopScanner(); // Close modal immediately on scan
                handleBarcode(decodedText);

                // Reset debounce after delay
                setTimeout(() => { isScanning = false; }, 1000);
            }
        },
        (errorMessage) => {
            // Error callback (ignore frequent errors during scanning)
        }
    ).catch(err => {
        console.error("Error starting scanner", err);
        document.getElementById('reader').innerHTML = `
            <div class="text-danger text-center p-4">
                Gagal membuka kamera.<br>Pastikan izin kamera diberikan.
            </div>
        `;
    });
}

function stopScanner() {
    closeModal('scannerModal');
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
        }).catch(err => console.error(err));
    }
}

// ============================================
// NEW PRODUCT FLOW
// ============================================

function openQuickAddModal(barcode) {
    const barcodeEl = document.getElementById('newProductBarcode');
    if (!barcodeEl) {
        console.warn('Quick Add Modal elements not found');
        return;
    }

    barcodeEl.value = barcode;
    const nameEl = document.getElementById('newProductName');
    if (nameEl) nameEl.value = '';

    const priceEl = document.getElementById('newProductPrice');
    if (priceEl) priceEl.value = '';

    const stockEl = document.getElementById('newProductStock');
    if (stockEl) stockEl.value = '100';

    openModal('quickAddModal');
    if (nameEl) nameEl.focus();
}

function saveNewProduct() {
    const barcode = document.getElementById('newProductBarcode').value;
    const name = document.getElementById('newProductName').value;
    const price = document.getElementById('newProductPrice').value;
    const stock = document.getElementById('newProductStock').value;
    const category = document.getElementById('newProductCategory').value;

    if (!name || !price) {
        alert('Nama dan Harga wajib diisi!');
        return;
    }

    const newItem = {
        name: name,
        price: parseInt(price),
        stock: parseInt(stock),
        category: category,
        barcode: barcode
    };

    const addedItem = addItem(newItem); // app.js function

    closeModal('quickAddModal');
    showNotification('Produk baru berhasil ditambahkan', 'success');

    // Auto add to cart immediately
    addProductToCart(addedItem.id);

    // Refresh grid (if on same page, though usually kasir page only shows grid)
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}
