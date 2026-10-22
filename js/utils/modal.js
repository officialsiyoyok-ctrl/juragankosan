/**
 * Juragankosan Modal & Toast Notification System
 */
import { escapeHtml } from './formatter.js';

export function showToast(message, type = 'info', duration = 3200) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type} animate-slide-in`;

  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
  };

  toast.innerHTML = `
    <div class="toast-content">
      ${icons[type] || icons.info}
      <span class="toast-message">${message}</span>
    </div>
    <button class="toast-close" aria-label="Tutup">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.classList.add('animate-slide-out');
    setTimeout(() => {
      toast.remove();
    }, 250);
  };

  closeBtn.addEventListener('click', dismiss);
  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

export function openModal(modalId, options = {}) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
  if (modalId === 'receipt-modal-container' || modalId === 'receipt-view-modal') {
    document.body.classList.add('has-active-receipt');
  }

  // Reset scroll to top on modal open
  const scrollTargets = modal.querySelectorAll('.modal-body, .modal-dialog, .upgrade-modal-body, .upgrade-pane');
  scrollTargets.forEach((el) => {
    el.scrollTop = 0;
  });
  modal.scrollTop = 0;

  // Matikan auto-focus jika modal adalah upgrade-pro-modal, noAutoFocus diminta, atau di layar mobile (<= 768px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  if (modalId === 'upgrade-pro-modal' || options.noAutoFocus || isMobile) {
    return;
  }

  const firstInput = modal.querySelector('input:not([type="hidden"]):not([data-no-autofocus]), select, textarea');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  if (modalId === 'receipt-modal-container' || modalId === 'receipt-view-modal') {
    document.body.classList.remove('has-active-receipt');
  }
  if (!document.querySelector('.modal-backdrop.active')) {
    document.body.classList.remove('modal-open');
    document.body.classList.remove('has-active-receipt');
  }
}

export function initModalListeners() {
  // Close modal when clicking backdrop
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
      if (e.target.id === 'receipt-modal-container' || e.target.id === 'receipt-view-modal') {
        document.body.classList.remove('has-active-receipt');
      }
      if (!document.querySelector('.modal-backdrop.active')) {
        document.body.classList.remove('modal-open');
        document.body.classList.remove('has-active-receipt');
      }
    }
  });

  // Close modal when pressing ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal-backdrop.active');
      if (activeModals.length > 0) {
        const topModal = activeModals[activeModals.length - 1];
        topModal.classList.remove('active');
        if (topModal.id === 'receipt-modal-container' || topModal.id === 'receipt-view-modal') {
          document.body.classList.remove('has-active-receipt');
        }
        if (!document.querySelector('.modal-backdrop.active')) {
          document.body.classList.remove('modal-open');
          document.body.classList.remove('has-active-receipt');
        }
      }
    }
  });

  // Attach data-close-modal handlers
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const modalId = closeBtn.getAttribute('data-close-modal');
      if (modalId) {
        closeModal(modalId);
      } else {
        const parentModal = closeBtn.closest('.modal-backdrop');
        if (parentModal) {
          parentModal.classList.remove('active');
          if (parentModal.id === 'receipt-modal-container' || parentModal.id === 'receipt-view-modal') {
            document.body.classList.remove('has-active-receipt');
          }
        }
      }
      if (!document.querySelector('.modal-backdrop.active')) {
        document.body.classList.remove('modal-open');
        document.body.classList.remove('has-active-receipt');
      }
    }
  });
}

export function showConfirmModal({
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  danger = false
}) {
  return new Promise((resolve) => {
    let confirmModal = document.getElementById('global-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'global-confirm-modal';
      confirmModal.className = 'modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Konfirmasi</h3>
            <button class="modal-close" data-close-modal="global-confirm-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" class="text-body text-secondary"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="confirm-modal-cancel">Batal</button>
            <button type="button" class="btn btn-primary" id="confirm-modal-ok">Ya</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    titleEl.textContent = title;
    msgEl.innerHTML = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    if (danger) {
      okBtn.className = 'btn btn-danger';
    } else {
      okBtn.className = 'btn btn-primary';
    }

    const cleanup = () => {
      confirmModal.classList.remove('active');
      document.body.classList.remove('modal-open');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };

    const onOk = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);

    confirmModal.classList.add('active');
    document.body.classList.add('modal-open');
  });
}

