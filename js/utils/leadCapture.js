/**
 * Juragankosan Lead Capture & Google Sheets Integration
 * Mengirim data calon pelanggan (Nama, Kos, No. WA) langsung ke Google Sheets secara real-time via Apps Script Webhook.
 * 100% Gratis, tanpa backend server berbayar.
 */
import { store } from '../state.js';

export const LEAD_CAPTURE_CONFIG = {
  // URL Deployment Google Apps Script resmi pemilik Juragankosan
  defaultWebhookUrl: 'https://script.google.com/macros/s/AKfycbwUiiDN_-vQL-tqPrESkEYEBYkheo2Etm5N8J1ROVqUUiC-DVvUE1v_tqMtHSHz14hjsA/exec',
  storageKey: 'juragankos_google_sheet_webhook'
};

/**
 * Dapatkan URL Webhook Google Sheet aktif (dari settings / localStorage / default config)
 */
export function getGoogleSheetWebhookUrl() {
  try {
    const fromSettings = store.getSettings()?.googleSheetWebhook;
    if (fromSettings && fromSettings.trim().startsWith('http')) {
      return fromSettings.trim();
    }
    const fromStorage = localStorage.getItem(LEAD_CAPTURE_CONFIG.storageKey);
    if (fromStorage && fromStorage.trim().startsWith('http')) {
      return fromStorage.trim();
    }
  } catch (e) {}
  return LEAD_CAPTURE_CONFIG.defaultWebhookUrl;
}

/**
 * Simpan URL Webhook Google Sheet kustom
 */
export function setGoogleSheetWebhookUrl(url) {
  const clean = (url || '').trim();
  try {
    localStorage.setItem(LEAD_CAPTURE_CONFIG.storageKey, clean);
    store.updateSettings({ googleSheetWebhook: clean });
  } catch (e) {}
  return clean;
}

/**
 * Kirim data calon pelanggan ke Google Sheets secara background (Non-blocking)
 * Menggunakan mode: 'no-cors' agar request Google Apps Script sukses tanpa terhalang CORS browser.
 */
export async function sendLeadToGoogleSheet(leadData) {
  const webhookUrl = getGoogleSheetWebhookUrl();

  const payload = {
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium'
    }),
    ownerName: leadData.ownerName || 'Calon Konsumen',
    kosName: leadData.kosName || 'Kost Baru',
    ownerPhone: leadData.ownerPhone || '-',
    securityPin: leadData.securityPin || '1234',
    roomCount: leadData.roomCount || 0,
    source: leadData.source || 'Juragankosan Web App (Onboarding)',
    appVersion: 'v6.3',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  };

  // Simpan lead terakhir di localStorage sebagai cadangan offline
  try {
    const history = JSON.parse(localStorage.getItem('juragankos_lead_cache') || '[]');
    history.unshift(payload);
    localStorage.setItem('juragankos_lead_cache', JSON.stringify(history.slice(0, 50)));
  } catch (e) {}

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.info('ℹ️ Lead Capture: URL Google Sheet Webhook belum diatur. Data tersimpan di profil aplikasi.');
    return { success: true, offline: true, payload };
  }

  try {
    // Mode 'no-cors' sangat penting untuk Google Apps Script Web App
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Lead berhasil dikirim ke Google Sheets:', payload.ownerName, payload.ownerPhone);
    return { success: true, payload };
  } catch (err) {
    console.warn('⚠️ Gagal mengirim lead ke Google Sheets (koneksi offline/timeout):', err);
    return { success: false, error: err, payload };
  }
}
