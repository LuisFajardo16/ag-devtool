import { createButton } from './Button.js';
import { getIcon } from './icons.js';

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl'
};

/**
 * Componente Modal / Popup reutilizable
 */
export const Modal = {
  /**
   * Abre un popup modal personalizado
   * @param {Object} options
   * @param {string} options.title
   * @param {string} [options.subtitle]
   * @param {string|HTMLElement} options.content
   * @param {HTMLElement|HTMLElement[]} [options.footer]
   * @param {'sm'|'md'|'lg'|'xl'|'full'} [options.size='md']
   * @param {boolean} [options.closeOnBackdrop=true]
   * @param {() => void} [options.onClose]
   * @returns {{ close: () => void, element: HTMLElement }}
   */
  open({
    title = 'Ventana emergente',
    subtitle = '',
    content = '',
    footer = null,
    size = 'md',
    closeOnBackdrop = true,
    onClose = null
  } = {}) {
    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in';

    const dialog = document.createElement('div');
    const sizeClass = MODAL_SIZES[size] || MODAL_SIZES.md;
    dialog.className = `w-full ${sizeClass} bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 flex flex-col max-h-[88vh] overflow-hidden animate-scale-in`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90';

    const titleWrap = document.createElement('div');
    titleWrap.innerHTML = `
      <h2 class="text-base font-semibold text-white">${title}</h2>
      ${subtitle ? `<p class="text-xs text-slate-400 mt-0.5">${subtitle}</p>` : ''}
    `;

    const closeBtn = createButton({
      variant: 'ghost',
      size: 'icon',
      icon: 'close',
      title: 'Cerrar (Esc)',
      className: 'text-slate-400 hover:text-white -mr-1 -mt-1',
      onClick: () => closeModal()
    });

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'p-5 overflow-y-auto flex-1 text-sm text-slate-300 custom-scrollbar';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    dialog.appendChild(header);
    dialog.appendChild(body);

    // Footer
    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5';
      if (Array.isArray(footer)) {
        footer.forEach((el) => el && footerEl.appendChild(el));
      } else if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      }
      dialog.appendChild(footerEl);
    }

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    if (closeOnBackdrop) {
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      });
    }

    let closed = false;
    function closeModal() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      if (typeof onClose === 'function') {
        onClose();
      }
    }

    return {
      close: closeModal,
      element: overlay,
      body
    };
  },

  /**
   * Abre un popup de confirmación reutilizable
   */
  confirm({
    title = 'Confirmar acción',
    message = '¿Estás seguro de que deseas continuar?',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm = null
  } = {}) {
    let modalInstance = null;

    const cancelBtn = createButton({
      label: cancelLabel,
      variant: 'secondary',
      size: 'sm',
      onClick: () => modalInstance?.close()
    });

    const confirmBtn = createButton({
      label: confirmLabel,
      variant,
      size: 'sm',
      onClick: () => {
        if (typeof onConfirm === 'function') {
          onConfirm();
        }
        modalInstance?.close();
      }
    });

    const contentEl = document.createElement('div');
    contentEl.className = 'flex items-start gap-3.5';
    contentEl.innerHTML = `
      <div class="p-2.5 rounded-xl ${
        variant === 'danger'
          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
      } shrink-0">
        ${getIcon(variant === 'danger' ? 'warning' : 'info')}
      </div>
      <div class="text-sm text-slate-300 leading-relaxed pt-0.5">${message}</div>
    `;

    modalInstance = Modal.open({
      title,
      size: 'sm',
      content: contentEl,
      footer: [cancelBtn, confirmBtn]
    });

    return modalInstance;
  }
};
