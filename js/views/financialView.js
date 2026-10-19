/**
 * Juragankosan — Pusat Keuangan & Arus Kas Terpadu
 * Menggabungkan Pemasukan, Pengeluaran, dan Laporan Laba Bersih ke dalam 1 Tabbed Interface
 */
import { store } from '../state.js?v=2.5';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYear,
  getCurrentYearMonth,
  getTodayDateString,
  escapeHtml
} from '../utils/formatter.js?v=2.5';
import { openModal, closeModal, showToast, showConfirmModal, bindCustomPicker } from '../utils/modal.js?v=2.5';

// Master Categories
export const EXPENSE_CATEGORIES = [
  { name: 'Listrik / Token PLN', icon: '⚡' },
  { name: 'Air / PDAM', icon: '💧' },
  { name: 'WiFi / Internet', icon: '📶' },
  { name: 'Kebersihan & Sampah', icon: '🧹' },
  { name: 'Perbaikan / Maintenance', icon: '🔧' },
  { name: 'Keamanan / Satpam', icon: '🛡️' },
  { name: 'Perlengkapan Kos', icon: '🧻' },
  { name: 'Lain-lain', icon: '📦' }
];

export const INCOME_CATEGORIES = [
  { name: 'Sewa Kamar', icon: '🏠', badgeClass: 'badge-emerald' },
  { name: 'Parkir Kendaraan', icon: '🛵', badgeClass: 'badge-blue' },
  { name: 'Denda Keterlambatan', icon: '⚠️', badgeClass: 'badge-amber' },
  { name: 'Layanan Tambahan', icon: '🧺', badgeClass: 'badge-purple' },
  { name: 'Penjualan Token Listrik', icon: '⚡', badgeClass: 'badge-info' },
  { name: 'Lain-lain', icon: '💰', badgeClass: 'badge-secondary' }
];

// Local state for the view
let currentSubTab = 'incomes'; // 'incomes' | 'expenses' | 'report'
let selectedPeriodYM = getCurrentYearMonth();
let incomeCategoryFilter = 'all';
let expenseCategoryFilter = 'all';

// Report custom filter state
let reportFilterType = 'this_month'; // 'this_month' | 'last_month' | 'this_year' | 'custom'
let reportStartDate = '';
let reportEndDate = '';

// Edit state
let editingIncomeId = null;
let editingExpenseId = null;

