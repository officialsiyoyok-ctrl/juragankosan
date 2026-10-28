/**
 * Juragankosan Operational Expenses View (Tab 5: Pencatatan Pengeluaran & Laba Bersih)
 */
import { store } from '../state.js';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYear,
  getCurrentYearMonth,
  getTodayDateString,
  escapeHtml
} from '../utils/formatter.js';
import { openModal, closeModal, showToast, showConfirmModal, bindCustomPicker } from '../utils/modal.js';

let selectedPeriod = getCurrentYearMonth();

const getExpenseCategoriesList = () => (store.getExpenseCategories ? store.getExpenseCategories() : [
  { name: 'Listrik / Token PLN', icon: '⚡' },
  { name: 'Air / PDAM', icon: '💧' },
  { name: 'WiFi / Internet', icon: '📶' },
  { name: 'Kebersihan & Sampah', icon: '🧹' },
  { name: 'Perbaikan / Maintenance', icon: '🔧' },
  { name: 'Keamanan / Satpam', icon: '🛡️' },
  { name: 'Perlengkapan Kos', icon: '🧻' },
  { name: 'Lain-lain', icon: '📦' }
]);

export function renderExpenses(container, options = {}) {
  if (options.period) {
    selectedPeriod = options.period;
  }

  const expenseCategories = getExpenseCategoriesList();
  const periodExpenses = store.getExpensesByPeriod(selectedPeriod);
  const periodBills = store.getBillsByPeriod(selectedPeriod);

  // Financial calculations
  const totalRevenue = periodBills
    .filter((b) => b.status === 'lunas')
    .reduce((acc, b) => acc + (b.amount || 0), 0);

  const totalExpense = periodExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpense;

  // Category breakdown
  const categoryTotals = {};
  periodExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + (exp.amount || 0);
  });

  // Calculate previous and next months
  const [yearStr, monthStr] = selectedPeriod.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const prevMonthDate = new Date(y, m - 2, 1);
  const nextMonthDate = new Date(y, m, 1);
  const pad = (n) => String(n).padStart(2, '0');
  const prevPeriod = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;
  const nextPeriod = `${nextMonthDate.getFullYear()}-${pad(nextMonthDate.getMonth() + 1)}`;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h1 class="page-title">Pencatatan Biaya Operasional Kos</h1>
        <p class="page-subtitle">Pantau pengeluaran bulanan (listrik, air, perbaikan, wifi) dan hitung laba bersih operasional kos</p>
      </div>
      <div class="view-header-actions">
        <!-- Month Navigator -->
        <div class="month-navigator">
          <button class="btn btn-outline btn-sm btn-nav-month" data-period="${prevPeriod}" title="Bulan Sebelumnya">
            &larr; Bulan Lalu
          </button>
          <div class="current-month-display">
            <svg class="calendar-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            <span><strong>${formatMonthYear(selectedPeriod)}</strong></span>
          </div>
          <button class="btn btn-outline btn-sm btn-nav-month" data-period="${nextPeriod}" title="Bulan Berikutnya">
            Bulan Depan &rarr;
          </button>
        </div>

        <button class="btn btn-primary" id="btn-add-expense-modal">
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          + Catat Pengeluaran
        </button>
      </div>
    </div>

    <!-- Profit & Loss Summary Cards -->
    <div class="pnl-grid">
      <div class="pnl-card">
        <span class="pnl-label">Pendapatan Sewa Diterima</span>
        <div class="pnl-value text-emerald">${formatRupiah(totalRevenue)}</div>
        <div class="pnl-sub">Dari pembayaran lunas bulan ini</div>
      </div>
      <div class="pnl-card">
        <span class="pnl-label">Total Pengeluaran Kos</span>
        <div class="pnl-value text-danger">-${formatRupiah(totalExpense)}</div>
        <div class="pnl-sub">${periodExpenses.length} transaksi pengeluaran</div>
      </div>
      <div class="pnl-card pnl-card-highlight ${netProfit >= 0 ? 'pnl-profit' : 'pnl-loss'}">
        <span class="pnl-label">${netProfit >= 0 ? '✨ Sisa Laba Bersih Kos' : '⚠️ Defisit / Rugi Bersih'}</span>
        <div class="pnl-value">${formatRupiah(netProfit)}</div>
        <div class="pnl-sub">${netProfit >= 0 ? 'Margin keuntungan bersih kos' : 'Pengeluaran melebihi pemasukan'}</div>
      </div>
    </div>

    <!-- Category Breakdown Pills -->
    ${
      Object.keys(categoryTotals).length > 0
        ? `
      <div class="category-breakdown-card">
        <h4 class="breakdown-title">Rincian Pengeluaran per Kategori (${formatMonthYear(selectedPeriod)}):</h4>
        <div class="category-chips-list">
          ${Object.entries(categoryTotals)
            .map(([cat, amount]) => {
              const matched = expenseCategories.find((c) => c.name === cat);
              const icon = matched ? matched.icon : '📦';
              return `
              <div class="category-stat-chip">
                <span class="cat-icon">${icon}</span>
                <span class="cat-name">${escapeHtml(cat)}</span>
                <strong class="cat-amount">${formatRupiah(amount)}</strong>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `
        : ''
    }

    <!-- Expenses List Table -->
    <div class="content-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Daftar Biaya Operasional (${formatMonthYear(selectedPeriod)})</h2>
          <p class="section-subtitle">Catatan pengeluaran rutin dan pemeliharaan kos</p>
        </div>
      </div>

      ${
        periodExpenses.length === 0
          ? `
        <div class="empty-state-card">
          <div class="empty-icon">💸</div>
          <h3>Belum Ada Pengeluaran Dicatat</h3>
          <p>Belum ada biaya operasional (listrik, air, kebersihan, wifi) yang dicatat pada periode ini.</p>
          <button class="btn btn-primary" id="btn-empty-add-expense">+ Catat Pengeluaran Pertama</button>
        </div>
      `
          : `
        <div class="table-responsive card-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th>Nominal</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${periodExpenses
                .map((exp) => {
                  const matched = expenseCategories.find((c) => c.name === exp.category);
                  const icon = matched ? matched.icon : '📦';

                  return `
                    <tr>
                      <td>${formatDateIndo(exp.date)}</td>
                      <td>
                        <span class="category-badge">
                          <span>${icon}</span> ${escapeHtml(exp.category)}
                        </span>
                      </td>
                      <td>
                        <span class="expense-desc">${escapeHtml(exp.description || '-')}</span>
                      </td>
                      <td>
                        <strong class="text-danger font-semibold">-${formatRupiah(exp.amount)}</strong>
                      </td>
                      <td class="text-right">
                        <button class="btn btn-ghost btn-sm btn-delete-expense text-danger" data-exp-id="${exp.id}" title="Hapus Pengeluaran">
                          🗑️ Hapus
                        </button>
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

    <!-- Add Expense Modal -->
    <div id="expense-form-modal" class="modal-backdrop">
      <div class="modal-dialog modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">Catat Pengeluaran Baru</h3>
          <button class="modal-close" data-close-modal="expense-form-modal">&times;</button>
        </div>
        <form id="expense-form" novalidate>
          <div class="modal-body">
            <div class="form-group">
              <label for="expense-date" class="form-label">Tanggal Pengeluaran <span class="text-danger">*</span></label>
              <input type="date" id="expense-date" class="form-control" value="${getTodayDateString()}" required />
            </div>

            <div class="form-group">
              <label for="expense-category" class="form-label">Kategori Biaya</label>
              <div class="custom-select-trigger" id="expense-category-trigger" data-picker-for="expense-category" tabindex="0" role="button">
                <span class="custom-select-label" id="expense-category-label">${expenseCategories[0]?.icon} ${expenseCategories[0]?.name}</span>
                <span class="custom-select-arrow">▾</span>
              </div>
              <input type="hidden" id="expense-category" value="${expenseCategories[0]?.name || ''}" />
            </div>

            <div class="form-group">
              <label for="expense-amount" class="form-label">Nominal Pengeluaran (Rp) <span class="text-danger">*</span></label>
              <input 
                type="number" 
                id="expense-amount" 
                class="form-control" 
                placeholder="Contoh: 150000" 
                min="1" 
                step="5000" 
                required 
              />
              <span class="form-error" id="error-expense-amount"></span>
            </div>

            <div class="form-group">
              <label for="expense-desc" class="form-label">Keterangan / Rincian <span class="text-danger">*</span></label>
              <input 
                type="text" 
                id="expense-desc" 
                class="form-control" 
                placeholder="Contoh: Beli token listrik pompa air & lampu teras" 
                required 
              />
              <span class="form-error" id="error-expense-desc"></span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="expense-form-modal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Pengeluaran</button>
          </div>
        </form>
      </div>
    </div>
  `;

  setupExpensesEvents(container);

  if (options.openAddModal) {
    openAddExpenseModal();
  }
}

function setupExpensesEvents(container) {
  // Month Navigator
  container.querySelectorAll('.btn-nav-month').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPeriod = btn.getAttribute('data-period');
      renderExpenses(container);
    });
  });

  // Open modal
  const btnAdd = container.querySelector('#btn-add-expense-modal');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openAddExpenseModal());
  }

  const btnEmptyAdd = container.querySelector('#btn-empty-add-expense');
  if (btnEmptyAdd) {
    btnEmptyAdd.addEventListener('click', () => openAddExpenseModal());
  }

  // Delete Expense
  container.querySelectorAll('.btn-delete-expense').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const expId = btn.getAttribute('data-exp-id');
      const confirmed = await showConfirmModal({
        title: 'Hapus Biaya Pengeluaran?',
        message: 'Apakah Anda yakin ingin menghapus catatan biaya ini?',
        confirmText: 'Ya, Hapus',
        danger: true
      });

      if (confirmed) {
        store.deleteExpense(expId);
        showToast('Catatan pengeluaran berhasil dihapus.', 'info');
        renderExpenses(container);
      }
    });
  });

  // Expense Form Submit
  const expenseForm = container.querySelector('#expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveExpenseForm(container);
    });
  }

  // Bind custom picker for expense category
  const catTrigger = container.querySelector('#expense-category-trigger');
  const catInput = container.querySelector('#expense-category');
  if (catTrigger && catInput) {
    bindCustomPicker(catTrigger, catInput, {
      title: 'Pilih Kategori Biaya',
      getOptions: () => getExpenseCategoriesList().map((c) => ({ value: c.name, label: c.name, icon: c.icon }))
    });
  }
}

