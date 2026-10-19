/**
 * Juragankosan App Lock (Layar Kunci PIN Keamanan)
 * Sinkron 100% dengan state.settings.securityPin (Pengaturan Kos & Zona Bahaya)
 */
import { store } from '../state.js?v=2.5';
import { showToast } from './modal.js?v=2.5';

let pinBuffer = '';

export function getTargetPinLength() {
  const pin = store.getSettings()?.securityPin || (typeof store.getSecurityPin === 'function' ? store.getSecurityPin() : '1234');
  const len = String(pin).trim().length;
  return (len >= 4 && len <= 6) ? len : 4;
}

export function renderPinDots() {
  const dotsContainer = document.getElementById('app-lock-dots');
  if (!dotsContainer) return;
  const targetLength = getTargetPinLength();
  dotsContainer.innerHTML = '';
  for (let i = 0; i < targetLength; i++) {
    const dot = document.createElement('span');
    dot.className = 'lock-dot pin-dot';
    dot.setAttribute('data-idx', String(i));
    dotsContainer.appendChild(dot);
  }
}

export function isAppLocked() {
  return store.isAppLocked();
}

export function showLockScreen() {
  const overlay = document.getElementById('app-lock-overlay');
  const card = document.getElementById('app-lock-card');
  const errorEl = document.getElementById('app-lock-error');

  document.documentElement.classList.remove('app-unlocked');

  if (overlay) {
    overlay.classList.remove('app-lock-hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  if (card) {
    card.classList.remove('lock-card-shake');
  }

  if (errorEl) {
    errorEl.classList.add('hidden');
  }

  pinBuffer = '';
  renderPinDots();
  updatePinUI();
}

export function hideLockScreen() {
  const overlay = document.getElementById('app-lock-overlay');
  document.documentElement.classList.add('app-unlocked');

  if (overlay) {
    overlay.classList.add('app-lock-hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  pinBuffer = '';
  updatePinUI();
}

export function lockApp() {
  store.lockApp();
  showLockScreen();
  showToast('Aplikasi telah dikunci.', 'info');
}

function updatePinUI() {
  const dots = document.querySelectorAll('#app-lock-dots .lock-dot, #app-lock-dots .pin-dot');
  const errorEl = document.getElementById('app-lock-error');

  dots.forEach((dot, idx) => {
    if (idx < pinBuffer.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });

  // Sembunyikan error jika user mulai mengetik ulang
  if (errorEl && !errorEl.classList.contains('hidden') && pinBuffer.length > 0) {
    errorEl.classList.add('hidden');
  }
}

function submitPin() {
  const card = document.getElementById('app-lock-card');
  const errorEl = document.getElementById('app-lock-error');
  const errorText = document.getElementById('app-lock-error-text');

  const enteredPin = pinBuffer.trim();

  if (!enteredPin) {
    if (errorText) errorText.textContent = 'Masukkan PIN terlebih dahulu!';
    if (errorEl) errorEl.classList.remove('hidden');
    shakeLockCard();
    return;
  }

  // Verifikasi langsung dengan PIN di state.settings
  const isCorrect = store.unlockApp(enteredPin);

  if (isCorrect) {
    if (errorEl) errorEl.classList.add('hidden');
    hideLockScreen();
    showToast('Aplikasi berhasil dibuka!', 'success');
  } else {
    if (errorText) errorText.textContent = 'PIN salah! Silakan coba lagi.';
    if (errorEl) errorEl.classList.remove('hidden');
    shakeLockCard();

    // Reset buffer setelah PIN salah agar user bisa ketik ulang
    pinBuffer = '';
    updatePinUI();
  }
}

function shakeLockCard() {
  const card = document.getElementById('app-lock-card');
  if (!card) return;
  card.classList.remove('lock-card-shake');
  void card.offsetWidth; // Trigger reflow
  card.classList.add('lock-card-shake');
  setTimeout(() => {
    card.classList.remove('lock-card-shake');
  }, 500);
}

export function initAppLock() {
  const keypad = document.getElementById('app-lock-keypad');
  const btnUnlock = document.getElementById('btn-app-unlock');
  const btnSidebarLock = document.getElementById('btn-sidebar-lock-app');
  const btnTopbarLock = document.getElementById('btn-topbar-lock-app');

  // Render indikator titik dinamis sesuai panjang PIN
  renderPinDots();

  // Periksa status terkunci pada saat startup
  if (isAppLocked()) {
    showLockScreen();
  } else {
    hideLockScreen();
  }

  // 1. On-Screen Keypad Event Delegation
  if (keypad) {
    keypad.addEventListener('click', (e) => {
      const target = e.target.closest('.lock-key-btn');
      if (!target) return;

      const key = target.getAttribute('data-key');
      const action = target.getAttribute('data-action');

      if (key !== null) {
        const targetLength = getTargetPinLength();
        if (pinBuffer.length < targetLength) {
          pinBuffer += key;
          updatePinUI();
          if (pinBuffer.length === targetLength) {
            setTimeout(() => {
              submitPin();
            }, 100);
          }
        }
      } else if (action === 'clear') {
        pinBuffer = '';
        updatePinUI();
      } else if (action === 'backspace') {
        pinBuffer = pinBuffer.slice(0, -1);
        updatePinUI();
      }
    });
  }

  // 2. Tombol "Masuk"
  if (btnUnlock) {
    btnUnlock.addEventListener('click', (e) => {
      e.preventDefault();
      submitPin();
    });
  }

  // 3. Global Keyboard Listener saat Layar Kunci aktif (Mengetik angka, Backspace, Enter, Esc)
  window.addEventListener('keydown', (e) => {
    if (isAppLocked()) {
      if (/^[0-9]$/.test(e.key)) {
        const targetLength = getTargetPinLength();
        if (pinBuffer.length < targetLength) {
          pinBuffer += e.key;
          updatePinUI();
          if (pinBuffer.length === targetLength) {
            setTimeout(() => {
              submitPin();
            }, 100);
          }
        }
      } else if (e.key === 'Backspace') {
        pinBuffer = pinBuffer.slice(0, -1);
        updatePinUI();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitPin();
      } else if (e.key === 'Escape') {
        pinBuffer = '';
        updatePinUI();
      }
    }
  });

  // 4. Tombol Kunci Aplikasi (Sidebar & Topbar)
  if (btnSidebarLock) {
    btnSidebarLock.addEventListener('click', (e) => {
      e.preventDefault();
      lockApp();
    });
  }

  if (btnTopbarLock) {
    btnTopbarLock.addEventListener('click', (e) => {
      e.preventDefault();
      lockApp();
    });
  }

  // 5. Event listeners dari state (jika terjadi penguncian programatik)
  window.addEventListener('juragankos:app_locked', () => {
    showLockScreen();
  });

  window.addEventListener('juragankos:app_unlocked', () => {
    hideLockScreen();
  });

  // 6. Sinkronisasi jika PIN diubah di menu Pengaturan
  if (typeof store.subscribe === 'function') {
    store.subscribe(() => {
      renderPinDots();
      updatePinUI();
    });
  }
}

