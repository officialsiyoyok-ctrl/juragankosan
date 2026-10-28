/**
 * Juragankosan Rooms View (Tab 2: Data Kamar & Okupansi)
 */
import { store } from '../state.js';
import { formatRupiah, escapeHtml } from '../utils/formatter.js';
import { openModal, closeModal, showToast, showConfirmModal, bindCustomPicker } from '../utils/modal.js';
import { isPro, canAddRoom, openUpgradeModal, MAX_FREE_ROOMS } from '../utils/license.js';

const FLOOR_OPTIONS = [
  'Lantai 1',
  'Lantai 2',
  'Lantai 3',
  'Lantai 4',
  'Paviliun Depan',
  'Paviliun Belakang'
];

const ROOM_TYPE_OPTIONS = [
  'Standar Non-AC',
  'Standar AC',
  'VIP AC',
  'VIP Balkon',
  'Paviliun Rumah',
  'Studio Eksekutif'
];

let currentFilter = 'all'; // 'all', 'kosong', 'terisi'
let currentSearch = '';

export function renderRooms(container, options = {}) {
  if (options.filter) {
    currentFilter = options.filter;
  }

  const allRooms = store.getRooms();
  const tenants = store.getTenants();

  // Filter and search
  const filteredRooms = allRooms.filter((room) => {
    const matchesFilter =
      currentFilter === 'all' ||
      (currentFilter === 'kosong' && room.status === 'kosong') ||
      (currentFilter === 'terisi' && room.status === 'terisi');

    const searchLower = currentSearch.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      room.number.toLowerCase().includes(searchLower) ||
      room.type.toLowerCase().includes(searchLower) ||
      room.floor.toLowerCase().includes(searchLower) ||
      (room.facilities && room.facilities.some((f) => f.toLowerCase().includes(searchLower)));

    return matchesFilter && matchesSearch;
  });

  const vacantCount = allRooms.filter((r) => r.status === 'kosong').length;
  const occupiedCount = allRooms.filter((r) => r.status === 'terisi').length;
  const isProActive = isPro();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h1 class="page-title">Data Kamar &amp; Okupansi</h1>
        <p class="page-subtitle">Kelola daftar unit kamar/kontrakan, fasilitas, harga sewa, dan status ketersediaan</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-add-room-modal">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Tambah Kamar Baru
        </button>
      </div>
    </div>

    <!-- Room Quota Bar (Freemium Monetization) -->
    <div class="room-quota-bar ${isProActive ? 'quota-bar-pro' : 'quota-bar-free'}">
      <div class="quota-bar-left">
        <span class="quota-badge ${isProActive ? 'badge-pro-gold' : (allRooms.length >= MAX_FREE_ROOMS ? 'badge-quota-warning' : 'badge-quota-free')}">
          ${isProActive 
            ? '👑 JURAGAN PRO (Unlimited Kamar)' 
            : `Paket Gratis: ${allRooms.length} / ${MAX_FREE_ROOMS} Kamar`}
        </span>
        <span class="quota-desc-text">
          ${isProActive 
            ? 'Akses PRO Lifetime Aktif — Bebas kelola puluhan unit kamar &amp; kontrakan tanpa batas.' 
            : (allRooms.length >= MAX_FREE_ROOMS 
                ? '⚠️ Batas kuota gratis 3 kamar tercapai. Upgrade ke PRO untuk menambah kamar baru.' 
                : `Tersisa kuota ${MAX_FREE_ROOMS - allRooms.length} kamar lagi pada paket gratis.`)}
        </span>
      </div>
      ${!isProActive ? `
        <button type="button" class="btn btn-warning btn-sm btn-quota-upgrade" id="btn-quota-upgrade-rooms">
          👑 Upgrade PRO
        </button>
      ` : ''}
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="toolbar-card">
      <div class="toolbar-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input 
          type="text" 
          id="room-search-input" 
          class="form-control form-control-search" 
          placeholder="Cari nomor kamar, tipe, fasilitas (contoh: AC, KM Dalam)..." 
          value="${escapeHtml(currentSearch)}"
        />
        ${currentSearch ? `<button class="search-clear-btn" id="btn-clear-room-search">&times;</button>` : ''}
      </div>

      <div class="filter-pills">
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          Semua (${allRooms.length})
        </button>
        <button class="filter-pill ${currentFilter === 'kosong' ? 'active' : ''}" data-filter="kosong">
          <span class="dot-indicator bg-emerald"></span> Kosong (${vacantCount})
        </button>
        <button class="filter-pill ${currentFilter === 'terisi' ? 'active' : ''}" data-filter="terisi">
          <span class="dot-indicator bg-blue"></span> Terisi (${occupiedCount})
        </button>
      </div>
    </div>

    <!-- Rooms Cards Grid -->
    ${
      filteredRooms.length === 0
        ? `
      <div class="empty-state-card">
        <div class="empty-icon">🛏️</div>
        <h3>Tidak Ada Kamar Ditemukan</h3>
        <p>${
          currentSearch || currentFilter !== 'all'
            ? 'Tidak ada kamar yang cocok dengan kriteria pencarian atau filter Anda.'
            : 'Belum ada data kamar terdaftar. Tambahkan kamar pertama Anda sekarang!'
        }</p>
        <button class="btn btn-primary" id="btn-empty-create-room">+ Tambah Kamar Baru</button>
      </div>
    `
        : `
      <div class="cards-grid">
        ${filteredRooms
          .map((room) => {
            const isOccupied = room.status === 'terisi';
            const tenant = isOccupied ? tenants.find((t) => t.id === room.currentTenantId) : null;

            return `
              <div class="room-card ${isOccupied ? 'is-occupied' : 'is-vacant'} animate-fade-in">
                <div class="room-card-top">
                  <div>
                    <div class="room-floor-tag">${escapeHtml(room.floor || 'Lantai 1')}</div>
                    <h3 class="room-card-number">${escapeHtml(room.number)}</h3>
                    <div class="room-card-type">${escapeHtml(room.type || 'Standar')}</div>
                  </div>
                  <div class="room-status-badge ${isOccupied ? 'badge-occupied' : 'badge-vacant'}">
                    ${isOccupied ? '🔵 TERISI' : '🟢 KOSONG'}
                  </div>
                </div>

                <div class="room-card-price">
                  <span class="price-value">${formatRupiah(room.price)}</span>
                  <span class="price-period">/ bulan</span>
                </div>

                <!-- Facilities Chips -->
                <div class="room-facilities">
                  ${
                    room.facilities && room.facilities.length > 0
                      ? room.facilities
                          .map((f) => `<span class="facility-chip">${escapeHtml(f)}</span>`)
                          .join('')
                      : `<span class="facility-chip text-muted">Fasilitas standar</span>`
                  }
                </div>

                <!-- Occupancy info -->
                <div class="room-tenant-box ${isOccupied ? 'has-tenant' : 'no-tenant'}">
                  ${
                    isOccupied && tenant
                      ? `
                    <div class="tenant-mini-info">
                      <div class="tenant-avatar">${escapeHtml(tenant.name.charAt(0).toUpperCase())}</div>
                      <div class="tenant-mini-details">
                        <span class="tenant-mini-name">${escapeHtml(tenant.name)}</span>
                        <span class="tenant-mini-date">Masuk sejak ${tenant.checkInDate || '-'}</span>
                      </div>
                    </div>
                  `
                      : `
                    <div class="vacant-callout">
                      <span>Unit siap dihuni penyewa baru</span>
                    </div>
                  `
                  }
                </div>

                ${room.notes ? `<div class="room-notes-text">📝 ${escapeHtml(room.notes)}</div>` : ''}

                <!-- Actions -->
                <div class="room-card-actions">
                  ${
                    !isOccupied
                      ? `
                    <button class="btn btn-primary btn-sm btn-checkin-room" data-room-id="${room.id}">
                      + Check-in Penyewa
                    </button>
                  `
                      : `
                    <button class="btn btn-outline btn-sm btn-view-tenant" data-tenant-id="${tenant ? tenant.id : ''}">
                      👤 Lihat Penyewa
                    </button>
                  `
                  }
                  <button class="btn btn-outline btn-sm btn-edit-room" data-room-id="${room.id}" title="Edit Data Kamar">
                    ✏️ Edit
                  </button>
                  <button class="btn btn-ghost btn-sm btn-delete-room text-danger" data-room-id="${room.id}" title="Hapus Kamar">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `
    }

    <!-- Add / Edit Room Modal -->
    <div id="room-form-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" id="room-modal-title">Tambah Kamar Baru</h3>
          <button class="modal-close" data-close-modal="room-form-modal">&times;</button>
        </div>
        <form id="room-form" novalidate>
          <input type="hidden" id="room-id-input" value="" />
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="room-number" class="form-label">Nomor / Nama Kamar <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  id="room-number" 
                  class="form-control" 
                  placeholder="Contoh: Kamar 101 / Paviliun Melati" 
                  required 
                />
                <span class="form-error" id="error-room-number"></span>
              </div>
              <div class="form-group flex-1">
                <label for="room-floor" class="form-label">Lantai / Posisi</label>
                <div class="custom-select-trigger" id="room-floor-trigger" data-picker-for="room-floor" tabindex="0" role="button">
                  <span class="custom-select-label" id="room-floor-label">Lantai 1</span>
                  <span class="custom-select-arrow">▾</span>
                </div>
                <input type="hidden" id="room-floor" value="Lantai 1" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="room-type" class="form-label">Tipe Unit</label>
                <div class="custom-select-trigger" id="room-type-trigger" data-picker-for="room-type" tabindex="0" role="button">
                  <span class="custom-select-label" id="room-type-label">Standar AC</span>
                  <span class="custom-select-arrow">▾</span>
                </div>
                <input type="hidden" id="room-type" value="Standar AC" />
              </div>
              <div class="form-group flex-1">
                <label for="room-price" class="form-label">Harga Sewa Bulanan (Rp) <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  id="room-price" 
                  class="form-control" 
                  placeholder="Contoh: 1500000" 
                  min="1" 
                  step="50000" 
                  required 
                />
                <span class="form-error" id="error-room-price"></span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Fasilitas Kamar (Pilih yang tersedia)</label>
              <div class="facility-checkbox-grid">
                ${[
                  'AC',
                  'Kamar Mandi Dalam',
                  'Kamar Mandi Luar',
                  'Kasur Springbed',
                  'Kasur Busa',
                  'Lemari Pakaian',
                  'Meja Kerja',
                  'WiFi',
                  'Water Heater',
                  'Balkon Pribadi',
                  'Smart TV',
                  'Dapur Mini',
                  'Token Listrik Sendiri',
                  'Kulkas Mini'
                ]
                  .map(
                    (fac) => `
                  <label class="checkbox-label">
                    <input type="checkbox" name="room-facility" value="${fac}">
                    <span class="checkbox-custom"></span>
                    <span>${fac}</span>
                  </label>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="form-group">
              <label for="room-notes" class="form-label">Catatan Tambahan (Opsional)</label>
              <textarea 
                id="room-notes" 
                class="form-control" 
                rows="2" 
                placeholder="Catatan seperti: dekat tangga, baru dicat, meteran listrik #0123..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="room-form-modal">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-room">Simpan Kamar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  setupRoomsEvents(container);

  if (options.openAddModal) {
    openAddRoomModal();
  }
}

function setupRoomsEvents(container) {
  // Search
  const searchInput = container.querySelector('#room-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderRooms(container);
    });
  }

  const btnClearSearch = container.querySelector('#btn-clear-room-search');
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      currentSearch = '';
      renderRooms(container);
    });
  }

  // Filter Pills
  container.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      currentFilter = pill.getAttribute('data-filter');
      renderRooms(container);
    });
  });

  // Quota Upgrade PRO button
  const btnQuotaUpgrade = container.querySelector('#btn-quota-upgrade-rooms');
  if (btnQuotaUpgrade) {
    btnQuotaUpgrade.addEventListener('click', () => openUpgradeModal());
  }

  // Open Add Room Modal
  const btnAddRoom = container.querySelector('#btn-add-room-modal');
  if (btnAddRoom) {
    btnAddRoom.addEventListener('click', () => openAddRoomModal());
  }

  const btnEmptyCreate = container.querySelector('#btn-empty-create-room');
  if (btnEmptyCreate) {
    btnEmptyCreate.addEventListener('click', () => openAddRoomModal());
  }

  // Check-in shortcut from Room Card
  container.querySelectorAll('.btn-checkin-room').forEach((btn) => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      window.juraganApp.switchTab('tenants', { openAddModal: true, preselectedRoomId: roomId });
    });
  });

  // View Tenant shortcut
  container.querySelectorAll('.btn-view-tenant').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tenantId = btn.getAttribute('data-tenant-id');
      window.juraganApp.switchTab('tenants', { searchTenantId: tenantId });
    });
  });

  // Edit Room
  container.querySelectorAll('.btn-edit-room').forEach((btn) => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      openEditRoomModal(roomId);
    });
  });

  // Delete Room
  container.querySelectorAll('.btn-delete-room').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const roomId = btn.getAttribute('data-room-id');
      const room = store.getRoomById(roomId);
      if (!room) return;

      if (room.status === 'terisi') {
        showToast('Kamar sedang terisi! Check-out penyewa terlebih dahulu sebelum menghapus.', 'error');
        return;
      }

      const confirmed = await showConfirmModal({
        title: 'Hapus Kamar?',
        message: `Apakah Anda yakin ingin menghapus <strong>${escapeHtml(room.number)}</strong>? Tindakan ini tidak dapat dibatalkan.`,
        confirmText: 'Ya, Hapus Kamar',
        danger: true
      });

      if (confirmed) {
        const res = store.deleteRoom(roomId);
        if (res.success) {
          showToast(`Kamar ${room.number} berhasil dihapus.`, 'success');
          renderRooms(container);
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  });

  // Room Form Submit (Add/Edit)
  const roomForm = container.querySelector('#room-form');
  if (roomForm) {
    roomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveRoomForm(container);
    });
  }

  // Bind custom pickers for floor & room type
  const floorTrigger = container.querySelector('#room-floor-trigger');
  const floorInput = container.querySelector('#room-floor');
  if (floorTrigger && floorInput) {
    bindCustomPicker(floorTrigger, floorInput, {
      title: 'Pilih Lantai / Posisi',
      options: FLOOR_OPTIONS
    });
  }

  const typeTrigger = container.querySelector('#room-type-trigger');
  const typeInput = container.querySelector('#room-type');
  if (typeTrigger && typeInput) {
    bindCustomPicker(typeTrigger, typeInput, {
      title: 'Pilih Tipe Unit',
      options: ROOM_TYPE_OPTIONS
    });
  }
}