/**
 * Universal Custom Picker Modal (Ramping, font proporsional, pengganti dialog select bawaan OS)
 */
export function showPickerModal({
  title = 'Pilih Opsi',
  options = [],
  value = '',
  searchable = false,
  onSelect = () => {}
}) {
  let pickerModal = document.getElementById('global-picker-modal');
  if (!pickerModal) {
    pickerModal = document.createElement('div');
    pickerModal.id = 'global-picker-modal';
    pickerModal.className = 'modal-backdrop global-picker-backdrop';
    pickerModal.innerHTML = `
      <div class="modal-dialog modal-sm global-picker-dialog">
        <div class="modal-header global-picker-header">
          <h3 class="modal-title global-picker-title" id="global-picker-title">Pilih Opsi</h3>
          <button type="button" class="modal-close" id="global-picker-close" aria-label="Tutup">&times;</button>
        </div>
        <div class="global-picker-search-container" id="global-picker-search-container" style="display: none;">
          <div class="global-picker-search-box">
            <span class="global-picker-search-icon">🔍</span>
            <input 
              type="text" 
              id="global-picker-search-input" 
              class="global-picker-search-input" 
              placeholder="Cari opsi..." 
              autocomplete="off"
            />
            <button type="button" id="global-picker-search-clear" class="global-picker-search-clear" style="display: none;" aria-label="Hapus pencarian">&times;</button>
          </div>
        </div>
        <div class="global-picker-body" id="global-picker-list"></div>
        <div class="modal-footer global-picker-footer">
          <button type="button" class="btn btn-secondary btn-sm" id="global-picker-cancel">Batal</button>
        </div>
      </div>
    `;
    document.body.appendChild(pickerModal);
  }

  const titleEl = document.getElementById('global-picker-title');
  const searchContainer = document.getElementById('global-picker-search-container');
  const searchInput = document.getElementById('global-picker-search-input');
  const searchClear = document.getElementById('global-picker-search-clear');
  const listEl = document.getElementById('global-picker-list');
  const closeBtn = document.getElementById('global-picker-close');
  const cancelBtn = document.getElementById('global-picker-cancel');

  titleEl.textContent = title;

  const normalizedOpts = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const rawLabel = String(opt.label !== undefined ? opt.label : opt.value);
      const icon = opt.icon || '';
      let displayLabel = rawLabel;
      // Strip leading icon from displayLabel if already present to avoid duplication with opt.icon
      if (icon && displayLabel.startsWith(icon)) {
        displayLabel = displayLabel.slice(icon.length).trim();
      }
      return {
        value: String(opt.value !== undefined ? opt.value : opt.label),
        label: rawLabel,
        displayLabel,
        icon,
        sublabel: opt.sublabel || ''
      };
    }
    return {
      value: String(opt),
      label: String(opt),
      displayLabel: String(opt),
      icon: '',
      sublabel: ''
    };
  });

  const shouldSearch = searchable || normalizedOpts.length > 6;
  searchContainer.style.display = shouldSearch ? 'block' : 'none';
  if (searchInput) searchInput.value = '';
  if (searchClear) searchClear.style.display = 'none';

  const renderItems = (filter = '') => {
    const q = filter.toLowerCase().trim();
    const filtered = q
      ? normalizedOpts.filter((o) => o.label.toLowerCase().includes(q) || o.displayLabel.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || o.sublabel.toLowerCase().includes(q))
      : normalizedOpts;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="global-picker-empty" style="text-align: center; padding: 1.25rem 0.5rem; color: var(--text-muted);">
          <div style="font-size: 1.25rem; margin-bottom: 4px;">🔍</div>
          <div style="font-size: 0.785rem;">Tidak ada opsi yang cocok dengan "${escapeHtml(filter)}"</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered
      .map((opt) => {
        const isSelected = String(opt.value) === String(value);
        return `
          <div class="global-picker-item ${isSelected ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}" role="button" tabindex="0">
            <div class="global-picker-item-left">
              ${opt.icon ? `<span class="global-picker-item-icon">${opt.icon}</span>` : ''}
              <div class="global-picker-item-text">
                <span class="global-picker-item-label">${escapeHtml(opt.displayLabel)}</span>
                ${opt.sublabel ? `<span class="global-picker-item-sub">${escapeHtml(opt.sublabel)}</span>` : ''}
              </div>
            </div>
            <div class="global-picker-radio ${isSelected ? 'checked' : ''}">
              ${isSelected ? '✓' : ''}
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.global-picker-item').forEach((item) => {
      item.addEventListener('click', () => {
        const selectedVal = item.getAttribute('data-value');
        cleanup();
        onSelect(selectedVal);
      });
    });
  };

  const cleanup = () => {
    pickerModal.classList.remove('active');
    if (!document.querySelector('.modal-backdrop.active')) {
      document.body.classList.remove('modal-open');
    }
    closeBtn.removeEventListener('click', onDismiss);
    cancelBtn.removeEventListener('click', onDismiss);
  };

  const onDismiss = () => {
    cleanup();
  };

  closeBtn.addEventListener('click', onDismiss);
  cancelBtn.addEventListener('click', onDismiss);

  if (searchInput) {
    searchInput.oninput = (e) => {
      const q = e.target.value;
      if (searchClear) searchClear.style.display = q ? 'block' : 'none';
      renderItems(q);
    };
  }

  if (searchClear) {
    searchClear.onclick = () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      renderItems('');
      searchInput.focus();
    };
  }

  renderItems('');
  pickerModal.classList.add('active');
  document.body.classList.add('modal-open');
}

/**
 * Mengikat Custom Select Trigger dengan Hidden Input & Global Picker
 */
export function bindCustomPicker(triggerEl, hiddenInputEl, { title = 'Pilih Opsi', options = [], getOptions = null, searchable = false, onChange = null }) {
  if (!triggerEl || !hiddenInputEl) return;

  const getActiveOptions = () => {
    return typeof getOptions === 'function' ? getOptions() : options;
  };

  const updateLabel = (val) => {
    const opts = getActiveOptions();
    const normalized = opts.map((o) => (typeof o === 'object' && o !== null ? o : { value: String(o), label: String(o) }));
    const found = normalized.find((o) => String(o.value) === String(val));
    const labelEl = triggerEl.querySelector('.custom-select-label');
    if (labelEl) {
      if (found) {
        const icon = found.icon || '';
        const rawLabel = found.label || '';
        if (icon && !rawLabel.startsWith(icon)) {
          labelEl.textContent = `${icon} ${rawLabel}`;
        } else {
          labelEl.textContent = rawLabel;
        }
      } else {
        labelEl.textContent = val || '-- Pilih --';
      }
    }
    triggerEl.setAttribute('data-value', val || '');
  };

  // Intercept .value setter on hiddenInputEl agar sinkron real-time
  const inputProto = HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(inputProto, 'value');
  try {
    Object.defineProperty(hiddenInputEl, 'value', {
      get() {
        return descriptor.get.call(this);
      },
      set(val) {
        descriptor.set.call(this, val);
        updateLabel(val);
      },
      configurable: true
    });
  } catch (e) {
    // Fallback if property define is constrained
  }

  // Set initial label
  updateLabel(hiddenInputEl.value);

  const openPicker = () => {
    showPickerModal({
      title,
      options: getActiveOptions(),
      value: hiddenInputEl.value,
      searchable,
      onSelect: (selectedVal) => {
        hiddenInputEl.value = selectedVal;
        updateLabel(selectedVal);
        hiddenInputEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof onChange === 'function') {
          onChange(selectedVal);
        }
      }
    });
  };

  triggerEl.addEventListener('click', openPicker);
  triggerEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  });
}

