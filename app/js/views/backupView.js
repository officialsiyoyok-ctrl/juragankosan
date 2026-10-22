/**
 * Juragankosan Backup, Restore & Data Security View (Tab 7: Pusat Backup & Data)
 * 
 * Fitur Komprehensif:
 * 1. Cloud Safety Vault (Pencadangan Otomatis di Balik Layar via No. WhatsApp)
 * 2. Proteksi Memori HP (Persistent Storage Anti-Hapus Browser)
 * 3. Riwayat Snapshot Darurat Lokal (7 Hari Terakhir di IndexedDB)
 * 4. Download & Import File JSON Manual (Fitur PRO)
 * 5. Zona Bahaya (Reset Database dengan Proteksi PIN)
 */
import { store } from '../state.js';
import { showToast, showConfirmModal, openModal, closeModal } from '../utils/modal.js';
import { isPro, openUpgradeModal } from '../utils/license.js';
import { getCloudSyncMeta, syncToCloudVault, fetchCloudBackup } from '../utils/cloudBackup.js';
import { checkStoragePersistence, getLocalSnapshots, getSnapshotById } from '../utils/autoBackup.js';
import { formatDateIndo, formatDisplayPhone, escapeHtml } from '../utils/formatter.js';

export async function renderBackup(container) {
  const isProUser = isPro();
  const rooms = store.getRooms();
  const tenants = store.getTenants();
  const bills = store.getBills();
  const expenses = store.getExpenses();
  const incomes = store.getIncomes ? store.getIncomes() : [];
  const settings = store.getSettings();

  const cloudMeta = getCloudSyncMeta();
  let isPersisted = false;
  let snapshots = [];

  try {
    isPersisted = await checkStoragePersistence();
    snapshots = await getLocalSnapshots();
  } catch (e) {
    console.warn('Backup view async load error:', e);
  }

  const hasPhone = Boolean(settings.ownerPhone && settings.ownerPhone.trim().length >= 9);
  let cloudBadgeHtml = '';
  let lastSyncText = 'Belum pernah disinkronkan';

  if (cloudMeta && cloudMeta.status === 'synced' && cloudMeta.lastSyncedAt) {
    cloudBadgeHtml = '<span class="badge badge-emerald font-bold text-xs">✓ OTOMATIS AKTIF</span>';
    const datePart = cloudMeta.lastSyncedAt.split('T')[0];
    const timePart = cloudMeta.lastSyncedAt.split('T')[1]?.substring(0, 5) || '';
    lastSyncText = `${formatDateIndo(datePart)} jam ${timePart} WIB`;
  } else if (hasPhone) {
    cloudBadgeHtml = '<span class="badge badge-blue font-bold text-xs">🔄 SIAP TERSINKRON</span>';
    lastSyncText = 'Siap dicadangkan (tersambung dengan No. WhatsApp Anda)';
  } else {
    cloudBadgeHtml = '<span class="badge badge-warning font-bold text-xs">⚠️ BUTUH NO. WHATSAPP</span>';
    lastSyncText = 'Isi No. WhatsApp Pengelola di Pengaturan agar brankas cloud aktif';
  }

  container.innerHTML = `
    <div class="backup-view-container">
      <div class="view-header">
        <div class="view-header-title">
          <h1 class="page-title">Pusat Backup &amp; Keamanan Data</h1>
          <p class="page-subtitle">Pencadangan otomatis di balik layar, proteksi anti-hapus memori HP, dan pemulihan arsip mandiri</p>
        </div>
      </div>

      <div class="backup-grid-2col">
        <!-- KOLOM KIRI: PANEL AKSI UTAMA (INTERAKTIF) -->
        <div class="backup-col-actions">

          <!-- BAGIAN 1: SISTEM PENGAMAN OTOMATIS (CLOUD & ANTI-HAPUS BROWSER) -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-indigo">BAGIAN 1: SISTEM PENGAMAN OTOMATIS (ANTI-HILANG DATA)</span>
          </div>

          <!-- CARD 1.1: CLOUD SAFETY VAULT -->
          <div class="settings-card backup-action-card card-accent-indigo">
            <div class="settings-card-header">
              <div class="settings-icon bg-indigo-subtle text-indigo" style="font-size:1.5rem;">☁️</div>
              <div class="flex-1">
                <div class="flex-between align-center gap-2">
                  <h3 class="settings-card-title">Brankas Cadangan Cloud di Balik Layar</h3>
                  ${cloudBadgeHtml}
                </div>
                <p class="settings-card-desc mt-1">
                  Sistem otomatis mencadangkan data kos Anda secara berkala di latar belakang menggunakan identitas No. WhatsApp Anda. Ganti HP baru atau cache terhapus? Data tetap selamat!
                </p>
              </div>
            </div>

            <div class="cloud-vault-status-box mb-3">
              <div class="cloud-meta-row">
                <span class="cloud-meta-label">📱 No. WhatsApp Identitas:</span>
                <span class="cloud-meta-val">
                  ${hasPhone ? formatDisplayPhone(settings.ownerPhone) : '<span class="text-warning">Belum diisi di Pengaturan</span>'}
                </span>
              </div>
              <div class="cloud-meta-row">
                <span class="cloud-meta-label">🔑 Kunci PIN Pemulihan:</span>
                <span class="cloud-meta-val font-mono">PIN Keamanan Anda (${settings.securityPin || '1234'})</span>
              </div>
              <div class="cloud-meta-row">
                <span class="cloud-meta-label">⏰ Terakhir Dicadangkan:</span>
                <span class="cloud-meta-val text-xs">${lastSyncText}</span>
              </div>
              <div class="cloud-meta-row">
                <span class="cloud-meta-label">📊 Status Data:</span>
                <span class="cloud-meta-val text-xs text-emerald font-bold">
                  🏠 ${rooms.length} Kamar • 👥 ${tenants.length} Penyewa • 🧾 ${bills.length} Tagihan
                </span>
              </div>
            </div>

            <div class="flex-between gap-2">
              <button type="button" class="btn btn-primary flex-1 btn-cloud-sync-now" id="btn-cloud-sync-now">
                <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                <span>☁️ Cadangkan ke Cloud Sekarang</span>
              </button>
              <button type="button" class="btn btn-outline flex-1 btn-cloud-restore-action" id="btn-open-cloud-restore">
                <span>📥 Pulihkan dari Cloud (via No. WA)</span>
              </button>
            </div>
          </div>

          <!-- CARD 1.2: PROTEKSI MEMORI HP (ANTI-EVICTION) -->
          <div class="settings-card backup-action-card card-accent-emerald">
            <div class="settings-card-header">
              <div class="settings-icon bg-emerald-subtle text-emerald" style="font-size:1.4rem;">🛡️</div>
              <div class="flex-1">
                <div class="flex-between align-center gap-2">
                  <h3 class="settings-card-title">Proteksi Memori HP (Anti-Hapus Browser)</h3>
                  <span class="badge ${isPersisted ? 'badge-emerald font-bold text-xs' : 'badge-blue font-bold text-xs'}">
                    ${isPersisted ? '✓ PROTEKSI PERMANEN AKTIF' : '✓ PERLINDUNGAN AKTIF'}
                  </span>
                </div>
                <p class="settings-card-desc mt-1">
                  Peramban (Chrome / Safari) telah mengamankan database Juragankosan agar <strong>tidak pernah dihapus otomatis</strong> saat sistem HP Anda kehabisan memori atau melakukan pembersihan file sampah.
                </p>
              </div>
            </div>
          </div>

          <!-- CARD 1.3: RIWAYAT SNAPSHOT DARURAT LOKAL (7 HARI TERAKHIR) -->
          <div class="settings-card backup-action-card card-accent-blue snapshot-history-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-blue-subtle text-blue" style="font-size:1.4rem;">💾</div>
              <div class="flex-1">
                <div class="flex-between align-center gap-2">
                  <h3 class="settings-card-title">Riwayat Snapshot Darurat Lokal (7 Terakhir)</h3>
                  <span class="badge badge-gray font-bold text-xs">${snapshots.length} Arsip Tersedia</span>
                </div>
                <p class="settings-card-desc mt-1">
                  Jika terjadi kesalahan input atau data tidak sengaja terhapus, Anda bisa langsung mengembalikan catatan kos ke salah satu snapshot tanggal sebelumnya di bawah ini:
                </p>
              </div>
            </div>

            <div class="snapshot-list-container mt-2">
              ${snapshots.length > 0 ? snapshots.slice(0, 5).map((s) => `
                <div class="snapshot-item">
                  <div>
                    <div class="snapshot-info-title">
                      📌 ${formatDateIndo(s.dateString)} <span class="text-xs font-mono text-muted">(${s.timeString})</span>
                    </div>
                    <div class="snapshot-info-meta mt-0.5">
                      🏠 ${s.summary?.roomsCount || 0} Kamar • 👥 ${s.summary?.tenantsCount || 0} Penyewa • 🧾 ${s.summary?.billsCount || 0} Tagihan
                    </div>
                  </div>
                  <button type="button" class="btn btn-outline btn-xs btn-restore-local-snap" data-snap-id="${s.id}">
                    ↩️ Pulihkan
                  </button>
                </div>
              `).join('') : `
                <div class="text-xs text-muted p-2 text-center bg-surface-subtle border-radius-md">
                  Snapshot lokal otomatis dibuat dan diperbarui setiap kali Anda mencatat data kos.
                </div>
              `}
            </div>
          </div>

          <!-- BAGIAN 2: PENCADANGAN DATA MANUAL (EXPORT JSON) -->
          <div class="backup-section-header mt-2">
            <span class="backup-section-tag tag-emerald">BAGIAN 2: PENCADANGAN MANUAL (DOWNLOAD JSON)</span>
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
                  Download seluruh database kos (kamar, penyewa, tagihan sewa, dan pengeluaran) ke dalam satu file arsip cadangan <code>.json</code> untuk disimpan di laptop atau Google Drive.
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

          <!-- BAGIAN 3: PEMULIHAN DATA MANUAL (RESTORE JSON) -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-blue">BAGIAN 3: PEMULIHAN DATA MANUAL (RESTORE)</span>
          </div>
          <div class="settings-card backup-action-card card-accent-blue">
            <div class="settings-card-header">
              <div class="settings-icon bg-blue-subtle text-blue">📂</div>
              <div>
                <h3 class="settings-card-title">Import &amp; Pulihkan File Cadangan</h3>
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

          <!-- BAGIAN 4: ALAT BANTU SIMULASI -->
          <div class="backup-section-header">
            <span class="backup-section-tag tag-gray">BAGIAN 4: ALAT BANTU SIMULASI</span>
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

          <!-- BAGIAN 5: ZONA BAHAYA (RESET DATABASE) -->
          <div class="backup-section-header mt-3">
            <span class="backup-section-tag tag-danger">BAGIAN 5: ZONA BAHAYA (RESET DATABASE)</span>
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

        <!-- KOLOM KANAN: PANDUAN & SKENARIO PENYELAMATAN (EDUKASI PENGGUNA) -->
        <div class="backup-col-guide">
          
          <!-- 1. Sistem Triple-Protection Juragankosan -->
          <div class="settings-card guide-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">🛡️</span>
              <h3 class="guide-title">Sistem Triple-Protection Juragankosan</h3>
            </div>
            <p class="guide-desc">
              Kami merancang arsitektur 3 lapis perlindungan data agar pemilik kos terhindar dari mimpi buruk kehilangan catatan sewa:
            </p>
            <div class="guide-highlight-box">
              <div class="highlight-item">
                <span class="item-check">1</span>
                <div>
                  <strong>Local-First (HP Anda):</strong>
                  <p class="text-xs text-secondary mb-0">Buka instan tanpa lag dan bisa digunakan 100% tanpa internet.</p>
                </div>
              </div>
              <div class="highlight-item">
                <span class="item-check">2</span>
                <div>
                  <strong>Anti-Hapus Storage:</strong>
                  <p class="text-xs text-secondary mb-0">Browser dikunci agar memori kosan tidak terhapus saat pembersihan sampah HP.</p>
                </div>
              </div>
              <div class="highlight-item">
                <span class="item-check">3</span>
                <div>
                  <strong>Cloud Safety Vault (Di Balik Layar):</strong>
                  <p class="text-xs text-secondary mb-0">Cadangan tersimpan otomatis ke Cloud Vault menggunakan identitas No. WhatsApp Anda.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Skenario Penyelamatan Saat Ganti HP Baru -->
          <div class="settings-card guide-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">📲</span>
              <h3 class="guide-title">Skenario Penyelamatan Saat Ganti HP Baru</h3>
            </div>
            <p class="guide-desc">
              Jika Anda baru membeli HP baru atau HP lama diservis/rusak:
            </p>
            <ul class="guide-benefits-list">
              <li>
                <div class="benefit-bullet">1️⃣</div>
                <div>
                  <strong>Buka Juragankosan di HP Baru</strong>
                  <p>Buka alamat <code>app.juragankosan.id</code> di Chrome / Safari HP baru Anda.</p>
                </div>
              </li>
              <li>
                <div class="benefit-bullet">2️⃣</div>
                <div>
                  <strong>Klik Tombol "Pulihkan dari Cloud"</strong>
                  <p>Di halaman Backup &amp; Data, klik tombol biru <em>Pulihkan dari Cloud (via No. WA)</em>.</p>
                </div>
              </li>
              <li>
                <div class="benefit-bullet">3️⃣</div>
                <div>
                  <strong>Ketik No. WhatsApp &amp; PIN Keamanan</strong>
                  <p>Sistem akan langsung memuat seluruh kamar, nama penyewa, dan riwayat tagihan Anda dalam 3 detik!</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- 3. Himbauan Rutin & Bantuan Admin -->
          <div class="settings-card guide-card routine-callout-card">
            <div class="guide-card-header">
              <span class="guide-badge-icon">💬</span>
              <h3 class="guide-title text-amber">Butuh Bantuan Pemulihan?</h3>
            </div>
            <div class="routine-quote-box">
              <p class="routine-quote-text">
                &ldquo;Jika Anda mengalami kendala teknis atau tidak sengaja menghapus data, tim Admin WhatsApp kami siap membantu memulihkan arsip data kos Anda kapan saja.&rdquo;
              </p>
            </div>
            <div class="storage-tips-grid mt-3">
              <div class="storage-tip-box">
                <span class="tip-icon">📥</span>
                <div>
                  <strong>Download Backup JSON Berkala</strong>
                  <p class="text-xs text-muted mb-0">Simpan salinan JSON di WhatsApp 'Pesan ke Diri Sendiri' setiap akhir bulan.</p>
                </div>
              </div>
              <div class="storage-tip-box">
                <span class="tip-icon">👑</span>
                <div>
                  <strong>Layanan Prioritas PRO</strong>
                  <p class="text-xs text-muted mb-0">Pengguna PRO mendapatkan prioritas pemulihan data 1-on-1 via WhatsApp Admin.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- MODAL 1: PULIHKAN DARI CLOUD VAULT (VIA NO WHATSAPP & PIN) -->
      <div class="modal-backdrop" id="modal-cloud-restore">
        <div class="modal-dialog modal-md">
          <div class="modal-header border-bottom-indigo">
            <div class="flex-center gap-2">
              <span class="text-indigo font-bold text-lg">☁️</span>
              <h3 class="modal-title">Pulihkan Data dari Cloud Safety Vault</h3>
            </div>
            <button type="button" class="modal-close" data-close-modal="modal-cloud-restore">&times;</button>
          </div>
          <div class="modal-body">
            <div class="p-3 bg-indigo-subtle border-radius-md mb-3">
              <p class="text-xs text-secondary mb-0">
                Masukkan <strong>Nomor WhatsApp Pengelola</strong> yang pernah terdaftar dan <strong>PIN Keamanan</strong> untuk mencari arsip cadangan kos Anda di cloud.
              </p>
            </div>

            <div class="form-group mb-3">
              <label for="input-cloud-restore-phone" class="form-label font-bold">
                Nomor WhatsApp Pengelola <span class="text-danger">*</span>
              </label>
              <input 
                type="tel" 
                id="input-cloud-restore-phone" 
                class="form-control" 
                placeholder="Contoh: 081234567890" 
                value="${escapeHtml(settings.ownerPhone || '')}"
              />
            </div>

            <div class="form-group mb-3">
              <label for="input-cloud-restore-pin" class="form-label font-bold">
                PIN Keamanan (Standar: 1234) <span class="text-danger">*</span>
              </label>
              <input 
                type="password" 
                id="input-cloud-restore-pin" 
                class="form-control font-mono text-center" 
                placeholder="••••" 
                maxlength="6" 
                value="${escapeHtml(settings.securityPin || '1234')}"
              />
            </div>

            <button type="button" class="btn btn-outline w-full mb-3" id="btn-search-cloud-vault">
              🔍 Cari Arsip Cadangan di Cloud
            </button>

            <!-- Box Hasil Pencarian (Muncul jika arsip ditemukan) -->
            <div id="cloud-search-result-box" style="display:none;" class="p-3 bg-surface-subtle border-radius-md border mb-2">
              <div class="text-xs font-bold text-emerald mb-1">✓ Arsip Cadangan Ditemukan!</div>
              <div class="text-sm font-bold text-primary" id="cloud-res-kos-name">-</div>
              <div class="text-xs text-secondary mt-1" id="cloud-res-summary">-</div>
              <div class="text-xs text-muted mt-1" id="cloud-res-date">-</div>

              <button type="button" class="btn btn-primary w-full mt-3" id="btn-execute-cloud-restore">
                🎉 Ya, Pulihkan Data Kos Ini Sekarang
              </button>
            </div>

            <div id="cloud-search-error-msg" class="text-xs text-danger text-center mt-2" style="display:none;"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="modal-cloud-restore">Tutup</button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: PROTEKSI PIN RESET SEMUA DATA (ZONA BAHAYA) -->
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
  // 1. Sinkronisasi Manual ke Cloud Sekarang
  const btnCloudSync = container.querySelector('#btn-cloud-sync-now');
  if (btnCloudSync) {
    btnCloudSync.addEventListener('click', async () => {
      const origText = btnCloudSync.innerHTML;
      btnCloudSync.innerHTML = '<span>⏳ Menyinkronkan...</span>';
      btnCloudSync.disabled = true;

      try {
        const res = await syncToCloudVault(store.data, { force: true });
        if (res.success) {
          showToast('☁️ Data kos Anda berhasil dicadangkan ke Cloud Vault!', 'success');
          renderBackup(container);
        } else if (res.status === 'no_phone') {
          showToast('⚠️ Mohon isi Nomor WhatsApp Pengelola di menu Pengaturan terlebih dahulu!', 'warning');
        } else {
          showToast(res.message || 'Gagal menyinkronkan ke cloud.', 'error');
        }
      } catch (err) {
        showToast('Koneksi terputus. Pastikan perangkat Anda online.', 'error');
      } finally {
        btnCloudSync.innerHTML = origText;
        btnCloudSync.disabled = false;
      }
    });
  }

  // 2. Buka Modal Pulihkan dari Cloud
  const btnOpenRestore = container.querySelector('#btn-open-cloud-restore');
  if (btnOpenRestore) {
    btnOpenRestore.addEventListener('click', () => {
      openModal('modal-cloud-restore');
    });
  }

  // 3. Cari Arsip di Cloud Vault
  const btnSearchVault = container.querySelector('#btn-search-cloud-vault');
  const inputRestorePhone = container.querySelector('#input-cloud-restore-phone');
  const inputRestorePin = container.querySelector('#input-cloud-restore-pin');
  const resultBox = container.querySelector('#cloud-search-result-box');
  const errorMsg = container.querySelector('#cloud-search-error-msg');
  const resKosName = container.querySelector('#cloud-res-kos-name');
  const resSummary = container.querySelector('#cloud-res-summary');
  const resDate = container.querySelector('#cloud-res-date');
  const btnExecuteRestore = container.querySelector('#btn-execute-cloud-restore');

  let fetchedBackupData = null;

  if (btnSearchVault && inputRestorePhone && inputRestorePin) {
    btnSearchVault.addEventListener('click', async () => {
      const phone = inputRestorePhone.value.trim();
      const pin = inputRestorePin.value.trim();

      if (!phone) {
        showToast('Masukkan nomor WhatsApp pengelola!', 'warning');
        return;
      }

      btnSearchVault.disabled = true;
      btnSearchVault.textContent = '🔍 Mencari di Brankas Cloud...';
      if (resultBox) resultBox.style.display = 'none';
      if (errorMsg) errorMsg.style.display = 'none';

      try {
        const res = await fetchCloudBackup(phone, pin);
        if (res.success && res.backup) {
          fetchedBackupData = res.backup;
          if (resKosName) resKosName.textContent = res.backup.settings?.kosName || 'Juragankosan';
          if (resSummary) {
            const rCount = res.backup.rooms?.length || 0;
            const tCount = res.backup.tenants?.length || 0;
            const bCount = res.backup.bills?.length || 0;
            resSummary.textContent = `Arsip Terdeteksi: ${rCount} Kamar • ${tCount} Penyewa • ${bCount} Tagihan`;
          }
          if (resDate && res.updatedAt) {
            resDate.textContent = `Waktu Pencadangan: ${new Date(res.updatedAt).toLocaleString('id-ID')}`;
          }
          if (resultBox) resultBox.style.display = 'block';
        } else {
          fetchedBackupData = null;
          if (errorMsg) {
            errorMsg.textContent = res.message || 'Data cadangan tidak ditemukan.';
            errorMsg.style.display = 'block';
          }
        }
      } catch (e) {
        if (errorMsg) {
          errorMsg.textContent = 'Gagal menghubungi server cloud. Periksa koneksi internet.';
          errorMsg.style.display = 'block';
        }
      } finally {
        btnSearchVault.disabled = false;
        btnSearchVault.textContent = '🔍 Cari Arsip Cadangan di Cloud';
      }
    });
  }

  // 4. Eksekusi Pemulihan dari Cloud
  if (btnExecuteRestore) {
    btnExecuteRestore.addEventListener('click', async () => {
      if (!fetchedBackupData) return;

      const confirmed = await showConfirmModal({
        title: 'Pulihkan Data Kos dari Cloud?',
        message: 'Seluruh data di perangkat ini akan diperbarui mengikuti data cadangan cloud yang ditemukan. Lanjutkan pemulihan?',
        confirmText: 'Ya, Pulihkan Sekarang',
        danger: false
      });

      if (confirmed) {
        const res = store.importDataJSON(JSON.stringify(fetchedBackupData));
        if (res.success) {
          showToast('🎉 Data kos berhasil dipulihkan dari Cloud Vault!', 'success');
          closeModal('modal-cloud-restore');
          renderBackup(container);
          if (window.juraganApp) {
            window.juraganApp.updateKosHeader();
            window.juraganApp.updateBadges();
          }
        } else {
          showToast('Gagal memproses data pemulihan: ' + res.message, 'error');
        }
      }
    });
  }

  // 5. Pulihkan dari Snapshot Lokal Darurat
  const restoreSnapBtns = container.querySelectorAll('.btn-restore-local-snap');
  restoreSnapBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const snapId = btn.dataset.snapId;
      if (!snapId) return;

      const confirmed = await showConfirmModal({
        title: 'Kembalikan ke Snapshot Ini?',
        message: 'Data saat ini akan diganti dengan rekaman snapshot tanggal tersebut. Gunakan fitur ini jika Anda baru saja salah catat.',
        confirmText: 'Ya, Pulihkan Snapshot',
        danger: false
      });

      if (confirmed) {
        const snap = await getSnapshotById(snapId);
        if (snap && snap.data) {
          store.data = snap.data;
          store.save();
          showToast('🎉 Data berhasil dikembalikan ke snapshot terpilih!', 'success');
          renderBackup(container);
          if (window.juraganApp) {
            window.juraganApp.updateKosHeader();
            window.juraganApp.updateBadges();
          }
        } else {
          showToast('Gagal memuat snapshot lokal.', 'error');
        }
      }
    });
  });

  // 6. Download Backup JSON (PRO)
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

  // 7. Upgrade PRO Button (If Free)
  const btnUpgrade = container.querySelector('#btn-backup-upgrade');
  if (btnUpgrade) {
    btnUpgrade.addEventListener('click', () => {
      openUpgradeModal();
    });
  }

  // 8. Import JSON File
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

  // 9. Reload Sample Demo Data
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

  // 10. Reset All Data (Zona Bahaya) - PIN Protected (In-Card & Modal)
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
      localStorage.removeItem('juragankos_onboarded');
      sessionStorage.setItem('jk_reset_toast', 'Semua data kos berhasil dibersihkan.');
    } catch (e) {}

    window.location.hash = 'dashboard';
    window.location.reload();
  };

  // In-Card PIN Handler
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
      if (pinVal.length >= 4) {
        inputCardResetPin.classList.add('is-invalid');
        if (cardStatusMsg) {
          cardStatusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-danger font-medium text-center';
          cardStatusMsg.innerHTML = '✕ PIN Salah! Pastikan PIN sesuai di menu Pengaturan.';
        }
      } else {
        inputCardResetPin.classList.remove('is-invalid');
        if (cardStatusMsg) {
          cardStatusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-muted text-center';
          cardStatusMsg.innerHTML = 'Ketik PIN keamanan (standar: 1234) untuk mengaktifkan tombol.';
        }
      }
    }
  };

  if (inputCardResetPin) {
    inputCardResetPin.addEventListener('input', validateCardResetPin);
  }

  if (btnCardExecuteReset) {
    btnCardExecuteReset.addEventListener('click', () => {
      if (btnCardExecuteReset.disabled) return;
      openModal('modal-reset-data-pin');
      if (inputResetPin) {
        inputResetPin.value = '';
        inputResetPin.classList.remove('is-valid', 'is-invalid');
        if (statusMsg) {
          statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-muted';
          statusMsg.innerHTML = 'Ketik PIN keamanan Anda untuk mengonfirmasi reset.';
        }
      }
      if (btnExecuteReset) btnExecuteReset.disabled = true;
    });
  }

  // Modal PIN Handler
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

  if (inputResetPin && btnExecuteReset) {
    inputResetPin.addEventListener('input', () => {
      const pinVal = inputResetPin.value.trim();
      const isValid = store.verifySecurityPin(pinVal);

      if (isValid) {
        btnExecuteReset.disabled = false;
        btnExecuteReset.classList.add('btn-danger-active-glow');
        inputResetPin.classList.remove('is-invalid');
        inputResetPin.classList.add('is-valid');
        if (statusMsg) {
          statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-emerald font-bold';
          statusMsg.innerHTML = '✓ PIN Cocok! Klik tombol merah untuk melanjutkan.';
        }
      } else {
        btnExecuteReset.disabled = true;
        btnExecuteReset.classList.remove('btn-danger-active-glow');
        inputResetPin.classList.remove('is-valid');
        if (pinVal.length >= 4) {
          inputResetPin.classList.add('is-invalid');
          if (statusMsg) {
            statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-danger font-medium';
            statusMsg.innerHTML = '✕ PIN Salah! Mohon periksa kembali PIN Anda.';
          }
        } else {
          inputResetPin.classList.remove('is-invalid');
          if (statusMsg) {
            statusMsg.className = 'reset-pin-status-msg text-xs mt-1 text-muted';
            statusMsg.innerHTML = 'Ketik PIN keamanan dengan benar untuk membuka tombol eksekusi.';
          }
        }
      }
    });

    btnExecuteReset.addEventListener('click', () => {
      if (btnExecuteReset.disabled) return;
      triggerResetExecution();
    });
  }
}
