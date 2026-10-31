/**
 * Juragankosan License & Monetization System (Freemium + Deterministic Checksum Engine)
 * Option A: Free max 3 rooms, Lifetime Unlimited for PRO
 * Direct Self-Checkout (0% Admin Fee - Transfer Langsung & QRIS)
 */
import { showToast, openModal, closeModal } from './modal.js';
import { formatRupiah } from './formatter.js';

// ============================================================================
// ⚙️ KONFIGURASI PEMBAYARAN PEMILIK APLIKASI (DIRECT SELF-CHECKOUT)
// Anda dapat mengubah nomor WhatsApp, harga, dan rekening bank di sini kapan saja
// ============================================================================

/**
 * Dapatkan atau buat ID perangkat unik permanen untuk validasi batas 2 device
 */
export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem('juragankos_device_id');
    if (!id) {
      const randomStr = Math.random().toString(36).substring(2, 10);
      const timeStr = Date.now().toString(36);
      id = 'dev_' + timeStr + '_' + randomStr;
      localStorage.setItem('juragankos_device_id', id);
    }
    return id;
  } catch (e) {
    return 'dev_fallback_' + Date.now();
  }
}

/**
 * Deteksi nama perangkat sederhana (HP Android, iPhone, Windows PC, Mac)
 */
export function getDeviceDisplayName() {
  try {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'HP Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone/iPad';
    if (/windows/i.test(ua)) return 'Windows PC/Laptop';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac';
    return 'Web Browser Device';
  } catch (e) {
    return 'Perangkat Web';
  }
}

export const OWNER_PAYMENT_CONFIG = {
  whatsappAdmin: '6287776108132',
  priceBase: 149000,
  banks: [
    {
      bankName: 'Bank Mandiri',
      accountNumber: '1120005096610',
      accountHolder: 'Yahya Kurniawan',
      color: '#003399'
    },
    {
      bankName: 'BCA',
      accountNumber: '5156054387',
      accountHolder: 'Yahya Kurniawan',
      color: '#0060af'
    }
  ]
};

// ============================================================================
// 📈 LOGIKA KENAIKAN HARGA OTOMATIS BERDASARKAN KUOTA (TIER PRICING ENGINE)
// ============================================================================
export const SOLD_COUNT_STORAGE_KEY = 'juragankos_sold_count';

export const PRICING_TIERS = {
  BATCH_1: {
    tierId: 1,
    name: 'Batch 1 (50 Pembeli Pertama)',
    shortTierName: 'Batch 1',
    crownBadge: '👑 PRO LIFETIME BATCH 1',
    price: 149000,
    strikePrice: 299000,
    maxSlots: 50,
    badgeText: '🔥 PROMO BATCH 1 (50 PEMBELI PERTAMA)'
  },
  BATCH_2: {
    tierId: 2,
    name: 'Batch 2 (Pembeli ke 51 – 100)',
    shortTierName: 'Batch 2',
    crownBadge: '⚡ PRO LIFETIME BATCH 2',
    price: 199000,
    strikePrice: 299000,
    maxSlots: 100,
    badgeText: '⚡ PROMO BATCH 2 SEDANG AKTIF (SLOT 51 – 100)'
  },
  BATCH_3: {
    tierId: 3,
    name: 'Batch 3 / Reguler (Pembeli ke 101+)',
    shortTierName: 'Batch 3 / Reguler',
    crownBadge: '⭐ PRO LIFETIME RESMI',
    price: 299000,
    strikePrice: null,
    maxSlots: null,
    badgeText: '🏷️ HARGA STANDAR SELAMANYA'
  }
};

/**
 * Ambil jumlah lisensi terjual dari localStorage (default: 86 slot)
 */
export function getSoldCount() {
  try {
    const raw = localStorage.getItem(SOLD_COUNT_STORAGE_KEY);
    if (raw !== null && !isNaN(parseInt(raw, 10))) {
      const val = parseInt(raw, 10);
      if (val === 86 || val === 105) {
        localStorage.setItem(SOLD_COUNT_STORAGE_KEY, '0');
        return 0;
      }
      return val;
    }
    return 0; // Default awal bersih: 0
  } catch (e) {
    return 0;
  }
}

/**
 * Set jumlah kuota terjual & picu pembaruan real-time ke UI
 */
export function setSoldCount(count) {
  const num = Math.max(0, parseInt(count, 10) || 0);
  localStorage.setItem(SOLD_COUNT_STORAGE_KEY, String(num));
  window.dispatchEvent(new CustomEvent('juragankos_pricing_changed', { detail: { soldCount: num } }));
  return num;
}

/**
 * Hitung tier aktif, harga, sisa kuota, dan status tangga harga otomatis
 */
export function getCurrentPricingTier(soldCount = getSoldCount()) {
  if (soldCount < 50) {
    const remaining = 50 - soldCount;
    return {
      tierId: 1,
      tierName: 'Batch 1 (50 Pembeli Pertama)',
      shortTierName: 'Batch 1',
      crownBadge: '👑 PRO LIFETIME BATCH 1',
      price: 149000,
      strikePrice: 299000,
      soldCount,
      targetQuota: 50,
      remainingSlots: remaining,
      progressPercent: Math.min(100, Math.max(5, Math.round((soldCount / 50) * 100))),
      progressText: 'Promo Peluncuran: Kuota Terbatas 50 Pembeli Pertama',
      statusBatch1: 'active',
      statusBatch2: 'upcoming',
      statusBatch3: 'normal'
    };
  } else if (soldCount < 100) {
    const remaining = 100 - soldCount;
    return {
      tierId: 2,
      tierName: 'Batch 2 (Pembeli ke 51 – 100)',
      shortTierName: 'Batch 2',
      crownBadge: '⚡ PRO LIFETIME BATCH 2',
      price: 199000,
      strikePrice: 299000,
      soldCount,
      targetQuota: 100,
      remainingSlots: remaining,
      progressPercent: Math.min(100, Math.max(5, Math.round(((soldCount - 50) / 50) * 100))),
      progressText: 'Promo Batch 2: Kuota 50 Pembeli (ke 51 – 100)',
      statusBatch1: 'soldout',
      statusBatch2: 'active',
      statusBatch3: 'normal'
    };
  } else {
    return {
      tierId: 3,
      tierName: 'Batch 3 / Reguler (Pembeli ke 101+)',
      shortTierName: 'Batch 3 / Reguler',
      crownBadge: '⭐ PRO LIFETIME RESMI',
      price: 299000,
      strikePrice: null,
      soldCount,
      targetQuota: null,
      remainingSlots: 0,
      progressPercent: 100,
      progressText: 'Harga Standar Selamanya (Pembeli ke 101+)',
      statusBatch1: 'soldout',
      statusBatch2: 'soldout',
      statusBatch3: 'active'
    };
  }
}

