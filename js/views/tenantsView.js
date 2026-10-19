/**
 * Juragankosan Tenants View (Tab 3: Database Penyewa & Check-in/Check-out)
 */
import { store } from '../state.js?v=2.5';
import {
  formatRupiah,
  formatDateIndo,
  cleanWhatsAppNumber,
  formatDisplayPhone,
  escapeHtml,
  getTodayDateString
} from '../utils/formatter.js?v=2.5';
import { openModal, closeModal, showToast, showConfirmModal } from '../utils/modal.js?v=2.5';

let currentTab = 'aktif'; // 'aktif' | 'keluar'
let currentSearch = '';

export function renderTenants(container, options = {}) {
  const allTenants = store.getTenants();
  const rooms = store.getRooms();
  const vacantRooms = store.getVacantRooms();

  if (options.searchTenantId) {
    const target = allTenants.find((t) => t.id === options.searchTenantId);
    if (target) {
      currentSearch = target.name;
    }
  }

  // Filter tenants
  const filteredTenants = allTenants.filter((tenant) => {
    const matchesStatus =
      currentTab === 'aktif' ? tenant.status === 'aktif' : tenant.status === 'keluar';

    const s = currentSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      tenant.name.toLowerCase().includes(s) ||
      (tenant.roomNumber && tenant.roomNumber.toLowerCase().includes(s)) ||
      (tenant.phone && tenant.phone.includes(s)) ||
      (tenant.emergencyPhone && tenant.emergencyPhone.includes(s)) ||
      (tenant.emergencyContactName && tenant.emergencyContactName.toLowerCase().includes(s)) ||
      (tenant.originAddress && tenant.originAddress.toLowerCase().includes(s)) ||
      (tenant.idNumber && tenant.idNumber.includes(s)) ||
      (tenant.occupation && tenant.occupation.toLowerCase().includes(s));

    return matchesStatus && matchesSearch;
  });

  const activeCount = allTenants.filter((t) => t.status === 'aktif').length;
  const historyCount = allTenants.filter((t) => t.status === 'keluar').length;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h1 class="page-title">Database Penyewa Kos</h1>
        <p class="page-subtitle">Pencatatan data kontak penyewa, kamar terisi, tanggal jatuh tempo, dan riwayat check-out</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-add-tenant-modal">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
          </svg>
          + Check-in Penyewa Baru
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="toolbar-card">
      <div class="toolbar-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input 
          type="text" 
          id="tenant-search-input" 
          class="form-control form-control-search" 
          placeholder="Cari nama, kamar, WA, kontak darurat, alamat asal, KTP..." 
          value="${escapeHtml(currentSearch)}"
        />
        ${currentSearch ? `<button class="search-clear-btn" id="btn-clear-tenant-search">&times;</button>` : ''}
      </div>

      <div class="filter-pills">
        <button class="filter-pill ${currentTab === 'aktif' ? 'active' : ''}" data-tab="aktif">
          Penyewa Aktif (${activeCount})
        </button>
        <button class="filter-pill ${currentTab === 'keluar' ? 'active' : ''}" data-tab="keluar">
          Riwayat Check-out (${historyCount})
        </button>
      </div>
    </div>

    <!-- Tenants Grid / Table -->
    ${
      filteredTenants.length === 0
        ? `
      <div class="empty-state-card">
        <div class="empty-icon">👥</div>
        <h3>${currentTab === 'aktif' ? 'Belum Ada Penyewa Aktif' : 'Belum Ada Riwayat Check-out'}</h3>
        <p>${
          currentSearch
            ? 'Tidak ada data penyewa yang sesuai dengan kata kunci pencarian.'
            : currentTab === 'aktif'
            ? 'Kamar Anda siap disewakan. Klik tombol di bawah untuk mencatat penyewa baru.'
            : 'Belum ada penyewa yang pernah check-out dari kos ini.'
        }</p>
        ${
          currentTab === 'aktif'
            ? `<button class="btn btn-primary" id="btn-empty-add-tenant-action">+ Check-in Penyewa Baru</button>`
            : ''
        }
      </div>
    `
        : `
      <div class="cards-grid tenants-grid">
        ${filteredTenants
          .map((tenant) => {
            const room = rooms.find((r) => r.id === tenant.roomId);
            const isAktif = tenant.status === 'aktif';
            const displayPhone = formatDisplayPhone(tenant.phone);
            const cleanPhone = cleanWhatsAppNumber(tenant.phone);
            const cleanEmergencyName = (tenant.emergencyContactName || '').replace(/[()]/g, '').trim();

            return `
              <div class="tenant-card animate-fade-in ${!isAktif ? 'tenant-card-inactive' : ''}">
                <div class="tenant-card-header">
                  <div class="tenant-avatar-large">
                    ${escapeHtml(tenant.name.charAt(0).toUpperCase())}
                  </div>
                  <div class="tenant-header-info">
                    <div class="tenant-header-top">
                      <h3 class="tenant-name-title">${escapeHtml(tenant.name)}</h3>
                      ${
                        isAktif
                          ? `<span class="badge badge-success status-badge-top">Aktif</span>`
                          : `<span class="badge badge-secondary status-badge-top">Sudah Keluar</span>`
                      }
                    </div>
                    <div class="tenant-sub-tags">
                      <span class="room-pill-sm">${escapeHtml(tenant.roomNumber || (room ? room.number : '-'))}</span>
                      ${
                        tenant.occupation
                          ? `<span class="badge badge-neutral">${escapeHtml(tenant.occupation)}</span>`
                          : ''
                      }
                    </div>
                  </div>
                </div>

                <div class="tenant-details-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nomor WhatsApp</span>
                    <a href="https://wa.me/${cleanPhone}" target="_blank" class="wa-link-btn" title="Kirim Chat WhatsApp">
                      <svg class="wa-icon-sm" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      ${displayPhone}
                    </a>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Tanggal Masuk</span>
                    <span class="detail-value">${formatDateIndo(tenant.checkInDate)}</span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Jatuh Tempo</span>
                    <span class="detail-value font-medium text-emerald" title="Tiap Tanggal ${tenant.dueDay || '1'}">Tiap Tgl ${tenant.dueDay || '1'}</span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Uang Deposit</span>
                    <span class="detail-value">${tenant.deposit ? formatRupiah(tenant.deposit) : 'Tidak Ada'}</span>
                  </div>

                  ${
                    tenant.emergencyPhone
                      ? `
                    <div class="detail-item detail-full-width">
                      <span class="detail-label">Kontak Darurat ${cleanEmergencyName ? `(${escapeHtml(cleanEmergencyName)})` : ''}</span>
                      <a href="https://wa.me/${cleanWhatsAppNumber(tenant.emergencyPhone)}" target="_blank" class="wa-link-emergency" title="Hubungi Kontak Darurat ${cleanEmergencyName ? `(${cleanEmergencyName})` : ''}">
                        <span>🚨</span> ${formatDisplayPhone(tenant.emergencyPhone)}
                      </a>
                    </div>
                  `
                      : ''
                  }

                  ${
                    tenant.idNumber
                      ? `
                    <div class="detail-item detail-full-width">
                      <span class="detail-label">No. KTP / Identitas</span>
                      <span class="detail-value font-mono text-break">${escapeHtml(tenant.idNumber)}</span>
                    </div>
                  `
                      : ''
                  }

                  ${
                    tenant.originAddress
                      ? `
                    <div class="detail-item detail-full-width">
                      <span class="detail-label">Alamat Asal (Domisili KTP)</span>
                      <span class="detail-value text-secondary">📍 ${escapeHtml(tenant.originAddress)}</span>
                    </div>
                  `
                      : ''
                  }

                  ${
                    !isAktif && tenant.checkOutDate
                      ? `
                    <div class="detail-item detail-full-width bg-surface-subtle p-2 rounded">
                      <span class="detail-label text-danger">Tanggal Check-out:</span>
                      <span class="detail-value">${formatDateIndo(tenant.checkOutDate)}</span>
                    </div>
                  `
                      : ''
                  }

                  ${
                    tenant.notes
                      ? `
                    <div class="detail-item detail-full-width">
                      <span class="detail-label">Catatan:</span>
                      <span class="detail-value text-secondary">${escapeHtml(tenant.notes)}</span>
                    </div>
                  `
                      : ''
                  }
                </div>

                <div class="tenant-card-actions">
                  ${
                    isAktif
                      ? `
                    <button class="btn btn-outline btn-sm btn-view-bills" data-tenant-id="${tenant.id}" title="Lihat Tagihan Sewa">
                      💳 Tagihan
                    </button>
                    <button class="btn btn-outline btn-sm btn-edit-tenant" data-tenant-id="${tenant.id}" title="Edit Data Penyewa">
                      ✏️ Edit
                    </button>
                    <button class="btn btn-danger-outline btn-sm btn-checkout-tenant" data-tenant-id="${tenant.id}" title="Check-out Penyewa">
                      🚪 Keluar
                    </button>
                  `
                      : `
                    <button class="btn btn-outline btn-sm btn-edit-tenant" data-tenant-id="${tenant.id}" style="width: 100%;">
                      ✏️ Edit Catatan
                    </button>
                  `
                  }
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `
    }

    <!-- Add / Edit Tenant Modal -->
    <div id="tenant-form-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" id="tenant-modal-title">Check-in Penyewa Baru</h3>
          <button class="modal-close" data-close-modal="tenant-form-modal">&times;</button>
        </div>
        <form id="tenant-form" novalidate>
          <input type="hidden" id="tenant-id-input" value="" />
          <div class="modal-body">
            <div id="tenant-modal-alert"></div>

            <div class="form-group">
              <label for="tenant-name" class="form-label">Nama Lengkap Penyewa <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="tenant-name" 
                class="form-control" 
                placeholder="Contoh: Dimas Pratama Putra" 
                required 
              />
              <span class="form-error" id="error-tenant-name"></span>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="tenant-phone" class="form-label">Nomor WhatsApp Utama <span class="text-danger">*</span></label>
                <div class="input-with-prefix">
                  <span class="input-prefix">🇮🇩</span>
                  <input 
                    type="tel" 
                    id="tenant-phone" 
                    class="form-control" 
                    placeholder="Contoh: 081234567890" 
                    required 
                  />
                </div>
                <span class="form-hint">Otomatis diformat ke awalan 62</span>
                <span class="form-error" id="error-tenant-phone"></span>
              </div>

              <div class="form-group flex-1">
                <label for="tenant-id-number" class="form-label">No. KTP / Paspor</label>
                <input 
                  type="text" 
                  id="tenant-id-number" 
                  class="form-control" 
                  placeholder="16 digit nomor NIK KTP" 
                  maxlength="20" 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="tenant-emergency-phone" class="form-label">Nomor WA / Kontak Darurat</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">🚨</span>
                  <input 
                    type="tel" 
                    id="tenant-emergency-phone" 
                    class="form-control" 
                    placeholder="Contoh: 081298765432" 
                  />
                </div>
                <span class="form-hint">Otomatis diformat ke awalan 62</span>
              </div>

              <div class="form-group flex-1">
                <label for="tenant-emergency-name" class="form-label">Nama / Hubungan Kontak Darurat</label>
                <input 
                  type="text" 
                  id="tenant-emergency-name" 
                  class="form-control" 
                  placeholder="Contoh: Bpk. Hendra (Ayah) / Ibu Kandung" 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="tenant-origin-address" class="form-label">Alamat Asal (Domisili KTP)</label>
              <input 
                type="text" 
                id="tenant-origin-address" 
                class="form-control" 
                placeholder="Contoh: Jl. Dago No. 12, Coblong, Kota Bandung, Jawa Barat" 
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1" id="group-select-room">
                <label for="tenant-room-id" class="form-label">Pilih Kamar Kosong <span class="text-danger">*</span></label>
                <select id="tenant-room-id" class="form-control" required>
                  <option value="">-- Pilih Kamar Kosong --</option>
                  ${renderVacantRoomOptions(vacantRooms)}
                </select>
                <span class="form-error" id="error-tenant-room"></span>
              </div>

              <div class="form-group flex-1">
                <label for="tenant-occupation" class="form-label">Pekerjaan / Status</label>
                <input 
                  type="text" 
                  id="tenant-occupation" 
                  class="form-control" 
                  placeholder="Contoh: Karyawan Swasta / Mahasiswa" 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="tenant-checkin-date" class="form-label">Tanggal Masuk (Check-in) <span class="text-danger">*</span></label>
                <input 
                  type="date" 
                  id="tenant-checkin-date" 
                  class="form-control" 
                  value="${getTodayDateString()}" 
                  required 
                />
              </div>

              <div class="form-group flex-1">
                <label for="tenant-dueday" class="form-label">Tanggal Jatuh Tempo Tiap Bulan</label>
                <input 
                  type="number" 
                  id="tenant-dueday" 
                  class="form-control" 
                  min="1" 
                  max="31" 
                  placeholder="Contoh: 1, 5, 10..." 
                />
                <span class="form-hint">Tanggal 1–31 untuk tagihan bulanan</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="tenant-deposit" class="form-label">Uang Jaminan / Deposit (Rp)</label>
                <input 
                  type="number" 
                  id="tenant-deposit" 
                  class="form-control" 
                  placeholder="Contoh: 500000" 
                  min="0" 
                  step="50000" 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="tenant-notes" class="form-label">Catatan Tambahan (Kontak Darurat, Plat Motor, dll)</label>
              <textarea 
                id="tenant-notes" 
                class="form-control" 
                rows="2" 
                placeholder="Contoh: Motor Vario hitam B 1234 XYZ. Kontak ortu: 0812334455..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="tenant-form-modal">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-tenant">Simpan &amp; Check-in</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Check-out Confirmation Modal -->
    <div id="checkout-modal" class="modal-backdrop">
      <div class="modal-dialog modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">Konfirmasi Check-out Penyewa</h3>
          <button class="modal-close" data-close-modal="checkout-modal">&times;</button>
        </div>
        <form id="checkout-form">
          <input type="hidden" id="checkout-tenant-id" value="" />
          <div class="modal-body">
            <p id="checkout-info-text" class="text-body mb-3"></p>
            <div class="form-group">
              <label for="checkout-date" class="form-label">Tanggal Check-out</label>
              <input type="date" id="checkout-date" class="form-control" value="${getTodayDateString()}" required />
            </div>
            <div class="form-group">
              <label for="checkout-deposit-status" class="form-label">Status Pengembalian Deposit</label>
              <select id="checkout-deposit-status" class="form-control">
                <option value="Deposit dikembalikan penuh">Deposit dikembalikan penuh</option>
                <option value="Deposit dipotong untuk perbaikan/denda">Deposit dipotong untuk perbaikan/denda</option>
                <option value="Tidak ada deposit / sudah selesai">Tidak ada deposit / sudah selesai</option>
              </select>
            </div>
            <div class="form-group">
              <label for="checkout-note" class="form-label">Catatan Saat Check-out</label>
              <textarea id="checkout-note" class="form-control" rows="2" placeholder="Kondisi kamar baik, kunci diserahkan..."></textarea>
            </div>
            <div class="alert-box-info">
              💡 Setelah check-out, status kamar akan otomatis berubah menjadi <strong>KOSONG (Hijau)</strong> dan siap disewakan kembali.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="checkout-modal">Batal</button>
            <button type="submit" class="btn btn-danger">Ya, Proses Check-out</button>
          </div>
        </form>
      </div>
    </div>
  `;

  setupTenantsEvents(container);

  if (options.openAddModal) {
    openAddTenantModal(options.preselectedRoomId);
  }
}

function setupTenantsEvents(container) {
  // Search
  const searchInput = container.querySelector('#tenant-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderTenants(container);
    });
  }

  const btnClearSearch = container.querySelector('#btn-clear-tenant-search');
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      currentSearch = '';
      renderTenants(container);
    });
  }

  // Tabs (Aktif vs Keluar)
  container.querySelectorAll('.filter-pill[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentTab = tab.getAttribute('data-tab');
      renderTenants(container);
    });
  });

  // Open Add Modal
  const btnAdd = container.querySelector('#btn-add-tenant-modal');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openAddTenantModal());
  }

  const btnEmptyAdd = container.querySelector('#btn-empty-add-tenant-action');
  if (btnEmptyAdd) {
    btnEmptyAdd.addEventListener('click', () => openAddTenantModal());
  }

  // Edit Tenant
  container.querySelectorAll('.btn-edit-tenant').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tenantId = btn.getAttribute('data-tenant-id');
      openEditTenantModal(tenantId);
    });
  });

  // View Bills for Tenant
  container.querySelectorAll('.btn-view-bills').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tenantId = btn.getAttribute('data-tenant-id');
      const tenant = store.getTenantById(tenantId);
      window.juraganApp.switchTab('bills', { searchKeyword: tenant ? tenant.name : '' });
    });
  });

  // Check-out Tenant
  container.querySelectorAll('.btn-checkout-tenant').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tenantId = btn.getAttribute('data-tenant-id');
      openCheckoutModal(tenantId);
    });
  });

  // Submit Add/Edit Tenant Form
  const tenantForm = container.querySelector('#tenant-form');
  if (tenantForm) {
    tenantForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTenantForm(container);
    });
  }

  // Submit Check-out Form
  const checkoutForm = container.querySelector('#checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCheckoutForm(container);
    });
  }
}