export function renderFinances(container, options = {}) {
  // Handle options
  if (options.subTab) {
    currentSubTab = options.subTab;
  } else if (options.initialTab) {
    currentSubTab = options.initialTab;
  }
  if (options.period) {
    selectedPeriodYM = options.period;
  }

  // Pre-calculate date ranges for report
  initReportDates();

  const [yearStr, monthStr] = selectedPeriodYM.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const prevMonthDate = new Date(y, m - 2, 1);
  const nextMonthDate = new Date(y, m, 1);
  const pad = (n) => String(n).padStart(2, '0');
  const prevPeriod = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;
  const nextPeriod = `${nextMonthDate.getFullYear()}-${pad(nextMonthDate.getMonth() + 1)}`;

  // Query Data
  const allInflows = store.getAllInflows ? store.getAllInflows() : [];
  const allExpenses = store.getExpenses ? store.getExpenses() : [];

  // Filter for current month view
  const periodInflows = allInflows.filter((item) => {
    return item.period === selectedPeriodYM || (item.date && item.date.startsWith(selectedPeriodYM));
  });

  const periodExpenses = allExpenses.filter((item) => {
    return item.period === selectedPeriodYM || (item.date && item.date.startsWith(selectedPeriodYM));
  });

  // Calculate totals for current month
  const totalRentIncome = periodInflows
    .filter((item) => item.isRent)
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalOtherIncome = periodInflows
    .filter((item) => !item.isRent)
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalMonthIncome = totalRentIncome + totalOtherIncome;
  const totalMonthExpense = periodExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const monthNetProfit = totalMonthIncome - totalMonthExpense;

  container.innerHTML = `
    <div class="finances-view-container">
      <!-- Main Page Header -->
      <div class="view-header fin-header no-print">
        <div class="view-header-title">
          <div class="flex align-center gap-2 mb-1">
            <h1 class="page-title">Pusat Keuangan &amp; Arus Kas</h1>
            <span class="badge badge-emerald font-bold">1 Menu Terpadu</span>
          </div>
          <p class="page-subtitle">Kelola pemasukan kos, biaya operasional harian, dan pantau laba bersih kos secara real-time</p>
        </div>

        <div class="view-header-actions">
          <!-- Month Navigator -->
          <div class="month-navigator">
            <button class="btn btn-outline btn-sm btn-nav-period" data-period="${prevPeriod}" title="Bulan Sebelumnya">
              &larr; Bulan Lalu
            </button>
            <div class="current-month-display">
              <svg class="calendar-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              <span><strong>${formatMonthYear(selectedPeriodYM)}</strong></span>
            </div>
            <button class="btn btn-outline btn-sm btn-nav-period" data-period="${nextPeriod}" title="Bulan Berikutnya">
              Bulan Depan &rarr;
            </button>
          </div>

          <!-- Quick Action Buttons depending on sub-tab -->
          ${currentSubTab === 'incomes' ? `
            <button type="button" class="btn btn-primary" id="btn-open-add-income">
              <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
              </svg>
              + Tambah Pemasukan
            </button>
          ` : currentSubTab === 'expenses' ? `
            <button type="button" class="btn btn-danger" id="btn-open-add-expense">
              <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
              </svg>
              + Catat Pengeluaran
            </button>
          ` : `
            <button type="button" class="btn btn-outline" id="btn-print-financial-report">
              <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/>
              </svg>
              🖨️ Cetak Laporan
            </button>
          `}
        </div>
      </div>

      <!-- Unified 3-Tabs Sub-navigation Bar -->
      <div class="fin-subnav-bar no-print">
        <button type="button" class="fin-subnav-btn ${currentSubTab === 'incomes' ? 'active' : ''}" data-subtab-target="incomes">
          <span class="fin-tab-icon">📥</span>
          <span class="fin-tab-title">Pemasukan</span>
          <span class="fin-tab-pill pill-emerald">${periodInflows.length} Transaksi</span>
        </button>

        <button type="button" class="fin-subnav-btn ${currentSubTab === 'expenses' ? 'active' : ''}" data-subtab-target="expenses">
          <span class="fin-tab-icon">📤</span>
          <span class="fin-tab-title">Pengeluaran</span>
          <span class="fin-tab-pill pill-rose">${periodExpenses.length} Transaksi</span>
        </button>

        <button type="button" class="fin-subnav-btn ${currentSubTab === 'report' ? 'active' : ''}" data-subtab-target="report">
          <span class="fin-tab-icon">📊</span>
          <span class="fin-tab-title">Laporan Laba Bersih</span>
          <span class="fin-tab-pill pill-purple">Arus Kas</span>
        </button>
      </div>

      <!-- SUB-TAB CONTENT CONTAINER -->
      <div class="fin-content-body">
        ${renderCurrentSubTabContent({
          selectedPeriodYM,
          periodInflows,
          periodExpenses,
          totalRentIncome,
          totalOtherIncome,
          totalMonthIncome,
          totalMonthExpense,
          monthNetProfit
        })}
      </div>
    </div>

    <!-- MODAL: TAMBAH / EDIT PEMASUKAN LAIN-LAIN -->
    <div id="income-modal" class="modal-backdrop">
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <h3 class="modal-title" id="income-modal-title">Tambah Pemasukan Lain-Lain</h3>
          <button class="modal-close" data-close-modal="income-modal">&times;</button>
        </div>
        <form id="income-form" novalidate>
          <div class="modal-body">
            <div class="form-group mb-3">
              <label for="income-date" class="form-label font-semibold">Tanggal Transaksi <span class="text-danger">*</span></label>
              <input type="date" id="income-date" class="form-control" value="${getTodayDateString()}" required />
            </div>

            <div class="form-group mb-3">
              <label for="income-title" class="form-label font-semibold">Nama / Uraian Pemasukan <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="income-title" 
                class="form-control" 
                placeholder="Contoh: Tambahan Parkir Motor Bulanan" 
                required 
              />
              <span class="form-error" id="error-income-title"></span>
            </div>

            <div class="form-group mb-3">
              <label for="income-category" class="form-label font-semibold">Kategori Pemasukan</label>
              <div class="custom-select-trigger" id="income-category-trigger" data-picker-for="income-category" tabindex="0" role="button">
                <span class="custom-select-label" id="income-category-label">🛵 Parkir Kendaraan</span>
                <span class="custom-select-arrow">▾</span>
              </div>
              <input type="hidden" id="income-category" value="Parkir Kendaraan" />
            </div>

            <div class="form-group mb-3">
              <label for="income-amount" class="form-label font-semibold">Jumlah Nominal (Rp) <span class="text-danger">*</span></label>
              <input 
                type="number" 
                id="income-amount" 
                class="form-control font-mono font-bold" 
                placeholder="Contoh: 100000" 
                min="1" 
                step="5000" 
                required 
              />
              <span class="form-error" id="error-income-amount"></span>
            </div>

            <div class="form-group mb-1">
              <label for="income-notes" class="form-label font-semibold">Catatan Tambahan (Opsional)</label>
              <textarea 
                id="income-notes" 
                class="form-control" 
                rows="2" 
                placeholder="Contoh: Penyewa Kamar 101 membawa motor tambahan kedua"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="income-modal">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-income">Simpan Pemasukan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: TAMBAH / EDIT PENGELUARAN OPERASIONAL -->
    <div id="expense-modal" class="modal-backdrop">
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <h3 class="modal-title" id="expense-modal-title">Catat Pengeluaran Operasional</h3>
          <button class="modal-close" data-close-modal="expense-modal">&times;</button>
        </div>
        <form id="expense-form" novalidate>
          <div class="modal-body">
            <div class="form-group mb-3">
              <label for="expense-date" class="form-label font-semibold">Tanggal Pengeluaran <span class="text-danger">*</span></label>
              <input type="date" id="expense-date" class="form-control" value="${getTodayDateString()}" required />
            </div>

            <div class="form-group mb-3">
              <label for="expense-category" class="form-label font-semibold">Kategori Biaya Operasional</label>
              <div class="custom-select-trigger" id="expense-category-trigger" data-picker-for="expense-category" tabindex="0" role="button">
                <span class="custom-select-label" id="expense-category-label">⚡ Listrik / Token PLN</span>
                <span class="custom-select-arrow">▾</span>
              </div>
              <input type="hidden" id="expense-category" value="Listrik / Token PLN" />
            </div>

            <div class="form-group mb-3">
              <label for="expense-amount" class="form-label font-semibold">Jumlah Pengeluaran (Rp) <span class="text-danger">*</span></label>
              <input 
                type="number" 
                id="expense-amount" 
                class="form-control font-mono font-bold" 
                placeholder="Contoh: 150000" 
                min="1" 
                step="5000" 
                required 
              />
              <span class="form-error" id="error-expense-amount"></span>
            </div>

            <div class="form-group mb-1">
              <label for="expense-desc" class="form-label font-semibold">Keterangan / Rincian <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="expense-desc" 
                class="form-control" 
                placeholder="Contoh: Beli token listrik pompa air &amp; bohlam teras" 
                required 
              />
              <span class="form-error" id="error-expense-desc"></span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="expense-modal">Batal</button>
            <button type="submit" class="btn btn-danger" id="btn-submit-expense">Simpan Pengeluaran</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Attach all interactive event listeners
  setupFinancialEventListeners(container);

  // Auto-open modal if requested via options
  if (options.openAddModal) {
    if (currentSubTab === 'expenses') {
      openExpenseModal();
    } else {
      openIncomeModal();
    }
  }
}

/**
 * Renders the active sub-tab content
 */
function renderCurrentSubTabContent(data) {
  if (currentSubTab === 'incomes') {
    return renderIncomesSubTab(data);
  } else if (currentSubTab === 'expenses') {
    return renderExpensesSubTab(data);
  } else {
    return renderReportSubTab(data);
  }
}

// =============================================================================
// TAB 1: PEMASUKAN VIEW
// =============================================================================
function renderIncomesSubTab({ selectedPeriodYM, periodInflows, totalRentIncome, totalOtherIncome, totalMonthIncome }) {
  // Apply Category Filter
  const filteredInflows = periodInflows.filter((item) => {
    if (incomeCategoryFilter === 'all') return true;
    if (incomeCategoryFilter === 'rent_only') return item.isRent;
    if (incomeCategoryFilter === 'other_only') return !item.isRent;
    return item.category === incomeCategoryFilter;
  });

  return `
    <!-- Pemasukan Summary KPIs -->
    <div class="fin-kpi-grid">
      <div class="fin-kpi-card highlight-emerald">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Total Seluruh Pemasukan</span>
          <span class="fin-kpi-icon bg-emerald-subtle text-emerald">💰</span>
        </div>
        <div class="fin-kpi-value text-emerald">${formatRupiah(totalMonthIncome)}</div>
        <div class="fin-kpi-meta">
          <span>Periode ${formatMonthYear(selectedPeriodYM)}</span> &bull; 
          <strong>${periodInflows.length}</strong> transaksi masuk
        </div>
      </div>

      <div class="fin-kpi-card">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Sewa Kamar (Auto-Sync)</span>
          <span class="fin-kpi-icon bg-blue-subtle text-blue">🏠</span>
        </div>
        <div class="fin-kpi-value text-blue">${formatRupiah(totalRentIncome)}</div>
        <div class="fin-kpi-meta">
          Dari tagihan berstatus <strong>Lunas</strong> / <strong>Dicicil</strong>
        </div>
      </div>

      <div class="fin-kpi-card">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Pemasukan Lain-Lain</span>
          <span class="fin-kpi-icon bg-purple-subtle text-purple">✨</span>
        </div>
        <div class="fin-kpi-value text-purple">${formatRupiah(totalOtherIncome)}</div>
        <div class="fin-kpi-meta">
          Denda, parkir tambahan, token listrik, dll
        </div>
      </div>
    </div>

    <!-- Filter & Toolbar -->
    <div class="card mb-4 fin-toolbar-card">
      <div class="fin-toolbar-inner">
        <div class="fin-toolbar-filters">
          <span class="text-xs font-bold text-muted uppercase fin-filter-label">Filter Kategori:</span>
          <div class="fin-filter-buttons">
            <button type="button" class="btn btn-sm ${incomeCategoryFilter === 'all' ? 'btn-primary' : 'btn-outline'} btn-filter-income-cat" data-cat="all">
              Semua (${periodInflows.length})
            </button>
            <button type="button" class="btn btn-sm ${incomeCategoryFilter === 'rent_only' ? 'btn-primary' : 'btn-outline'} btn-filter-income-cat" data-cat="rent_only">
              🏠 Sewa Kamar (${periodInflows.filter(i => i.isRent).length})
            </button>
            <button type="button" class="btn btn-sm ${incomeCategoryFilter === 'other_only' ? 'btn-primary' : 'btn-outline'} btn-filter-income-cat" data-cat="other_only">
              ✨ Pemasukan Lain (${periodInflows.filter(i => !i.isRent).length})
            </button>
          </div>
        </div>

        <div class="fin-toolbar-action">
          <button type="button" class="btn btn-primary btn-sm" id="btn-trigger-add-income-sub">
            <span>+</span> Tambah Pemasukan
          </button>
        </div>
      </div>
    </div>

    <!-- Incomes Table -->
    <div class="card p-0 overflow-hidden">
      <div class="card-header fin-card-header border-b px-4 py-3">
        <div class="fin-header-title-box">
          <h3 class="card-title text-base font-bold mb-0">Riwayat Arus Kas Masuk (${filteredInflows.length} Transaksi)</h3>
          <span class="text-xs text-muted">Data sewa tersinkronisasi otomatis dari pembayaran tagihan</span>
        </div>
      </div>

      ${filteredInflows.length === 0 ? `
        <div class="empty-state py-5 text-center">
          <div class="empty-state-icon" style="font-size: 3rem;">📥</div>
          <h3 class="font-bold text-lg mt-2">Belum Ada Pemasukan Tercatat</h3>
          <p class="text-muted text-sm max-w-md mx-auto mb-4">
            Belum ada pembayaran sewa atau pemasukan lain untuk periode <strong>${formatMonthYear(selectedPeriodYM)}</strong>.
          </p>
          <button type="button" class="btn btn-primary" id="btn-empty-add-income">
            + Tambah Pemasukan Baru
          </button>
        </div>
      ` : `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 120px;">Tanggal</th>
                <th>Sumber / Uraian Transaksi</th>
                <th style="width: 150px;">Kategori</th>
                <th style="width: 170px;">Metode / No. Kwitansi</th>
                <th class="text-right" style="width: 160px;">Nominal (Rp)</th>
                <th style="width: 120px;" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInflows.map((item, idx) => {
                const isRent = item.isRent;
                return `
                  <tr class="${isRent ? 'row-rent-inflow' : 'row-other-inflow'}">
                    <td class="text-muted text-xs font-mono">${idx + 1}</td>
                    <td class="text-xs whitespace-nowrap font-medium">
                      ${formatDateIndo(item.date)}
                    </td>
                    <td>
                      <div class="font-semibold text-main text-sm">
                        ${escapeHtml(item.title)}
                      </div>
                      ${item.notes && item.notes !== '-' ? `
                        <div class="text-xs text-muted mt-0.5">${escapeHtml(item.notes)}</div>
                      ` : ''}
                    </td>
                    <td>
                      ${isRent ? `
                        <span class="badge badge-emerald text-xs">
                          🏠 Sewa Kamar
                        </span>
                      ` : `
                        <span class="badge badge-purple text-xs">
                          ✨ ${escapeHtml(item.category || 'Lain-lain')}
                        </span>
                      `}
                    </td>
                    <td class="text-xs">
                      <div class="font-medium text-main">${escapeHtml(item.paymentMethod || 'Kas Masuk')}</div>
                      ${item.receiptNumber && item.receiptNumber !== '-' ? `
                        <div class="text-muted font-mono">${escapeHtml(item.receiptNumber)}</div>
                      ` : ''}
                    </td>
                    <td class="text-right whitespace-nowrap">
                      <strong class="text-emerald font-bold text-sm">
                        + ${formatRupiah(item.amount)}
                      </strong>
                    </td>
                    <td class="text-center whitespace-nowrap">
                      ${isRent ? `
                        <button type="button" class="btn btn-outline btn-xs btn-view-bill" data-bill-id="${item.billId}" title="Lihat Tagihan Sewa">
                          🧾 Tagihan
                        </button>
                      ` : `
                        <div class="flex-center gap-1">
                          <button type="button" class="btn btn-ghost btn-xs btn-edit-income" data-income-id="${item.id}" title="Edit Pemasukan">
                            ✏️ Edit
                          </button>
                          <button type="button" class="btn btn-ghost btn-xs text-danger btn-delete-income" data-income-id="${item.id}" title="Hapus Pemasukan">
                            🗑️
                          </button>
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="5" class="text-right font-bold text-sm">TOTAL PEMASUKAN BULAN INI:</td>
                <td class="text-right font-bold text-emerald text-base">
                  + ${formatRupiah(filteredInflows.reduce((acc, i) => acc + (i.amount || 0), 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `}
    </div>
  `;
}

// =============================================================================
// TAB 2: PENGELUARAN VIEW
// =============================================================================
function renderExpensesSubTab({ selectedPeriodYM, periodExpenses, totalMonthExpense }) {
  // Category breakdown
  const categoryTotals = {};
  periodExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + (exp.amount || 0);
  });

  // Filter expenses
  const filteredExpenses = periodExpenses.filter((item) => {
    if (expenseCategoryFilter === 'all') return true;
    return item.category === expenseCategoryFilter;
  });

  return `
    <!-- Pengeluaran Summary KPIs -->
    <div class="fin-kpi-grid">
      <div class="fin-kpi-card highlight-rose">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Total Biaya Operasional</span>
          <span class="fin-kpi-icon bg-rose-subtle text-rose">📤</span>
        </div>
        <div class="fin-kpi-value text-danger">-${formatRupiah(totalMonthExpense)}</div>
        <div class="fin-kpi-meta">
          <span>Periode ${formatMonthYear(selectedPeriodYM)}</span> &bull; 
          <strong>${periodExpenses.length}</strong> transaksi pengeluaran
        </div>
      </div>

      <div class="fin-kpi-card">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Pengeluaran Terbesar</span>
          <span class="fin-kpi-icon bg-amber-subtle text-amber">⚡</span>
        </div>
        <div class="fin-kpi-value text-amber">
          ${(() => {
            const keys = Object.keys(categoryTotals);
            if (keys.length === 0) return 'Rp 0';
            let maxCat = keys[0];
            keys.forEach(k => { if (categoryTotals[k] > categoryTotals[maxCat]) maxCat = k; });
            return formatRupiah(categoryTotals[maxCat]);
          })()}
        </div>
        <div class="fin-kpi-meta">
          ${(() => {
            const keys = Object.keys(categoryTotals);
            if (keys.length === 0) return 'Belum ada data';
            let maxCat = keys[0];
            keys.forEach(k => { if (categoryTotals[k] > categoryTotals[maxCat]) maxCat = k; });
            return `Pos: <strong>${maxCat}</strong>`;
          })()}
        </div>
      </div>

      <div class="fin-kpi-card">
        <div class="fin-kpi-header">
          <span class="fin-kpi-title">Rata-rata Transaksi</span>
          <span class="fin-kpi-icon bg-blue-subtle text-blue">📊</span>
        </div>
        <div class="fin-kpi-value text-blue">
          ${periodExpenses.length > 0 ? formatRupiah(Math.round(totalMonthExpense / periodExpenses.length)) : 'Rp 0'}
        </div>
        <div class="fin-kpi-meta">
          Dari <strong>${periodExpenses.length}</strong> pos pengeluaran
        </div>
      </div>
    </div>

    <!-- Category Breakdown Chips -->
    <div class="card mb-4 category-breakdown-card">
      <div class="card-header border-b px-4 py-3">
        <h3 class="card-title text-sm font-bold mb-0">Rincian Pos Operasional (${formatMonthYear(selectedPeriodYM)})</h3>
      </div>
      <div class="category-chips-grid p-4">
        ${EXPENSE_CATEGORIES.map((cat) => {
          const total = categoryTotals[cat.name] || 0;
          const isSelected = expenseCategoryFilter === cat.name;
          return `
            <div class="category-chip ${total > 0 ? 'category-chip-active' : ''} ${isSelected ? 'category-chip-selected' : ''}" data-cat="${escapeHtml(cat.name)}">
              <span class="category-icon">${cat.icon}</span>
              <div class="category-info">
                <span class="category-name">${escapeHtml(cat.name)}</span>
                <span class="category-amount ${total > 0 ? 'text-danger font-semibold' : 'text-muted'}">
                  ${formatRupiah(total)}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Expenses Table -->
    <div class="card p-0 overflow-hidden">
      <div class="card-header fin-card-header border-b px-4 py-3">
        <div class="fin-header-title-box">
          <div class="flex align-center gap-2 flex-wrap">
            <h3 class="card-title text-base font-bold mb-0">Daftar Pengeluaran (${filteredExpenses.length} Transaksi)</h3>
            ${expenseCategoryFilter !== 'all' ? `
              <button type="button" class="btn btn-outline btn-xs" id="btn-reset-expense-filter">
                Hapus Filter: ${expenseCategoryFilter} &times;
              </button>
            ` : ''}
          </div>
        </div>
        <div class="fin-header-action-box">
          <button type="button" class="btn btn-danger btn-sm" id="btn-trigger-add-expense-sub">
            <span>+</span> Catat Pengeluaran
          </button>
        </div>
      </div>

      ${filteredExpenses.length === 0 ? `
        <div class="empty-state py-5 text-center">
          <div class="empty-state-icon" style="font-size: 3rem;">📤</div>
          <h3 class="font-bold text-lg mt-2">Tidak Ada Pengeluaran</h3>
          <p class="text-muted text-sm max-w-md mx-auto mb-4">
            Belum ada catatan pengeluaran operasional kos pada periode <strong>${formatMonthYear(selectedPeriodYM)}</strong>.
          </p>
          <button type="button" class="btn btn-danger" id="btn-empty-add-expense">
            + Catat Pengeluaran Baru
          </button>
        </div>
      ` : `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 120px;">Tanggal</th>
                <th style="width: 180px;">Kategori</th>
                <th>Keterangan / Rincian Pengeluaran</th>
                <th class="text-right" style="width: 160px;">Nominal (Rp)</th>
                <th style="width: 110px;" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map((exp, idx) => {
                const catObj = EXPENSE_CATEGORIES.find((c) => c.name === exp.category);
                const icon = catObj ? catObj.icon : '📦';
                return `
                  <tr>
                    <td class="text-muted text-xs font-mono">${idx + 1}</td>
                    <td class="text-xs whitespace-nowrap font-medium">
                      ${formatDateIndo(exp.date)}
                    </td>
                    <td>
                      <span class="badge badge-secondary text-xs">
                        <span>${icon}</span> ${escapeHtml(exp.category)}
                      </span>
                    </td>
                    <td>
                      <span class="expense-desc font-medium text-main text-sm">${escapeHtml(exp.description || '-')}</span>
                    </td>
                    <td class="text-right whitespace-nowrap">
                      <strong class="text-danger font-bold text-sm">
                        -${formatRupiah(exp.amount)}
                      </strong>
                    </td>
                    <td class="text-center whitespace-nowrap">
                      <div class="flex-center gap-1">
                        <button type="button" class="btn btn-ghost btn-xs btn-edit-expense" data-exp-id="${exp.id}" title="Edit Pengeluaran">
                          ✏️ Edit
                        </button>
                        <button type="button" class="btn btn-ghost btn-xs text-danger btn-delete-expense" data-exp-id="${exp.id}" title="Hapus Pengeluaran">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="4" class="text-right font-bold text-sm">TOTAL BIAYA OPERASIONAL:</td>
                <td class="text-right font-bold text-danger text-base">
                  -${formatRupiah(filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `}
    </div>
  `;
}

// =============================================================================
// TAB 3: LAPORAN LABA BERSIH & ARUS KAS (CASH FLOW LEDGER)
// =============================================================================
function renderReportSubTab({ selectedPeriodYM }) {
  const allInflows = store.getAllInflows ? store.getAllInflows() : [];
  const allExpenses = store.getExpenses ? store.getExpenses() : [];

  // Determine active date range based on reportFilterType
  const { startDate, endDate, label } = getActiveReportRange(selectedPeriodYM);

  // Filter transactions in range
  const rangeInflows = allInflows.filter((item) => {
    return item.date >= startDate && item.date <= endDate;
  });

  const rangeExpenses = allExpenses.filter((item) => {
    return item.date >= startDate && item.date <= endDate;
  });

  // Calculate Net Profit
  const totalRevenue = rangeInflows.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = rangeExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netProfit = totalRevenue - totalExpense;
  const isSurplus = netProfit >= 0;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Build Chronological Cash Flow Ledger
  // Combine all inflows and outflows, sorted chronologically ASCENDING
  const ledgerEntries = [];

  rangeInflows.forEach((item) => {
    ledgerEntries.push({
      id: item.id,
      date: item.date,
      type: 'inflow',
      category: item.category || (item.isRent ? 'Sewa Kamar' : 'Lain-lain'),
      description: item.title,
      inAmount: item.amount,
      outAmount: 0,
      notes: item.notes || item.paymentMethod || '-'
    });
  });

  rangeExpenses.forEach((item) => {
    ledgerEntries.push({
      id: item.id,
      date: item.date,
      type: 'outflow',
      category: item.category || 'Operasional',
      description: item.description,
      inAmount: 0,
      outAmount: item.amount,
      notes: '-'
    });
  });

  // Sort ascending by date
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute Running Balance sequentially
  let runningBalance = 0;
  ledgerEntries.forEach((entry) => {
    runningBalance += (entry.inAmount - entry.outAmount);
    entry.balance = runningBalance;
  });

  const settings = store.getSettings();

  return `
    <!-- Report Print Header (Visible only when printed) -->
    <div class="print-only mb-4">
      <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="margin: 0; font-size: 16pt; font-weight: bold;">${escapeHtml(settings.kosName || 'Juragankosan')}</h2>
          <p style="margin: 2px 0 0; font-size: 9pt; color: #444;">${escapeHtml(settings.address || 'Alamat Kos Belum Diatur')}</p>
          <p style="margin: 2px 0 0; font-size: 9pt; color: #444;">Pengelola: ${escapeHtml(settings.ownerName || '-')} | WA: ${escapeHtml(settings.ownerPhone || '-')}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase;">LAPORAN LABA BERSIH &amp; ARUS KAS</h3>
          <p style="margin: 2px 0 0; font-size: 9pt; font-weight: bold;">Periode: ${label}</p>
          <p style="margin: 2px 0 0; font-size: 8pt; color: #666;">Dicetak: ${formatDateIndo(getTodayDateString())}</p>
        </div>
      </div>
    </div>

    <!-- Filter Periode Bar (Interactive) -->
    <div class="card mb-4 fin-report-filter-bar no-print">
      <div class="fin-toolbar-inner">
        <div class="fin-toolbar-filters">
          <span class="text-xs font-bold text-muted uppercase fin-filter-label">Pilih Periode Laporan:</span>
          <div class="fin-period-grid">
            <button type="button" class="btn btn-sm ${reportFilterType === 'this_month' ? 'btn-primary' : 'btn-outline'} btn-set-report-filter" data-filter="this_month">
              📅 Bulan Ini
            </button>
            <button type="button" class="btn btn-sm ${reportFilterType === 'last_month' ? 'btn-primary' : 'btn-outline'} btn-set-report-filter" data-filter="last_month">
              ⏪ Bulan Lalu
            </button>
            <button type="button" class="btn btn-sm ${reportFilterType === 'this_year' ? 'btn-primary' : 'btn-outline'} btn-set-report-filter" data-filter="this_year">
              🗓️ Tahun Ini (${new Date().getFullYear()})
            </button>
            <button type="button" class="btn btn-sm ${reportFilterType === 'custom' ? 'btn-primary' : 'btn-outline'} btn-set-report-filter" data-filter="custom">
              ⚡ Rentang Kustom
            </button>
          </div>
        </div>

        <div class="fin-toolbar-action">
          <button type="button" class="btn btn-outline btn-sm font-semibold" id="btn-print-report-inner">
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <!-- Custom Date Picker Fields (Shown when reportFilterType === 'custom') -->
      ${reportFilterType === 'custom' ? `
        <div class="custom-date-box mt-3 pt-3 border-t flex align-center gap-3 flex-wrap">
          <div class="flex align-center gap-2">
            <label for="report-date-start" class="text-xs font-semibold">Dari Tanggal:</label>
            <input type="date" id="report-date-start" class="form-control form-control-sm" value="${startDate}" />
          </div>
          <div class="flex align-center gap-2">
            <label for="report-date-end" class="text-xs font-semibold">Sampai Tanggal:</label>
            <input type="date" id="report-date-end" class="form-control form-control-sm" value="${endDate}" />
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-apply-custom-dates">
            Terapkan Filter
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Financial Statement Highlight Cards (Laba Bersih Real-Time) -->
    <div class="pnl-grid mb-4">
      <!-- Total Pemasukan -->
      <div class="pnl-card">
        <span class="pnl-label">Total Pemasukan Arus Kas</span>
        <div class="pnl-value text-emerald">+${formatRupiah(totalRevenue)}</div>
        <div class="pnl-sub">${rangeInflows.length} transaksi pemasukan (sewa &amp; lain-lain)</div>
      </div>

      <!-- Total Pengeluaran -->
      <div class="pnl-card">
        <span class="pnl-label">Total Biaya Operasional</span>
        <div class="pnl-value text-danger">-${formatRupiah(totalExpense)}</div>
        <div class="pnl-sub">${rangeExpenses.length} transaksi pengeluaran kos</div>
      </div>

      <!-- Laba Bersih (Net Profit) -->
      <div class="pnl-card pnl-card-highlight ${isSurplus ? 'pnl-profit' : 'pnl-loss'}">
        <div class="flex-between align-center mb-1">
          <span class="pnl-label font-bold">Laba Bersih (Net Profit)</span>
          <span class="badge ${isSurplus ? 'badge-emerald' : 'badge-danger'} font-bold text-xs">
            ${isSurplus ? '✓ SURPLUS (PROFIT)' : '⚠️ DEFISIT (RUGI)'}
          </span>
        </div>
        <div class="pnl-value ${isSurplus ? 'text-emerald' : 'text-danger'}">
          ${isSurplus ? '+' : ''}${formatRupiah(netProfit)}
        </div>
        <div class="pnl-sub">
          Margin Keuntungan: <strong>${profitMargin}%</strong> &bull; Periode: <strong>${label}</strong>
        </div>
      </div>
    </div>

    <!-- Chronological Cash Flow Ledger Table (Buku Kas) -->
    <div class="card p-0 overflow-hidden mb-4">
      <div class="card-header fin-card-header border-b px-4 py-3">
        <div class="fin-header-title-box">
          <h3 class="card-title text-base font-bold mb-0">Buku Kas &amp; Arus Kas Kronologis</h3>
          <p class="text-xs text-muted mb-0">Rincian mutasi kas masuk, keluar, dan saldo berjalan (running balance)</p>
        </div>
        <div class="text-right">
          <span class="badge badge-secondary text-xs">Periode: ${label}</span>
        </div>
      </div>

      ${ledgerEntries.length === 0 ? `
        <div class="empty-state py-5 text-center">
          <div class="empty-state-icon" style="font-size: 3rem;">📊</div>
          <h3 class="font-bold text-lg mt-2">Tidak Ada Transaksi di Periode Ini</h3>
          <p class="text-muted text-sm max-w-md mx-auto mb-0">
            Tidak ditemukan mutasi kas masuk maupun keluar pada rentang <strong>${label}</strong>.
          </p>
        </div>
      ` : `
        <div class="table-responsive">
          <table class="data-table cashflow-table">
            <thead>
              <tr>
                <th style="width: 45px;">No</th>
                <th style="width: 110px;">Tanggal</th>
                <th style="width: 90px;" class="text-center">Tipe</th>
                <th style="width: 140px;">Kategori</th>
                <th>Uraian Transaksi</th>
                <th class="text-right" style="width: 140px;">Pemasukan (Kredit)</th>
                <th class="text-right" style="width: 140px;">Pengeluaran (Debit)</th>
                <th class="text-right" style="width: 150px;">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerEntries.map((entry, idx) => {
                const isIn = entry.type === 'inflow';
                return `
                  <tr class="${isIn ? 'row-ledger-in' : 'row-ledger-out'}">
                    <td class="text-muted text-xs font-mono">${idx + 1}</td>
                    <td class="text-xs whitespace-nowrap font-medium">
                      ${formatDateIndo(entry.date)}
                    </td>
                    <td class="text-center">
                      ${isIn ? `
                        <span class="badge badge-emerald text-2xs font-bold">📥 Masuk</span>
                      ` : `
                        <span class="badge badge-danger text-2xs font-bold">📤 Keluar</span>
                      `}
                    </td>
                    <td>
                      <span class="badge badge-secondary text-xs">${escapeHtml(entry.category)}</span>
                    </td>
                    <td>
                      <span class="font-semibold text-sm text-main">${escapeHtml(entry.description)}</span>
                      ${entry.notes && entry.notes !== '-' ? `
                        <span class="text-xs text-muted block">${escapeHtml(entry.notes)}</span>
                      ` : ''}
                    </td>
                    <td class="text-right font-mono text-xs ${entry.inAmount > 0 ? 'text-emerald font-bold' : 'text-muted'}">
                      ${entry.inAmount > 0 ? `+${formatRupiah(entry.inAmount)}` : '-'}
                    </td>
                    <td class="text-right font-mono text-xs ${entry.outAmount > 0 ? 'text-danger font-bold' : 'text-muted'}">
                      ${entry.outAmount > 0 ? `-${formatRupiah(entry.outAmount)}` : '-'}
                    </td>
                    <td class="text-right font-mono text-xs font-bold ${entry.balance >= 0 ? 'text-main' : 'text-danger'}">
                      ${formatRupiah(entry.balance)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="5" class="text-right font-bold text-sm">TOTAL PERIODE:</td>
                <td class="text-right font-bold text-emerald text-sm">
                  +${formatRupiah(totalRevenue)}
                </td>
                <td class="text-right font-bold text-danger text-sm">
                  -${formatRupiah(totalExpense)}
                </td>
                <td class="text-right font-bold font-mono text-sm ${isSurplus ? 'text-emerald' : 'text-danger'}">
                  ${isSurplus ? '+' : ''}${formatRupiah(netProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `}
    </div>

    <!-- Signature Block for Printed Financial Statement -->
    <div class="print-only mt-5" style="display: flex; justify-content: space-between; padding: 0 40px;">
      <div style="text-align: center;">
        <p style="margin-bottom: 50px; font-size: 9pt;">Mengetahui,<br>Pengelola / Pemilik Kos</p>
        <p style="font-weight: bold; text-decoration: underline; font-size: 10pt; margin: 0;">${escapeHtml(settings.ownerName || 'Pengelola Kos')}</p>
      </div>
      <div style="text-align: center;">
        <p style="margin-bottom: 50px; font-size: 9pt;">Dibuat Tanggal ${formatDateIndo(getTodayDateString())},<br>Sistem Keuangan Juragankosan</p>
        <p style="font-weight: bold; text-decoration: underline; font-size: 10pt; margin: 0;">Laporan Resmi Otomatis</p>
      </div>
    </div>
  `;
}

// =============================================================================
// EVENT LISTENERS & HANDLERS
// =============================================================================
function setupFinancialEventListeners(container) {
  // 1. Sub-tab switcher
  container.querySelectorAll('[data-subtab-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentSubTab = btn.getAttribute('data-subtab-target');
      renderFinances(container, { subTab: currentSubTab, period: selectedPeriodYM });
    });
  });

  // 2. Month Navigator
  container.querySelectorAll('.btn-nav-period').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPeriodYM = btn.getAttribute('data-period');
      renderFinances(container, { subTab: currentSubTab, period: selectedPeriodYM });
    });
  });

  // 3. Print Report
  const btnPrintTop = container.querySelector('#btn-print-financial-report');
  if (btnPrintTop) {
    btnPrintTop.addEventListener('click', () => window.print());
  }
  const btnPrintInner = container.querySelector('#btn-print-report-inner');
  if (btnPrintInner) {
    btnPrintInner.addEventListener('click', () => window.print());
  }

  // 4. Modal Triggers: Income
  const btnOpenAddIncome = container.querySelector('#btn-open-add-income');
  if (btnOpenAddIncome) btnOpenAddIncome.addEventListener('click', () => openIncomeModal());

  const btnTriggerAddIncomeSub = container.querySelector('#btn-trigger-add-income-sub');
  if (btnTriggerAddIncomeSub) btnTriggerAddIncomeSub.addEventListener('click', () => openIncomeModal());

  const btnEmptyAddIncome = container.querySelector('#btn-empty-add-income');
  if (btnEmptyAddIncome) btnEmptyAddIncome.addEventListener('click', () => openIncomeModal());

  // 5. Modal Triggers: Expense
  const btnOpenAddExpense = container.querySelector('#btn-open-add-expense');
  if (btnOpenAddExpense) btnOpenAddExpense.addEventListener('click', () => openExpenseModal());

  const btnTriggerAddExpenseSub = container.querySelector('#btn-trigger-add-expense-sub');
  if (btnTriggerAddExpenseSub) btnTriggerAddExpenseSub.addEventListener('click', () => openExpenseModal());

  const btnEmptyAddExpense = container.querySelector('#btn-empty-add-expense');
  if (btnEmptyAddExpense) btnEmptyAddExpense.addEventListener('click', () => openExpenseModal());

  // 6. Category filters for Pemasukan
  container.querySelectorAll('.btn-filter-income-cat').forEach((btn) => {
    btn.addEventListener('click', () => {
      incomeCategoryFilter = btn.getAttribute('data-cat');
      renderFinances(container, { subTab: 'incomes', period: selectedPeriodYM });
    });
  });

  // 7. Category chips for Pengeluaran
  container.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      expenseCategoryFilter = (expenseCategoryFilter === cat) ? 'all' : cat;
      renderFinances(container, { subTab: 'expenses', period: selectedPeriodYM });
    });
  });

  const btnResetExpFilter = container.querySelector('#btn-reset-expense-filter');
  if (btnResetExpFilter) {
    btnResetExpFilter.addEventListener('click', () => {
      expenseCategoryFilter = 'all';
      renderFinances(container, { subTab: 'expenses', period: selectedPeriodYM });
    });
  }

  // 8. Report Filter switcher
  container.querySelectorAll('.btn-set-report-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      reportFilterType = btn.getAttribute('data-filter');
      renderFinances(container, { subTab: 'report', period: selectedPeriodYM });
    });
  });

  const btnApplyCustom = container.querySelector('#btn-apply-custom-dates');
  if (btnApplyCustom) {
    btnApplyCustom.addEventListener('click', () => {
      const startEl = container.querySelector('#report-date-start');
      const endEl = container.querySelector('#report-date-end');
      if (startEl && endEl && startEl.value && endEl.value) {
        if (startEl.value > endEl.value) {
          showToast('Tanggal mulai tidak boleh lebih besar dari tanggal akhir', 'error');
          return;
        }
        reportStartDate = startEl.value;
        reportEndDate = endEl.value;
        renderFinances(container, { subTab: 'report', period: selectedPeriodYM });
      }
    });
  }

  // 9. Table Row Actions: View Bill
  container.querySelectorAll('.btn-view-bill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const billId = btn.getAttribute('data-bill-id');
      if (window.juraganApp) {
        window.juraganApp.navigateTo('bills', { highlightBillId: billId });
      }
    });
  });

  // 10. Table Row Actions: Edit & Delete Income
  container.querySelectorAll('.btn-edit-income').forEach((btn) => {
    btn.addEventListener('click', () => {
      const incId = btn.getAttribute('data-income-id');
      openIncomeModal(incId);
    });
  });

  container.querySelectorAll('.btn-delete-income').forEach((btn) => {
    btn.addEventListener('click', () => {
      const incId = btn.getAttribute('data-income-id');
      const inc = store.getIncomeById(incId);
      if (!inc) return;

      showConfirmModal({
        title: 'Hapus Catatan Pemasukan?',
        message: `Yakin ingin menghapus catatan pemasukan "${escapeHtml(inc.title)}" sebesar ${formatRupiah(inc.amount)}? Data yang dihapus tidak dapat dipulihkan.`,
        confirmText: 'Ya, Hapus Pemasukan',
        confirmBtnClass: 'btn-danger',
        onConfirm: () => {
          store.deleteIncome(incId);
          showToast('Catatan pemasukan berhasil dihapus', 'info');
          renderFinances(container, { subTab: currentSubTab, period: selectedPeriodYM });
        }
      });
    });
  });

  // 11. Table Row Actions: Edit & Delete Expense
  container.querySelectorAll('.btn-edit-expense').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expId = btn.getAttribute('data-exp-id');
      openExpenseModal(expId);
    });
  });

  container.querySelectorAll('.btn-delete-expense').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expId = btn.getAttribute('data-exp-id');
      const exp = store.getExpenseById ? store.getExpenseById(expId) : store.getExpenses().find(e => e.id === expId);
      if (!exp) return;

      showConfirmModal({
        title: 'Hapus Biaya Operasional?',
        message: `Yakin ingin menghapus pengeluaran "${escapeHtml(exp.description || exp.category)}" sebesar ${formatRupiah(exp.amount)}? Data yang dihapus tidak dapat dipulihkan.`,
        confirmText: 'Ya, Hapus Pengeluaran',
        confirmBtnClass: 'btn-danger',
        onConfirm: () => {
          store.deleteExpense(expId);
          showToast('Catatan pengeluaran berhasil dihapus', 'info');
          renderFinances(container, { subTab: currentSubTab, period: selectedPeriodYM });
        }
      });
    });
  });

  // 12. Income Form Submission
  const incomeForm = document.getElementById('income-form');
  if (incomeForm) {
    incomeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('income-date').value;
      const title = document.getElementById('income-title').value.trim();
      const category = document.getElementById('income-category').value;
      const amountVal = document.getElementById('income-amount').value;
      const notes = document.getElementById('income-notes').value.trim();

      const amount = parseInt(amountVal, 10);
      if (!title) {
        showToast('Uraian pemasukan tidak boleh kosong', 'error');
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        showToast('Nominal harus lebih besar dari 0', 'error');
        return;
      }

      if (editingIncomeId) {
        store.updateIncome(editingIncomeId, { date, title, category, amount, notes });
        showToast('Data pemasukan berhasil diperbarui!', 'success');
      } else {
        store.addIncome({ date, title, category, amount, notes });
        showToast('Pemasukan baru berhasil dicatat!', 'success');
      }

      closeModal('income-modal');
      editingIncomeId = null;
      renderFinances(container, { subTab: 'incomes', period: selectedPeriodYM });
    });
  }

  // 13. Expense Form Submission
  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('expense-date').value;
      const category = document.getElementById('expense-category').value;
      const amountVal = document.getElementById('expense-amount').value;
      const description = document.getElementById('expense-desc').value.trim();

      const amount = parseInt(amountVal, 10);
      if (isNaN(amount) || amount <= 0) {
        showToast('Nominal harus lebih besar dari 0', 'error');
        return;
      }
      if (!description) {
        showToast('Keterangan pengeluaran wajib diisi', 'error');
        return;
      }

      if (editingExpenseId) {
        store.updateExpense(editingExpenseId, { date, category, amount, description });
        showToast('Biaya operasional berhasil diperbarui!', 'success');
      } else {
        store.addExpense({ date, category, amount, description });
        showToast('Biaya operasional berhasil dicatat!', 'success');
      }

      closeModal('expense-modal');
      editingExpenseId = null;
      renderFinances(container, { subTab: 'expenses', period: selectedPeriodYM });
    });
  }

  // 14. Bind custom pickers for income & expense categories
  const incomeCatTrigger = container.querySelector('#income-category-trigger');
  const incomeCatInput = container.querySelector('#income-category');
  if (incomeCatTrigger && incomeCatInput) {
    bindCustomPicker(incomeCatTrigger, incomeCatInput, {
      title: 'Pilih Kategori Pemasukan',
      options: INCOME_CATEGORIES.filter((c) => c.name !== 'Sewa Kamar').map((c) => ({
        value: c.name,
        label: c.name,
        icon: c.icon
      }))
    });
  }

  const expCatTrigger = container.querySelector('#expense-category-trigger');
  const expCatInput = container.querySelector('#expense-category');
  if (expCatTrigger && expCatInput) {
    bindCustomPicker(expCatTrigger, expCatInput, {
      title: 'Pilih Kategori Biaya Operasional',
      options: EXPENSE_CATEGORIES.map((c) => ({
        value: c.name,
        label: c.name,
        icon: c.icon
      }))
    });
  }
}

// Modal open helpers
function openIncomeModal(incomeId = null) {
  editingIncomeId = incomeId;
  const modalTitle = document.getElementById('income-modal-title');
  const dateInput = document.getElementById('income-date');
  const titleInput = document.getElementById('income-title');
  const catInput = document.getElementById('income-category');
  const amountInput = document.getElementById('income-amount');
  const notesInput = document.getElementById('income-notes');
  const submitBtn = document.getElementById('btn-submit-income');

  if (incomeId) {
    const inc = store.getIncomeById(incomeId);
    if (!inc) return;
    if (modalTitle) modalTitle.textContent = 'Edit Catatan Pemasukan';
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    if (dateInput) dateInput.value = inc.date || getTodayDateString();
    if (titleInput) titleInput.value = inc.title || '';
    if (catInput) catInput.value = inc.category || 'Lain-lain';
    if (amountInput) amountInput.value = inc.amount || '';
    if (notesInput) notesInput.value = inc.notes || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Pemasukan Lain-Lain';
    if (submitBtn) submitBtn.textContent = 'Simpan Pemasukan';
    if (dateInput) dateInput.value = getTodayDateString();
    if (titleInput) titleInput.value = '';
    if (catInput) catInput.value = 'Parkir Kendaraan';
    if (amountInput) amountInput.value = '';
    if (notesInput) notesInput.value = '';
  }

  openModal('income-modal');
}

function openExpenseModal(expenseId = null) {
  editingExpenseId = expenseId;
  const modalTitle = document.getElementById('expense-modal-title');
  const dateInput = document.getElementById('expense-date');
  const catInput = document.getElementById('expense-category');
  const amountInput = document.getElementById('expense-amount');
  const descInput = document.getElementById('expense-desc');
  const submitBtn = document.getElementById('btn-submit-expense');

  if (expenseId) {
    const exp = store.getExpenseById ? store.getExpenseById(expenseId) : store.getExpenses().find(e => e.id === expenseId);
    if (!exp) return;
    if (modalTitle) modalTitle.textContent = 'Edit Biaya Operasional';
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    if (dateInput) dateInput.value = exp.date || getTodayDateString();
    if (catInput) catInput.value = exp.category || 'Listrik / Token PLN';
    if (amountInput) amountInput.value = exp.amount || '';
    if (descInput) descInput.value = exp.description || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Catat Pengeluaran Operasional';
    if (submitBtn) submitBtn.textContent = 'Simpan Pengeluaran';
    if (dateInput) dateInput.value = getTodayDateString();
    if (catInput) catInput.value = 'Listrik / Token PLN';
    if (amountInput) amountInput.value = '';
    if (descInput) descInput.value = '';
  }

  openModal('expense-modal');
}

function initReportDates() {
  if (!reportStartDate || !reportEndDate) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    reportStartDate = `${currentYear}-${currentMonth}-01`;
    // Last day of month
    const lastDay = new Date(currentYear, today.getMonth() + 1, 0).getDate();
    reportEndDate = `${currentYear}-${currentMonth}-${String(lastDay).padStart(2, '0')}`;
  }
}

function getActiveReportRange(selectedPeriodYM) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();

  if (reportFilterType === 'this_month') {
    const [yStr, mStr] = selectedPeriodYM.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      startDate: `${yStr}-${mStr}-01`,
      endDate: `${yStr}-${mStr}-${pad(lastDay)}`,
      label: `Bulan Ini (${formatMonthYear(selectedPeriodYM)})`
    };
  } else if (reportFilterType === 'last_month') {
    const [yStr, mStr] = selectedPeriodYM.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const prevDate = new Date(y, m - 2, 1);
    const py = prevDate.getFullYear();
    const pm = pad(prevDate.getMonth() + 1);
    const lastDay = new Date(py, prevDate.getMonth() + 1, 0).getDate();
    return {
      startDate: `${py}-${pm}-01`,
      endDate: `${py}-${pm}-${pad(lastDay)}`,
      label: `Bulan Lalu (${formatMonthYear(`${py}-${pm}`)})`
    };
  } else if (reportFilterType === 'this_year') {
    const y = now.getFullYear();
    return {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
      label: `Tahun ${y} Penuh (Jan - Des)`
    };
  } else {
    // Custom
    return {
      startDate: reportStartDate,
      endDate: reportEndDate,
      label: `${formatDateIndo(reportStartDate)} s/d ${formatDateIndo(reportEndDate)}`
    };
  }
}
