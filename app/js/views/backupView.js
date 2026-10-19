/**
 * Juragankosan Backup, Restore & Data Security View (Tab 7: Pusat Backup & Data)
 */
import { store } from '../state.js?v=2.5';
import { showToast, showConfirmModal, openModal, closeModal } from '../utils/modal.js?v=2.5';
import { isPro, openUpgradeModal } from '../utils/license.js?v=4.1';

export function renderBackup(container) {
  const isProUser = isPro();
  const rooms = store.getRooms();
  const tenants = store.getTenants();
  const bills = store.getBills();
  const expenses = store.getExpenses();
  const incomes = store.getIncomes ? store.getIncomes() : [];

  container.innerHTML = `
    <div class="backup-view-container">
      <div class="view-header">
        <div class="view-header-title">
          <h1 class="page-title">Pusat Backup &amp; Keamanan Data</h1>
          <p class="page-subtitle">Kelola file cadangan JSON, pulihkan data, atau reset database kos Anda dengan aman &amp; 100% offline</p>
        </div>
      </div>

      <div class="backup-grid-2col">
        <!-- KOLOM KIRI: PANEL AKSI UTAMA (INTERAKTIF) -->
        <div class="backup-col-actions">
          
          <!-- BAGIAN 1: PENCADANGAN DATA (EXPORT) -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-emerald">BAGIAN 1: PENCADANGAN DATA (EXPORT)</span>
          </div>
          <div class="settings-card backup-action-card card-accent-emerald">
            <div class="settings-card-header">
              <div class="settings-icon bg-emerald-subtle text-emerald">📥</div>
              <div class="flex-1">
                <div class="flex-between align-center gap-2">
                  <h3 class="settings-card-title">Download Arsip Backup JSON</h3>
                  <span class="badge ${isProUser ? 'badge-emerald font-bold text-xs' : 'badge-warning font-bold text-xs'} backup-pro-badge">
                    ${isProUser ? '✓ FITUR PRO AKTIF' : '🔒 FITUR PRO'}
                  </span>
                </div>
                <p class="settings-card-desc mt-1">
                  Download seluruh database kos (kamar, penyewa, tagihan sewa, dan pengeluaran) ke dalam satu file arsip cadangan <code>.json</code>.
                </p>
              </div>
            </div>

            <div class="backup-meta-pills mb-3">
              <span class="meta-pill">🏠 ${rooms.length} Kamar</span>
              <span class="meta-pill">👥 ${tenants.length} Penyewa</span>
              <span class="meta-pill">🧾 ${bills.length} Tagihan</span>
              <span class="meta-pill">📥 ${incomes.length} Pemasukan</span>
              <span class="meta-pill">💸 ${expenses.length} Pengeluaran</span>
            </div>

            ${isProUser ? `
              <div class="backup-btn-area">
                <button type="button" class="btn btn-primary btn-lg w-full btn-download-backup" id="btn-backup-download">
                  <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                  <span>📥 Download Arsip Backup JSON</span>
                </button>
                <div class="text-xs text-muted text-center mt-2 font-mono">
                  Nama File: <strong>Juragankosan-Backup-[Tanggal].json</strong>
                </div>
              </div>
            ` : `
              <div class="backup-free-lock-box">
                <div class="free-lock-content">
                  <span class="lock-icon">🔒</span>
                  <div>
                    <strong>Fitur Download Backup JSON Terkunci pada Paket Gratis</strong>
                    <p class="text-xs text-muted mb-0">Upgrade ke Juragankosan PRO seumur hidup untuk mengunduh arsip database kos kapan saja tanpa batas.</p>
                  </div>
                </div>
                <button type="button" class="btn btn-warning w-full mt-3 btn-upgrade-backup-pro" id="btn-backup-upgrade">
                  👑 Upgrade ke PRO untuk Backup
                </button>
              </div>
            `}
          </div>

          <!-- BAGIAN 2: PEMULIHAN DATA (RESTORE) -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-blue">BAGIAN 2: PEMULIHAN DATA (RESTORE)</span>
          </div>
          <div class="settings-card backup-action-card card-accent-blue">
            <div class="settings-card-header">
              <div class="settings-icon bg-blue-subtle text-blue">📂</div>
              <div>
                <h3 class="settings-card-title">Import &amp; Pulihkan Data</h3>
                <p class="settings-card-desc">
                  Pulihkan data kos Anda dari file arsip cadangan <code>.json</code> yang pernah didownload sebelumnya (misal dari HP lama atau backup minggu lalu).
                </p>
              </div>
            </div>

            <div class="import-notice-box mb-3">
              <span class="text-xs text-secondary">
                💡 <strong>Perhatian:</strong> Data kamar dan transaksi di perangkat ini akan disinkronkan &amp; diperbarui mengikuti data yang ada di dalam file cadangan JSON yang Anda pilih.
              </span>
            </div>

            <label class="btn btn-outline btn-lg w-full btn-file-upload">
              <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>📂 Pilih File Backup JSON (.json)</span>
              <input type="file" id="backup-file-input" accept=".json" style="display:none;" />
            </label>
          </div>

          <!-- BAGIAN 3: ALAT BANTU SIMULASI -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-gray">BAGIAN 3: ALAT BANTU SIMULASI</span>
          </div>
          <div class="settings-card backup-action-card card-accent-gray">
            <div class="settings-card-header">
              <div class="settings-icon bg-amber-subtle text-amber">🔄</div>
              <div>
                <h3 class="settings-card-title">Muat Ulang Data Sampel Demo</h3>
                <p class="settings-card-desc">
                  Muat data demonstrasi bawaan (6 kamar kos realistis, 4 penyewa aktif, dan simulasi tagihan sewa) untuk mencoba seluruh alur aplikasi.
                </p>
              </div>
            </div>

            <button type="button" class="btn btn-outline w-full" id="btn-backup-sample">
              🔄 Muat Data Sampel Demo
            </button>
          </div>

          <!-- BAGIAN 4: ZONA BAHAYA (RESET DATABASE) -->
          <div class="backup-section-header mt-3">
            <span class="backup-section-tag tag-danger">BAGIAN 4: ZONA BAHAYA (RESET DATABASE)</span>
          </div>
          <div class="settings-card backup-action-card border-danger-subtle card-danger-zone card-accent-red">
            <div class="settings-card-header">
              <div class="settings-icon bg-red-subtle text-danger">⚠️</div>
              <div>
                <h3 class="settings-card-title text-danger">Zona Bahaya: Reset Semua Data</h3>
                <p class="settings-card-desc">
                  Hapus total seluruh data kamar, database penyewa, riwayat tagihan, dan pengeluaran dari browser ini untuk memulai pembukuan dari nol (0 unit).
                </p>
              </div>
            </div>

            <div class="danger-warning-note mb-3">
              <span class="text-xs text-danger font-medium">
                🛑 <strong>Tindakan Permanen:</strong> Pastikan Anda telah mendownload arsip cadangan JSON sebelum melakukan reset database!
              </span>
            </div>

            <div class="danger-card-pin-box mb-3">
              <label for="input-card-reset-pin" class="form-label font-bold text-danger text-xs mb-1">
                Ketik PIN Keamanan untuk Membuka Tombol Reset:
              </label>
              <div class="pin-input-field-wrap">
                <input 
                  type="password" 
                  id="input-card-reset-pin" 
                  class="form-control font-mono text-center input-security-pin-lg" 
                  placeholder="••••" 
                  maxlength="6" 
                  inputmode="numeric" 
                  autocomplete="off" 
                />
                <button type="button" class="btn-toggle-pin-field" id="btn-toggle-card-reset-eye" title="Lihat/Sembunyikan PIN">👁️</button>
              </div>
              <div id="card-reset-pin-status-msg" class="reset-pin-status-msg text-xs mt-1 text-muted text-center">
                Ketik PIN keamanan (standar: 1234) untuk mengaktifkan tombol.
              </div>
            </div>

            <button type="button" class="btn btn-danger w-full btn-danger-reset-all" id="btn-danger-card-reset-execute" disabled>
              ⚠️ Ya, Kosongkan Semua Data Kos
            </button>
          </div>

        </div>

        <!-- KOLOM KANAN: PANDUAN, MANFAAT & HIMBAUAN RUTIN (EDUKASI PENGGUNA) -->
        <div class="backup-col-guide">
          
          <!-- 1. Kenapa Data Anda Sangat Aman? -->
          <div class="settings-card guide-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">🛡️</span>
              <h3 class="guide-title">Kenapa Data Anda Sangat Aman?</h3>
            </div>
            <p class="guide-desc">
              Semua data operasional kos, identitas penyewa, dan catatan keuangan tersimpan aman secara <strong>100% offline</strong> di dalam memori peramban (browser) perangkat Anda menggunakan teknologi <em>Modern LocalStorage</em>.
            </p>
            <div class="guide-highlight-box">
              <div class="highlight-item">
                <span class="item-check">✓</span>
                <span><strong>Tanpa Server Luar:</strong> Tidak ada data privasi Anda yang dikirim atau dijual ke server pihak ketiga manapun.</span>
              </div>
              <div class="highlight-item">
                <span class="item-check">✓</span>
                <span><strong>Bisa Diakses Tanpa Internet:</strong> Anda tetap bisa mencatat tagihan dan cetak kwitansi di saat kuota internet habis.</span>
              </div>
            </div>
          </div>

          <!-- 2. Manfaat Rutin Melakukan Backup JSON -->
          <div class="settings-card guide-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">💡</span>
              <h3 class="guide-title">Manfaat Rutin Melakukan Backup JSON</h3>
            </div>
            <ul class="guide-benefits-list">
              <li>
                <div class="benefit-bullet">📲</div>
                <div>
                  <strong>Pindah Perangkat Sangat Mudah (5 Detik)</strong>
                  <p>Mau ganti dari HP Android ke iPhone, atau ingin kelola kos lewat Laptop? Cukup download backup di HP lama dan upload di Laptop/HP baru.</p>
                </div>
              </li>
              <li>
                <div class="benefit-bullet">🛡️</div>
                <div>
                  <strong>Antisipasi HP Hilang, Rusak &amp; Bersih-bersih Cache</strong>
                  <p>Jika HP terkena reset pabrik atau dibersihkan oleh aplikasi cleaner, data kos Anda tetap 100% selamat selama Anda memiliki salinan file <code>.json</code>.</p>
                </div>
              </li>
              <li>
                <div class="benefit-bullet">💼</div>
                <div>
                  <strong>Bebas Ketergantungan Selamanya</strong>
                  <p>Arsip file JSON adalah format standar internasional. Data pembukuan kos Anda adalah milik Anda seutuhnya tanpa biaya sewa cloud bulanan.</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- 3. Himbauan Rutin (Best Practice Juragankosan) -->
          <div class="settings-card guide-card routine-callout-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">⏰</span>
              <h3 class="guide-title text-amber">Himbauan Rutin (Best Practice)</h3>
            </div>
            <div class="routine-quote-box">
              <p class="routine-quote-text">
                &ldquo;Kami sangat menghimbau Anda untuk mengklik tombol <strong>Download Arsip Backup JSON</strong> <strong>minimal 1 minggu sekali</strong> (misalnya setiap Hari Minggu malam) dan simpan file cadangannya di WhatsApp atau Google Drive pribadi Anda!&rdquo;
              </p>
            </div>
            <div class="storage-tips-grid mt-3">
              <div class="storage-tip-box">
                <span class="tip-icon">💬</span>
                <div>
                  <strong>Kirim ke WhatsApp Pribadi</strong>
                  <p class="text-xs text-muted mb-0">Kirim file backup ke chat 'Pesan ke Diri Sendiri' di WA agar mudah dicari kapan saja.</p>
                </div>
              </div>
              <div class="storage-tip-box">
                <span class="tip-icon">☁️</span>
                <div>
                  <strong>Simpan di Google Drive</strong>
                  <p class="text-xs text-muted mb-0">Buat folder 'Backup Juragankosan' di Google Drive untuk arsip jangka panjang yang aman.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Modal Proteksi PIN Reset Semua Data (Zona Bahaya) -->
      <div class="modal-backdrop" id="modal-reset-data-pin">
        <div class="modal-dialog modal-sm">
          <div class="modal-header border-bottom-danger">
            <div class="flex-center gap-2">
              <span class="text-danger font-bold text-lg">⚠️</span>
              <h3 class="modal-title text-danger">Zona Bahaya: Reset Database Kos</h3>
            </div>
            <button type="button" class="modal-close" data-close-modal="modal-reset-data-pin">&times;</button>
          </div>
          <div class="modal-body">
            <div class="danger-modal-callout mb-3">
              <p class="text-sm text-danger font-bold mb-1">🛑 PERINGATAN KERAS!</p>
              <p class="text-xs text-secondary mb-0">
                Seluruh data kamar, penyewa, riwayat tagihan, pemasukan, dan pengeluaran akan <strong>DIHAPUS TOTAL &amp; PERMANEN</strong> dari browser ini!
              </p>
            </div>

            <div class="form-group mb-2">
              <label for="input-reset-security-pin" class="form-label font-bold text-slate-800">
                Masukkan PIN Keamanan Anda (Standar: 1234) <span class="text-danger">*</span>
              </label>
              <div class="pin-input-field-wrap">
                <input 
                  type="password" 
                  id="input-reset-security-pin" 
                  class="form-control font-mono text-center input-security-pin-lg" 
                  placeholder="••••" 
                  maxlength="6" 
                  inputmode="numeric" 
                  autocomplete="off" 
                />
                <button type="button" class="btn-toggle-pin-field" id="btn-toggle-reset-pin-eye" title="Lihat/Sembunyikan PIN">👁️</button>
              </div>
              <div id="reset-pin-status-msg" class="reset-pin-status-msg text-xs mt-1 text-muted">
                Ketik PIN keamanan dengan benar untuk membuka tombol eksekusi di bawah.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="modal-reset-data-pin">Batal</button>
            <button type="button" class="btn btn-danger" id="btn-confirm-reset-execute" disabled>
              ⚠️ Ya, Kosongkan Semua Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setupBackupEvents(container);
}

function setupBackupEvents(container) {
  // Download Backup JSON (PRO)
  const btnDownload = container.querySelector('#btn-backup-download');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!isPro()) {
        openUpgradeModal();
        return;
      }
      store.exportDataJSON();
      showToast('📥 File arsip backup JSON berhasil diunduh!', 'success');
    });
  }

  // Upgrade PRO Button (If Free)
  const btnUpgrade = container.querySelector('#btn-backup-upgrade');
  if (btnUpgrade) {
    btnUpgrade.addEventListener('click', () => {
      openUpgradeModal();
    });
  }

  // Import JSON File
  const fileInput = container.querySelector('#backup-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const res = store.importDataJSON(content);
        if (res.success) {
          showToast('🎉 Data kos berhasil dipulihkan dari file backup!', 'success');
          renderBackup(container);
          if (window.juraganApp) {
            window.juraganApp.updateKosHeader();
            window.juraganApp.updateBadges();
          }
        } else {
          showToast(res.message || 'Format file JSON tidak sesuai!', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Reload Sample Demo Data
  const btnSample = container.querySelector('#btn-backup-sample');
  if (btnSample) {
    btnSample.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: 'Muat Ulang Data Sampel Demo?',
        message: 'Tindakan ini akan memuat contoh pembukuan bawaan (6 unit kamar, 4 penyewa aktif, dan simulasi tagihan). Pastikan Anda sudah membackup data Anda jika ada.',
        confirmText: 'Ya, Muat Data Sampel',
        danger: false
      });

      if (confirmed) {
        store.resetToSampleData();
        showToast('🔄 Data sampel demo berhasil dimuat ulang!', 'success');
        renderBackup(container);
        if (window.juraganApp) {
          window.juraganApp.updateKosHeader();
          window.juraganApp.updateBadges();
        }
      }
    });
  }

  // Reset All Data (Zona Bahaya) - PIN Protected (In-Card & Modal)
  const inputCardResetPin = container.querySelector('#input-card-reset-pin');
  const btnToggleCardEye = container.querySelector('#btn-toggle-card-reset-eye');
  const cardStatusMsg = container.querySelector('#card-reset-pin-status-msg');
  const btnCardExecuteReset = container.querySelector('#btn-danger-card-reset-execute');

  const inputResetPin = container.querySelector('#input-reset-security-pin');
  const btnToggleEye = container.querySelector('#btn-toggle-reset-pin-eye');
  const statusMsg = container.querySelector('#reset-pin-status-msg');
  const btnExecuteReset = container.querySelector('#btn-confirm-reset-execute');

  const triggerResetExecution = () => {
    store.clearAllData();
    closeModal('modal-reset-data-pin');

    try {
      sessionStorage.setItem('jk_reset_toast', 'Semua data kos berhasil dibersihkan.');
    } catch (e) {}

    // Clean reload back to dashboard (0 Kamar, 0 Penyewa, 0 Tagihan)
    window.location.hash = 'dashboard';
    window.location.reload();
  };

  // --- 1. In-Card PIN Handler ---
  if (btnToggleCardEye && inputCardResetPin) {
    btnToggleCardEye.addEventListener('click', () => {
      if (inputCardResetPin.type === 'password') {
        inputCardResetPin.type = 'text';
        btnToggleCardEye.textContent = '🔒';
      } else {
        inputCardResetPin.type = 'password';
        btnToggleCardEye.textContent = '👁️';
      }
    });
  }

  const validateCardResetPin = () => {
    if (!inputCardResetPin || !btnCardExecuteReset) return;
    const pinVal = inputCardResetPin.value.trim();
    const isValid = store.verifySecurityPin(pinVal);

    if (isValid) {
      btnCardExecuteReset.disabled = false;
      btnCardExecuteReset.classList.add('btn-danger-active-glow');
      inputCardResetPin.classList.remove('is-invalid');
      inputCardResetPin.classList.add('is-valid');
      if (cardStatusMsg) {
        cardStatusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-emerald font-bold text-center';
        cardStatusMsg.innerHTML = '✓ PIN Cocok! Tombol merah di bawah telah aktif.';
      }
    } else {
      btnCardExecuteReset.disabled = true;
      btnCardExecuteReset.classList.remove('btn-danger-active-glow');
      inputCardResetPin.classList.remove('is-valid');
      if (cardStatusMsg) {
        if (pinVal.length >= 4) {
          inputCardResetPin.classList.add('is-invalid');
          cardStatusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-danger font-semibold text-center';
          cardStatusMsg.innerHTML = '⚠️ PIN salah! Tombol reset tetap terkunci.';
        } else {
          inputCardResetPin.classList.remove('is-invalid');
          cardStatusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-muted text-center';
          cardStatusMsg.innerHTML = 'Ketik PIN keamanan (standar: 1234) untuk mengaktifkan tombol.';
        }
      }
    }
  };

  if (inputCardResetPin) {
    inputCardResetPin.addEventListener('input', validateCardResetPin);
    inputCardResetPin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const pinVal = inputCardResetPin.value.trim();
        if (store.verifySecurityPin(pinVal)) {
          triggerResetExecution();
        } else {
          inputCardResetPin.classList.remove('animate-shake');
          void inputCardResetPin.offsetWidth;
          inputCardResetPin.classList.add('animate-shake', 'is-invalid');
          showToast('PIN Keamanan salah! Aksi dibatalkan demi keamanan data Anda.', 'error');
        }
      }
    });
  }

  if (btnCardExecuteReset) {
    btnCardExecuteReset.addEventListener('click', () => {
      const pinVal = inputCardResetPin ? inputCardResetPin.value.trim() : '';
      if (!store.verifySecurityPin(pinVal)) {
        if (inputCardResetPin) {
          inputCardResetPin.classList.remove('animate-shake');
          void inputCardResetPin.offsetWidth;
          inputCardResetPin.classList.add('animate-shake', 'is-invalid');
        }
        showToast('PIN Keamanan salah! Aksi dibatalkan demi keamanan data Anda.', 'error');
        return;
      }
      triggerResetExecution();
    });
  }

  // --- 2. Modal PIN Handler ---
  if (btnToggleEye && inputResetPin) {
    btnToggleEye.addEventListener('click', () => {
      if (inputResetPin.type === 'password') {
        inputResetPin.type = 'text';
        btnToggleEye.textContent = '🔒';
      } else {
        inputResetPin.type = 'password';
        btnToggleEye.textContent = '👁️';
      }
    });
  }

  const triggerModalPinErrorFeedback = () => {
    if (inputResetPin) {
      inputResetPin.classList.remove('animate-shake');
      void inputResetPin.offsetWidth;
      inputResetPin.classList.add('animate-shake', 'is-invalid');
    }
    showToast('PIN Keamanan salah! Aksi dibatalkan demi keamanan data Anda.', 'error');
  };

  const validateModalResetPin = () => {
    if (!inputResetPin || !btnExecuteReset) return;
    const pinVal = inputResetPin.value.trim();
    const isValid = store.verifySecurityPin(pinVal);

    if (isValid) {
      btnExecuteReset.disabled = false;
      btnExecuteReset.classList.add('btn-danger-active-glow');
      inputResetPin.classList.remove('is-invalid');
      inputResetPin.classList.add('is-valid');
      if (statusMsg) {
        statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-emerald font-bold';
        statusMsg.innerHTML = '✓ PIN Keamanan Cocok! Tombol eksekusi telah aktif.';
      }
    } else {
      btnExecuteReset.disabled = true;
      btnExecuteReset.classList.remove('btn-danger-active-glow');
      inputResetPin.classList.remove('is-valid');
      if (statusMsg) {
        if (pinVal.length >= 4) {
          inputResetPin.classList.add('is-invalid');
          statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-danger';
          statusMsg.innerHTML = '⚠️ PIN salah! Tombol eksekusi tetap terkunci.';
        } else {
          inputResetPin.classList.remove('is-invalid');
          statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-muted';
          statusMsg.innerHTML = 'Ketik PIN keamanan dengan benar untuk membuka tombol eksekusi di bawah.';
        }
      }
    }
  };

  if (inputResetPin) {
    inputResetPin.addEventListener('input', validateModalResetPin);
    inputResetPin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const pinVal = inputResetPin.value.trim();
        if (store.verifySecurityPin(pinVal)) {
          triggerResetExecution();
        } else {
          triggerModalPinErrorFeedback();
        }
      }
    });
  }

  if (btnExecuteReset) {
    btnExecuteReset.addEventListener('click', () => {
      const pinVal = inputResetPin ? inputResetPin.value.trim() : '';
      if (!store.verifySecurityPin(pinVal)) {
        triggerModalPinErrorFeedback();
        return;
      }
      triggerResetExecution();
    });
  }
}
