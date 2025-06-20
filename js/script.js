
// Database kode promo
const promoCodes = {
    'MAHASISWA' : {discount: 10, type: 'percentage', description: 'Diskon 10%'},
    'FREEPLSTN' : {discount: 20, type: 'percentage', description: 'Diskon 20%'},
    'GLOBAL' : {discount: 5000, type: 'fixed', description: 'Diskon Rp 5.000'},
    'KANTIN' : {discount: 25, type: 'percentage', description: 'Diskon 25%'},
    'WELCOME' : {discount: 10000, type: 'fixed', description: 'Diskon Rp 10.000'}
}
// ===== DATA & VARIABEL GLOBAL =====
let transactions = [];
let transactionIdCounter = 1;
let currentDiscount = 0;
let appliedPromoCode = '';

// Mapping metode pembayaran dengan warna (disesuaikan untuk dark mode)
const paymentMethodColors = {
    'transfer': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border dark:border-blue-800',
    'ewallet': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border dark:border-purple-800',
    'credit': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border dark:border-orange-800',
    'cash': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border dark:border-green-800'
};

// Mapping nama metode pembayaran
const paymentMethodNames = {
    'transfer': 'Transfer Bank',
    'ewallet': 'E-Wallet',
    'credit': 'Kartu Kredit',
    'cash': 'Bayar Tunai'
};

// ===== DARK MODE FUNCTIONS =====

// Cek preferensi dark mode dari localStorage atau sistem
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// ===== MENDAPATKAN ELEMEN DOM =====
const paymentForm = document.getElementById('paymentForm');
const productSelect = document.getElementById('productSelect');
const quantity = document.getElementById('quantity');
const promoCode = document.getElementById('promoCode');
const applyPromoBtn = document.getElementById('applyPromoBtn');
const promoMessage = document.getElementById('promoMessage');
const darkModeToggle = document.getElementById('darkModeToggle');

// Elemen untuk menampilkan total
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const discountRow = document.getElementById('discountRow');
const totalAmountEl = document.getElementById('totalAmount');

// Elemen riwayat transaksi
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Elemen statistik
const totalTransactionsEl = document.getElementById('totalTransactions');
const totalRevenueEl = document.getElementById('totalRevenue');
const avgTransactionEl = document.getElementById('avgTransaction');

// Modal
const paymentModal = document.getElementById('paymentModal');
const paymentDetails = document.getElementById('paymentDetails');
const closeModalBtn = document.getElementById('closeModalBtn');

// ===== FUNGSI UTILITY =====