export const CHECKOUT_URL = 'https://lynk.id/juragankosan/order-pro'; // Fallback checkout link
export const MAX_FREE_ROOMS = 3;
export const LICENSE_STORAGE_KEY = 'juragankos_license';

// 3 Master Code VIP bawaan untuk pengujian instan
export const MASTER_VIP_CODES = [
  'JKPRO-2026-VIP1',
  'JKPRO-SULTAN-99',
  'JKPRO-ADMIN-88',
  'JKPRO-JS5S-3NR5'
];

export const SECRET_ADMIN_TRIGGER = 'ADMIN-GENERATOR';

// 32-karakter alfanumerik bersih (tanpa karakter membingungkan seperti O & I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Algoritma Checksum Deterministik:
 * Mengambil blok tengah (4 karakter) dan menghitung 4 karakter checksum untuk blok akhir.
 */
export function computeChecksum(block1) {
  const b1 = (block1 || '').toUpperCase().trim();
  let h1 = 0x1a8c;
  let h2 = 0x5b3f;
  let h3 = 0x9c2e;
  let h4 = 0xdf4a;

  for (let i = 0; i < b1.length; i++) {
    const c = b1.charCodeAt(i);
    h1 = Math.abs((h1 * 33 + c * 17 + i * 7) ^ 0x4b7a);
    h2 = Math.abs((h2 * 37 + c * 23 + (i + 1) * 11) ^ 0x8f2c);
    h3 = Math.abs((h3 * 41 + c * 29 + (i + 2) * 13) ^ 0x3d9e);
    h4 = Math.abs((h4 * 43 + c * 31 + (i + 3) * 17) ^ 0x6e1b);
  }

  const c1 = ALPHABET[h1 % ALPHABET.length];
  const c2 = ALPHABET[h2 % ALPHABET.length];
  const c3 = ALPHABET[h3 % ALPHABET.length];
  const c4 = ALPHABET[h4 % ALPHABET.length];

  return `${c1}${c2}${c3}${c4}`;
}

/**
 * Menghasilkan satu kode lisensi acak yang 100% valid
 */
export function generateLicenseCode() {
  let b1 = '';
  for (let i = 0; i < 4; i++) {
    b1 += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  const b2 = computeChecksum(b1);
  return `JKPRO-${b1}-${b2}`;
}

/**
 * Menghasilkan kumpulan kode lisensi unik sekaligus (stok Scalev / Lynk.id / Excel)
 */
export function generateBatchCodes(count = 50) {
  const codes = new Set();
  let attempts = 0;
  while (codes.size < count && attempts < count * 20) {
    codes.add(generateLicenseCode());
    attempts++;
  }
  return Array.from(codes);
}

/**
 * Validasi apakah sebuah kode lisensi sah (VIP Master atau lolos rumus checksum)
 */
export function validateLicenseCode(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();

  // 1. Cek Master VIP codes
  if (MASTER_VIP_CODES.includes(clean)) {
    return true;
  }

  // 2. Cek format JKPRO-XXXX-XXXX
  const match = clean.match(/^JKPRO-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
  if (!match) return false;

  const b1 = match[1];
  const b2 = match[2];
  return computeChecksum(b1) === b2;
}

/**
 * Ambil status lisensi dari localStorage
 */
export function getLicense() {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return { status: 'FREE', code: null, activatedAt: null };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.status === 'PRO') {
      return parsed;
    }
    return { status: 'FREE', code: null, activatedAt: null };
  } catch (e) {
    return { status: 'FREE', code: null, activatedAt: null };
  }
}

/**
 * Alias untuk getLicense
 */
export function getLicenseStatus() {
  return getLicense();
}

/**
 * Cek apakah lisensi aktif adalah PRO
 */
export function isPro() {
  return getLicense().status === 'PRO';
}

/**
 * Cek apakah kamar baru boleh ditambahkan berdasarkan batas kuota
 */
export function canAddRoom(currentRoomCount) {
  if (isPro()) return true;
  return currentRoomCount < MAX_FREE_ROOMS;
}

/**
 * Proses aktivasi kode lisensi
 */
export function activateLicense(inputCode) {
  const clean = (inputCode || '').trim().toUpperCase();

  // Cek jika trigger kode rahasia admin generator
  if (clean === SECRET_ADMIN_TRIGGER) {
    openAdminGeneratorModal();
    return { success: false, isAdmin: true, message: 'Buka Admin Generator Lisensi' };
  }

  if (!validateLicenseCode(clean)) {
    return {
      success: false,
      message: 'Kode lisensi tidak valid! Pastikan format JKPRO-XXXX-XXXX sudah benar.'
    };
  }

  const licenseData = {
    status: 'PRO',
    code: clean,
    activatedAt: new Date().toISOString()
  };

  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
  window.dispatchEvent(new CustomEvent('juragankos_license_changed', { detail: licenseData }));

  return {
    success: true,
    message: '🎉 Selamat! Juragankosan PRO Lifetime berhasil diaktifkan. Semua fitur & kuota tanpa batas kini terbuka!'
  };
}

/**
 * Nonaktifkan lisensi (kembali ke FREE untuk demonstrasi / pengujian)
 */
export function deactivateLicense() {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
  const licenseData = { status: 'FREE', code: null, activatedAt: null };
  window.dispatchEvent(new CustomEvent('juragankos_license_changed', { detail: licenseData }));
  return licenseData;
}

/**
 * Dapatkan / buat 3 digit angka unik acak (101 - 499) tersimpan di localStorage
 */
export function getUniquePaymentCode() {
  try {
    let code = localStorage.getItem('juragankos_unique_code');
    if (!code || isNaN(parseInt(code, 10)) || parseInt(code, 10) < 101 || parseInt(code, 10) > 499) {
      code = String(Math.floor(101 + Math.random() * 399));
      localStorage.setItem('juragankos_unique_code', code);
    }
    return parseInt(code, 10);
  } catch (e) {
    return 238;
  }
}

/**
 * Dapatkan / buat 4 karakter unik ID Perangkat pembeli
 */