function openAddExpenseModal() {
  const cats = getExpenseCategoriesList();
  const firstCat = cats[0]?.name || 'Listrik / Token PLN';
  const firstIcon = cats[0]?.icon || '⚡';
  document.getElementById('expense-date').value = getTodayDateString();
  document.getElementById('expense-category').value = firstCat;
  const labelEl = document.getElementById('expense-category-label');
  if (labelEl) labelEl.textContent = `${firstIcon} ${firstCat}`;
  document.getElementById('expense-amount').value = '';
  document.getElementById('expense-desc').value = '';

  document.getElementById('error-expense-amount').textContent = '';
  document.getElementById('error-expense-desc').textContent = '';

  openModal('expense-form-modal');
}

function saveExpenseForm(container) {
  const date = document.getElementById('expense-date').value;
  const category = document.getElementById('expense-category').value;
  const amountRaw = document.getElementById('expense-amount').value;
  const desc = document.getElementById('expense-desc').value.trim();

  let hasError = false;
  const amount = parseInt(amountRaw, 10);

  if (isNaN(amount) || amount <= 0) {
    document.getElementById('error-expense-amount').textContent = 'Nominal harus berupa angka lebih dari 0!';
    hasError = true;
  }

  if (!desc) {
    document.getElementById('error-expense-desc').textContent = 'Keterangan pengeluaran wajib diisi!';
    hasError = true;
  }

  if (hasError) return;

  store.addExpense({ date, category, amount, description: desc });
  showToast('Pengeluaran berhasil dicatat!', 'success');
  closeModal('expense-form-modal');
  renderExpenses(container);
}
