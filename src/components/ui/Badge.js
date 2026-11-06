const BADGE_VARIANTS = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
};

/**
 * Crea un componente Badge reutilizable
 * @param {Object} options
 * @param {string} options.text
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} [options.variant='default']
 * @param {string} [options.className='']
 * @returns {HTMLSpanElement}
 */
export function createBadge({ text, variant = 'default', className = '' } = {}) {
  const span = document.createElement('span');
  const vClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  span.className = `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${vClass} ${className}`.trim();
  span.textContent = text;
  return span;
}