export function getDeviceId() {
  try {
    let devId = localStorage.getItem('juragankos_device_id');
    if (!devId || devId.length !== 4) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      devId = '';
      for (let i = 0; i < 4; i++) {
        devId += chars[Math.floor(Math.random() * chars.length)];
      }
      localStorage.setItem('juragankos_device_id', devId);
    }
    return devId;
  } catch (e) {
    return 'D92A';
  }
}

// ============================================================================
// MODAL UPGRADE PRO POP-UP & DIRECT SELF-CHECKOUT
// ============================================================================

/**
 * Buka Modal Upgrade PRO dengan Alur Direct Self-Checkout & Aktivasi Instan
 */
export function openUpgradeModal(initialStep = 'info') {
  let modal = document.getElementById('upgrade-pro-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'upgrade-pro-modal';
    modal.className = 'modal-backdrop modal-overlay';
    document.body.appendChild(modal);
  }

  const pricing = getCurrentPricingTier();
  const uniqueCode = getUniquePaymentCode();
  const priceBase = pricing.price;
  const totalAmount = priceBase + uniqueCode;
  const deviceId = getDeviceId();

  // Coba pre-fill nama kos / pemilik dari localStorage
  let defaultBuyerName = '';
  try {
    const rawData = localStorage.getItem('juragankos_data_v1');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed && parsed.settings) {
        defaultBuyerName = parsed.settings.ownerName || parsed.settings.kosName || '';
      }
    }
  } catch (e) {}

  modal.innerHTML = `
    <div class="modal-dialog modal-md upgrade-pro-dialog modal-card animate-bounce-in">
      
      <!-- PANE 1: INFO PAKET & KEUNTUNGAN -->
      <div id="upgrade-view-info" class="upgrade-pane ${initialStep === 'info' ? '' : 'is-hidden'}">
        <div class="modal-header upgrade-modal-header no-print">
          <div class="upgrade-header-title">
            <span class="pro-crown-badge">${pricing.crownBadge}</span>
            <h2 class="modal-title">Upgrade ke Juragankosan PRO</h2>
            <p class="modal-subtitle">Kelola puluhan pintu kos &amp; kontrakan tanpa batas, sekali bayar untuk selamanya!</p>
          </div>
          <button class="modal-close" data-close-modal="upgrade-pro-modal" aria-label="Tutup">&times;</button>
        </div>

        <div class="modal-body upgrade-modal-body">
          <!-- Pricing Banner -->
          <div class="upgrade-pricing-banner upgrade-price-card tier-${pricing.tierId}">
            <div class="pricing-badge">${pricing.tierId === 1 ? '🔥 PROMO BATCH 1 TERBATAS' : (pricing.tierId === 2 ? '⚡ PROMO BATCH 2 SEDANG AKTIF' : '🏷️ HARGA RESMI TETAP')}</div>
            <div class="pricing-numbers">
              ${pricing.strikePrice ? `<span class="price-strikethrough">${formatRupiah(pricing.strikePrice)}</span>` : ''}
              <span class="price-main">${formatRupiah(pricing.price)}</span>
              <span class="price-lifetime">/ Sekali Bayar Selamanya</span>
            </div>
            <p class="pricing-note">Tanpa biaya bulanan atau tahunan. Akses penuh seumur hidup!</p>

            <!-- Kuota Resmi Profesional: Kuota Terbatas Batch 1 -->
            <div class="pricing-quota-official-box mt-2">
              <div class="quota-official-badge">
                <span class="quota-official-icon">💎</span>
                <div class="quota-official-info">
                  <span class="quota-official-title">Promo Peluncuran: Kuota Terbatas 50 Pembeli Pertama</span>
                  <p class="quota-official-desc">Harga diskon 50% khusus pembeli Batch 1 (Rp 149.000). Setelah kuota 50 pembeli pertama terpenuhi, harga naik bertahap ke Batch 2 Rp 199.000 (pembeli ke 51 – 100), dan selanjutnya harga standar Batch 3 / Reguler Rp 299.000 untuk pembeli ke 101+.</p>
                </div>
              </div>
            </div>

            <!-- Tangga Kenaikan Harga Batch -->
            <div class="price-ladder-box mt-3">
              <div class="ladder-title text-xs font-bold text-muted mb-1 text-left">📈 Tangga Kenaikan Harga Resmi:</div>
              <div class="ladder-steps-list">
                <div class="ladder-step-item ${pricing.statusBatch1}">
                  <span class="step-badge">${pricing.statusBatch1 === 'soldout' ? '❌' : (pricing.statusBatch1 === 'active' ? '👉' : '⏳')}</span>
                  <div class="step-name ${pricing.statusBatch1 === 'soldout' ? 'line-through text-muted' : ''}">
                    <span class="step-title">Batch 1 (50 Pembeli Pertama)</span>
                    <span class="step-price"><strong>Rp 149.000</strong> <small class="text-emerald font-bold">(Diskon 50%)</small></span>
                  </div>
                  <span class="step-status">${pricing.statusBatch1 === 'soldout' ? '<span class="badge badge-soldout">HABIS TERJUAL</span>' : '<span class="badge badge-active-tier">SEDANG BERLAKU</span>'}</span>
                </div>
                <div class="ladder-step-item ${pricing.statusBatch2}">
                  <span class="step-badge">${pricing.statusBatch2 === 'soldout' ? '❌' : (pricing.statusBatch2 === 'active' ? '👉' : '⏳')}</span>
                  <div class="step-name ${pricing.statusBatch2 === 'soldout' ? 'line-through text-muted' : ''}">
                    <span class="step-title">Batch 2 (Pembeli 51 – 100)</span>
                    <span class="step-price"><strong>Rp 199.000</strong></span>
                  </div>
                  <span class="step-status">${pricing.statusBatch2 === 'soldout' ? '<span class="badge badge-soldout">HABIS TERJUAL</span>' : (pricing.statusBatch2 === 'active' ? '<span class="badge badge-active-tier">SEDANG BERLAKU</span>' : '<span class="badge badge-upcoming">BERIKUTNYA</span>')}</span>
                </div>
                <div class="ladder-step-item ${pricing.statusBatch3}">
                  <span class="step-badge">${pricing.statusBatch3 === 'active' ? '👉' : '🏷️'}</span>
                  <div class="step-name">
                    <span class="step-title">Batch 3 / Reguler (101+)</span>
                    <span class="step-price"><strong>Rp 299.000</strong></span>
                  </div>
                  <span class="step-status">${pricing.statusBatch3 === 'active' ? '<span class="badge badge-active-tier">SEDANG BERLAKU</span>' : '<span class="badge badge-normal-tier">HARGA TETAP</span>'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Features Benefit List -->
          <div class="upgrade-benefits-card">
            <h4 class="benefits-title">Keuntungan Eksklusif Juragankosan PRO:</h4>
            <ul class="benefits-list">
              <li>
                <span class="benefit-check">✓</span>
                <div>
                  <strong>Unlimited Kamar &amp; Penyewa</strong>
                  <p>Versi gratis terbatas 3 kamar. Versi PRO bebas kelola puluhan unit kos &amp; kontrakan.</p>
                </div>
              </li>
              <li>
                <span class="benefit-check">✓</span>
                <div>
                  <strong>Kwitansi Resmi Tanpa Watermark</strong>
                  <p>Kwitansi cetak &amp; PDF 100% bersih dengan nama &amp; logo kos Anda tanpa teks promosi.</p>
                </div>
              </li>
              <li>
                <span class="benefit-check">✓</span>
                <div>
                  <strong>Export &amp; Backup Data JSON Penuh</strong>
                  <p>Amankan seluruh data keuangan, kamar, dan penyewa untuk dipindah ke laptop/HP lain.</p>
                </div>
              </li>
              <li>
                <span class="benefit-check">✓</span>
                <div>
                  <strong>Sekali Bayar Selamanya</strong>
                  <p>Tidak ada tagihan berulang atau langganan per bulan. Aplikasi tetap milik Anda selamanya.</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Action Button: Open Direct Self-Checkout -->
          <div class="upgrade-action-block">
            <button type="button" class="btn btn-buy-pro" id="btn-goto-checkout">
              <span>🛒 Beli Lisensi PRO ${formatRupiah(pricing.price)} Sekarang</span>
              <span class="btn-arrow">→</span>
            </button>
            <span class="checkout-guarantee">⚡ Direct Self-Checkout 0% Biaya Admin &bull; Transfer Langsung Bank Mandiri / BCA</span>
          </div>

          <!-- Activation Box -->
          <div class="upgrade-activation-box">
            <label for="input-license-key-info" class="activation-label">
              Sudah membeli lisensi? Masukkan Kode PRO Anda di sini:
            </label>
            <div class="activation-form-row">
              <input 
                type="text" 
                id="input-license-key-info" 
                class="form-control input-license-code" 
                placeholder="Contoh: JKPRO-XXXX-XXXX"
                autocomplete="off"
                spellcheck="false"
                data-no-autofocus="true"
              />
              <button type="button" class="btn btn-primary btn-submit-license-action" data-input-target="#input-license-key-info">
                🔑 Aktifkan
              </button>
            </div>
            <div class="activation-hint text-xs text-muted mt-1">
              Kode lisensi dikirim otomatis oleh Admin ke WhatsApp Anda setelah konfirmasi pembayaran.
            </div>
          </div>
        </div>

        <div class="modal-footer upgrade-modal-footer no-print">
          <button type="button" class="btn btn-ghost" data-close-modal="upgrade-pro-modal">Nanti Saja</button>
        </div>
      </div>

      <!-- PANE 2: DIRECT SELF-CHECKOUT (0% ADMIN FEE) -->
      <div id="upgrade-view-checkout" class="upgrade-pane ${initialStep === 'checkout' ? '' : 'is-hidden'}">
        <div class="modal-header upgrade-modal-header header-checkout no-print">
          <div class="upgrade-header-title">
            <span class="pro-crown-badge badge-admin-fee">⚡ 0% BIAYA ADMIN &bull; TRANSFER LANGSUNG</span>
            <h2 class="modal-title">Instruksi Pembayaran Instan</h2>
            <p class="modal-subtitle">Transfer tepat sesuai nominal unik ke rekening resmi untuk aktivasi kilat</p>
          </div>
          <button class="modal-close" data-close-modal="upgrade-pro-modal" aria-label="Tutup">&times;</button>
        </div>

        <div class="modal-body upgrade-modal-body">
          <!-- 1. Nominal Transfer Unik -->
          <div class="checkout-unique-box">
            <div class="unique-box-header">
              <span class="unique-label">TOTAL TRANSFER RESMI (TERMASUK KODE UNIK):</span>
            </div>
            <div class="unique-amount-row">
              <div class="unique-price-display">
                <span class="unique-price-val">${formatRupiah(totalAmount)}</span>
                <span class="unique-digit-badge">+${uniqueCode} (Kode Unik)</span>
              </div>
              <button type="button" class="btn btn-outline btn-sm btn-copy-nominal" id="btn-copy-nominal">
                📋 Salin Nominal
              </button>
            </div>
            <div class="unique-warning-note">
              <span class="warning-icon">⚠️</span>
              <span><strong>PENTING:</strong> Mohon transfer tepat hingga 3 digit terakhir (<strong>${formatRupiah(totalAmount)}</strong>) agar verifikasi lisensi Anda otomatis diproses kilat!</span>
            </div>
          </div>

          <!-- 2. Pilihan Rekening Tujuan Resmi (Bank Mandiri & BCA) -->
          <div class="checkout-banks-section">
            <h4 class="checkout-section-title">Pilihan Rekening Tujuan Resmi:</h4>
            <div class="checkout-banks-grid">
              ${OWNER_PAYMENT_CONFIG.banks.map((b) => {
                const isMandiri = b.bankName.toLowerCase().includes('mandiri');
                const cardClass = isMandiri ? 'bank-card-mandiri' : 'bank-card-bca';
                const badgeClass = isMandiri ? 'brand-mandiri' : 'brand-bca';
                const brandLabel = isMandiri ? 'MANDIRI' : 'BCA';
                return `
                <div class="checkout-bank-card ${cardClass}">
                  <div class="bank-card-top">
                    <div class="bank-brand-badge ${badgeClass}">
                      <span class="bank-brand-code">${brandLabel}</span>
                    </div>
                    <button type="button" class="btn btn-outline btn-xs btn-copy-bank" data-acc="${b.accountNumber}" data-copy="${b.accountNumber}" data-label="${b.bankName}">
                      📋 Salin No. Rek
                    </button>
                  </div>
                  <div class="bank-card-number font-mono">${b.accountNumber}</div>
                  <div class="bank-card-holder">a.n. <strong>${b.accountHolder}</strong></div>
                </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 3. Form Singkat Konfirmasi -->
          <div class="checkout-form-box">
            <h4 class="checkout-section-title">Konfirmasi Pembayaran Anda:</h4>
            <div class="form-group mb-2">
              <label for="checkout-buyer-name" class="form-label text-xs">
                Nama Pembeli / Nama Kos Anda <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                id="checkout-buyer-name" 
                class="form-control form-control-sm" 
                placeholder="Contoh: Bpk. Ahmad / Kos Melati Asri" 
                value="${defaultBuyerName}"
                required
              />
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs font-bold">
                Pilih Rekening Tujuan Yang Ditransfer <span class="text-danger">*</span>
              </label>
              <input type="hidden" id="checkout-destination-bank" value="${OWNER_PAYMENT_CONFIG.banks[0]?.bankName} (${OWNER_PAYMENT_CONFIG.banks[0]?.accountNumber})" />
              <div class="checkout-bank-selector-grid" id="checkout-bank-selector-grid">
                ${OWNER_PAYMENT_CONFIG.banks.map((b, idx) => {
                  const isMandiri = b.bankName.toLowerCase().includes('mandiri');
                  const isDefault = idx === 0;
                  return `
                  <div class="bank-pill-btn ${isDefault ? 'is-active' : ''}" data-bank-value="${b.bankName} (${b.accountNumber})">
                    <div class="pill-check-indicator">
                      <span class="pill-radio-dot"></span>
                    </div>
                    <div class="pill-bank-info">
                      <div class="pill-bank-title">🏦 ${isMandiri ? 'Bank Mandiri' : 'Bank BCA'}</div>
                      <div class="pill-bank-number font-mono">${b.accountNumber}</div>
                    </div>
                  </div>
                  `;
                }).join('')}
              </div>
            </div>
            <div class="checkout-device-row">
              <span class="text-xs text-muted">ID Perangkat Anda:</span>
              <code class="device-id-badge" id="checkout-device-id">${deviceId}</code>
              <span class="text-xs text-secondary">(Otomatis disertakan di pesan konfirmasi)</span>
            </div>
          </div>

          <!-- 4. Tombol Utama WhatsApp -->
          <div class="checkout-action-block">
            <button type="button" class="btn btn-wa-checkout" id="btn-send-wa-confirm">
              <span class="btn-wa-icon-bullet">🟢</span>
              <span class="btn-wa-text">Konfirmasi Pembayaran &amp; Ambil Kode PRO (Via WhatsApp)</span>
            </button>
            <div class="text-xs text-muted text-center mt-1">
              Admin akan langsung membalas chat WA dengan Kode Lisensi PRO Anda (proses 1-5 menit).
            </div>
          </div>

          <!-- 5. Kotak Input Aktivasi Instan di Layar yang Sama -->
          <div class="upgrade-activation-box mt-3">
            <label for="input-license-key-checkout" class="activation-label">
              Sudah menerima Kode Lisensi dari Admin? Masukkan di sini:
            </label>
            <div class="activation-form-row">
              <input 
                type="text" 
                id="input-license-key-checkout" 
                class="form-control input-license-code" 
                placeholder="Contoh: JKPRO-XXXX-XXXX"
                autocomplete="off"
                spellcheck="false"
                data-no-autofocus="true"
              />
              <button type="button" class="btn btn-primary btn-submit-license-action" data-input-target="#input-license-key-checkout">
                🔑 Aktifkan
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer upgrade-modal-footer flex-between no-print">
          <button type="button" class="btn btn-ghost btn-sm" id="btn-back-to-info">
            ← Kembali ke Info Paket
          </button>
          <button type="button" class="btn btn-secondary btn-sm" data-close-modal="upgrade-pro-modal">
            Tutup
          </button>
        </div>
      </div>

    </div>
  `;

  // Switching Panes
  const viewInfo = modal.querySelector('#upgrade-view-info');
  const viewCheckout = modal.querySelector('#upgrade-view-checkout');
  const btnGotoCheckout = modal.querySelector('#btn-goto-checkout');
  const btnBackToInfo = modal.querySelector('#btn-back-to-info');

  if (btnGotoCheckout && viewInfo && viewCheckout) {
    btnGotoCheckout.addEventListener('click', () => {
      viewInfo.classList.add('is-hidden');
      viewCheckout.classList.remove('is-hidden');
      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
      const checkoutBody = viewCheckout.querySelector('.upgrade-modal-body');
      if (checkoutBody) checkoutBody.scrollTop = 0;
      const inputName = modal.querySelector('#checkout-buyer-name');
      if (inputName && !inputName.value) inputName.focus();
    });
  }

  if (btnBackToInfo && viewInfo && viewCheckout) {
    btnBackToInfo.addEventListener('click', () => {
      viewCheckout.classList.add('is-hidden');
      viewInfo.classList.remove('is-hidden');
      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
      const infoBody = viewInfo.querySelector('.upgrade-modal-body');
      if (infoBody) infoBody.scrollTop = 0;
    });
  }

  // Copy Nominal Button
  const btnCopyNominal = modal.querySelector('#btn-copy-nominal');
  if (btnCopyNominal) {
    btnCopyNominal.addEventListener('click', () => {
      const rawVal = String(totalAmount);
      navigator.clipboard.writeText(rawVal).then(() => {
        showToast(`📋 Nominal Rp ${totalAmount.toLocaleString('id-ID')} berhasil disalin ke clipboard!`, 'success');
      }).catch(() => {
        showToast(`📋 Nominal Rp ${totalAmount.toLocaleString('id-ID')} disalin!`, 'success');
      });
    });
  }

  // Copy Bank Account Buttons
  modal.querySelectorAll('.btn-copy-bank').forEach((btn) => {
    btn.addEventListener('click', () => {
      const acc = btn.getAttribute('data-copy') || btn.getAttribute('data-acc');
      const bankLabel = btn.getAttribute('data-label') || 'Rekening';
      navigator.clipboard.writeText(acc).then(() => {
        showToast(`📋 No. Rekening ${bankLabel} (${acc}) berhasil disalin!`, 'success');
      }).catch(() => {
        showToast(`📋 No. Rekening ${acc} disalin!`, 'success');
      });
    });
  });

  // Custom Bank Selector Interaction
  const bankPills = modal.querySelectorAll('.bank-pill-btn');
  const hiddenBankInput = modal.querySelector('#checkout-destination-bank');
  bankPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      bankPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      const val = pill.getAttribute('data-bank-value');
      if (hiddenBankInput && val) hiddenBankInput.value = val;
    });
  });

  // WhatsApp Confirmation Button
  const btnSendWA = modal.querySelector('#btn-send-wa-confirm');
  if (btnSendWA) {
    btnSendWA.addEventListener('click', () => {
      const inputName = modal.querySelector('#checkout-buyer-name');
      const selectBank = modal.querySelector('#checkout-destination-bank');
      const buyerName = inputName ? inputName.value.trim() : '';

      if (!buyerName) {
        showToast('Mohon masukkan Nama Anda atau Nama Kos Anda terlebih dahulu!', 'warning');
        if (inputName) inputName.focus();
        return;
      }

      const bankDest = selectBank ? selectBank.value : 'Transfer Bank';
      const totalStr = formatRupiah(totalAmount);

      const msg = 
`Halo Admin Juragankosan, saya sudah melakukan pembayaran untuk aktivasi *Juragankosan PRO (Lifetime ${pricing.shortTierName})*:

- *Nama / Kos*: ${buyerName}
- *Nominal Unik*: ${totalStr}
- *Transfer ke*: ${bankDest}
- *ID Perangkat*: ${deviceId}

Berikut saya lampirkan bukti transfernya. Mohon kirimkan Kode Lisensi PRO saya. Terima kasih!`;

      const waUrl = `https://wa.me/${OWNER_PAYMENT_CONFIG.whatsappAdmin}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
      showToast('Membuka WhatsApp Admin... Silakan lampirkan bukti transfer Anda.', 'info', 4000);
    });
  }

  // Activation Action Handler
  const doActivate = (inputEl) => {
    const code = inputEl ? inputEl.value.trim() : '';
    if (!code) {
      showToast('Masukkan kode lisensi PRO terlebih dahulu!', 'warning');
      if (inputEl) inputEl.focus();
      return;
    }

    const res = activateLicense(code);
    if (res.isAdmin) {
      closeModal('upgrade-pro-modal');
      return;
    }

    if (res.success) {
      showToast(res.message, 'success', 5000);
      closeModal('upgrade-pro-modal');
      if (window.juraganApp && window.juraganApp.navigateTo) {
        window.juraganApp.navigateTo(window.juraganApp.currentTab);
      }
    } else {
      showToast(res.message, 'error', 4000);
      if (inputEl) inputEl.focus();
    }
  };

  // Attach submit listeners to both activation inputs
  modal.querySelectorAll('.btn-submit-license-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-input-target');
      const inputEl = modal.querySelector(targetSelector);
      doActivate(inputEl, btn);
    });
  });

  ['#input-license-key-info', '#input-license-key-checkout'].forEach((sel) => {
    const inputEl = modal.querySelector(sel);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doActivate(inputEl);
        }
      });
      inputEl.addEventListener('input', () => {
        inputEl.value = inputEl.value.toUpperCase();
      });
    }
  });

  openModal('upgrade-pro-modal', { noAutoFocus: true });
  modal.scrollTop = 0;
  const dialog = modal.querySelector('.modal-dialog');
  if (dialog) dialog.scrollTop = 0;
  const infoBody = modal.querySelector('#upgrade-view-info .upgrade-modal-body');
  if (infoBody) infoBody.scrollTop = 0;
  const checkoutBody = modal.querySelector('#upgrade-view-checkout .upgrade-modal-body');
  if (checkoutBody) checkoutBody.scrollTop = 0;
  setTimeout(() => {
    modal.scrollTop = 0;
    if (dialog) dialog.scrollTop = 0;
    if (infoBody) infoBody.scrollTop = 0;
    if (checkoutBody) checkoutBody.scrollTop = 0;
  }, 50);
}

