/**
 * Juragankosan Modal & Toast Notification System
 */

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
  if (!document.querySelector('.modal-backdrop.active')) {
    document.body.classList.remove('modal-open');
  }
}

export function initModalListeners() {
  // Close modal when clicking backdrop
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
      if (!document.querySelector('.modal-backdrop.active')) {
        document.body.classList.remove('modal-open');
      }
    }
  });

  // Close modal when pressing ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        document.body.classList.remove('modal-open');
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
        if (parentModal) parentModal.classList.remove('active');
      }
      if (!document.querySelector('.modal-backdrop.active')) {
        document.body.classList.remove('modal-open');
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