function renderVacantRoomOptions(vacantRooms, preselectedId = null) {
  if (!vacantRooms || vacantRooms.length === 0) {
    return '<option value="" disabled>-- Tidak Ada Kamar Kosong --</option>';
  }

  // Cek apakah ada informasi lantai
  const hasFloors = vacantRooms.some((r) => r.floor && r.floor.trim());

  if (hasFloors) {
    const grouped = {};
    vacantRooms.forEach((r) => {
      const fl = (r.floor || 'Lainnya').trim();
      if (!grouped[fl]) grouped[fl] = [];
      grouped[fl].push(r);
    });

    return Object.keys(grouped)
      .map(
        (floorName) => `
        <optgroup label="🏢 ${escapeHtml(floorName)} (${grouped[floorName].length} Kamar Kosong)">
          ${grouped[floorName]
            .map(
              (r) => `
            <option value="${r.id}" ${preselectedId === r.id ? 'selected' : ''}>
              ${escapeHtml(r.number)} • ${escapeHtml(r.type)} • ${formatRupiah(r.price)}/bln
            </option>
          `
            )
            .join('')}
        </optgroup>
      `
      )
      .join('');
  }

  return vacantRooms
    .map(
      (r) => `
    <option value="${r.id}" ${preselectedId === r.id ? 'selected' : ''}>
      ${escapeHtml(r.number)} • ${escapeHtml(r.type)} • ${formatRupiah(r.price)}/bln
    </option>
  `
    )
    .join('');
}

