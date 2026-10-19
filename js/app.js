/**
 * Juragankosan Main Application Orchestrator
 */
import { store } from './state.js?v=6.1';
import { initModalListeners, openModal, closeModal, showToast, bindCustomPicker } from './utils/modal.js?v=6.1';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYear,
  addMonthsToPeriod,
  parseRupiahInput,
  terbilangRupiah,
  formatDisplayPhone,
  escapeHtml
} from './utils/formatter.js?v=6.1';
import {
  generateWhatsAppMessage,
  generateKwitansiWhatsAppText,
  openWhatsAppLink,
  DEFAULT_RECEIPT_WA_TEMPLATE,
  DEFAULT_RECEIPT_PARTIAL_WA_TEMPLATE,
  DEFAULT_RECEIPT_ADVANCE_WA_TEMPLATE
} from './utils/whatsapp.js?v=6.1';

import { renderDashboard } from './views/dashboardView.js?v=6.1';
import { renderRooms } from './views/roomsView.js?v=6.1';
import { renderTenants } from './views/tenantsView.js?v=6.1';
import { renderBills, openReceiptModal as renderReceiptModal } from './views/billsView.js?v=6.1';
import { renderFinances } from './views/financialView.js?v=6.2';
import { renderExpenses } from './views/expensesView.js?v=6.1';
import { renderSettings } from './views/settingsView.js?v=6.1';
import { renderBackup } from './views/backupView.js?v=6.1';
import { isPro, openUpgradeModal, openAdminGeneratorModal, MAX_FREE_ROOMS } from './utils/license.js?v=6.1';
import { initAppLock, lockApp } from './utils/appLock.js?v=6.1';
import { initOnboarding } from './utils/onboarding.js?v=6.1';

class JuragankosanApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.mainContainer = document.getElementById('main-content');
    window.juraganApp = this;
    this.init();
  }

  navigateTo(tabName, options = {}) {
    this.switchTab(tabName, options);
  }

  init() {
    // Register Service Worker for Offline-First PWA capabilities in production
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            console.log('Juragankosan PWA Service Worker terdaftar:', reg.scope);
          })
          .catch((err) => {
            console.warn('SW registration warning:', err);
          });
      });
    }

    // Check URL parameters for maintenance / cache busting
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('clear_cache') && 'caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        });
      }
      if (urlParams.has('reset_sample')) {
        store.resetToSampleData();
      }
    } catch (e) {}

    try {
      initModalListeners();
      this.setupTheme();
      this.setupNavigation();
      this.setupGlobalEvents();
      this.setupAdminGeneratorTrigger();
      this.updateKosHeader();
      this.updateSidebarLicense();
    } catch (e) {
      console.warn('Juragankosan setup partial error:', e);
    }

    try {
      initAppLock();
    } catch (e) {
      console.error('Juragankosan initAppLock error:', e);
    }

    try {
      initOnboarding();
    } catch (e) {
      console.error('Juragankosan initOnboarding error:', e);
    }

    this.lockApp = lockApp;

    // Check if coming from a full reset reload
    try {
      const resetToastMsg = sessionStorage.getItem('jk_reset_toast');
      if (resetToastMsg) {
        sessionStorage.removeItem('jk_reset_toast');
        setTimeout(() => {
          showToast(resetToastMsg, 'warning');
        }, 300);
      }
    } catch (e) {}

    // Listen to reactive store updates
    window.addEventListener('juragankos:statechange', () => {
      this.updateBadges();
      this.updateSidebarLicense();
    });

    // Listen to reactive license changes
    window.addEventListener('juragankos_license_changed', () => {
      this.updateSidebarLicense();
      this.switchTab(this.currentTab);
    });

    // Initial render
    const startTab = this.currentTab || 'dashboard';
    this.switchTab(startTab);
    this.updateBadges();
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('juragankos_theme') || 'light';
    this.applyTheme(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('juragankos_theme', theme);

    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }

  updateKosHeader() {
    const settings = store.getSettings();
    const brandNameEl = document.getElementById('brand-kos-name');
    if (brandNameEl) {
      brandNameEl.textContent = settings.kosName || 'Juragankosan';
    }
  }

  updateBadges() {
    const rooms = store.getRooms();
    const vacantCount = rooms.filter((r) => r.status === 'kosong').length;
    const bills = store.getBills();
    const currentYM = new Date().toISOString().substring(0, 7);
    const unpaidThisMonth = bills.filter(
      (b) => b.period === currentYM && b.status === 'belum_bayar'
    ).length;

    const vacantBadge = document.getElementById('nav-badge-vacant');
    if (vacantBadge) {
      vacantBadge.textContent = vacantCount > 0 ? vacantCount : '';
      vacantBadge.style.display = vacantCount > 0 ? 'inline-flex' : 'none';
    }

    const unpaidBadge = document.getElementById('nav-badge-unpaid');
    if (unpaidBadge) {
      unpaidBadge.textContent = unpaidThisMonth > 0 ? unpaidThisMonth : '';
      unpaidBadge.style.display = unpaidThisMonth > 0 ? 'inline-flex' : 'none';
    }
  }

  updateSidebarLicense() {
    const container = document.getElementById('sidebar-license-widget');
    if (!container) return;

    const pro = isPro();
    const roomsCount = store.getRooms().length;

    if (pro) {
      container.innerHTML = `
        <div class="sidebar-license-card pro-active">
          <div class="sidebar-license-badge">
            <span class="pro-crown">👑</span>
            <strong class="pro-name">JURAGAN PRO</strong>
          </div>
          <span class="sidebar-license-sub">Unlimited Kamar &amp; Pintu</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="sidebar-license-card free-active">
          <div class="sidebar-license-quota">
            <span class="quota-pill ${roomsCount >= MAX_FREE_ROOMS ? 'quota-pill-full' : ''}">
              Paket Gratis: <strong>${roomsCount} / ${MAX_FREE_ROOMS}</strong> Kamar
            </span>
          </div>
          <button type="button" class="btn btn-sidebar-upgrade" id="btn-sidebar-upgrade-pro">
            <span>👑</span> Upgrade PRO
          </button>
        </div>
      `;

      const btn = container.querySelector('#btn-sidebar-upgrade-pro');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openUpgradeModal();
        });
      }
    }
  }

  setupAdminGeneratorTrigger() {
    const versionTag = document.getElementById('sidebar-version-tag') || document.querySelector('.version-tag');
    if (!versionTag) return;

    let clickCount = 0;
    let clickTimeout = null;

    versionTag.style.cursor = 'pointer';
    versionTag.addEventListener('click', () => {
      clickCount++;
      if (clickTimeout) clearTimeout(clickTimeout);

      if (clickCount >= 5) {
        clickCount = 0;
        openAdminGeneratorModal();
      } else {
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 2500);
      }
    });
  }

  setupNavigation() {
    // Handle browser hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      if (['dashboard', 'rooms', 'tenants', 'bills', 'finances', 'expenses', 'settings', 'backup'].includes(hash)) {
        if (this.currentTab !== hash) {
          this.switchTab(hash);
        }
      }
    });

    // Check initial hash on load
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    if (['dashboard', 'rooms', 'tenants', 'bills', 'finances', 'expenses', 'settings', 'backup'].includes(initialHash)) {
      this.currentTab = initialHash;
    }

    // Desktop & Mobile nav items
    document.querySelectorAll('[data-tab-target]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab-target');
        window.location.hash = tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName, options = {}) {
    // Alias 'expenses' to 'finances' with subTab: 'expenses'
    let effectiveTab = tabName;
    let effectiveOptions = { ...options };
    if (tabName === 'expenses') {
      effectiveTab = 'finances';
      effectiveOptions.subTab = 'expenses';
    }

    this.currentTab = effectiveTab;

    // Update breadcrumb and mobile topbar titles
    const pageTitles = {
      dashboard: 'Dashboard Ringkasan',
      rooms: 'Data Kamar',
      tenants: 'Database Penyewa',
      bills: 'Tagihan & Sewa',
      finances: 'Keuangan & Arus Kas',
      expenses: 'Keuangan & Arus Kas',
      settings: 'Pengaturan Kos',
      backup: 'Pusat Backup & Keamanan Data'
    };
    const titleText = pageTitles[effectiveTab] || 'Dashboard';
    const topbarTitleEls = document.querySelectorAll(
      '#topbar-current-page, #topbar-page-title, .topbar-title, .breadcrumb-current'
    );
    topbarTitleEls.forEach((el) => {
      el.textContent = titleText;
    });

    // Keep URL hash in sync with active tab
    if (window.location.hash !== `#${effectiveTab}`) {
      try {
        history.replaceState(null, '', `#${effectiveTab}`);
      } catch (e) {
        window.location.hash = effectiveTab;
      }
    }

    // Update active nav links
    document.querySelectorAll('[data-tab-target]').forEach((link) => {
      const target = link.getAttribute('data-tab-target');
      if (target === effectiveTab || (effectiveTab === 'finances' && target === 'expenses')) {
        link.classList.add('active');
        if (link.closest('#mobile-bottom-nav')) {
          try {
            link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } catch (e) {}
        }
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding view
    switch (effectiveTab) {
      case 'dashboard':
        renderDashboard(this.mainContainer);
        break;
      case 'rooms':
        renderRooms(this.mainContainer, effectiveOptions);
        break;
      case 'tenants':
        renderTenants(this.mainContainer, effectiveOptions);
        break;
      case 'bills':
        renderBills(this.mainContainer, effectiveOptions);
        break;
      case 'finances':
        renderFinances(this.mainContainer, effectiveOptions);
        break;
      case 'settings':
        renderSettings(this.mainContainer);
        break;
      case 'backup':
        renderBackup(this.mainContainer);
        break;
      default:
        renderDashboard(this.mainContainer);
    }
  }

  openPaymentModal(billId) {
    const bill = store.getBillById(billId);
    if (!bill) return;

    let paymentModal = document.getElementById('payment-modal');
    if (!paymentModal) {
      paymentModal = document.createElement('div');
      paymentModal.id = 'payment-modal';
      paymentModal.className = 'modal-backdrop';
      document.body.appendChild(paymentModal);
    }

    const settings = store.getSettings();
    const rawAccounts = Array.isArray(settings.bankAccounts) && settings.bankAccounts.length > 0
      ? settings.bankAccounts
      : (settings.bankName ? [{ bankName: settings.bankName, accountNumber: settings.bankAccount || '', accountHolder: '' }] : []);

    const paymentMethodOptions = [];
    rawAccounts
      .filter((acc) => acc && acc.bankName && acc.bankName.trim())
      .forEach((acc) => {
        const rawName = acc.bankName.trim();
        const bankTitle = rawName.toLowerCase().startsWith('transfer') ? rawName : `Transfer ${rawName}`;
        const detailsParts = [];
        if (acc.accountNumber && acc.accountNumber.trim()) {
          detailsParts.push(acc.accountNumber.trim());
        }
        if (acc.accountHolder && acc.accountHolder.trim()) {
          detailsParts.push(`a.n ${acc.accountHolder.trim()}`);
        }
        const label = detailsParts.length > 0 ? `${bankTitle} (${detailsParts.join(' ')})` : bankTitle;
        paymentMethodOptions.push({ value: label, label });
      });

    if (settings.acceptCash !== false || paymentMethodOptions.length === 0) {
      paymentMethodOptions.push({ value: '💵 Tunai / Cash', label: '💵 Tunai / Cash' });
    }

    const defaultPaymentMethod = paymentMethodOptions.length > 0 ? paymentMethodOptions[0].value : '💵 Tunai / Cash';

    const prevPaid = bill.paidAmount || 0;
    const remaining = bill.remainingAmount !== undefined ? bill.remainingAmount : Math.max(0, bill.amount - prevPaid);
    const isCurrentlyPartial = bill.status === 'sebagian' || (prevPaid > 0 && remaining > 0);
    const initialType = isCurrentlyPartial ? 'partial' : 'full';

    paymentModal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <h3 class="modal-title">Pencatatan Pembayaran Sewa</h3>
          <button class="modal-close" data-close-modal="payment-modal">&times;</button>
        </div>
        <form id="payment-form">
          <input type="hidden" id="pay-bill-id" value="${bill.id}" />
          <div class="modal-body">
            <!-- Tenant & Room Highlight -->
            <div id="pay-modal-bill-info" class="card-highlight-info mb-3">
              <div class="flex-between">
                <span><strong>${escapeHtml(bill.roomNumber)}</strong> — ${escapeHtml(bill.tenantName)}</span>
                <span class="text-emerald font-bold">${formatRupiah(bill.amount)} / bln</span>
              </div>
              <div class="text-xs text-muted mt-1">
                Periode: <strong>${formatMonthYear(bill.period)}</strong> | Jatuh Tempo: ${formatDateIndo(bill.dueDate)}
              </div>
              ${prevPaid > 0 ? `
                <div class="mt-2 pt-2 border-top-subtle flex-between text-xs">
                  <span class="text-secondary">Sudah Dicicil: <strong class="text-emerald">${formatRupiah(prevPaid)}</strong></span>
                  <span class="text-secondary">Sisa Tagihan: <strong class="text-danger">${formatRupiah(remaining)}</strong></span>
                </div>
              ` : ''}
            </div>

            <!-- Payment Type Selector -->
            <div class="form-group mb-3">
              <label class="form-label font-bold">Pilih Skema Pembayaran:</label>
              <div class="payment-type-selector">
                <button type="button" class="payment-type-btn ${initialType === 'full' ? 'active' : ''}" data-pay-type="full">
                  <span class="btn-icon-emoji">✓</span>
                  <span>Lunas (1 Bln)</span>
                  <small class="text-xs text-muted font-normal">${formatRupiah(remaining > 0 ? remaining : bill.amount)}</small>
                </button>
                <button type="button" class="payment-type-btn ${initialType === 'partial' ? 'active' : ''}" data-pay-type="partial">
                  <span class="btn-icon-emoji">⚡</span>
                  <span>Cicilan</span>
                  <small class="text-xs text-muted font-normal">Bayar sebagian</small>
                </button>
                <button type="button" class="payment-type-btn" data-pay-type="advance">
                  <span class="btn-icon-emoji">📅</span>
                  <span>Bayar Maju</span>
                  <small class="text-xs text-muted font-normal">Multi-bulan</small>
                </button>
              </div>
            </div>

            <!-- Section 1: Full Payment -->
            <div id="pay-section-full" class="payment-type-section ${initialType === 'full' ? '' : 'hidden'}">
              <div class="payment-calc-card">
                <div class="calc-row">
                  <span>Tagihan Bulan Ini (${formatMonthYear(bill.period)})</span>
                  <span class="font-medium">${formatRupiah(bill.amount)}</span>
                </div>
                ${prevPaid > 0 ? `
                  <div class="calc-row">
                    <span>Sudah Masuk Sebelumnya</span>
                    <span class="text-emerald font-medium">- ${formatRupiah(prevPaid)}</span>
                  </div>
                ` : ''}
                <div class="calc-row calc-row-highlight">
                  <span>Nominal Pelunasan</span>
                  <span class="text-emerald font-bold">${formatRupiah(remaining > 0 ? remaining : bill.amount)}</span>
                </div>
                <div class="text-xs text-muted mt-2">
                  ✓ Tagihan periode ini akan langsung dinyatakan <strong>LUNAS PENUH</strong>.
                </div>
              </div>
            </div>

            <!-- Section 2: Partial Installment Payment -->
            <div id="pay-section-partial" class="payment-type-section ${initialType === 'partial' ? '' : 'hidden'}">
              <div class="form-group">
                <label for="pay-partial-amount" class="form-label">
                  Nominal Cicilan yang Dibayar Sekarang (Rp) <span class="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  id="pay-partial-amount" 
                  class="form-control font-bold text-lg" 
                  placeholder="Contoh: 500000" 
                  value="${remaining > 0 ? remaining : Math.round(bill.amount / 2)}" 
                />
                <div class="calc-quick-chips">
                  <button type="button" class="quick-chip" data-chip-val="${Math.round(bill.amount * 0.5)}">
                    50% (${formatRupiah(Math.round(bill.amount * 0.5))})
                  </button>
                  <button type="button" class="quick-chip" data-chip-val="500000">
                    Rp 500.000
                  </button>
                  <button type="button" class="quick-chip" data-chip-val="1000000">
                    Rp 1.000.000
                  </button>
                  <button type="button" class="quick-chip" data-chip-val="${remaining}">
                    Lunaskan Sisa (${formatRupiah(remaining)})
                  </button>
                </div>
              </div>

              <div class="payment-calc-card" id="partial-calc-preview">
                <!-- Dynamically updated via JS -->
              </div>
            </div>

            <!-- Section 3: Advance Multi-Month Payment -->
            <div id="pay-section-advance" class="payment-type-section hidden">
              <div class="form-group mb-2">
                <label for="pay-advance-months" class="form-label font-bold">
                  Durasi Sewa Maju (Bulan) <span class="text-danger">*</span>
                </label>
                <input 
                  type="number" 
                  id="pay-advance-months" 
                  class="form-control font-bold text-lg" 
                  min="1" 
                  max="60" 
                  value="1" 
                  placeholder="Contoh: 1, 3, 6, 12" 
                  required 
                />
                <span class="form-hint text-xs text-muted mt-1 block">
                  Masukkan jumlah bulan (cth: 1, 4, 12, dll)
                </span>
                <div class="calc-quick-chips mt-2">
                  <button type="button" class="quick-chip advance-chip" data-advance-val="1">1 Bulan</button>
                  <button type="button" class="quick-chip advance-chip" data-advance-val="2">2 Bulan</button>
                  <button type="button" class="quick-chip advance-chip" data-advance-val="3">3 Bulan (Triwulan)</button>
                  <button type="button" class="quick-chip advance-chip" data-advance-val="6">6 Bulan (Semester)</button>
                  <button type="button" class="quick-chip advance-chip" data-advance-val="12">12 Bulan (1 Thn)</button>
                </div>
              </div>

              <div class="payment-calc-card" id="advance-calc-preview">
                <!-- Dynamically updated via JS -->
              </div>
            </div>

            <!-- Common Payment Details -->
            <div class="form-group">
              <label for="pay-date" class="form-label">Tanggal Diterima Pembayaran <span class="text-danger">*</span></label>
              <input type="date" id="pay-date" class="form-control" value="${new Date().toISOString().substring(0, 10)}" required />
            </div>

            <div class="form-group">
              <label for="pay-method" class="form-label">Metode Pembayaran</label>
              <div class="custom-select-trigger" id="pay-method-trigger" data-picker-for="pay-method">
                <span class="custom-select-label" id="pay-method-label">${escapeHtml(defaultPaymentMethod)}</span>
                <span class="custom-select-arrow">▾</span>
              </div>
              <input type="hidden" id="pay-method" value="${escapeHtml(defaultPaymentMethod)}" />
            </div>

            <div class="form-group">
              <label for="pay-notes" class="form-label">Catatan Transaksi (Opsional)</label>
              <input type="text" id="pay-notes" class="form-control" placeholder="Contoh: Bukti transfer via WA jam 10:15 / dicicil separuh" />
            </div>

            <div class="form-group mb-0">
              <label class="checkbox-label">
                <input type="checkbox" id="pay-open-receipt-cb" checked />
                <span class="checkbox-custom"></span>
                <span>Langsung buka kwitansi digital setelah disimpan</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-modal="payment-modal">Batal</button>
            <button type="submit" class="btn btn-success" id="pay-submit-btn">✓ Simpan &amp; Konfirmasi Pembayaran</button>
          </div>
        </form>
      </div>
    `;

    // Internal State for Modal
    let selectedType = initialType;

    const fullSection = paymentModal.querySelector('#pay-section-full');
    const partialSection = paymentModal.querySelector('#pay-section-partial');
    const advanceSection = paymentModal.querySelector('#pay-section-advance');
    const partialInput = paymentModal.querySelector('#pay-partial-amount');
    const advanceInput = paymentModal.querySelector('#pay-advance-months');
    const partialPreview = paymentModal.querySelector('#partial-calc-preview');
    const advancePreview = paymentModal.querySelector('#advance-calc-preview');
    const submitBtn = paymentModal.querySelector('#pay-submit-btn');

    // Bind custom picker for payment method
    const payMethodTrigger = paymentModal.querySelector('#pay-method-trigger');
    const payMethodInput = paymentModal.querySelector('#pay-method');
    if (payMethodTrigger && payMethodInput) {
      bindCustomPicker(payMethodTrigger, payMethodInput, {
        title: 'Pilih Metode Pembayaran',
        options: paymentMethodOptions
      });
    }

    const updatePartialPreview = () => {
      const payNow = parseRupiahInput(partialInput.value);
      const newPaid = prevPaid + payNow;
      const newRemaining = Math.max(0, bill.amount - newPaid);
      const isLunas = newRemaining === 0;

      partialPreview.innerHTML = `
        <div class="calc-row">
          <span>Total Tagihan Sewa</span>
          <span>${formatRupiah(bill.amount)}</span>
        </div>
        ${prevPaid > 0 ? `
          <div class="calc-row">
            <span>Sudah Dicicil Sebelumnya</span>
            <span class="text-emerald font-medium">${formatRupiah(prevPaid)}</span>
          </div>
        ` : ''}
        <div class="calc-row">
          <span>Cicilan Diterima Sekarang</span>
          <span class="text-emerald font-bold">${formatRupiah(payNow)}</span>
        </div>
        <div class="calc-row calc-row-highlight">
          <span>Sisa Tagihan Belum Lunas</span>
          <span class="${isLunas ? 'text-emerald' : 'text-danger'} font-bold">
            ${isLunas ? 'Rp 0 (LUNAS ✓)' : formatRupiah(newRemaining)}
          </span>
        </div>
        <div class="text-xs text-muted mt-2">
          Status setelah disimpan: <strong>${isLunas ? '✓ LUNAS' : `⚡ Dicicil (Sisa ${formatRupiah(newRemaining)})`}</strong>
        </div>
      `;

      submitBtn.textContent = isLunas ? '✓ Simpan & Nyatakan Lunas' : '⚡ Simpan Pembayaran Cicilan';
    };

    const updateAdvancePreview = () => {
      const rawVal = advanceInput.value ? advanceInput.value.trim() : '';
      let months = parseInt(rawVal, 10);
      if (isNaN(months) || months < 1) {
        months = 1;
      } else if (months > 60) {
        months = 60;
      }

      const totalAdvance = bill.amount * months;
      const endPeriod = addMonthsToPeriod(bill.period, months - 1);
      const periodRangeText = months === 1
        ? formatMonthYear(bill.period)
        : `${formatMonthYear(bill.period)} s/d ${formatMonthYear(endPeriod)}`;

      advancePreview.innerHTML = `
        <div class="calc-row">
          <span>Tarif Sewa Kamar / Bulan</span>
          <span>${formatRupiah(bill.amount)}</span>
        </div>
        <div class="calc-row">
          <span>Durasi Pembayaran</span>
          <span><strong>${months} Bulan ${months > 1 ? 'Sekaligus' : ''}</strong></span>
        </div>
        <div class="calc-row">
          <span>Periode yang Langsung Terbayar</span>
          <span class="text-body font-medium">${periodRangeText}</span>
        </div>
        <div class="calc-row calc-row-highlight">
          <span>Total Uang Sewa Diterima</span>
          <span class="text-emerald font-bold text-base">${formatRupiah(totalAdvance)}</span>
        </div>
        <div class="text-xs text-muted mt-2">
          ✓ Tagihan ${months} bulan (${periodRangeText}) otomatis diterbitkan dan ditandai <strong>LUNAS</strong>.
        </div>
      `;

      submitBtn.textContent = `📅 Simpan Pembayaran Maju (${months} Bulan)`;
    };

    // Mode Selector Switching
    paymentModal.querySelectorAll('.payment-type-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        paymentModal.querySelectorAll('.payment-type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.getAttribute('data-pay-type');

        fullSection.classList.toggle('hidden', selectedType !== 'full');
        partialSection.classList.toggle('hidden', selectedType !== 'partial');
        advanceSection.classList.toggle('hidden', selectedType !== 'advance');

        if (selectedType === 'full') {
          submitBtn.textContent = '✓ Simpan & Nyatakan Lunas';
        } else if (selectedType === 'partial') {
          updatePartialPreview();
        } else if (selectedType === 'advance') {
          updateAdvancePreview();
        }
      });
    });

    // Quick chips click
    paymentModal.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-chip-val');
        partialInput.value = val;
        updatePartialPreview();
      });
    });

    // Partial input typing
    partialInput.addEventListener('input', () => {
      updatePartialPreview();
    });

    // Advance duration input & quick chips
    advanceInput.addEventListener('input', () => {
      updateAdvancePreview();
    });
    advanceInput.addEventListener('change', () => {
      updateAdvancePreview();
    });
    paymentModal.querySelectorAll('.advance-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        advanceInput.value = chip.getAttribute('data-advance-val');
        updateAdvancePreview();
      });
    });

    // Initial render of preview
    updatePartialPreview();
    updateAdvancePreview();
    if (selectedType === 'full') {
      submitBtn.textContent = '✓ Simpan & Nyatakan Lunas';
    }

    const paymentForm = paymentModal.querySelector('#payment-form');
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const paidDate = document.getElementById('pay-date').value;
      const paymentMethod = document.getElementById('pay-method').value;
      const notes = document.getElementById('pay-notes').value.trim();
      const openReceipt = document.getElementById('pay-open-receipt-cb').checked;

      let result;
      if (selectedType === 'partial') {
        const payAmount = parseRupiahInput(partialInput.value);
        if (payAmount <= 0) {
          showToast('Nominal cicilan harus lebih dari Rp 0', 'warning');
          return;
        }
        result = store.recordPayment(bill.id, {
          type: 'partial',
          amount: payAmount,
          paidDate,
          paymentMethod,
          notes
        });
        showToast(
          result.newRemaining <= 0
            ? `Cicilan ${bill.roomNumber} (${bill.tenantName}) selesai & dinyatakan LUNAS!`
            : `Cicilan ${bill.roomNumber} sebesar ${formatRupiah(payAmount)} dicatat. Sisa: ${formatRupiah(result.newRemaining)}.`,
          'success'
        );
      } else if (selectedType === 'advance') {
        const rawVal = advanceInput.value ? advanceInput.value.trim() : '';
        const monthsCount = Math.max(1, Math.min(60, parseInt(rawVal, 10) || 1));
        result = store.recordPayment(bill.id, {
          type: 'advance',
          advanceMonths: monthsCount,
          paidDate,
          paymentMethod,
          notes
        });
        showToast(
          `Pembayaran sewa maju ${monthsCount} bulan untuk ${bill.roomNumber} (${bill.tenantName}) berhasil dicatat LUNAS!`,
          'success'
        );
      } else {
        result = store.recordPayment(bill.id, {
          type: 'full',
          paidDate,
          paymentMethod,
          notes
        });
        showToast(`Sewa ${bill.roomNumber} (${bill.tenantName}) berhasil ditandai LUNAS!`, 'success');
      }

      closeModal('payment-modal');

      // Refresh current view smoothly
      this.switchTab(this.currentTab);

      if (openReceipt && result) {
        this.openReceiptModal(bill.id, result);
      }
    });

    openModal('payment-modal');
  }

  openReceiptModal(billId, paymentResult = null) {
    renderReceiptModal(billId, paymentResult);
  }

  setupGlobalEvents() {
    // Mobile sidebar toggle if needed
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-nav');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
}

// Resilient Bootstrapping: Handles both early and late script execution
function bootstrapJuraganApp() {
  if (!window.juraganApp) {
    window.juraganApp = new JuragankosanApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapJuraganApp);
} else {
  bootstrapJuraganApp();
}