function openAddRoomModal() {
  const currentCount = store.getRooms().length;
  if (!canAddRoom(currentCount)) {
    openUpgradeModal();
    return;
  }

  const modal = document.getElementById('room-form-modal');
  if (!modal) return;

  document.getElementById('room-modal-title').textContent = 'Tambah Kamar Baru';
  document.getElementById('room-id-input').value = '';
  document.getElementById('room-number').value = '';
  document.getElementById('room-floor').value = 'Lantai 1';
  document.getElementById('room-type').value = 'Standar AC';
  document.getElementById('room-price').value = '1500000';
  document.getElementById('room-notes').value = '';

  // Reset checkboxes
  modal.querySelectorAll('input[name="room-facility"]').forEach((cb) => {
    cb.checked = ['AC', 'Kamar Mandi Dalam', 'Kasur Springbed', 'WiFi', 'Lemari Pakaian'].includes(cb.value);
  });

  clearFormErrors();
  openModal('room-form-modal');
}

function openEditRoomModal(roomId) {
  const room = store.getRoomById(roomId);
  if (!room) return;

  document.getElementById('room-modal-title').textContent = `Edit Data ${room.number}`;
  document.getElementById('room-id-input').value = room.id;
  document.getElementById('room-number').value = room.number;
  document.getElementById('room-floor').value = room.floor || 'Lantai 1';
  document.getElementById('room-type').value = room.type || 'Standar AC';
  document.getElementById('room-price').value = room.price || 0;
  document.getElementById('room-notes').value = room.notes || '';

  const facilitySet = new Set(room.facilities || []);
  document.querySelectorAll('input[name="room-facility"]').forEach((cb) => {
    cb.checked = facilitySet.has(cb.value);
  });

  clearFormErrors();
  openModal('room-form-modal');
}

