/**
 * Juragankosan Welcome & Onboarding Wizard
 * Menyambut calon pengguna baru, mempersonalisasi nama kos, mengatur PIN pribadi,
 * dan menangkap lead ke Google Sheets tanpa membuat pengguna merasa ribet.
 */
import { store } from '../state.js?v=2.5';
import { cleanWhatsAppNumber } from './formatter.js?v=2.5';
import { showToast } from './modal.js?v=2.5';
import { sendLeadToGoogleSheet } from './leadCapture.js?v=5.2';

export const ONBOARDING_STORAGE_KEY = 'juragankos_onboarded';

/**
 * Periksa apakah pengguna saat ini sudah melewati tahap onboarding
 */
export function isOnboarded() {
  try {
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true') {
      return true;
    }

    // Kompatibilitas mundur: jika data kos sudah pernah diisi sebelumnya, anggap sudah onboarded
    const stored = localStorage.getItem('juragankos_data_v1') || localStorage.getItem('juragankos_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        (Array.isArray(parsed?.rooms) && parsed.rooms.length > 0) ||
        (parsed?.settings?.ownerName && parsed.settings.ownerName.trim() !== '')
      ) {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        return true;
      }
    }
  } catch (e) {}
  return false;
}

/**
 * Tampilkan modal onboarding
 */
export function showOnboardingOverlay() {
  const overlay = document.getElementById('welcome-onboarding-overlay');
  if (!overlay) return;

  // Pastikan aplikasi tidak terkunci oleh layar PIN saat onboarding berlangsung
  document.documentElement.classList.add('app-unlocked');

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  // Autofocus ke input nama pemilik
  setTimeout(() => {
    const inputName = document.getElementById('onboarding-owner-name');
    if (inputName) inputName.focus();
  }, 200);
}

/**
 * Sembunyikan modal onboarding dengan animasi halus
 */
export function hideOnboardingOverlay() {
  const overlay = document.getElementById('welcome-onboarding-overlay');
  if (!overlay) return;

  overlay.classList.add('onboarding-fade-out');
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('onboarding-fade-out');
    overlay.setAttribute('aria-hidden', 'true');
  }, 280);
}

/**
 * Inisialisasi flow onboarding pada saat aplikasi startup
 */
export function initOnboarding() {
  const overlay = document.getElementById('welcome-onboarding-overlay');
  const form = document.getElementById('onboarding-form');
  const inputPin = document.getElementById('onboarding-pin');

  // Bila diklik atau difokuskan saat masih bernilai default '1234', langsung hapus agar user bisa langsung ketik PIN baru
  if (inputPin) {
    inputPin.addEventListener('focus', () => {
      if (inputPin.value === '1234') {
        inputPin.value = '';
      }
    });

    inputPin.addEventListener('click', () => {
      if (inputPin.value === '1234') {
        inputPin.value = '';
      }
    });

    // Jika dikosongkan lalu klik di luar (blur) tanpa mengetik apa-apa, kembalikan ke default '1234'
    inputPin.addEventListener('blur', () => {
      if (!inputPin.value.trim()) {
        inputPin.value = '1234';
      }
    });
  }

  if (!isOnboarded()) {
    // Pengguna baru: bypass PIN lock dan tampilkan formulir selamat datang
    document.documentElement.classList.add('app-unlocked');
    showOnboardingOverlay();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inputName = document.getElementById('onboarding-owner-name');
      const inputKos = document.getElementById('onboarding-kos-name');
      const inputPhone = document.getElementById('onboarding-owner-phone');
      const inputPin = document.getElementById('onboarding-pin');
      const btnSubmit = document.getElementById('btn-onboarding-submit');

      const ownerName = inputName ? inputName.value.trim() : '';
      const kosName = inputKos ? inputKos.value.trim() : '';
      const ownerPhoneRaw = inputPhone ? inputPhone.value.trim() : '';
      let pin = inputPin ? inputPin.value.trim() : '';

      // 1. Validasi Nama
      if (!ownerName || ownerName.length < 2) {
        showToast('Mohon masukkan nama Anda dengan benar!', 'warning');
        if (inputName) inputName.focus();
        return;
      }

      // 2. Validasi Nama Kos
      if (!kosName || kosName.length < 2) {
        showToast('Mohon masukkan nama kos/kontrakan Anda!', 'warning');
        if (inputKos) inputKos.focus();
        return;
      }

      // 3. Validasi Nomor WhatsApp
      const cleanPhone = cleanWhatsAppNumber(ownerPhoneRaw);
      if (!cleanPhone || cleanPhone.length < 9) {
        showToast('Nomor WhatsApp tidak valid. Masukkan nomor HP aktif (contoh: 081234567890)', 'warning');
        if (inputPhone) inputPhone.focus();
        return;
      }

      // 4. Validasi PIN Keamanan
      if (!pin) {
        pin = '1234';
      } else if (!/^\d{4,6}$/.test(pin)) {
        showToast('PIN Keamanan harus terdiri dari 4 sampai 6 digit angka!', 'warning');
        if (inputPin) inputPin.focus();
        return;
      }

      // Ubah state tombol menjadi loading
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
          <svg class="animate-spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;display:inline-block;margin-right:8px;vertical-align:middle;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          <span>Menyiapkan Kos Anda...</span>
        `;
      }

      // Simpan pengaturan profil kos & PIN keamanan baru
      store.updateSettings({
        ownerName: ownerName,
        kosName: kosName,
        ownerPhone: cleanPhone,
        securityPin: pin
      });

      // Tandai bahwa onboarding telah selesai & unlock sesi aplikasi
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        sessionStorage.setItem('juragankos_app_unlocked', 'true');
      } catch (err) {}

      // Buka kunci aplikasi di store
      store.unlockApp(pin);

      // Kirim data calon konsumen (Lead) ke Google Sheets secara background
      sendLeadToGoogleSheet({
        ownerName,
        kosName,
        ownerPhone: cleanPhone,
        securityPin: pin,
        source: 'Formulir Onboarding Pengguna Baru'
      }).catch(() => {});

      // Berikan jeda sejenak untuk efek transisi mulus
      setTimeout(() => {
        hideOnboardingOverlay();

        // Update header & nama kos di tampilan dashboard
        if (window.juraganApp) {
          window.juraganApp.updateKosHeader();
          if (typeof window.juraganApp.navigateTo === 'function') {
            window.juraganApp.navigateTo('dashboard');
          }
        }

        // Tampilkan sambutan ramah
        showToast(`🎉 Selamat datang, ${ownerName}! Kos "${kosName}" siap dikelola.`, 'success', 4500);

        // Reset tombol
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>🚀 Mulai Kelola Kos Saya Gratis</span>';
        }

        // Trigger custom event untuk komponen lain
        window.dispatchEvent(new CustomEvent('juragankos:onboarding_completed', {
          detail: { ownerName, kosName, ownerPhone: cleanPhone }
        }));
      }, 500);
    });
  }
}