/**
 * Buka Modal Secret Admin Generator Lisensi
 */
export function openAdminGeneratorModal() {
  let modal = document.getElementById('admin-generator-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-generator-modal';
    modal.className = 'modal-backdrop modal-overlay';
    document.body.appendChild(modal);
  }

  const initialCodes = generateBatchCodes(50);

  modal.innerHTML = `
    <div class="modal-dialog modal-md admin-generator-dialog modal-card animate-bounce-in">
      <div class="modal-header modal-header-admin no-print">
        <div>
          <span class="badge badge-danger text-xs font-mono mb-1">RAHASIA PEMILIK APLIKASI</span>
          <h3 class="modal-title">⚡ Generator Kode Lisensi Juragankosan PRO</h3>
          <p class="modal-subtitle text-xs text-muted">Hasilkan stok kode lisensi valid untuk diunggah ke Scalev / Lynk.id / Excel</p>
        </div>
        <button class="modal-close" data-close-modal="admin-generator-modal">&times;</button>
      </div>

      <div class="modal-body">
        <!-- BONUS: 1-Click Quick Generator for WhatsApp Chat -->
        <div class="admin-quick-copy-card">
          <div class="quick-copy-top">
            <span class="badge badge-warning font-bold text-xs">⚡ QUICK GENERATOR FOR WHATSAPP</span>
            <span class="text-xs text-muted">Generate &amp; langsung salin 1 kode ke clipboard untuk dikirim ke chat pembeli WA:</span>
          </div>
          <button type="button" class="btn btn-warning w-full btn-admin-quick-1" id="btn-admin-quick-1">
            ⚡ Buat &amp; Copy 1 Kode Lisensi Sekarang
          </button>
          <div class="admin-quick-display" id="admin-quick-display" style="display: none;">
            <span class="text-xs text-secondary">Kode Berhasil Disalin:</span>
            <code class="quick-code-badge" id="quick-code-text"></code>
            <span class="badge badge-emerald text-xs">✓ Tersalin ke Clipboard</span>
          </div>
        </div>

        <!-- INSPEKSI & RESET STATUS DEVICE LISENSI -->
        <div class="admin-device-inspector-card mb-3" style="background: rgba(16, 185, 129, 0.06); border: 1.5px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 14px 16px;">
          <div class="flex-between align-center mb-1">
            <span class="badge badge-emerald font-bold text-xs">📱 INSPEKSI &amp; CEK DEVICE LISENSI (MAKS. 2 DEVICE)</span>
            <span class="text-xs text-muted">Cek status kuota perangkat pembeli</span>
          </div>
          <p class="text-xs text-secondary mb-2">
            Masukkan kode lisensi pembeli untuk melihat berapa perangkat yang sudah terdaftar atau melakukan reset:
          </p>
          <div style="display: flex; gap: 8px;">
            <input 
              type="text" 
              id="input-admin-check-code" 
              class="form-control form-control-sm font-mono text-uppercase" 
              placeholder="Tempel / ketik kode lisensi pembeli..." 
              style="font-weight: 700; letter-spacing: 0.05em;"
            />
            <button type="button" class="btn btn-primary btn-sm" id="btn-admin-check-code-status" style="white-space: nowrap;">
              🔍 Cek Device
            </button>
          </div>

          <!-- Box Hasil Inspeksi -->
          <div id="admin-device-result-box" style="display: none; margin-top: 12px; background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 12px;">
            <div class="flex-between align-center mb-2">
              <div>
                <strong id="adm-res-code" class="font-mono text-sm" style="color: var(--primary);">JKPRO-XXXX</strong>
                <span id="adm-res-badge" class="badge badge-emerald text-xs ml-2">1 / 2 Device</span>
              </div>
              <button type="button" class="btn btn-outline btn-xs text-danger" id="btn-admin-reset-license-devices">
                🔄 Reset Semua Device
              </button>
            </div>
            <div id="adm-res-device-list" class="text-xs text-secondary space-y-1">
              <!-- Render via JS -->
            </div>
          </div>
        </div>

        <!-- SIMULASI & KONTROL KUOTA HARGA DINAMIS -->
        <div class="admin-pricing-control-card">
          <div class="control-card-header">
            <span class="badge badge-emerald font-bold text-xs">📈 SIMULASI &amp; KONTROL KUOTA HARGA DINAMIS</span>
            <p class="text-xs text-muted mb-0 mt-1">Ubah kuota penjualan untuk menguji lonjakan harga otomatis secara real-time:</p>
          </div>
          <div class="control-current-status mt-2">
            <span class="text-xs">Status Saat Ini: <strong id="admin-current-tier-name">${getCurrentPricingTier().tierName}</strong> &bull; Harga: <strong class="text-emerald font-bold" id="admin-current-tier-price">${formatRupiah(getCurrentPricingTier().price)}</strong> &bull; Terjual: <strong id="admin-current-sold-count">${getSoldCount()} slot</strong></span>
          </div>
          <div class="control-actions-grid mt-2">
            <button type="button" class="btn btn-outline btn-xs btn-set-tier" data-count="0">
              🟢 Set Batch 1 (Awal Bersih 0 - Rp 149rb)
            </button>
            <button type="button" class="btn btn-outline btn-xs btn-set-tier" data-count="55">
              🟡 Simulasi Kuota 50 Terpenuhi → Naik ke Batch 2 (Rp 199rb)
            </button>
            <button type="button" class="btn btn-outline btn-xs btn-set-tier" data-count="105">
              🔴 Simulasi Batch 3 Reguler (Terjual 105 - Rp 299rb)
            </button>
          </div>
          <div class="custom-count-row mt-2 flex-items-center gap-2">
            <span class="text-xs text-muted">Atau masukkan angka manual:</span>
            <input type="number" id="input-custom-sold-count" class="form-control form-control-sm" style="width: 90px;" min="0" value="${getSoldCount()}" />
            <button type="button" class="btn btn-secondary btn-xs" id="btn-save-custom-count">Simpan Kuota</button>
          </div>
        </div>

        <div class="admin-gen-toolbar mt-3">
          <button type="button" class="btn btn-primary btn-sm" id="btn-admin-regen-50">
            ⚡ Generate 50 Kode Baru
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="btn-admin-copy-all">
            📋 Copy Semua Kode
          </button>
          <span class="badge badge-emerald" id="admin-code-count">${initialCodes.length} Kode Siap Jual</span>
        </div>

        <div class="form-group mt-3">
          <label class="form-label text-xs font-mono">Daftar Kode Lisensi (1 Kode per Baris):</label>
          <textarea 
            id="admin-generated-codes" 
            class="form-control font-mono text-xs admin-codes-textarea" 
            rows="10" 
            readonly
          >${initialCodes.join('\n')}</textarea>
        </div>

        <div class="admin-notice-box">
          <p class="text-xs text-secondary">
            💡 <strong>Cara Pakai:</strong> Copy kode di atas, lalu paste ke inventori / produk digital di Scalev / Lynk.id / Mayar. 
            Setiap pembeli akan menerima 1 kode ini dan dapat langsung mengaktifkannya tanpa backend.
          </p>
          <div class="mt-2 text-xs">
            <strong>Master Code Testing:</strong> <code>JKPRO-2026-VIP1</code> &bull; <code>JKPRO-SULTAN-99</code>
          </div>
        </div>
      </div>

      <div class="modal-footer no-print">
        <button type="button" class="btn btn-secondary" data-close-modal="admin-generator-modal">Tutup</button>
      </div>
    </div>
  `;

  // Device Inspector Listeners
  const inputCheckCode = modal.querySelector('#input-admin-check-code');
  const btnCheckCode = modal.querySelector('#btn-admin-check-code-status');
  const resultBox = modal.querySelector('#admin-device-result-box');
  const resCodeEl = modal.querySelector('#adm-res-code');
  const resBadgeEl = modal.querySelector('#adm-res-badge');
  const resDeviceList = modal.querySelector('#adm-res-device-list');
  const btnResetDevices = modal.querySelector('#btn-admin-reset-license-devices');

  const executeCheck = async (codeToInspect) => {
    const code = (codeToInspect || '').trim().toUpperCase();
    if (!code) {
      showToast('Ketik atau paste kode lisensi yang ingin dicek!', 'warning');
      return;
    }

    if (btnCheckCode) {
      btnCheckCode.disabled = true;
      btnCheckCode.textContent = '⏳ Memeriksa...';
    }

    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', code })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal memeriksa status kode lisensi.', 'error');
        if (resultBox) resultBox.style.display = 'none';
        return;
      }

      if (resultBox) resultBox.style.display = 'block';
      if (resCodeEl) resCodeEl.textContent = data.code;

      const count = data.deviceCount || 0;
      const max = data.maxDevices || 2;

      if (resBadgeEl) {
        if (count === 0) {
          resBadgeEl.className = 'badge badge-gray text-xs ml-2';
          resBadgeEl.textContent = '0 / 2 Device (Belum Diaktivasi)';
        } else if (count >= max) {
          resBadgeEl.className = 'badge badge-danger text-xs ml-2 font-bold';
          resBadgeEl.textContent = `${count} / ${max} Device Penuh`;
        } else {
          resBadgeEl.className = 'badge badge-emerald text-xs ml-2 font-bold';
          resBadgeEl.textContent = `${count} / ${max} Device Terdaftar`;
        }
      }

      if (resDeviceList) {
        if (!data.devices || data.devices.length === 0) {
          resDeviceList.innerHTML = '<div class="text-muted text-xs p-1">Belum ada perangkat yang mengaktifkan kode ini. (Kuota 2 perangkat masih utuh).</div>';
        } else {
          resDeviceList.innerHTML = data.devices.map((d, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 4px 6px; background: rgba(0,0,0,0.03); border-radius: 6px; margin-bottom: 4px;">
              <div>
                <strong>Perangkat ${i + 1}: ${d.name || 'Device'}</strong>
                <div class="text-muted" style="font-size: 11px;">ID: ${d.id || '-'} &bull; Waktu: ${d.activatedAt ? new Date(d.activatedAt).toLocaleString('id-ID') : '-'}</div>
              </div>
              <span class="badge badge-blue text-xs">Aktif</span>
            </div>
          `).join('');
        }
      }

      showToast(`Status kode ${data.code}: ${count} dari ${max} device terpakai.`, 'info', 3000);
    } catch (e) {
      showToast('Gagal menghubungi server verifikasi.', 'error');
    } finally {
      if (btnCheckCode) {
        btnCheckCode.disabled = false;
        btnCheckCode.textContent = '🔍 Cek Device';
      }
    }
  };

  if (btnCheckCode && inputCheckCode) {
    btnCheckCode.addEventListener('click', () => executeCheck(inputCheckCode.value));
    inputCheckCode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeCheck(inputCheckCode.value);
      }
    });
  }

  if (btnResetDevices) {
    btnResetDevices.addEventListener('click', async () => {
      const code = inputCheckCode ? inputCheckCode.value.trim().toUpperCase() : '';
      if (!code) return;

      if (!confirm(`Yakin ingin mereset seluruh perangkat untuk lisensi ${code}? Pembeli dapat mendaftarkan 2 perangkat baru lagi.`)) {
        return;
      }

      btnResetDevices.disabled = true;
      btnResetDevices.textContent = '⏳ Mereset...';

      try {
        const res = await fetch('/api/license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_devices', code })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Perangkat berhasil di-reset!', 'success');
          executeCheck(code);
        } else {
          showToast(data.message || 'Gagal mereset perangkat.', 'error');
        }
      } catch (err) {
        showToast('Terjadi kesalahan saat mereset.', 'error');
      } finally {
        btnResetDevices.disabled = false;
        btnResetDevices.textContent = '🔄 Reset Semua Device';
      }
    });
  }

  // Quick 1 Code Generator Listener
  const btnQuick1 = modal.querySelector('#btn-admin-quick-1');
  const quickDisplay = modal.querySelector('#admin-quick-display');
  const quickCodeText = modal.querySelector('#quick-code-text');

  if (btnQuick1) {
    btnQuick1.addEventListener('click', () => {
      const singleCode = generateLicenseCode();
      navigator.clipboard.writeText(singleCode).then(() => {
        showToast(`⚡ Kode lisensi ${singleCode} berhasil disalin ke clipboard! Siap kirim ke pembeli.`, 'success', 5000);
      }).catch(() => {
        showToast(`⚡ Kode lisensi ${singleCode} siap dipakai!`, 'success', 5000);
      });
      if (quickDisplay && quickCodeText) {
        quickDisplay.style.display = 'flex';
        quickCodeText.textContent = singleCode;
      }
    });
  }

  // 50 Batch Regeneator Listeners
  const textarea = modal.querySelector('#admin-generated-codes');
  const btnRegen = modal.querySelector('#btn-admin-regen-50');
  const btnCopy = modal.querySelector('#btn-admin-copy-all');
  const countBadge = modal.querySelector('#admin-code-count');

  if (btnRegen && textarea) {
    btnRegen.addEventListener('click', () => {
      const freshCodes = generateBatchCodes(50);
      textarea.value = freshCodes.join('\n');
      if (countBadge) countBadge.textContent = `${freshCodes.length} Kode Siap Jual`;
      showToast('⚡ 50 Kode lisensi PRO baru berhasil di-generate!', 'success');
    });
  }

  if (btnCopy && textarea) {
    btnCopy.addEventListener('click', () => {
      textarea.select();
      navigator.clipboard.writeText(textarea.value).then(() => {
        showToast('📋 50 Kode lisensi berhasil disalin ke clipboard!', 'success');
      }).catch(() => {
        document.execCommand('copy');
        showToast('📋 Kode berhasil disalin!', 'success');
      });
    });
  }

  // Admin Pricing Control Listeners
  const updateAdminTierDisplay = (newCount) => {
    const updated = getCurrentPricingTier(newCount);
    const tierNameEl = modal.querySelector('#admin-current-tier-name');
    const tierPriceEl = modal.querySelector('#admin-current-tier-price');
    const soldCountEl = modal.querySelector('#admin-current-sold-count');
    const inputCount = modal.querySelector('#input-custom-sold-count');
    if (tierNameEl) tierNameEl.textContent = updated.tierName;
    if (tierPriceEl) tierPriceEl.textContent = formatRupiah(updated.price);
    if (soldCountEl) soldCountEl.textContent = `${updated.soldCount} slot`;
    if (inputCount) inputCount.value = updated.soldCount;
    showToast(`📈 Kuota diubah ke ${updated.soldCount}! Tier aktif: ${updated.tierName} (${formatRupiah(updated.price)})`, 'success', 4000);
  };

  modal.querySelectorAll('.btn-set-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetCount = parseInt(btn.getAttribute('data-count'), 10) || 0;
      setSoldCount(targetCount);
      updateAdminTierDisplay(targetCount);
    });
  });

  const btnSaveCustom = modal.querySelector('#btn-save-custom-count');
  if (btnSaveCustom) {
    btnSaveCustom.addEventListener('click', () => {
      const input = modal.querySelector('#input-custom-sold-count');
      const val = input ? parseInt(input.value, 10) : 0;
      setSoldCount(val);
      updateAdminTierDisplay(val);
    });
  }

  openModal('admin-generator-modal');
}