function openAddTenantModal(preselectedRoomId = null) {
  const vacantRooms = store.getVacantRooms();
  const alertEl = document.getElementById('tenant-modal-alert');
  const saveBtn = document.getElementById('btn-save-tenant');
  const roomSelect = document.getElementById('tenant-room-id');

  alertEl.innerHTML = '';

  if (vacantRooms.length === 0) {
    alertEl.innerHTML = `
      <div class="alert-banner alert-warning mb-3">
        <span class="alert-banner-icon" style="font-size: 1.35rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">⚠️</span>
        <div class="alert-banner-content" style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0;">
          <strong style="color: inherit; font-size: 0.88rem; line-height: 1.3;">Semua kamar sedang terisi!</strong>
          <span style="font-size: 0.76rem; line-height: 1.4; opacity: 0.95;">Tambahkan kamar baru di tab Data Kamar atau check-out penyewa lama terlebih dahulu sebelum mendaftarkan penyewa baru.</span>
        </div>
      </div>
    `;
    saveBtn.disabled = true;
  } else {
    saveBtn.disabled = false;
  }

  document.getElementById('tenant-modal-title').textContent = 'Check-in Penyewa Baru';
  document.getElementById('tenant-id-input').value = '';
  document.getElementById('tenant-name').value = '';
  document.getElementById('tenant-phone').value = '';
  document.getElementById('tenant-emergency-phone').value = '';
  document.getElementById('tenant-emergency-name').value = '';
  document.getElementById('tenant-origin-address').value = '';
  document.getElementById('tenant-id-number').value = '';
  document.getElementById('tenant-occupation').value = '';
  document.getElementById('tenant-checkin-date').value = getTodayDateString();
  document.getElementById('tenant-dueday').value = new Date().getDate();
  document.getElementById('tenant-deposit').value = '';
  document.getElementById('tenant-notes').value = '';

  // Room Select visibility
  document.getElementById('group-select-room').style.display = 'block';

  // Populate vacant rooms
  roomSelect.innerHTML = `
    <option value="">-- Pilih Kamar Kosong --</option>
    ${renderVacantRoomOptions(vacantRooms, preselectedRoomId)}
  `;

  clearTenantFormErrors();
  openModal('tenant-form-modal');
}

