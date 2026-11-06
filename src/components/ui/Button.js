import { getIcon } from './icons.js';

const VARIANT_CLASSES = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-sm shadow-indigo-950/50',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
  outline: 'bg-transparent hover:bg-slate-800/70 text-slate-200 border border-slate-600 hover:border-slate-500',
  ghost: 'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent',
  danger: 'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/40 shadow-sm',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 shadow-sm',
  warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold border border-amber-400/40'
};

const SIZE_CLASSES = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  icon: 'p-2 rounded-lg'
};

/**
 * Crea un elemento Button reutilizable
 * @param {Object} options
 * @param {string} [options.label] - Texto del botón
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'success'|'warning'} [options.variant='primary']
 * @param {'xs'|'sm'|'md'|'lg'|'icon'} [options.size='md']
 * @param {string} [options.icon] - Nombre del icono en Icons o SVG directo
 * @param {string} [options.iconRight] - Icono a la derecha
 * @param {string} [options.title] - Tooltip nativo
 * @param {boolean} [options.disabled=false]
 * @param {boolean} [options.fullWidth=false]
 * @param {string} [options.className='']
 * @param {'button'|'submit'|'reset'} [options.type='button']
 * @param {(e: MouseEvent) => void} [options.onClick]
 * @returns {HTMLButtonElement}
 */
export function createButton({
  label = '',
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  title = '',
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick = null
} = {}) {
  const btn = document.createElement('button');
  btn.type = type;
  if (title) btn.title = title;
  btn.disabled = disabled;

  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const widthClass = fullWidth ? 'w-full' : '';

  btn.className = `${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const parts = [];
  if (icon) {
    const svg = icon.startsWith('<svg') ? icon : getIcon(icon);
    parts.push(`<span class="inline-flex shrink-0">${svg}</span>`);
  }
  if (label) {
    parts.push(`<span class="truncate">${label}</span>`);
  }
  if (iconRight) {
    const svgRight = iconRight.startsWith('<svg') ? iconRight : getIcon(iconRight);
    parts.push(`<span class="inline-flex shrink-0">${svgRight}</span>`);
  }

  btn.innerHTML = parts.join('');

  if (typeof onClick === 'function') {
    btn.addEventListener('click', onClick);
  }

  return btn;
}