function clearFormErrors() {
  document.getElementById('error-room-number').textContent = '';
  document.getElementById('error-room-price').textContent = '';
  document.getElementById('room-number').classList.remove('input-invalid');
  document.getElementById('room-price').classList.remove('input-invalid');
}

function saveRoomForm(container) {
  clearFormErrors();
  const id = document.getElementById('room-id-input').value;
  const number = document.getElementById('room-number').value.trim();
  const floor = document.getElementById('room-floor').value;
  const type = document.getElementById('room-type').value;
  const priceRaw = document.getElementById('room-price').value;
  const notes = document.getElementById('room-notes').value.trim();

  let hasError = false;

  if (!number) {
    document.getElementById('error-room-number').textContent = 'Nomor/Nama kamar wajib diisi!';
    document.getElementById('room-number').classList.add('input-invalid');
    hasError = true;
  }

  const price = parseInt(priceRaw, 10);
  if (isNaN(price) || price <= 0) {
    document.getElementById('error-room-price').textContent = 'Harga sewa harus angka positif lebih dari 0!';
    document.getElementById('room-price').classList.add('input-invalid');
    hasError = true;
  }

  if (hasError) return;

  const facilities = [];
  document.querySelectorAll('input[name="room-facility"]:checked').forEach((cb) => {
    facilities.push(cb.value);
  });

  if (id) {
    store.updateRoom(id, { number, floor, type, price, facilities, notes });
    showToast(`Data ${number} berhasil diperbarui!`, 'success');
  } else {
    store.addRoom({ number, floor, type, price, facilities, notes });
    showToast(`Kamar ${number} berhasil ditambahkan!`, 'success');
  }

  closeModal('room-form-modal');
  renderRooms(container);
}