function openEditTenantModal(tenantId) {
  const tenant = store.getTenantById(tenantId);
  if (!tenant) return;

  document.getElementById('tenant-modal-title').textContent = `Edit Data ${tenant.name}`;
  document.getElementById('tenant-id-input').value = tenant.id;
  document.getElementById('tenant-name').value = tenant.name;
  document.getElementById('tenant-phone').value = tenant.phone;
  document.getElementById('tenant-emergency-phone').value = tenant.emergencyPhone || '';
  document.getElementById('tenant-emergency-name').value = tenant.emergencyContactName || '';
  document.getElementById('tenant-origin-address').value = tenant.originAddress || '';
  document.getElementById('tenant-id-number').value = tenant.idNumber || '';
  document.getElementById('tenant-occupation').value = tenant.occupation || '';
  document.getElementById('tenant-checkin-date').value = tenant.checkInDate || getTodayDateString();
  document.getElementById('tenant-dueday').value = tenant.dueDay || 1;
  document.getElementById('tenant-deposit').value = tenant.deposit || '';
  document.getElementById('tenant-notes').value = tenant.notes || '';

  // Cannot change room directly in edit (must check-out or reassign)
  document.getElementById('group-select-room').style.display = 'none';
  document.getElementById('tenant-modal-alert').innerHTML = '';
  document.getElementById('btn-save-tenant').disabled = false;

  clearTenantFormErrors();
  openModal('tenant-form-modal');
}