// Format mata uang Rupiah
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format waktu
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate transaction ID
function generateTransactionId() {
    return 'TRX' + Date.now().toString().substr(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// ===== FUNGSI KALKULASI =====

// Hitung subtotal
function calculateSubtotal() {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if (!selectedOption || !selectedOption.dataset.price) return 0;
    
    const price = parseInt(selectedOption.dataset.price);
    const qty = parseInt(quantity.value) || 1;
    return price * qty;
}

// Hitung diskon
function calculateDiscount(subtotal, promoData) {
    if (!promoData) return 0;
    
    if (promoData.type === 'percentage') {
        return Math.round(subtotal * promoData.discount / 100);
    } else {
        return Math.min(promoData.discount, subtotal);
    }
}

// Update tampilan total
function updateTotal() {
    const subtotal = calculateSubtotal();
    const promoData = appliedPromoCode ? promoCodes[appliedPromoCode] : null;
    const discount = calculateDiscount(subtotal, promoData);
    const total = subtotal - discount;

    subtotalEl.textContent = formatCurrency(subtotal);
    
    if (discount > 0) {
        discountEl.textContent = '-' + formatCurrency(discount);
        discountRow.classList.remove('hidden');
    } else {
        discountRow.classList.add('hidden');
    }
    
    totalAmountEl.textContent = formatCurrency(total);
    currentDiscount = discount;
}

// ===== FUNGSI PROMO CODE =====

// Terapkan kode promo
function applyPromoCode() {
    const code = promoCode.value.trim().toUpperCase();
    
    if (!code) {
        showPromoMessage('Masukkan kode promo terlebih dahulu', 'error');
        return;
    }

    if (!promoCodes[code]) {
        showPromoMessage('Kode promo tidak valid', 'error');
        return;
    }

    appliedPromoCode = code;
    updateTotal();
    showPromoMessage(`Kode promo "${code}" berhasil diterapkan! ${promoCodes[code].description}`, 'success');
    promoCode.disabled = true;
    applyPromoBtn.textContent = 'Diterapkan';
    applyPromoBtn.disabled = true;
    applyPromoBtn.classList.remove('bg-green-500', 'hover:bg-green-600', 'dark:bg-green-600', 'dark:hover:bg-green-700');
    applyPromoBtn.classList.add('bg-gray-400', 'dark:bg-gray-600');
}

// Tampilkan pesan promo
function showPromoMessage(message, type) {
    promoMessage.textContent = message;
    promoMessage.classList.remove('hidden', 'text-red-500', 'text-green-500', 'dark:text-red-400', 'dark:text-green-400');
    if (type === 'error') {
        promoMessage.classList.add('text-red-500', 'dark:text-red-400');
    } else {
        promoMessage.classList.add('text-green-500', 'dark:text-green-400');
    }
}

// Reset promo code
function resetPromoCode() {
    appliedPromoCode = '';
    currentDiscount = 0;
    promoCode.value = '';
    promoCode.disabled = false;
    applyPromoBtn.textContent = 'Terapkan';
    applyPromoBtn.disabled = false;
    applyPromoBtn.classList.remove('bg-gray-400', 'dark:bg-gray-600');
    applyPromoBtn.classList.add('bg-green-500', 'hover:bg-green-600', 'dark:bg-green-600', 'dark:hover:bg-green-700');
    promoMessage.classList.add('hidden');
    updateTotal();
}

// ===== FUNGSI TRANSAKSI =====

// Proses pembayaran
function processPayment(formData) {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const subtotal = calculateSubtotal();
    const total = subtotal - currentDiscount;

    const transaction = {
        id: generateTransactionId(),
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        product: selectedOption.textContent,
        productValue: selectedOption.value,
        quantity: parseInt(formData.get('quantity')),
        paymentMethod: formData.get('paymentMethod'),
        promoCode: appliedPromoCode,
        subtotal: subtotal,
        discount: currentDiscount,
        total: total,
        timestamp: new Date(),
        time: getCurrentTime(),
        status: 'success'
    };

    transactions.push(transaction);
    return transaction;
}

// Tampilkan modal konfirmasi
function showPaymentModal(transaction) {
    paymentDetails.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">ID Transaksi:</span>
                <span class="font-medium text-gray-800 dark:text-white">${transaction.id}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Nama:</span>
                <span class="font-medium text-gray-800 dark:text-white">${transaction.customerName}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Produk:</span>
                <span class="font-medium text-gray-800 dark:text-white">${transaction.product}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Jumlah:</span>
                <span class="font-medium text-gray-800 dark:text-white">${transaction.quantity}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Metode:</span>
                <span class="font-medium text-gray-800 dark:text-white">${paymentMethodNames[transaction.paymentMethod]}</span>
            </div>
            ${transaction.discount > 0 ? `
            <div class="flex justify-between text-green-600 dark:text-green-400">
                <span>Diskon:</span>
                <span class="font-medium">-${formatCurrency(transaction.discount)}</span>
            </div>
            ` : ''}
            <hr class="my-2 border-gray-300 dark:border-gray-600">
            <div class="flex justify-between text-lg font-semibold">
                <span class="text-gray-800 dark:text-white">Total:</span>
                <span class="text-green-600 dark:text-green-400">${formatCurrency(transaction.total)}</span>
            </div>
        </div>
    `;
    
    paymentModal.classList.remove('hidden');
    paymentModal.classList.add('flex');
}

// Tutup modal
function closeModal() {
    paymentModal.classList.add('hidden');
    paymentModal.classList.remove('flex');
}

// ===== FUNGSI RIWAYAT TRANSAKSI =====

// Buat elemen transaksi
function createTransactionElement(transaction) {
    const template = document.getElementById('transactionTemplate');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.transaction-customer').textContent = transaction.customerName;
    clone.querySelector('.transaction-product').textContent = `${transaction.product} (${transaction.quantity}x)`;
    clone.querySelector('.transaction-amount').textContent = formatCurrency(transaction.total);
    clone.querySelector('.transaction-time').textContent = transaction.time;
    
    const methodEl = clone.querySelector('.transaction-method');
    methodEl.textContent = paymentMethodNames[transaction.paymentMethod];
    // Clear existing classes before adding new ones to ensure proper dark mode toggling
    methodEl.className = 'transaction-method px-2 py-1 rounded-full text-xs ' + paymentMethodColors[transaction.paymentMethod];
    
    return clone;
}

// Render daftar transaksi
function renderTransactions() {
    // Hapus semua transaksi dari DOM
    transactionList.innerHTML = ''; // Clear all existing content
    // transactionList.querySelectorAll('[data-transaction-id]').forEach(item => item.remove()); // Alternative: remove specific elements

    if (transactions.length === 0) {
        emptyState.style.display = 'block';
        clearHistoryBtn.classList.add('hidden');
    } else {
        emptyState.style.display = 'none';
        clearHistoryBtn.classList.remove('hidden');

        // Tampilkan transaksi terbaru di atas
        const sortedTransactions = [...transactions].reverse();
        sortedTransactions.forEach(transaction => {
            const transactionElement = createTransactionElement(transaction);
            // Tambahkan ID untuk referensi
            const container = transactionElement.querySelector('div');
            container.setAttribute('data-transaction-id', transaction.id);
            transactionList.appendChild(transactionElement);
        });
    }

    updateStatistics();
}

// Update statistik
function updateStatistics() {
    const totalTrans = transactions.length;
    const totalRev = transactions.reduce((sum, t) => sum + t.total, 0);
    const avgTrans = totalTrans > 0 ? totalRev / totalTrans : 0;

    totalTransactionsEl.textContent = totalTrans;
    totalRevenueEl.textContent = formatCurrency(totalRev);
    avgTransactionEl.textContent = formatCurrency(avgTrans);
}

// Hapus semua riwayat
function clearAllHistory() {
    if (transactions.length === 0) return;
    
    // Replaced alert with custom modal for confirmation
    showConfirmationModal('Apakah Anda yakin ingin menghapus semua riwayat transaksi?', () => {
        transactions = [];
        renderTransactions();
    });
}

// Custom Modal for confirmation
function showConfirmationModal(message, onConfirm) {
    const modalHtml = `
        <div id="confirmationModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border dark:border-gray-700">
                <div class="text-center mb-4">
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Konfirmasi</h3>
                    <p class="text-gray-600 dark:text-gray-300">${message}</p>
                </div>
                <div class="flex justify-center gap-4">
                    <button id="confirmCancelBtn" class="px-5 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors duration-200">Batal</button>
                    <button id="confirmProceedBtn" class="px-5 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200">Ya, Hapus</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const confirmModal = document.getElementById('confirmationModal');

    document.getElementById('confirmProceedBtn').addEventListener('click', () => {
        onConfirm();
        confirmModal.remove();
    });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
        confirmModal.remove();
    });
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.remove();
        }
    });
}

