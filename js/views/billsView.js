/**
 * Juragankosan Bills View (Tab 4: Tracking Tagihan Sewa & Pengingat WhatsApp 1-Klik)
 */
import { store } from '../state.js?v=3.4';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYear,
  getCurrentYearMonth,
  calculateDaysDiffFromToday,
  escapeHtml,
  formatDisplayPhone,
  terbilangRupiah,
  addMonthsToPeriod
} from '../utils/formatter.js?v=3.4';
import {
  generateBillWhatsAppText,
  generateKwitansiWhatsAppText,
  generateWhatsAppMessage,
  openWhatsAppLink,
  DEFAULT_PARTIAL_REMINDER_WA_TEMPLATE
} from '../utils/whatsapp.js?v=3.5';
import { openModal, closeModal, showToast, showConfirmModal } from '../utils/modal.js?v=3.4';
import { isPro } from '../utils/license.js?v=3.4';

let selectedPeriod = getCurrentYearMonth();
let currentFilter = 'all'; // 'all' | 'belum_bayar' | 'sebagian' | 'lunas' | 'terlambat'
let searchKeyword = '';

export function renderBills(container, options = {}) {
  if (options.period) {
    selectedPeriod = options.period;
  }
  if (options.filter) {
    currentFilter = options.filter;
  }
  if (options.searchKeyword) {
    searchKeyword = options.searchKeyword;
  }

  // Ensure bills exist for the selected period
  store.generateBillsForPeriod(selectedPeriod);

  const allPeriodBills = store.getBillsByPeriod(selectedPeriod);
  const settings = store.getSettings();

  // Statistics for this period
  const totalBillsCount = allPeriodBills.length;
  const paidBills = allPeriodBills.filter((b) => b.status === 'lunas');
  const partialBills = allPeriodBills.filter((b) => b.status === 'sebagian');
  const unpaidBills = allPeriodBills.filter((b) => b.status === 'belum_bayar');
  const pendingBills = allPeriodBills.filter((b) => b.status !== 'lunas');
  const overdueBills = pendingBills.filter((b) => calculateDaysDiffFromToday(b.dueDate) > 0);

  const totalNominal = allPeriodBills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalPaidNominal = allPeriodBills.reduce((acc, b) => {
    return acc + (b.paidAmount !== undefined ? b.paidAmount : (b.status === 'lunas' ? b.amount : 0));
  }, 0);
  const totalUnpaidNominal = allPeriodBills.reduce((acc, b) => {
    return acc + (b.remainingAmount !== undefined ? b.remainingAmount : (b.status !== 'lunas' ? b.amount : 0));
  }, 0);

  // Filter bills
  const filteredBills = allPeriodBills.filter((b) => {
    const isOverdue = b.status !== 'lunas' && calculateDaysDiffFromToday(b.dueDate) > 0;

    let matchesFilter = true;
    if (currentFilter === 'lunas') matchesFilter = b.status === 'lunas';
    else if (currentFilter === 'belum_bayar') matchesFilter = b.status === 'belum_bayar';
    else if (currentFilter === 'sebagian') matchesFilter = b.status === 'sebagian';
    else if (currentFilter === 'terlambat') matchesFilter = isOverdue;

    const s = searchKeyword.toLowerCase().trim();
    const matchesSearch =
      !s ||
      b.tenantName.toLowerCase().includes(s) ||
      b.roomNumber.toLowerCase().includes(s) ||
      (b.tenantPhone && b.tenantPhone.includes(s));

    return matchesFilter && matchesSearch;
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
        <h1 class="page-title">Tracking Tagihan Sewa Bulanan</h1>
        <p class="page-subtitle">Pantau status pembayaran penyewa, tandai lunas, dan kirim pengingat tagihan WhatsApp 1-klik</p>
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
      </div>
    </div>

    <!-- Monthly Stats Bar -->
    <div class="bills-summary-grid">
      <div class="bills-summary-card">
        <span class="summary-label">Total Tagihan Periode Ini</span>
        <div class="summary-value">${formatRupiah(totalNominal)}</div>
        <div class="summary-sub">${totalBillsCount} tagihan unit aktif</div>
      </div>
      <div class="bills-summary-card border-left-emerald">
        <span class="summary-label text-emerald">Sudah Lunas (${paidBills.length})</span>
        <div class="summary-value text-emerald">${formatRupiah(totalPaidNominal)}</div>
        <div class="summary-sub">Uang masuk diterima</div>
      </div>
      <div class="bills-summary-card border-left-amber">
        <span class="summary-label text-amber">Belum Lunas (${unpaidBills.length})</span>
        <div class="summary-value text-amber">${formatRupiah(totalUnpaidNominal)}</div>
        <div class="summary-sub">Menunggu pembayaran sewa</div>
      </div>
      <div class="bills-summary-card border-left-danger">
        <span class="summary-label text-danger">Terlambat (${overdueBills.length})</span>
        <div class="summary-value text-danger">${overdueBills.length} Penyewa</div>
        <div class="summary-sub">Melewati tanggal jatuh tempo</div>
      </div>
    </div>

    <!-- Toolbar Filters -->
    <div class="toolbar-card">
      <div class="toolbar-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input 
          type="text" 
          id="bills-search-input" 
          class="form-control form-control-search" 
          placeholder="Cari nama penyewa atau nomor kamar..." 
          value="${escapeHtml(searchKeyword)}"
        />
        ${searchKeyword ? `<button class="search-clear-btn" id="btn-clear-bills-search">&times;</button>` : ''}
      </div>

      <div class="filter-pills">
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          Semua (${totalBillsCount})
        </button>
        <button class="filter-pill ${currentFilter === 'belum_bayar' ? 'active' : ''}" data-filter="belum_bayar">
          Belum Bayar (${unpaidBills.length})
        </button>
        <button class="filter-pill ${currentFilter === 'sebagian' ? 'active' : ''}" data-filter="sebagian">
          <span class="dot-indicator bg-amber"></span> Dicicil (${partialBills.length})
        </button>
        <button class="filter-pill ${currentFilter === 'terlambat' ? 'active' : ''}" data-filter="terlambat">
          <span class="dot-indicator bg-danger"></span> Terlambat (${overdueBills.length})
        </button>
        <button class="filter-pill ${currentFilter === 'lunas' ? 'active' : ''}" data-filter="lunas">
          <span class="dot-indicator bg-emerald"></span> Lunas (${paidBills.length})
        </button>
      </div>
    </div>

    <!-- Bills Table / Cards -->
    ${
      filteredBills.length === 0
        ? `
      <div class="empty-state-card">
        <div class="empty-icon">🧾</div>
        <h3>Tidak Ada Tagihan Ditemukan</h3>
        <p>${
          searchKeyword || currentFilter !== 'all'
            ? 'Tidak ada tagihan yang sesuai dengan filter atau kata kunci pencarian.'
            : `Belum ada penyewa aktif yang terdaftar untuk periode ${formatMonthYear(selectedPeriod)}.`
        }</p>
        <button class="btn btn-outline" id="btn-generate-bills">🔄 Perbarui Tagihan Periode Ini</button>
      </div>
    `
        : `
      <div class="table-responsive card-table bills-table-container">
        <table class="data-table bills-table">
          <thead>
            <tr>
              <th>Kamar</th>
              <th>Nama Penyewa</th>
              <th>Nominal Sewa</th>
              <th>Jatuh Tempo</th>
              <th>Status Tagihan</th>
              <th>Pembayaran</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBills
              .map((bill) => {
                const daysDiff = calculateDaysDiffFromToday(bill.dueDate);
                const isLunas = bill.status === 'lunas';
                const isPartial = bill.status === 'sebagian';
                const isOverdue = !isLunas && daysDiff > 0;

                let statusBadge = '';
                if (isLunas) {
                  statusBadge = bill.isAdvance
                    ? `<span class="badge badge-success">✓ Lunas (Maju ${bill.advanceMonths || 1} Bln)</span>`
                    : `<span class="badge badge-success">✓ Lunas</span>`;
                } else if (isPartial) {
                  statusBadge = `<span class="badge badge-warning-soft">⚡ Dicicil (Sisa ${formatRupiah(bill.remainingAmount || 0)})</span>`;
                } else if (isOverdue) {
                  statusBadge = `<span class="badge badge-danger">⚠️ Telat ${daysDiff} Hari</span>`;
                } else if (daysDiff === 0) {
                  statusBadge = `<span class="badge badge-warning">⚡ Jatuh Tempo Hari Ini</span>`;
                } else {
                  statusBadge = `<span class="badge badge-warning">Belum Bayar</span>`;
                }

                return `
                  <tr class="bill-card ${isOverdue ? 'row-highlight-danger' : ''}">
                    <td>
                      <strong class="room-pill">${escapeHtml(bill.roomNumber)}</strong>
                    </td>
                    <td>
                      <div class="tenant-name-cell">
                        <span class="tenant-name">${escapeHtml(bill.tenantName)}</span>
                        <span class="tenant-phone-sub">${bill.tenantPhone}</span>
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
                    <td>
                      <div class="due-date-cell">
                        <span class="${isOverdue ? 'text-danger font-medium' : 'text-body'}">${formatDateIndo(
                  bill.dueDate
                )}</span>
                        ${
                          !isLunas
                            ? `<span class="text-muted text-xs">${
                                daysDiff > 0
                                  ? `Lewat ${daysDiff} hari`
                                  : daysDiff === 0
                                  ? 'Batas hari ini'
                                  : `${Math.abs(daysDiff)} hari lagi`
                              }</span>`
                            : ''
                        }
                      </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                      ${
                        isLunas
                          ? `
                        <div class="payment-meta-cell">
                          <span class="pay-method-pill">${escapeHtml(bill.paymentMethod || 'Transfer')}</span>
                          <span class="pay-date-text">Tgl: ${formatDateIndo(bill.paidDate)}</span>
                          <span class="pay-receipt-num font-mono text-xs">${bill.receiptNumber || ''}</span>
                        </div>
                      `
                          : isPartial
                          ? `
                        <div class="payment-meta-cell">
                          <span class="pay-method-pill" style="background-color: rgba(245, 158, 11, 0.15); color: #b45309;">${escapeHtml(bill.paymentMethod || 'Transfer')}</span>
                          <span class="pay-date-text">Cicil: ${formatDateIndo(bill.paidDate)}</span>
                          <span class="pay-receipt-num font-mono text-xs">${bill.receiptNumber || ''}</span>
                        </div>
                      `
                          : `<span class="text-muted text-sm">- Belum diterima -</span>`
                      }
                    </td>
                    <td class="text-right">
                      <div class="action-btn-group bill-actions table-actions">
                        ${
                          !isLunas
                            ? `
                          <button class="btn btn-wa btn-sm btn-send-wa" data-bill-id="${bill.id}" title="${isPartial ? 'Kirim Pengingat Sisa Cicilan via WA' : 'Kirim Tagihan via WhatsApp'}">
                            <svg class="wa-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            ${isPartial ? 'Tagih Sisa' : 'Tagih WA'}
                          </button>
                          <button class="btn ${isPartial ? 'btn-warning' : 'btn-success'} btn-sm btn-mark-paid" data-bill-id="${bill.id}">
                            ${isPartial ? '+ Bayar Sisa' : '✓ Tandai Lunas'}
                          </button>
                          ${
                            isPartial
                              ? `
                            <button class="btn btn-outline btn-sm btn-show-receipt" data-bill-id="${bill.id}" title="Kwitansi Bukti Cicilan">
                              📄 Kwitansi
                            </button>
                            <button class="btn btn-ghost btn-sm btn-revert-paid text-muted" data-bill-id="${bill.id}" title="Reset Status Cicilan">
                              ↩️ Batal Cicil
                            </button>
                          `
                              : ''
                          }
                        `
                            : `
                          <button class="btn btn-outline btn-sm btn-show-receipt" data-bill-id="${bill.id}">
                            📄 Kwitansi
                          </button>
                          <button class="btn btn-ghost btn-sm btn-revert-paid text-muted" data-bill-id="${bill.id}" title="Batalkan status lunas (jika salah klik)">
                            ↩️ Batal Lunas
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
  `;

  setupBillsEvents(container);
}

function setupBillsEvents(container) {
  // Month Navigator
  container.querySelectorAll('.btn-nav-month').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPeriod = btn.getAttribute('data-period');
      renderBills(container);
    });
  });

  // Search input
  const searchInput = container.querySelector('#bills-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value;
      renderBills(container);
    });
  }

  const btnClearSearch = container.querySelector('#btn-clear-bills-search');
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchKeyword = '';
      renderBills(container);
    });
  }

  // Filter pills
  container.querySelectorAll('.filter-pill[data-filter]').forEach((pill) => {
    pill.addEventListener('click', () => {
      currentFilter = pill.getAttribute('data-filter');
      renderBills(container);
    });
  });

  // Generate / refresh bills button
  const btnGen = container.querySelector('#btn-generate-bills');
  if (btnGen) {
    btnGen.addEventListener('click', () => {
      const count = store.generateBillsForPeriod(selectedPeriod);
      showToast(`Tagihan diperbarui (${count} tagihan baru dibuat).`, 'info');
      renderBills(container);
    });
  }

  // Send WhatsApp Reminder
  container.querySelectorAll('.btn-send-wa').forEach((btn) => {
    btn.addEventListener('click', () => {
      const billId = btn.getAttribute('data-bill-id');
      const bill = store.getBillById(billId);
      if (!bill) return;

      const settings = store.getSettings();
      const message = generateBillWhatsAppText(bill, settings);
      openWhatsAppLink(bill.tenantPhone, message);
    });
  });

  // Mark as Paid Button
  container.querySelectorAll('.btn-mark-paid').forEach((btn) => {
    btn.addEventListener('click', () => {
      const billId = btn.getAttribute('data-bill-id');
      window.juraganApp.openPaymentModal(billId);
    });
  });

  // Show Digital Receipt
  container.querySelectorAll('.btn-show-receipt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const billId = btn.getAttribute('data-bill-id');
      openReceiptModal(billId);
    });
  });

  // Revert Paid
  container.querySelectorAll('.btn-revert-paid').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const billId = btn.getAttribute('data-bill-id');
      const bill = store.getBillById(billId);
      if (!bill) return;

      const confirmed = await showConfirmModal({
        title: 'Batalkan Status Lunas?',
        message: `Kembalikan status tagihan sewa <strong>${escapeHtml(bill.tenantName)} (${escapeHtml(
          bill.roomNumber
        )})</strong> menjadi Belum Bayar?`,
        confirmText: 'Ya, Batalkan Lunas',
        danger: true
      });

      if (confirmed) {
        store.revertBillPayment(billId);
        showToast('Status pembayaran berhasil dibatalkan menjadi Belum Bayar.', 'info');
        renderBills(container);
      }
    });
  });
}

