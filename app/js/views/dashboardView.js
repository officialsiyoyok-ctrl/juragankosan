/**
 * Juragankosan Dashboard View (Tab 1: Ringkasan & Jatuh Tempo)
 */
import { store } from '../state.js';
import {
  formatRupiah,
  formatDateIndo,
  getCurrentYearMonth,
  calculateDaysDiffFromToday,
  escapeHtml,
  formatDisplayPhone
} from '../utils/formatter.js';
import { generateBillWhatsAppText, generateWhatsAppMessage, openWhatsAppLink, DEFAULT_PARTIAL_REMINDER_WA_TEMPLATE } from '../utils/whatsapp.js';
import { openModal } from '../utils/modal.js';

export function renderDashboard(container) {
  const currentYM = getCurrentYearMonth();
  const rooms = store.getRooms();
  const tenants = store.getActiveTenants();
  const settings = store.getSettings();

  // Make sure bills for current month exist for active tenants
  store.generateBillsForPeriod(currentYM);
  const bills = store.getBillsByPeriod(currentYM);
  const expenses = store.getExpensesByPeriod(currentYM);

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'terisi').length;
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Bills statistics
  const paidBills = bills.filter((b) => b.status === 'lunas');
  const partialBills = bills.filter((b) => b.status === 'sebagian');
  const unpaidBills = bills.filter((b) => b.status === 'belum_bayar');
  const pendingBills = bills.filter((b) => b.status !== 'lunas');

  const totalPaidNominal = bills.reduce((acc, b) => {
    return acc + (b.paidAmount !== undefined ? b.paidAmount : (b.status === 'lunas' ? b.amount : 0));
  }, 0);
  const otherIncomes = store.getIncomesByPeriod ? store.getIncomesByPeriod(currentYM) : [];
  const totalOtherIncomesNominal = otherIncomes.reduce((acc, inc) => acc + (inc.amount || 0), 0);
  const totalAllRevenueNominal = totalPaidNominal + totalOtherIncomesNominal;

  const totalUnpaidNominal = bills.reduce((acc, b) => {
    return acc + (b.remainingAmount !== undefined ? b.remainingAmount : (b.status !== 'lunas' ? b.amount : 0));
  }, 0);
  const totalExpensesNominal = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netIncomeNominal = totalAllRevenueNominal - totalExpensesNominal;

  // Check overdue bills
  const overdueBills = pendingBills.filter((b) => calculateDaysDiffFromToday(b.dueDate) > 0);

  // Sort upcoming bills: overdue first, then partial/unpaid, then lunas
  const sortedBills = [...bills].sort((a, b) => {
    if (a.status !== 'lunas' && b.status === 'lunas') return -1;
    if (a.status === 'lunas' && b.status !== 'lunas') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const todayStr = formatDateIndo(new Date(), true);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <div class="greeting-badge">👋 Selamat Datang</div>
        <h1 class="page-title">${escapeHtml(settings.kosName || 'Juragankosan')}</h1>
        <p class="page-subtitle">Ringkasan operasional kos &amp; kontrakan per <strong>${todayStr}</strong></p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-outline" id="btn-quick-expense">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
          </svg>
          Catat Pengeluaran
        </button>
        <button class="btn btn-outline" id="btn-quick-room">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
          </svg>
          + Kamar Baru
        </button>
        <button class="btn btn-primary" id="btn-quick-tenant">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
          </svg>
          + Check-in Penyewa
        </button>
      </div>
    </div>

    ${
      overdueBills.length > 0
        ? `
      <div class="alert-banner alert-danger animate-pulse-gentle">
        <div class="alert-banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="alert-banner-content">
          <strong>Perhatian Juragan:</strong> Ada <strong>${overdueBills.length} penyewa</strong> yang terlambat membayar sewa bulan ini!
          <span class="text-secondary-inline">Klik tombol hijau WhatsApp di bawah untuk kirim pengingat tagihan dengan 1 klik.</span>
        </div>
      </div>
    `
        : ''
    }

    <!-- Stat Cards Grid -->
    <div class="stats-grid">
      <!-- Card 1: Total Kamar -->
      <div class="stat-card" data-navigate="rooms">
        <div class="stat-card-header">
          <span class="stat-label">Total Kamar</span>
          <div class="stat-icon-wrapper bg-blue-subtle text-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        </div>
        <div class="stat-number">${totalRooms} <span class="stat-unit">Kamar</span></div>
        <div class="stat-footer">
          <div class="stat-progress-bar">
            <div class="stat-progress-fill bg-blue" style="width: ${occupancyRate}%"></div>
          </div>
          <div class="stat-subtext">
            <span>${occupiedRooms} Terisi (${occupancyRate}%)</span>
            <span class="badge-link">Kelola &rarr;</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Kamar Kosong -->
      <div class="stat-card" data-navigate="rooms" data-filter="kosong">
        <div class="stat-card-header">
          <span class="stat-label">Kamar Kosong</span>
          <div class="stat-icon-wrapper bg-emerald-subtle text-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="stat-number text-emerald">${vacantRooms} <span class="stat-unit">Unit Siap</span></div>
        <div class="stat-footer">
          <span class="stat-subtext text-emerald-dark font-medium">
            ${vacantRooms > 0 ? `Bisa tambah pendapatan potensial` : `Semua kamar penuh (100%)`}
          </span>
        </div>
      </div>

      <!-- Card 3: Tagihan Belum Lunas -->
      <div class="stat-card" data-navigate="bills" data-filter="belum_bayar">
        <div class="stat-card-header">
          <span class="stat-label">Belum Lunas (${unpaidBills.length})</span>
          <div class="stat-icon-wrapper bg-amber-subtle text-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <div class="stat-number text-amber">${formatRupiah(totalUnpaidNominal)}</div>
        <div class="stat-footer">
          <span class="stat-subtext text-amber-dark">
            ${overdueBills.length > 0 ? `⚠️ ${overdueBills.length} terlambat jatuh tempo` : `Menunggu pembayaran bulan ini`}
          </span>
        </div>
      </div>

      <!-- Card 4: Pendapatan Bulan Ini -->
      <div class="stat-card" data-navigate="bills">
        <div class="stat-card-header">
          <span class="stat-label">Pendapatan Bersih</span>
          <div class="stat-icon-wrapper bg-purple-subtle text-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <div class="stat-number text-purple">${formatRupiah(netIncomeNominal)}</div>
        <div class="stat-footer">
          <span class="stat-subtext">
            Pemasukan ${formatRupiah(totalAllRevenueNominal)} - Pengeluaran ${formatRupiah(totalExpensesNominal)}
          </span>
        </div>
      </div>
    </div>

    <!-- Section: Jatuh Tempo & Tagihan Bulan Ini -->
    <div class="content-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Status Tagihan &amp; Jatuh Tempo Bulan Ini</h2>
          <p class="section-subtitle">Daftar penyewa aktif beserta status pembayaran sewa periode berjalan</p>
        </div>
        <button class="btn btn-outline btn-sm" data-navigate="bills">
          Lihat Semua Tagihan &rarr;
        </button>
      </div>

      ${
        sortedBills.length === 0
          ? `
        <div class="empty-state-card">
          <div class="empty-icon">🏠</div>
          <h3>Belum Ada Tagihan Bulan Ini</h3>
          <p>Tambahkan kamar dan check-in penyewa untuk mulai memantau tagihan sewa otomatis.</p>
          <button class="btn btn-primary" id="btn-empty-add-tenant">+ Tambah Penyewa Sekarang</button>
        </div>
      `
          : `
        <div class="table-responsive card-table due-bills-table-container">
          <table class="data-table bills-table due-bills-table">
            <thead>
              <tr>
                <th>Kamar</th>
                <th>Penyewa</th>
                <th>Nominal</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
                <th class="text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBills
                .map((bill) => {
                  const daysDiff = calculateDaysDiffFromToday(bill.dueDate);
                  const isLunas = bill.status === 'lunas';
                  const isPartial = bill.status === 'sebagian';
                  let statusBadge = '';
                  let dueBadge = '';

                  if (isLunas) {
                    statusBadge = bill.isAdvance
                      ? `<span class="badge badge-success">✓ Lunas (Maju ${bill.advanceMonths || 1} Bln)</span>`
                      : `<span class="badge badge-success">✓ Lunas</span>`;
                    dueBadge = `<span class="text-muted text-sm">Dibayar ${formatDateIndo(bill.paidDate)}</span>`;
                  } else if (isPartial) {
                    statusBadge = `<span class="badge badge-warning-soft">⚡ Dicicil (Sisa ${formatRupiah(bill.remainingAmount || 0)})</span>`;
                    dueBadge = `<span class="text-body font-medium">${formatDateIndo(bill.dueDate)}</span>`;
                  } else if (daysDiff > 0) {
                    statusBadge = `<span class="badge badge-danger">⚠️ Telat ${daysDiff} Hari</span>`;
                    dueBadge = `<span class="text-danger font-medium">${formatDateIndo(bill.dueDate)}</span>`;
                  } else if (daysDiff === 0) {
                    statusBadge = `<span class="badge badge-warning">⚡ Hari Ini</span>`;
                    dueBadge = `<span class="text-amber font-medium">${formatDateIndo(bill.dueDate)}</span>`;
                  } else {
                    statusBadge = `<span class="badge badge-warning">Belum Bayar</span>`;
                    dueBadge = `<span class="text-body">${formatDateIndo(bill.dueDate)} (${Math.abs(daysDiff)} hari lagi)</span>`;
                  }

                  return `
                    <tr class="due-bill-item bill-card ${daysDiff > 0 && bill.status !== 'lunas' ? 'row-highlight-danger' : ''}">
                      <td>
                        <strong class="room-pill">${escapeHtml(bill.roomNumber)}</strong>
                      </td>
                      <td>
                        <div class="tenant-name-cell">
                          <span class="tenant-name">${escapeHtml(bill.tenantName)}</span>
                          <span class="tenant-phone-sub">${formatDisplayPhone(bill.tenantPhone)}</span>
                        </div>
                      </td>
                      <td>
                        <strong class="nominal-text">${formatRupiah(bill.amount)}</strong>
                        ${
                          isPartial
                            ? `
                          <div class="text-xs text-emerald font-semibold" style="margin-top: 2px;">Masuk: ${formatRupiah(bill.paidAmount || 0)}</div>
                          <div class="text-xs text-danger font-medium">Sisa: ${formatRupiah(bill.remainingAmount || 0)}</div>
                        `
                            : ''
                        }
                      </td>
                      <td>${dueBadge}</td>
                      <td>${statusBadge}</td>
                      <td class="text-right">
                        <div class="action-btn-group bill-actions table-actions">
                          ${
                            isPartial
                              ? `
                            <button class="btn btn-wa btn-sm btn-action-wa" data-bill-id="${bill.id}" title="Kirim Pengingat Sisa Cicilan">
                              <svg class="wa-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                              Tagih Sisa
                            </button>
                            <button class="btn btn-warning btn-sm btn-action-pay" data-bill-id="${bill.id}">
                              + Bayar Sisa
                            </button>
                            <button class="btn btn-outline btn-sm btn-action-receipt" data-bill-id="${bill.id}" title="Kwitansi Bukti Cicilan">
                              📄 Kwitansi
                            </button>
                          `
                              : bill.status === 'belum_bayar'
                              ? `
                            <button class="btn btn-wa btn-sm btn-action-wa" data-bill-id="${bill.id}" title="Kirim Tagihan via WhatsApp">
                              <svg class="wa-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                              Tagih WA
                            </button>
                            <button class="btn btn-success btn-sm btn-action-pay" data-bill-id="${bill.id}">
                              ✓ Tandai Lunas
                            </button>
                          `
                              : `
                            <button class="btn btn-outline btn-sm btn-action-receipt" data-bill-id="${bill.id}">
                              📄 Kwitansi
                            </button>
                          `
                          }
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
      }
    </div>
  `;

  // Attach event handlers
  setupDashboardEvents(container);
}

function setupDashboardEvents(container) {
  // Navigation shortcuts
  container.querySelectorAll('[data-navigate]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Don't navigate if user clicked an action button inside table
      if (e.target.closest('button')) return;
      const tabId = el.getAttribute('data-navigate');
      const filter = el.getAttribute('data-filter');
      window.location.hash = tabId;
      window.juraganApp.switchTab(tabId, { filter });
    });
  });

  // Quick Action Buttons
  const btnQuickRoom = container.querySelector('#btn-quick-room');
  if (btnQuickRoom) {
    btnQuickRoom.addEventListener('click', () => {
      window.juraganApp.switchTab('rooms', { openAddModal: true });
    });
  }

  const btnQuickTenant = container.querySelector('#btn-quick-tenant');
  if (btnQuickTenant) {
    btnQuickTenant.addEventListener('click', () => {
      window.juraganApp.switchTab('tenants', { openAddModal: true });
    });
  }

  const btnQuickExpense = container.querySelector('#btn-quick-expense');
  if (btnQuickExpense) {
    btnQuickExpense.addEventListener('click', () => {
      window.juraganApp.switchTab('finances', { subTab: 'expenses', openAddModal: true });
    });
  }

  const btnEmptyAddTenant = container.querySelector('#btn-empty-add-tenant');
  if (btnEmptyAddTenant) {
    btnEmptyAddTenant.addEventListener('click', () => {
      window.juraganApp.switchTab('tenants', { openAddModal: true });
    });
  }

  // Quick WhatsApp Trigger
  container.querySelectorAll('.btn-action-wa').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const billId = btn.getAttribute('data-bill-id');
      const bill = store.getBillById(billId);
      if (!bill) return;

      const settings = store.getSettings();
      const message = generateBillWhatsAppText(bill, settings);
      openWhatsAppLink(bill.tenantPhone, message);
    });
  });

  // Quick Tandai Lunas Trigger
  container.querySelectorAll('.btn-action-pay').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const billId = btn.getAttribute('data-bill-id');
      window.juraganApp.openPaymentModal(billId);
    });
  });

  // Quick Kwitansi Trigger
  container.querySelectorAll('.btn-action-receipt').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const billId = btn.getAttribute('data-bill-id');
      window.juraganApp.openReceiptModal(billId);
    });
  });
}