// Custom Modal for alerts
function showAlertModal(message, type = 'info') {
    const iconSvg = {
        'info': `<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        'error': `<svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };
    const bgColor = {
        'info': 'bg-blue-100 dark:bg-blue-900/30',
        'error': 'bg-red-100 dark:bg-red-900/30'
    };
    const borderColor = {
        'info': 'border dark:border-blue-800',
        'error': 'border dark:border-red-800'
    };

    const modalHtml = `
        <div id="alertModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border dark:border-gray-700">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 ${bgColor[type]} rounded-full flex items-center justify-center mx-auto mb-4 ${borderColor[type]}">
                        ${iconSvg[type]}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Pemberitahuan</h3>
                    <p class="text-gray-600 dark:text-gray-300">${message}</p>
                </div>
                <button id="alertCloseBtn" class="w-full py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">Tutup</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const alertModal = document.getElementById('alertModal');

    document.getElementById('alertCloseBtn').addEventListener('click', () => {
        alertModal.remove();
    });
    alertModal.addEventListener('click', (e) => {
        if (e.target === alertModal) {
            alertModal.remove();
        }
    });
}


// Reset form
function resetForm() {
    paymentForm.reset();
    resetPromoCode();
    updateTotal();
}

// ===== EVENT LISTENERS =====

// Form submission
paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(paymentForm);
    
    // Validasi metode pembayaran
    if (!formData.get('paymentMethod')) {
        showAlertModal('Silakan pilih metode pembayaran', 'error');
        return;
    }

    // Validasi total > 0
    const total = calculateSubtotal() - currentDiscount;
    if (total <= 0) {
        showAlertModal('Total pembayaran harus lebih dari 0', 'error');
        return;
    }

    try {
        const transaction = processPayment(formData);
        showPaymentModal(transaction);
        renderTransactions();
        resetForm();
    } catch (error) {
        showAlertModal('Terjadi kesalahan saat memproses pembayaran', 'error');
        console.error('Payment error:', error);
    }
});

// Product select dan quantity change
productSelect.addEventListener('change', updateTotal);
quantity.addEventListener('input', updateTotal);

// Promo code
applyPromoBtn.addEventListener('click', applyPromoCode);
promoCode.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        applyPromoCode();
    }
});

// Dark Mode Toggle
darkModeToggle.addEventListener('click', toggleDarkMode);

// Modal controls
closeModalBtn.addEventListener('click', closeModal);
paymentModal.addEventListener('click', function(e) {
    if (e.target === paymentModal) {
        closeModal();
    }
});

// Clear history
clearHistoryBtn.addEventListener('click', clearAllHistory);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !paymentModal.classList.contains('hidden')) {
        closeModal();
    }
        // Close confirmation/alert modals on Escape
        if (e.key === 'Escape' && document.getElementById('confirmationModal')) {
        document.getElementById('confirmationModal').remove();
    }
    if (e.key === 'Escape' && document.getElementById('alertModal')) {
        document.getElementById('alertModal').remove();
    }
});

// ===== INISIALISASI =====

// Initialize app
function initApp() {
    initDarkMode(); // Initialize dark mode first
    updateTotal();
    renderTransactions();
    
    // Focus ke input nama saat halaman dimuat
    document.getElementById('customerName').focus();
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', initApp);