function clearTenantFormErrors() {
  document.getElementById('error-tenant-name').textContent = '';
  document.getElementById('error-tenant-phone').textContent = '';
  const errorRoom = document.getElementById('error-tenant-room');
  if (errorRoom) errorRoom.textContent = '';
  document.getElementById('tenant-name').classList.remove('input-invalid');
  document.getElementById('tenant-phone').classList.remove('input-invalid');
}

function saveTenantForm(container) {
  clearTenantFormErrors();
  const id = document.getElementById('tenant-id-input').value;
  const name = document.getElementById('tenant-name').value.trim();
  const rawPhone = document.getElementById('tenant-phone').value.trim();
  const rawEmergencyPhone = document.getElementById('tenant-emergency-phone').value.trim();
  const emergencyPhone = rawEmergencyPhone ? cleanWhatsAppNumber(rawEmergencyPhone) : '';
  const emergencyContactName = document.getElementById('tenant-emergency-name').value.trim();
  const originAddress = document.getElementById('tenant-origin-address').value.trim();
  const idNumber = document.getElementById('tenant-id-number').value.trim();
  const occupation = document.getElementById('tenant-occupation').value.trim();
  const checkInDate = document.getElementById('tenant-checkin-date').value;
  const dueDay = document.getElementById('tenant-dueday').value;
  const deposit = document.getElementById('tenant-deposit').value;
  const notes = document.getElementById('tenant-notes').value.trim();

  let hasError = false;

  if (!name) {
    document.getElementById('error-tenant-name').textContent = 'Nama penyewa wajib diisi!';
    document.getElementById('tenant-name').classList.add('input-invalid');
    hasError = true;
  }

  const cleanPhone = cleanWhatsAppNumber(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) {
    document.getElementById('error-tenant-phone').textContent =
      'Nomor WhatsApp wajib diisi (minimal 9 digit nomor HP valid)!';
    document.getElementById('tenant-phone').classList.add('input-invalid');
    hasError = true;
  }

  if (!id) {
    const roomId = document.getElementById('tenant-room-id').value;
    if (!roomId) {
      document.getElementById('error-tenant-room').textContent = 'Pilih salah satu kamar yang kosong!';
      hasError = true;
    }
    if (hasError) return;

    try {
      const newTenant = store.addTenant({
        name,
        phone: cleanPhone,
        emergencyPhone,
        emergencyContactName,
        originAddress,
        idNumber,
        occupation,
        roomId,
        checkInDate,
        dueDay: parseInt(dueDay, 10) || new Date(checkInDate).getDate() || 1,
        deposit,
        notes
      });
      showToast(`Penyewa ${newTenant.name} berhasil di-checkin! Status kamar kini TERISI.`, 'success');
      closeModal('tenant-form-modal');
      renderTenants(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
  } else {
    if (hasError) return;
    store.updateTenant(id, {
      name,
      phone: cleanPhone,
      emergencyPhone,
      emergencyContactName,
      originAddress,
      idNumber,
      occupation,
      checkInDate,
      dueDay: parseInt(dueDay, 10) || 1,
      deposit,
      notes
    });
    showToast(`Data penyewa ${name} berhasil diperbarui!`, 'success');
    closeModal('tenant-form-modal');
    renderTenants(container);
  }
}

function openCheckoutModal(tenantId) {
  const tenant = store.getTenantById(tenantId);
  if (!tenant) return;

  document.getElementById('checkout-tenant-id').value = tenant.id;
  document.getElementById('checkout-date').value = getTodayDateString();
  document.getElementById('checkout-note').value = '';
  document.getElementById('checkout-info-text').innerHTML = `
    Proses check-out untuk <strong>${escapeHtml(tenant.name)}</strong> dari <strong>${escapeHtml(
    tenant.roomNumber
  )}</strong>.
  `;

  openModal('checkout-modal');
}

function saveCheckoutForm(container) {
  const tenantId = document.getElementById('checkout-tenant-id').value;
  const checkOutDate = document.getElementById('checkout-date').value;
  const depositStatus = document.getElementById('checkout-deposit-status').value;
  const note = document.getElementById('checkout-note').value.trim();

  const combinedNote = `${depositStatus}. ${note}`;
  const res = store.checkOutTenant(tenantId, checkOutDate, combinedNote);

  if (res.success) {
    showToast('Penyewa berhasil check-out. Status kamar otomatis kembali KOSONG!', 'success');
    closeModal('checkout-modal');
    renderTenants(container);
  } else {
    showToast(res.message, 'error');
  }
}
