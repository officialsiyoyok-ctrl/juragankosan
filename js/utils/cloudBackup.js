/**
 * Juragankosan Silent Cloud Safety Vault Client
 * 
 * Melakukan sinkronisasi cadangan otomatis di belakang layar ke Cloud Vault
 * menggunakan identitas No. WhatsApp Pemilik Kos & PIN Keamanan.
 * Mengantisipasi kehilangan data saat HP diservis, ganti HP baru, atau cache terhapus.
 */
import { cleanWhatsAppNumber } from './formatter.js?v=2.5';
import { getLicense, getLicenseStatus } from './license.js?v=6.4';

const CLOUD_SYNC_STORAGE_KEY = 'juragankos_cloud_sync_meta';
const BACKUP_ENDPOINT = '/api/backup';
const MIN_SYNC_INTERVAL_MS = 60 * 1000; // 1 menit throttle kecuali forced

let syncTimeout = null;

/**
 * Ambil metadata sinkronisasi cloud terakhir dari localStorage
 */
export function getCloudSyncMeta() {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * Simpan metadata sinkronisasi cloud
 */
function setCloudSyncMeta(meta) {
  try {
    localStorage.setItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(meta));
    window.dispatchEvent(new CustomEvent('juragankos:cloud_sync_updated', { detail: meta }));
  } catch (e) {}
}

/**
 * Picu sinkronisasi cloud di belakang layar dengan Debounce (misal 5 detik setelah perubahan)
 */
export function queueCloudSync(data, delayMs = 5000) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncToCloudVault(data, { silent: true });
  }, delayMs);
}

/**
 * Eksekusi pengiriman cadangan ke Cloud Safety Vault
 */
export async function syncToCloudVault(data, options = {}) {
  const { silent = false, force = false } = options;

  if (!navigator.onLine) {
    if (!silent) console.log('Cloud sync skipped: Perangkat sedang offline.');
    return { success: false, status: 'offline', message: 'Perangkat sedang tidak terhubung ke internet.' };
  }

  if (!data || !Array.isArray(data.rooms)) {
    return { success: false, status: 'invalid_data', message: 'Data kos tidak valid.' };
  }

  const rawPhone = data.settings?.ownerPhone || '';
  const cleanPhone = cleanWhatsAppNumber(rawPhone);

  if (!cleanPhone || cleanPhone.length < 9) {
    const meta = {
      status: 'no_phone',
      message: 'Nomor WhatsApp Pemilik belum diisi di menu Pengaturan.',
      timestamp: Date.now()
    };
    setCloudSyncMeta(meta);
    return { success: false, status: 'no_phone', message: meta.message };
  }

  // Throttle check
  const lastMeta = getCloudSyncMeta();
  const now = Date.now();
  if (!force && lastMeta && lastMeta.timestamp && (now - lastMeta.timestamp < MIN_SYNC_INTERVAL_MS)) {
    return { success: true, status: 'throttled', message: 'Sinkronisasi cloud baru saja dilakukan.' };
  }

  const licenseStatus = typeof getLicenseStatus === 'function' ? getLicenseStatus() : (typeof getLicense === 'function' ? getLicense() : null);
  const licenseKey = licenseStatus?.code || '';
  const securityPin = data.settings?.securityPin || '1234';
  const kosName = data.settings?.kosName || 'Juragankosan';
  const ownerName = data.settings?.ownerName || '';

  const payload = {
    phone: cleanPhone,
    kosName,
    ownerName,
    licenseKey,
    pin: securityPin,
    summary: {
      roomsCount: data.rooms.length,
      tenantsCount: (data.tenants || []).length,
      billsCount: (data.bills || []).length,
      expensesCount: (data.expenses || []).length,
      incomesCount: (data.incomes || []).length,
      clientVersion: '6.3'
    },
    data: data,
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(BACKUP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      const meta = {
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        timestamp: Date.now(),
        phone: cleanPhone,
        kosName,
        summary: payload.summary,
        message: 'Tersinkron otomatis ke Cloud Vault.'
      };
      setCloudSyncMeta(meta);
      return { success: true, status: 'synced', meta };
    } else {
      const meta = {
        status: 'error',
        lastAttempt: new Date().toISOString(),
        timestamp: Date.now(),
        phone: cleanPhone,
        message: result.message || 'Gagal menyinkronkan data ke Cloud Vault.'
      };
      setCloudSyncMeta(meta);
      return { success: false, status: 'error', message: meta.message };
    }
  } catch (err) {
    // Silent fail in background agar tidak memutus kenyamanan pengguna
    if (!silent) {
      console.warn('Gagal menghubungi endpoint Cloud Backup:', err);
    }
    const meta = {
      status: 'network_error',
      lastAttempt: new Date().toISOString(),
      timestamp: Date.now(),
      phone: cleanPhone,
      message: 'Koneksi ke server Cloud Vault terputus. Sistem akan mencoba lagi nanti.'
    };
    setCloudSyncMeta(meta);
    return { success: false, status: 'network_error', message: meta.message };
  }
}

/**
 * Cari dan ambil file cadangan dari Cloud Vault berdasarkan Nomor WhatsApp & PIN/Lisensi
 */
export async function fetchCloudBackup(phone, pin = '') {
  if (!navigator.onLine) {
    return { success: false, message: 'Tidak ada koneksi internet. Sambungkan ke WiFi/kuota untuk memulihkan dari cloud.' };
  }

  const clean = cleanWhatsAppNumber(phone);
  if (!clean || clean.length < 9) {
    return { success: false, message: 'Nomor WhatsApp tidak valid (minimal 10 digit).' };
  }

  const url = `${BACKUP_ENDPOINT}?phone=${encodeURIComponent(clean)}&pin=${encodeURIComponent(pin.trim())}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await res.json();

    if (res.ok && result.success && result.backup) {
      return {
        success: true,
        backup: result.backup,
        summary: result.summary,
        updatedAt: result.updatedAt,
        message: 'Data cadangan cloud berhasil ditemukan!'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Tidak ditemukan arsip data untuk nomor WhatsApp tersebut.'
      };
    }
  } catch (err) {
    return {
      success: false,
      message: 'Gagal menghubungi server Cloud Backup. Pastikan koneksi internet stabil.'
    };
  }
}
