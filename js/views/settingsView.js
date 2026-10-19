/**
 * Juragankosan Settings & Backup View (Tab 6: Pengaturan & Data)
 */
import { store } from '../state.js?v=2.5';
import { DEFAULT_WA_TEMPLATE } from '../utils/whatsapp.js?v=3.3';
import { cleanWhatsAppNumber, escapeHtml, formatRupiah } from '../utils/formatter.js?v=2.5';
import { showToast, showConfirmModal } from '../utils/modal.js?v=2.5';
import { isPro, getLicense, deactivateLicense, openUpgradeModal, getCurrentPricingTier } from '../utils/license.js?v=4.1';

export function renderSettings(container) {
  const settings = store.getSettings();
  const isProUser = isPro();
  const license = getLicense();
  const pricing = getCurrentPricingTier();
  const currentPin = store.getSecurityPin ? store.getSecurityPin() : '1234';
  const isDefaultPin = (currentPin === '1234');
  const bankAccounts = (settings.bankAccounts && settings.bankAccounts.length > 0)
    ? settings.bankAccounts
    : [
        {
          id: 'bank_01',
          bankName: settings.bankName || 'BCA',
          accountNumber: settings.bankAccount || '',
          accountHolder: settings.ownerName || ''
        }
      ];

  container.innerHTML = `
    <div class="settings-view-container">
      <div class="view-header">
        <div class="view-header-title">
          <h1 class="page-title">Pengaturan Kos</h1>
          <p class="page-subtitle">Kelola profil kos, rekening bank &amp; e-wallet, pembayaran tunai, dan kustomisasi template WhatsApp</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Kolom Kiri: Profil Kos & Rekening Pembayaran (Lebar 55%-60%) -->
        <div class="settings-col-left">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-emerald-subtle text-emerald">🏠</div>
              <div>
                <h3 class="settings-card-title">Profil Kos &amp; Rekening Bank</h3>
                <p class="settings-card-desc">Informasi ini otomatis muncul di pesan WhatsApp tagihan dan kwitansi sewa</p>
              </div>
            </div>

            <form id="settings-profile-form">
              <!-- Baris 1: Nama Kos / Kontrakan (Full width) -->
              <div class="form-group">
                <label for="set-kos-name" class="form-label">Nama Kos / Kontrakan <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  id="set-kos-name" 
                  class="form-control" 
                  value="${escapeHtml(settings.kosName || '')}" 
                  placeholder="Contoh: Kos Griya Asri Harmoni" 
                  required 
                />
              </div>

              <!-- Baris 2: Grid 2 kolom sama lebar (1fr 1fr) -->
              <div class="profile-grid-2col">
                <div class="form-group mb-0">
                  <label for="set-owner-name" class="form-label">Nama Pemilik / Pengelola <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    id="set-owner-name" 
                    class="form-control" 
                    value="${escapeHtml(settings.ownerName || '')}" 
                    placeholder="Contoh: H. Ahmad Fauzi" 
                    required 
                  />
                </div>
                <div class="form-group mb-0">
                  <label for="set-owner-phone" class="form-label">No. WhatsApp Pengelola</label>
                  <input 
                    type="tel" 
                    id="set-owner-phone" 
                    class="form-control" 
                    value="${escapeHtml(settings.ownerPhone || '')}" 
                    placeholder="Contoh: 081234567890" 
                  />
                </div>
              </div>

              <!-- Baris 3: Alamat Lengkap Kos (textarea 2 baris rapi) -->
              <div class="form-group">
                <label for="set-address" class="form-label">Alamat Lengkap Kos</label>
                <textarea 
                  id="set-address" 
                  class="form-control" 
                  rows="2" 
                  placeholder="Contoh: Jl. Margonda Raya No. 45, Beji, Depok"
                >${escapeHtml(settings.address || '')}</textarea>
              </div>

              <!-- Multi-Rekening Bank & E-Wallet Manager -->
              <div class="bank-accounts-manager">
                <div class="bank-accounts-header">
                  <h4 class="bank-accounts-title">Daftar Rekening Bank &amp; E-Wallet Penerima</h4>
                  <button type="button" class="btn btn-outline btn-sm btn-add-bank" id="btn-add-bank-row">
                    <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                    </svg>
                    + Tambah Rekening
                  </button>
                </div>

                <div id="bank-accounts-list" class="bank-accounts-list">
                  ${bankAccounts
                    .map(
                      (acc, idx) => `
                    <div class="bank-account-row bank-subcard" data-bank-id="${escapeHtml(acc.id || 'bank_' + idx)}">
                      <div class="bank-subcard-header">
                        <span class="bank-subcard-badge">
                          <span class="bank-badge-dot"></span>
                          <span class="bank-subcard-number">Rekening #${idx + 1}</span>
                        </span>
                        <button type="button" class="btn-subcard-delete btn-delete-bank-row" title="Hapus Rekening" aria-label="Hapus Rekening">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                          </svg>
                          <span>Hapus</span>
                        </button>
                      </div>
                      <div class="bank-subcard-body">
                        <div class="bank-inputs-grid">
                          <div class="form-group mb-0">
                            <label class="bank-input-label">Nama Bank / E-Wallet <span class="text-danger">*</span></label>
                            <input 
                              type="text" 
                              class="form-control form-control-sm input-bank-name" 
                              placeholder="BCA, Mandiri, BRI, DANA" 
                              value="${escapeHtml(acc.bankName || '')}" 
                              required 
                            />
                          </div>
                          <div class="form-group mb-0">
                            <label class="bank-input-label">Nomor Rekening / No. HP <span class="text-danger">*</span></label>
                            <input 
                              type="text" 
                              class="form-control form-control-sm input-bank-number" 
                              placeholder="Contoh: 7140-8899-22" 
                              value="${escapeHtml(acc.accountNumber || '')}" 
                              required 
                            />
                          </div>
                          <div class="form-group mb-0">
                            <label class="bank-input-label">Atas Nama Pemilik</label>
                            <input 
                              type="text" 
                              class="form-control form-control-sm input-bank-holder" 
                              placeholder="Contoh: H. Ahmad Fauzi" 
                              value="${escapeHtml(acc.accountHolder || '')}" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <!-- Opsi Pembayaran Tunai (Cash) Modern Toggle -->
              <div class="cash-payment-section">
                <label class="cash-toggle-row" for="set-accept-cash">
                  <div class="cash-toggle-info">
                    <span class="cash-icon">💵</span>
                    <div class="cash-text-block">
                      <div class="cash-title">Terima Pembayaran Tunai (Cash)</div>
                      <div class="cash-subtitle">Penyewa dapat memilih pembayaran tunai langsung ke pengelola</div>
                    </div>
                  </div>
                  <div class="switch-toggle">
                    <input type="checkbox" id="set-accept-cash" ${settings.acceptCash !== false ? 'checked' : ''} />
                    <span class="switch-slider"></span>
                  </div>
                </label>
                <div id="cash-note-container" class="cash-note-container" style="${settings.acceptCash !== false ? 'display: block;' : 'display: none;'}">
                  <label for="set-cash-note" class="form-label text-xs">Keterangan / Lokasi Bayar Tunai</label>
                  <input 
                    type="text" 
                    id="set-cash-note" 
                    class="form-control" 
                    value="${escapeHtml(settings.cashNote || 'Bayar tunai langsung ke Pengelola Kos')}" 
                    placeholder="Contoh: Bayar langsung ke pengelola / penjaga kos di Pos Keamanan" 
                  />
                </div>
              </div>

              <div class="form-actions-right mt-3">
                <button type="submit" class="btn btn-primary btn-save-settings">
                  <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  Simpan Profil Kos &amp; Rekening
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Kolom Kanan: Tumpuk Vertikal Stack (Status Lisensi, Card WA Template, Card Backup) -->
        <div class="settings-col-right">
          <!-- Card 1: Status Lisensi Aplikasi (Monetisasi Freemium) -->
          <div class="settings-card license-status-card ${isProUser ? 'license-card-pro' : 'license-card-free'}">
            <div class="settings-card-header license-card-header-clean">
              <div class="license-header-row">
                <div class="license-title-wrapper">
                  <div class="settings-icon ${isProUser ? 'bg-amber-subtle text-amber' : 'bg-emerald-subtle text-emerald'}">
                    ${isProUser ? '👑' : '🏷️'}
                  </div>
                  <h3 class="settings-card-title">Status Lisensi Aplikasi</h3>
                </div>
                <span class="badge ${isProUser ? 'badge-pro-gold' : 'badge-free-quota'} license-header-badge">
                  ${isProUser ? '👑 PRO LIFETIME' : 'STARTER GRATIS'}
                </span>
              </div>
              <p class="settings-card-desc license-desc-full">
                ${isProUser 
                  ? 'Lisensi resmi aktif seumur hidup. Akses tanpa batas ke seluruh fitur & kamar.' 
                  : 'Paket gratis terbatas maksimal 3 kamar. Upgrade ke PRO untuk akses tanpa batas seumur hidup.'}
              </p>
            </div>

            <div class="license-card-body">
              ${isProUser ? `
                <div class="license-info-box">
                  <div class="license-info-row">
                    <span class="license-info-label">Kode Lisensi:</span>
                    <span class="license-code-display">${escapeHtml(license.code || 'JKPRO-VIP')}</span>
                  </div>
                  <div class="license-info-row">
                    <span class="license-info-label">Status:</span>
                    <span class="text-emerald font-bold">✓ Terverifikasi Aktif (Unlimited Kamar)</span>
                  </div>
                  ${license.activatedAt ? `
                    <div class="license-info-row">
                      <span class="license-info-label">Diaktifkan:</span>
                      <span class="text-muted text-xs">${new Date(license.activatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="license-actions-row mt-3">
                  <button type="button" class="btn btn-outline btn-sm text-xs" id="btn-settings-change-license">
                    🔑 Ganti / Masukkan Kode Lain
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm text-xs text-muted" id="btn-settings-deactivate-license" title="Reset ke status gratis (untuk pengujian)">
                    Reset ke Free (Testing)
                  </button>
                </div>
              ` : `
                <div class="license-free-box">
                  <div class="license-limits-list">
                    <div class="license-limit-item">
                      <span class="limit-bullet">⚠️</span>
                      <span>Maksimal 3 kamar terdaftar</span>
                    </div>
                    <div class="license-limit-item">
                      <span class="limit-bullet">⚠️</span>
                      <span>Watermark pada kwitansi cetak &amp; PDF</span>
                    </div>
                    <div class="license-limit-item">
                      <span class="limit-bullet">🔒</span>
                      <span>Fitur download backup JSON terkunci</span>
                    </div>
                  </div>
                  <div class="license-promo-callout mt-2">
                    <div class="promo-price-tag">
                      ${pricing.strikePrice ? `<span class="promo-old">${formatRupiah(pricing.strikePrice)}</span>` : ''}
                      <span class="promo-new">${formatRupiah(pricing.price)}</span>
                      <span class="promo-sub">${pricing.tierName}</span>
                    </div>
                    <div class="promo-quota-sub text-xs mt-1 font-bold ${pricing.tierId === 1 ? 'text-warning' : (pricing.tierId === 2 ? 'text-amber' : 'text-muted')}">
                      🔥 ${pricing.progressText}
                    </div>
                  </div>
                  <div class="license-btn-stack mt-3">
                    <button type="button" class="btn btn-warning w-full btn-settings-buy-pro" id="btn-settings-upgrade-pro">
                      👑 Beli Lisensi PRO (${formatRupiah(pricing.price)}) Sekarang
                    </button>
                    <button type="button" class="btn btn-outline btn-sm w-full mt-2" id="btn-settings-activate-key">
                      🔑 Sudah Punya Kode Lisensi? Aktifkan Di Sini
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Card Atas: Template Pesan WhatsApp 1-Klik -->
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-blue-subtle text-blue">💬</div>
              <div>
                <h3 class="settings-card-title">Template Tagihan WhatsApp 1-Klik</h3>
                <p class="settings-card-desc">Pesan ramah yang otomatis terisi saat tombol 'Tagih via WA' diklik</p>
              </div>
            </div>

            <form id="settings-wa-form">
              <div class="placeholder-tags mb-2">
                <span class="text-xs text-muted block mb-1">Klik tag di bawah untuk menyisipkan variabel otomatis:</span>
                <div class="tag-chips">
                  <button type="button" class="btn-tag-insert" data-tag="{nama}">+ {nama}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{kamar}">+ {kamar}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{nominal}">+ {nominal}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{periode}">+ {periode}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{jatuh_tempo}">+ {jatuh_tempo}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{status_terlambat}">+ {status_terlambat}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{nama_kos}">+ {nama_kos}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{bank}">+ {bank}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{rekening}">+ {rekening}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{nama_pengelola}">+ {nama_pengelola}</button>
                  <button type="button" class="btn-tag-insert" data-tag="{pemilik}">+ {pemilik}</button>
                </div>
              </div>

              <div class="form-group">
                <textarea 
                  id="set-wa-template" 
                  class="form-control wa-template-textarea" 
                  rows="10"
                >${escapeHtml(settings.waTemplate || DEFAULT_WA_TEMPLATE)}</textarea>
              </div>

              <div class="flex-between">
                <button type="button" class="btn btn-ghost btn-sm text-secondary" id="btn-reset-wa-template">
                  Kembalikan Template Bawaan
                </button>
                <button type="submit" class="btn btn-primary">Simpan Template WA</button>
              </div>
            </form>
          </div>

          <!-- Card 3: PIN Keamanan Aplikasi (Proteksi Reset & Data) -->
          <div class="settings-card security-pin-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-red-subtle text-danger">🔐</div>
              <div class="flex-1">
                <div class="flex-between align-center">
                  <h3 class="settings-card-title">PIN Keamanan Aplikasi</h3>
                  <span class="badge ${isDefaultPin ? 'badge-warning font-bold' : 'badge-emerald font-bold'}" id="pin-status-badge">
                    ${isDefaultPin ? 'PIN Standar (1234)' : '✓ PIN Kustom Aktif'}
                  </span>
                </div>
                <p class="settings-card-desc">
                  PIN ini digunakan untuk Login &amp; Membuka Aplikasi (App Lock) serta mengamankan tindakan berbahaya seperti 'Reset Semua Data' di tab Backup &amp; Data.
                </p>
              </div>
            </div>

            <form id="settings-pin-form">
              <div class="pin-inputs-stack">
                <div class="form-group mb-2">
                  <label for="set-pin-old" class="form-label">PIN Lama Saat Ini <span class="text-danger">*</span></label>
                  <div class="pin-input-field-wrap">
                    <input 
                      type="password" 
                      id="set-pin-old" 
                      class="form-control font-mono text-center input-pin-numeric" 
                      placeholder="Masukkan PIN saat ini (Standar: 1234)" 
                      maxlength="6" 
                      inputmode="numeric" 
                      required 
                    />
                    <button type="button" class="btn-toggle-pin-field" data-target="set-pin-old" title="Lihat/Sembunyikan">👁️</button>
                  </div>
                </div>

                <div class="profile-grid-2col">
                  <div class="form-group mb-2">
                    <label for="set-pin-new" class="form-label">PIN Baru <span class="text-danger">*</span></label>
                    <div class="pin-input-field-wrap">
                      <input 
                        type="password" 
                        id="set-pin-new" 
                        class="form-control font-mono text-center input-pin-numeric" 
                        placeholder="4-6 digit angka" 
                        maxlength="6" 
                        inputmode="numeric" 
                        required 
                      />
                      <button type="button" class="btn-toggle-pin-field" data-target="set-pin-new" title="Lihat/Sembunyikan">👁️</button>
                    </div>
                  </div>
                  <div class="form-group mb-2">
                    <label for="set-pin-confirm" class="form-label">Konfirmasi PIN Baru <span class="text-danger">*</span></label>
                    <div class="pin-input-field-wrap">
                      <input 
                        type="password" 
                        id="set-pin-confirm" 
                        class="form-control font-mono text-center input-pin-numeric" 
                        placeholder="Ulangi PIN baru" 
                        maxlength="6" 
                        inputmode="numeric" 
                        required 
                      />
                      <button type="button" class="btn-toggle-pin-field" data-target="set-pin-confirm" title="Lihat/Sembunyikan">👁️</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-xs text-muted mb-3">
                💡 PIN standar bawaan aplikasi adalah <strong>1234</strong>. Masukkan PIN lama untuk mengubahnya menjadi PIN kustom pilihan Anda.
              </div>

              <div class="flex-between align-center">
                <button type="button" class="btn btn-outline btn-sm" id="btn-settings-lock-now">
                  🔒 Kunci Aplikasi Sekarang
                </button>
                <button type="submit" class="btn btn-primary" id="btn-save-security-pin">
                  🔐 Simpan PIN Keamanan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  setupSettingsEvents(container);
}

function updateBankBadgeNumbers(bankList) {
  if (!bankList) return;
  const rows = bankList.querySelectorAll('.bank-account-row');
  rows.forEach((row, idx) => {
    const numEl = row.querySelector('.bank-subcard-number');
    if (numEl) {
      numEl.textContent = `Rekening #${idx + 1}`;
    }
  });
}

function setupSettingsEvents(container) {
  const bankList = container.querySelector('#bank-accounts-list');
  const btnAddBank = container.querySelector('#btn-add-bank-row');
  const acceptCashCheckbox = container.querySelector('#set-accept-cash');
  const cashNoteContainer = container.querySelector('#cash-note-container');

  // Toggle Cash Note
  if (acceptCashCheckbox && cashNoteContainer) {
    acceptCashCheckbox.addEventListener('change', () => {
      cashNoteContainer.style.display = acceptCashCheckbox.checked ? 'block' : 'none';
    });
  }

  // Add Bank Row
  if (btnAddBank && bankList) {
    btnAddBank.addEventListener('click', () => {
      const newId = 'bank_' + Date.now();
      const currentCount = bankList.querySelectorAll('.bank-account-row').length;
      const row = document.createElement('div');
      row.className = 'bank-account-row bank-subcard animate-fade-in';
      row.setAttribute('data-bank-id', newId);
      row.innerHTML = `
        <div class="bank-subcard-header">
          <span class="bank-subcard-badge">
            <span class="bank-badge-dot"></span>
            <span class="bank-subcard-number">Rekening #${currentCount + 1}</span>
          </span>
          <button type="button" class="btn-subcard-delete btn-delete-bank-row" title="Hapus Rekening" aria-label="Hapus Rekening">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>Hapus</span>
          </button>
        </div>
        <div class="bank-subcard-body">
          <div class="bank-inputs-grid">
            <div class="form-group mb-0">
              <label class="bank-input-label">Nama Bank / E-Wallet <span class="text-danger">*</span></label>
              <input 
                type="text" 
                class="form-control form-control-sm input-bank-name" 
                placeholder="BCA, Mandiri, BRI, DANA" 
                required 
              />
            </div>
            <div class="form-group mb-0">
              <label class="bank-input-label">Nomor Rekening / No. HP <span class="text-danger">*</span></label>
              <input 
                type="text" 
                class="form-control form-control-sm input-bank-number" 
                placeholder="Contoh: 157-00-0988231-1" 
                required 
              />
            </div>
            <div class="form-group mb-0">
              <label class="bank-input-label">Atas Nama Pemilik</label>
              <input 
                type="text" 
                class="form-control form-control-sm input-bank-holder" 
                placeholder="Contoh: H. Ahmad Fauzi" 
              />
            </div>
          </div>
        </div>
      `;
      bankList.appendChild(row);
      updateBankBadgeNumbers(bankList);
      const nameInput = row.querySelector('.input-bank-name');
      if (nameInput) nameInput.focus();
    });
  }

  // Delete Bank Row (Event Delegation)
  if (bankList) {
    bankList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-delete-bank-row');
      if (delBtn) {
        const row = delBtn.closest('.bank-account-row');
        if (row) {
          const totalRows = bankList.querySelectorAll('.bank-account-row').length;
          if (totalRows <= 1) {
            showToast('Minimal harus ada 1 baris rekening bank / e-wallet!', 'warning');
            return;
          }
          row.remove();
          updateBankBadgeNumbers(bankList);
        }
      }
    });
  }

  // Save Profile Form
  const profileForm = container.querySelector('#settings-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const kosName = document.getElementById('set-kos-name').value.trim();
      const ownerName = document.getElementById('set-owner-name').value.trim();
      const rawPhone = document.getElementById('set-owner-phone').value.trim();
      const address = document.getElementById('set-address').value.trim();

      const ownerPhone = cleanWhatsAppNumber(rawPhone);

      // Collect all bank accounts
      const bankAccounts = [];
      const rows = bankList ? bankList.querySelectorAll('.bank-account-row') : [];
      rows.forEach((r, idx) => {
        const nameEl = r.querySelector('.input-bank-name');
        const numEl = r.querySelector('.input-bank-number');
        const holderEl = r.querySelector('.input-bank-holder');
        const bankName = nameEl ? nameEl.value.trim() : '';
        const accountNumber = numEl ? numEl.value.trim() : '';
        const accountHolder = holderEl ? holderEl.value.trim() : '';

        if (bankName || accountNumber) {
          bankAccounts.push({
            id: r.getAttribute('data-bank-id') || 'bank_' + (idx + 1),
            bankName,
            accountNumber,
            accountHolder: accountHolder || ownerName
          });
        }
      });

      const acceptCash = acceptCashCheckbox ? acceptCashCheckbox.checked : true;
      const cashNoteEl = document.getElementById('set-cash-note');
      const cashNote = cashNoteEl ? cashNoteEl.value.trim() : 'Bayar tunai langsung ke Pengelola Kos';

      store.updateSettings({
        kosName,
        ownerName,
        ownerPhone,
        address,
        bankAccounts,
        acceptCash,
        cashNote
      });

      showToast('Profil kos, multi-rekening, dan opsi pembayaran berhasil disimpan!', 'success');
      if (window.juraganApp && window.juraganApp.updateKosHeader) {
        window.juraganApp.updateKosHeader();
      }
    });
  }

  // Insert variable tags into WA textarea
  const waTextarea = container.querySelector('#set-wa-template');
  container.querySelectorAll('.btn-tag-insert').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (!waTextarea) return;

      const start = waTextarea.selectionStart;
      const end = waTextarea.selectionEnd;
      const text = waTextarea.value;
      waTextarea.value = text.substring(0, start) + tag + text.substring(end);
      waTextarea.focus();
      waTextarea.selectionStart = waTextarea.selectionEnd = start + tag.length;
    });
  });

  // Save WA Template Form
  const waForm = container.querySelector('#settings-wa-form');
  if (waForm) {
    waForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const waTemplate = waTextarea.value.trim();
      store.updateSettings({ waTemplate });
      showToast('Template tagihan WhatsApp berhasil disimpan!', 'success');
    });
  }

  // Reset WA Template
  const btnResetWA = container.querySelector('#btn-reset-wa-template');
  if (btnResetWA) {
    btnResetWA.addEventListener('click', () => {
      waTextarea.value = DEFAULT_WA_TEMPLATE;
      showToast('Template dikembalikan ke format awal.', 'info');
    });
  }

  // License Status Actions
  const btnUpgradePro = container.querySelector('#btn-settings-upgrade-pro');
  if (btnUpgradePro) {
    btnUpgradePro.addEventListener('click', () => openUpgradeModal());
  }

  const btnActivateKey = container.querySelector('#btn-settings-activate-key');
  if (btnActivateKey) {
    btnActivateKey.addEventListener('click', () => openUpgradeModal());
  }

  const btnChangeLicense = container.querySelector('#btn-settings-change-license');
  if (btnChangeLicense) {
    btnChangeLicense.addEventListener('click', () => openUpgradeModal());
  }

  const btnDeactivate = container.querySelector('#btn-settings-deactivate-license');
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: 'Reset Lisensi ke Free?',
        message: 'Tindakan ini untuk keperluan pengujian: status lisensi akan kembali ke <strong>STARTER GRATIS (Maks. 3 Kamar)</strong>. Anda dapat mengaktifkannya kembali kapan saja dengan master code atau kode lisensi.',
        confirmText: 'Ya, Kembalikan ke Free',
        danger: false
      });
      if (confirmed) {
        deactivateLicense();
        showToast('Lisensi berhasil dikembalikan ke status FREE.', 'info');
        renderSettings(container);
      }
    });
  }

  // Toggle PIN visibility buttons
  container.querySelectorAll('.btn-toggle-pin-field').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = container.querySelector('#' + targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // Save PIN Form
  const pinForm = container.querySelector('#settings-pin-form');
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPinInput = container.querySelector('#set-pin-old');
      const newPinInput = container.querySelector('#set-pin-new');
      const confirmPinInput = container.querySelector('#set-pin-confirm');

      const oldPin = oldPinInput.value.trim();
      const newPin = newPinInput.value.trim();
      const confirmPin = confirmPinInput.value.trim();

      if (!store.verifySecurityPin(oldPin)) {
        showToast('PIN Lama tidak sesuai! Silakan periksa kembali.', 'error');
        oldPinInput.focus();
        return;
      }

      if (!/^\d{4,6}$/.test(newPin)) {
        showToast('PIN Baru harus berupa 4 - 6 digit angka!', 'error');
        newPinInput.focus();
        return;
      }

      if (newPin !== confirmPin) {
        showToast('Konfirmasi PIN Baru tidak cocok!', 'error');
        confirmPinInput.focus();
        return;
      }

      const res = store.updateSecurityPin(oldPin, newPin);
      if (res.success) {
        showToast('🎉 PIN Keamanan berhasil diperbarui! Gunakan PIN ini saat membuka aplikasi.', 'success');
        renderSettings(container);
      } else {
        showToast(res.message || 'Gagal mengubah PIN Keamanan', 'error');
      }
    });
  }

  // Tombol Kunci Aplikasi Sekarang
  const btnLockNow = container.querySelector('#btn-settings-lock-now');
  if (btnLockNow) {
    btnLockNow.addEventListener('click', (e) => {
      e.preventDefault();
      store.lockApp();
    });
  }

  // Listen for dynamic pricing quota change from Admin Generator
  const onPricingChanged = () => {
    if (document.body.contains(container)) {
      renderSettings(container);
    }
  };
  window.addEventListener('juragankos_pricing_changed', onPricingChanged, { once: true });
}
