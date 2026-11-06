/**
 * Crea un contenedor tipo tarjeta reutilizable
 * @param {Object} options
 * @param {string|HTMLElement} [options.header]
 * @param {string|HTMLElement|HTMLElement[]} [options.body]
 * @param {string|HTMLElement} [options.footer]
 * @param {string} [options.className='']
 * @param {boolean} [options.hoverable=false]
 * @returns {HTMLDivElement}
 */
export function createCard({
  header = null,
  body = null,
  footer = null,
  className = '',
  hoverable = false
} = {}) {
  const card = document.createElement('div');
  const hoverClass = hoverable
    ? 'hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-150'
    : '';
  card.className = `bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden flex flex-col ${hoverClass} ${className}`.trim();

  if (header) {
    const headerEl = document.createElement('div');
    headerEl.className = 'px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-2';
    if (typeof header === 'string') {
      headerEl.innerHTML = `<h3 class="text-sm font-semibold text-slate-100">${header}</h3>`;
    } else {
      headerEl.appendChild(header);
    }
    card.appendChild(headerEl);
  }

  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'p-4 flex-1 text-sm text-slate-300';
    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else if (Array.isArray(body)) {
      body.forEach((child) => child && bodyEl.appendChild(child));
    } else {
      bodyEl.appendChild(body);
    }
    card.appendChild(bodyEl);
  }

  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'px-4 py-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-end gap-2';
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
    card.appendChild(footerEl);
  }

  return card;
}
