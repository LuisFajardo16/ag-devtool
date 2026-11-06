import { getIcon } from './icons.js';

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Sistema de notificaciones Toast reutilizable
 */
export const Toast = {
  show({ message = '', type = 'info', duration = 3200 } = {}) {
    const container = ensureContainer();

    const styleMap = {
      success: 'bg-slate-900/95 border-emerald-500/50 text-emerald-300',
      error: 'bg-slate-900/95 border-rose-500/50 text-rose-300',
      warning: 'bg-slate-900/95 border-amber-500/50 text-amber-300',
      info: 'bg-slate-900/95 border-indigo-500/50 text-indigo-300'
    };

    const iconMap = {
      success: 'check',
      error: 'warning',
      warning: 'warning',
      info: 'info'
    };

    const item = document.createElement('div');
    item.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl shadow-black/60 backdrop-blur-md text-xs font-medium animate-scale-in ${
      styleMap[type] || styleMap.info
    }`;

    item.innerHTML = `
      <span class="shrink-0">${getIcon(iconMap[type] || 'info')}</span>
      <span class="flex-1 text-slate-100">${message}</span>
    `;

    container.appendChild(item);

    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(6px)';
      item.style.transition = 'all 180ms ease';
      setTimeout(() => item.remove(), 180);
    }, duration);
  },

  success(msg) {
    this.show({ message: msg, type: 'success' });
  },
  error(msg) {
    this.show({ message: msg, type: 'error' });
  },
  warning(msg) {
    this.show({ message: msg, type: 'warning' });
  },
  info(msg) {
    this.show({ message: msg, type: 'info' });
  }
};
