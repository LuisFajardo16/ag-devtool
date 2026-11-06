import { getIcon } from './icons.js';

let activeDropdownCleanup = null;

/**
 * Crea un componente Dropdown reutilizable (menú desplegable o selector)
 * @param {Object} options
 * @param {string} [options.label='Opciones']
 * @param {string} [options.icon]
 * @param {'primary'|'secondary'|'outline'|'ghost'} [options.variant='secondary']
 * @param {'xs'|'sm'|'md'} [options.size='sm']
 * @param {'left'|'right'} [options.align='left']
 * @param {Array<{id?: string, label?: string, icon?: string, badge?: string, active?: boolean, danger?: boolean, divider?: boolean, onClick?: Function}>} options.items
 * @param {string} [options.className='']
 * @returns {HTMLDivElement}
 */
export function createDropdown({
  label = '',
  icon = null,
  variant = 'secondary',
  size = 'sm',
  align = 'left',
  items = [],
  title = '',
  className = ''
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `relative inline-block text-left ${className}`.trim();

  const variantMap = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
    outline: 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border-transparent'
  };

  const sizeMap = {
    xs: 'px-2 py-1 text-xs rounded-md gap-1',
    sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-3.5 py-2 text-sm rounded-lg gap-2'
  };

  const trigger = document.createElement('button');
  trigger.type = 'button';
  if (title) trigger.title = title;
  trigger.className = `inline-flex items-center justify-between font-medium border transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
    variantMap[variant] || variantMap.secondary
  } ${sizeMap[size] || sizeMap.sm}`;

  trigger.innerHTML = `
    ${icon ? `<span class="inline-flex shrink-0 text-slate-400">${getIcon(icon)}</span>` : ''}
    ${label ? `<span class="truncate max-w-[160px]">${label}</span>` : ''}
    <span class="inline-flex shrink-0 opacity-70 transition-transform duration-150" data-chevron>${getIcon('chevronDown')}</span>
  `;

  const menu = document.createElement('div');
  const alignClass = align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';
  menu.className = `hidden absolute ${alignClass} mt-1.5 w-56 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black/80 py-1.5 z-50 focus:outline-none animate-scale-in`;

  function renderItems(currentItems) {
    menu.innerHTML = '';
    currentItems.forEach((item) => {
      if (item.divider) {
        const div = document.createElement('div');
        div.className = 'my-1 border-t border-slate-800';
        menu.appendChild(div);
        return;
      }

      if (item.header) {
        const hdr = document.createElement('div');
        hdr.className = 'px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500';
        hdr.textContent = item.header;
        menu.appendChild(hdr);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      const activeClass = item.active
        ? 'bg-indigo-600/20 text-indigo-300 font-medium'
        : item.danger
        ? 'text-rose-400 hover:bg-rose-500/15 hover:text-rose-300'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white';

      btn.className = `w-full px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${activeClass}`;

      btn.innerHTML = `
        <span class="flex items-center gap-2 truncate">
          ${item.icon ? `<span class="shrink-0 opacity-80">${getIcon(item.icon)}</span>` : ''}
          <span class="truncate">${item.label || ''}</span>
        </span>
        <span class="flex items-center gap-1 shrink-0">
          ${
            item.badge
              ? `<span class="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 border border-slate-700">${item.badge}</span>`
              : ''
          }
          ${item.active ? `<span class="text-indigo-400">${getIcon('check')}</span>` : ''}
        </span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
        if (typeof item.onClick === 'function') {
          item.onClick(item);
        }
      });

      menu.appendChild(btn);
    });
  }

  renderItems(items);

  let isOpen = false;

  function openMenu() {
    if (activeDropdownCleanup && activeDropdownCleanup !== closeMenu) {
      activeDropdownCleanup();
    }
    isOpen = true;
    menu.classList.remove('hidden');
    const chevron = trigger.querySelector('[data-chevron]');
    if (chevron) chevron.classList.add('rotate-180');
    activeDropdownCleanup = closeMenu;
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.add('hidden');
    const chevron = trigger.querySelector('[data-chevron]');
    if (chevron) chevron.classList.remove('rotate-180');
    document.removeEventListener('click', handleOutsideClick);
    if (activeDropdownCleanup === closeMenu) {
      activeDropdownCleanup = null;
    }
  }

  function handleOutsideClick(e) {
    if (!wrapper.contains(e.target)) {
      closeMenu();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  wrapper.updateItems = renderItems;
  return wrapper;
}