/**
 * Renders and opens the official corporate property digital receipt modal
 * Strictly structured into 6 neat sections and guaranteed to fit exactly 1 page
 */
export function openReceiptModal(billId, paymentResult = null) {
  const bill = store.getBillById(billId);
  if (!bill) {
    showToast('Data tagihan sewa tidak ditemukan.', 'error');
    return;
  }

  // Synchronize tenant & room details from store if missing
  if (!bill.tenantName || !bill.tenantPhone) {
    const tenant = store.getTenantById(bill.tenantId);
    if (tenant) {
      if (!bill.tenantName) bill.tenantName = tenant.name;
      if (!bill.tenantPhone) bill.tenantPhone = tenant.phone;
    }
  }
  if (!bill.roomNumber) {
    const room = store.getRoomById(bill.roomId);
    if (room) {
      bill.roomNumber = room.number;
    }
  }

  const settings = store.getSettings();
  const isAdvance = bill.isAdvance || (paymentResult && paymentResult.type === 'advance');
  const isPartial = bill.status === 'sebagian' || (paymentResult && paymentResult.type === 'partial');

  // Calculate amounts and labels according to payment mode
  let receiptTitle = 'KWITANSI RESMI PEMBAYARAN SEWA';
  let statusBadgeText = 'LUNAS';
  let stampClass = 'paid-stamp animate-stamp';
  let stampText = 'LUNAS';
  let receiptAmount = bill.amount;
  let periodText = formatMonthYear(bill.period);

  if (isAdvance) {
    const advInfo = bill.advanceInfo || (paymentResult ? paymentResult : null);
    const months = advInfo ? advInfo.monthsCount || advInfo.totalMonths || 2 : 2;
    const startP = advInfo ? advInfo.startPeriod || advInfo.periodStart || bill.period : bill.period;
    const endP = advInfo ? advInfo.endPeriod || advInfo.periodEnd || addMonthsToPeriod(bill.period, months - 1) : addMonthsToPeriod(bill.period, months - 1);
    const totalAdv = advInfo ? advInfo.totalAmount : bill.amount * months;

    receiptTitle = 'KWITANSI RESMI SEWA MAJU';
    statusBadgeText = `LUNAS (${months} BULAN)`;
    stampClass = 'paid-stamp stamp-advance animate-stamp';
    stampText = 'LUNAS (MAJU)';
    receiptAmount = totalAdv;
    periodText = `${months} Bulan (${formatMonthYear(startP)} s/d ${formatMonthYear(endP)})`;
  } else if (isPartial) {
    const latestPay = paymentResult && paymentResult.paymentRecord
      ? paymentResult.paymentRecord.amount
      : (bill.payments && bill.payments.length > 0 ? bill.payments[bill.payments.length - 1].amount : bill.paidAmount);

    receiptTitle = 'KWITANSI PEMBAYARAN CICILAN';
    statusBadgeText = bill.status === 'lunas' ? 'LUNAS' : 'DICICIL (SEBAGIAN)';
    stampClass = bill.status === 'lunas' ? 'paid-stamp animate-stamp' : 'paid-stamp stamp-partial animate-stamp';
    stampText = bill.status === 'lunas' ? 'LUNAS' : 'DICICIL';
    receiptAmount = latestPay || bill.paidAmount;
    periodText = `Cicilan ${formatMonthYear(bill.period)}`;
  }

  const terbilang = terbilangRupiah(receiptAmount);

  // Guaranteed unique corporate receipt number format: KW/YYYYMM/ROOM-SEQ
  const cleanRoom = ((bill.roomNumber || '101').replace(/[^0-9a-zA-Z]/g, '') || 'KMR').toUpperCase();
  const [y, m] = (bill.period || getCurrentYearMonth()).split('-');
  const seq = Math.floor(100 + Math.random() * 900);
  const receiptNum = bill.receiptNumber || `KW/${y}${m}/${cleanRoom}-${seq}`;
  if (!bill.receiptNumber) {
    bill.receiptNumber = receiptNum;
    store.save();
  }

  // Extract dynamic short address and city location for stamp & signature
  let shortAddress = '';
  let signLocation = 'Indonesia';
  if (settings.address && settings.address.trim()) {
    const addrParts = settings.address.split(',').map((p) => p.trim()).filter(Boolean);
    if (addrParts.length >= 2) {
      signLocation = addrParts[addrParts.length - 2] || addrParts[addrParts.length - 1];
      shortAddress = addrParts.slice(-2).join(', ');
    } else if (addrParts.length === 1) {
      signLocation = addrParts[0];
      shortAddress = addrParts[0];
    }
  }
  if (shortAddress.length > 24) {
    shortAddress = signLocation;
  }

  const receiptData = {
    receiptNumber: receiptNum,
    kosName: settings.kosName || 'Juragankosan',
    kosAddress: settings.address || 'Alamat Properti Belum Diisi',
    shortAddress: shortAddress,
    signLocation: signLocation,
    ownerName: settings.ownerName || 'Pengelola Kos',
    ownerPhone: settings.ownerPhone || '',
    tenantName: bill.tenantName || 'Penyewa',
    tenantPhone: bill.tenantPhone || '',
    roomNumber: bill.roomNumber || 'Kamar',
    period: bill.period,
    amount: bill.amount,
    paidAmount: bill.paidAmount !== undefined ? bill.paidAmount : bill.amount,
    remainingAmount: bill.remainingAmount !== undefined ? bill.remainingAmount : 0,
    paidDate: bill.paidDate || new Date().toISOString().substring(0, 10),
    paymentMethod: bill.paymentMethod || 'Transfer Bank',
    notes: bill.notes || '',
    terbilang: terbilang,
    isAdvance: isAdvance,
    isPartial: isPartial,
    advanceMonths: bill.advanceMonths || (paymentResult ? paymentResult.monthsCount : 1)
  };

  let receiptModal = document.getElementById('receipt-modal-container');
  if (!receiptModal) {
    receiptModal = document.createElement('div');
    receiptModal.id = 'receipt-modal-container';
    receiptModal.className = 'modal-backdrop';
    document.body.appendChild(receiptModal);
  }

  receiptModal.innerHTML = `
    <div class="modal-dialog modal-md">
      <div class="modal-header modal-header-clean no-print">
        <h3 class="modal-title">Kwitansi Pembayaran Digital</h3>
        <button class="modal-close" data-close-modal="receipt-modal-container">&times;</button>
      </div>

      <div class="modal-body p-0">
        <!-- Printable Corporate Property Receipt Sheet (Pas Tepat 1 Halaman Penuh) -->
        <div class="printable-receipt-card receipt-print-area" id="printable-receipt-area">
          
          <!-- 1. Kop Kwitansi: Nama Kos, Alamat Lengkap, Kontak & Nama Pengelola -->
          <div class="receipt-corp-header">
            <div class="receipt-corp-brand">
              <div class="receipt-corp-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="corp-logo-svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="receipt-corp-details">
                <h2 class="receipt-corp-title">${escapeHtml(receiptData.kosName)}</h2>
                <p class="receipt-corp-meta">${escapeHtml(receiptData.kosAddress)}</p>
                <p class="receipt-corp-contact">
                  <span>Kontak: <strong>${formatDisplayPhone(receiptData.ownerPhone) || '-'}</strong></span>
                  <span class="contact-sep">&bull;</span>
                  <span>Pengelola: <strong>${escapeHtml(receiptData.ownerName)}</strong></span>
                </p>
              </div>
            </div>
          </div>

          <div class="receipt-header-divider"></div>

          <!-- 2. Nomor & Tanggal (Rata Kanan) -->
          <div class="receipt-meta-bar">
            <div class="receipt-badge-title">${escapeHtml(receiptTitle)}</div>
            <div class="receipt-meta-right">
              <div class="receipt-meta-item">
                <span class="meta-label">No. Kwitansi</span>
                <span class="meta-val-mono">${escapeHtml(receiptData.receiptNumber)}</span>
              </div>
              <div class="receipt-meta-item">
                <span class="meta-label">Tanggal Cetak</span>
                <span class="meta-val">${formatDateIndo(new Date().toISOString().substring(0, 10))}</span>
              </div>
            </div>
          </div>

          <!-- 3. Informasi Penyewa (Kotak Rincian Bergaris Tipis Tanpa Simbol Mentah) -->
          <div class="receipt-tenant-box">
            <div class="tenant-info-grid">
              <div class="tenant-field">
                <span class="field-title">Nama Penyewa</span>
                <span class="field-data font-bold">${escapeHtml(receiptData.tenantName)}</span>
              </div>
              <div class="tenant-field">
                <span class="field-title">Unit Kamar</span>
                <span class="field-data font-bold text-emerald">${escapeHtml(receiptData.roomNumber)}</span>
              </div>
              <div class="tenant-field">
                <span class="field-title">No. WhatsApp / HP</span>
                <span class="field-data font-mono">${formatDisplayPhone(receiptData.tenantPhone) || '-'}</span>
              </div>
              <div class="tenant-field">
                <span class="field-title">Metode Pembayaran</span>
                <span class="field-data font-semibold">${escapeHtml(receiptData.paymentMethod)}</span>
              </div>
            </div>
          </div>

          <!-- 4. Tabel Rincian Pembayaran -->
          <table class="receipt-items-table">
            <thead>
              <tr>
                <th class="th-no">NO</th>
                <th class="th-desc">DESKRIPSI PEMBAYARAN</th>
                <th class="th-period">PERIODE</th>
                <th class="th-amount text-right">NOMINAL (RP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center font-mono">1</td>
                <td>
                  <div class="item-head">${isPartial ? 'Cicilan Pembayaran Sewa Kamar' : (isAdvance ? `Pembayaran Sewa Di Muka (${receiptData.advanceMonths} Bulan Sekaligus)` : 'Pembayaran Sewa Kamar Bulanan')}</div>
                  <div class="item-sub">Status: <span class="badge-status-inline">${statusBadgeText}</span>${isPartial ? ` &bull; Terbayar ${formatRupiah(receiptData.paidAmount)} dari total ${formatRupiah(receiptData.amount)}` : ''}</div>
                  ${bill.notes ? `<div class="item-notes">Keterangan: ${escapeHtml(bill.notes)}</div>` : ''}
                </td>
                <td>
                  <span class="period-text font-semibold">${escapeHtml(periodText)}</span>
                </td>
                <td class="text-right font-mono font-bold amount-cell">
                  ${formatRupiah(receiptAmount)}
                </td>
              </tr>
              ${isPartial && receiptData.remainingAmount > 0 ? `
                <tr class="row-remaining-warn">
                  <td colspan="3" class="text-right font-bold text-danger">SISA TAGIHAN SEWA BELUM LUNAS:</td>
                  <td class="text-right font-mono font-bold text-danger amount-cell">${formatRupiah(receiptData.remainingAmount)}</td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="row-total-bar">
                <td colspan="3" class="text-right font-bold total-label">TOTAL DITERIMA :</td>
                <td class="text-right font-mono font-bold total-value amount-cell">${formatRupiah(receiptAmount)}</td>
              </tr>
            </tfoot>
          </table>

          <!-- 5. Kotak Terbilang Rupiah -->
          <div class="receipt-terbilang-box">
            <span class="terbilang-title">TERBILANG :</span>
            <span class="terbilang-words"># ${receiptData.terbilang} #</span>
          </div>

          <!-- 6. Footer: Stempel Resmi LUNAS & Tanda Tangan Pengelola -->
          <div class="receipt-bottom-grid">
            <div class="bottom-left-panel">
              <div class="receipt-legal-card">
                <div class="legal-caption">KETENTUAN RESMI:</div>
                <p class="legal-text">&bull; Kwitansi ini adalah bukti sah penerimaan pembayaran uang sewa.</p>
                <p class="legal-text">&bull; Disimpan sebagai arsip resmi bukti pelunasan sewa kamar.</p>
              </div>
              ${!isPro() ? `
                <div class="receipt-watermark-free">
                  ⚡ Diterbitkan otomatis via <strong>Juragankosan</strong> (Versi Gratis) &bull; Hilangkan watermark dengan <strong>Lisensi PRO</strong>
                </div>
              ` : ''}
            </div>

            <div class="bottom-right-panel">
              <div class="sign-loc-date">
                ${escapeHtml(receiptData.signLocation)}, ${formatDateIndo(receiptData.paidDate)}
              </div>
              <div class="sign-post">Pengelola / Pemilik Properti,</div>

              <div class="sign-stamp-block">
                <div class="stamp-wrap">
                  <div class="${stampClass}">
                    <div class="stamp-double-ring">
                      <div class="stamp-org-title">${escapeHtml(receiptData.kosName).toUpperCase()}</div>
                      ${receiptData.shortAddress ? `<div class="stamp-address-sub">${escapeHtml(receiptData.shortAddress).toUpperCase()}</div>` : ''}
                      <div class="stamp-status-word">${stampText}</div>
                      <div class="stamp-verified-tag">&#10003; SAH &bull; ${receiptData.paidDate}</div>
                    </div>
                  </div>
                </div>
                <div class="sign-space"></div>
              </div>

              <div class="sign-owner-name font-bold underline">( ${escapeHtml(receiptData.ownerName)} )</div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer no-print receipt-modal-footer">
        <button type="button" class="btn btn-wa" id="btn-share-receipt-wa">
          <svg class="wa-btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Kirim Kwitansi via WA
        </button>
        <div class="receipt-footer-sub-row">
          <button type="button" class="btn btn-outline" id="btn-print-receipt">
            🖨️ Cetak / Simpan PDF
          </button>
          <button type="button" class="btn btn-secondary" data-close-modal="receipt-modal-container">
            Tutup
          </button>
        </div>
      </div>
    </div>
  `;

  // Print Receipt Event
  document.getElementById('btn-print-receipt').addEventListener('click', () => {
    window.print();
  });

  // Share Receipt WA Event (100% Synchronized via generateKwitansiWhatsAppText)
  document.getElementById('btn-share-receipt-wa').addEventListener('click', () => {
    const freshSettings = store.getSettings();
    const waMsg = generateKwitansiWhatsAppText(bill, freshSettings, {
      paymentMethod: receiptData.paymentMethod,
      receiptNumber: receiptData.receiptNumber,
      paidDate: receiptData.paidDate,
      amount: receiptAmount,
      type: isAdvance ? 'advance' : (isPartial ? 'partial' : 'full'),
      monthsCount: receiptData.advanceMonths
    });
    openWhatsAppLink(receiptData.tenantPhone, waMsg);
  });

  openModal('receipt-modal-container');
}

