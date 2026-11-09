import { Toast } from './Toast.js';
import { getIcon } from './icons.js';

export const BLOCK_TYPES = [
  {
    id: 'p',
    label: 'Texto',
    description: 'Escribe texto plano o párrafos normales.',
    category: 'Básicos',
    icon: 'type',
    badge: 'Texto',
    keywords: ['text', 'texto', 'p', 'parrafo']
  },
  {
    id: 'h1',
    label: 'Encabezado 1',
    description: 'Título de sección grande.',
    category: 'Básicos',
    icon: 'heading',
    badge: 'H1',
    keywords: ['h1', 'heading1', 'titulo 1', 'encabezado 1']
  },
  {
    id: 'h2',
    label: 'Encabezado 2',
    description: 'Subtítulo de sección mediana.',
    category: 'Básicos',
    icon: 'heading',
    badge: 'H2',
    keywords: ['h2', 'heading2', 'titulo 2', 'encabezado 2']
  },
  {
    id: 'h3',
    label: 'Encabezado 3',
    description: 'Encabezado pequeño.',
    category: 'Básicos',
    icon: 'heading',
    badge: 'H3',
    keywords: ['h3', 'heading3', 'titulo 3', 'encabezado 3']
  },
  {
    id: 'bullet',
    label: 'Lista con viñeta',
    description: 'Elemento de lista simple.',
    category: 'Básicos',
    icon: 'list',
    badge: '•',
    keywords: ['list', 'lista', 'bullet', 'ul']
  },
  {
    id: 'quote',
    label: 'Cita',
    description: 'Destaca una frase o nota importante.',
    category: 'Básicos',
    icon: 'quote',
    badge: '“ ”',
    keywords: ['quote', 'cita', 'callout']
  },
  {
    id: 'code-line',
    label: 'Código (Una línea)',
    description: 'Expresión o comando en una sola línea.',
    category: 'Código',
    icon: 'code',
    badge: '1L',
    keywords: ['code', 'codigo', 'inline', 'linea', 'comando']
  },
  {
    id: 'code-block',
    label: 'Código (Bloque)',
    description: 'Fragmento de código multilínea con lenguaje.',
    category: 'Código',
    icon: 'terminal',
    badge: '{ }',
    keywords: ['code', 'codigo', 'block', 'bloque', 'snippet']
  },
  {
    id: 'link-url',
    label: 'Link (URL)',
    description: 'Enlace web directo y minimalista.',
    category: 'Links & Media',
    icon: 'link',
    badge: 'URL',
    keywords: ['link', 'url', 'enlace', 'href']
  },
  {
    id: 'link-bookmark',
    label: 'Link (Bookmark)',
    description: 'Tarjeta visual de marcador con título y descripción.',
    category: 'Links & Media',
    icon: 'bookmark',
    badge: 'Card',
    keywords: ['bookmark', 'marcador', 'link', 'card', 'tarjeta']
  },
  {
    id: 'image',
    label: 'Imagen',
    description: 'Inserta imagen desde URL o archivo local.',
    category: 'Links & Media',
    icon: 'image',
    badge: 'IMG',
    keywords: ['image', 'imagen', 'img', 'foto', 'media']
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Línea divisoria horizontal entre bloques.',
    category: 'Estructura',
    icon: 'divider',
    badge: '—',
    keywords: ['divider', 'separador', 'hr', 'linea']
  }
];

export const TEXT_COLORS = [
  { id: 'default', label: 'Por defecto', textClass: 'text-slate-100', dotClass: 'bg-slate-200' },
  { id: 'indigo', label: 'Índigo', textClass: 'text-indigo-400', dotClass: 'bg-indigo-400' },
  { id: 'emerald', label: 'Esmeralda', textClass: 'text-emerald-400', dotClass: 'bg-emerald-400' },
  { id: 'amber', label: 'Ámbar', textClass: 'text-amber-400', dotClass: 'bg-amber-400' },
  { id: 'rose', label: 'Rosa', textClass: 'text-rose-400', dotClass: 'bg-rose-400' },
  { id: 'sky', label: 'Cielo', textClass: 'text-sky-400', dotClass: 'bg-sky-400' },
  { id: 'violet', label: 'Violeta', textClass: 'text-violet-400', dotClass: 'bg-violet-400' },
  { id: 'muted', label: 'Gris', textClass: 'text-slate-400', dotClass: 'bg-slate-500' }
];

const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'python',
  'sql',
  'bash',
  'yaml',
  'powerfx'
];

function uid(prefix = 'blk') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getColorMeta(colorId) {
  return TEXT_COLORS.find((c) => c.id === colorId) || TEXT_COLORS[0];
}

function getBlockTypeMeta(typeId) {
  return BLOCK_TYPES.find((t) => t.id === typeId) || BLOCK_TYPES[0];
}

function createDefaultCell(type = 'p', overrides = {}) {
  return {
    id: overrides.id || uid('cell'),
    type: BLOCK_TYPES.some((t) => t.id === type) ? type : 'p',
    color: overrides.color || 'default',
    content: overrides.content ?? '',
    meta: {
      language: overrides.meta?.language || 'javascript',
      url: overrides.meta?.url || '',
      label: overrides.meta?.label || '',
      title: overrides.meta?.title || '',
      description: overrides.meta?.description || '',
      caption: overrides.meta?.caption || '',
      editing: overrides.meta?.editing ?? false
    }
  };
}

export function normalizeBlock(raw = {}) {
  const columns = [1, 2, 3].includes(Number(raw.columns)) ? Number(raw.columns) : 1;
  let cells = Array.isArray(raw.cells)
    ? raw.cells.map((c) => createDefaultCell(c.type, c))
    : [
        createDefaultCell(raw.type || 'p', {
          color: raw.color || 'default',
          content: raw.content ?? '',
          meta: raw.meta || {}
        })
      ];

  while (cells.length < columns) {
    cells.push(createDefaultCell('p'));
  }
  if (cells.length > 3) {
    cells = cells.slice(0, 3);
  }

  return {
    id: raw.id || uid('block'),
    columns,
    cells
  };
}

/**
 * Componente de Sistema Reutilizable: Editor de Notas basado en Bloques estilo Notion
 * - Interfaz minimalista: si el usuario simplemente escribe, el bloque funciona como texto limpio.
 * - Al escribir `/` aparece una lista flotante filtrable para elegir el tipo de bloque.
 * - Ajustes por bloque (tipo, color de texto, 1 a 3 columnas, orden, eliminar) mediante un botón
 *   minimalista (`⋮⋮`) que aparece al pasar el cursor, tal como en Notion.
 */
export function createBlockEditor({
  initialBlocks = [],
  onChange = null,
  readOnly = false,
  className = ''
} = {}) {
  let blocks =
    Array.isArray(initialBlocks) && initialBlocks.length > 0
      ? initialBlocks.map(normalizeBlock)
      : [normalizeBlock({ type: 'p', columns: 1, content: '' })];

  // Estado de menús flotantes (Slash Menu `/` y Popover de Ajustes `⋮⋮`)
  let activePopoverCleanup = null;
  let pendingFocus = null; // { blockId, colIndex, cursorAtEnd, openSlash }

  const root = document.createElement('div');
  root.className = `relative w-full flex flex-col gap-1 ${className}`.trim();

  const blocksContainer = document.createElement('div');
  blocksContainer.className = 'flex flex-col gap-1';

  function closeActivePopovers() {
    if (typeof activePopoverCleanup === 'function') {
      const fn = activePopoverCleanup;
      activePopoverCleanup = null;
      fn();
    }
  }

  function emitChange() {
    if (typeof onChange === 'function') {
      onChange(getCleanBlocks());
    }
  }

  function getCleanBlocks() {
    return blocks.map((b) => ({
      id: b.id,
      columns: b.columns,
      type: b.cells[0]?.type || 'p',
      color: b.cells[0]?.color || 'default',
      content: b.cells[0]?.content || '',
      meta: {
        language: b.cells[0]?.meta?.language || 'javascript',
        url: b.cells[0]?.meta?.url || '',
        label: b.cells[0]?.meta?.label || '',
        title: b.cells[0]?.meta?.title || '',
        description: b.cells[0]?.meta?.description || '',
        caption: b.cells[0]?.meta?.caption || ''
      },
      cells: b.cells.slice(0, b.columns).map((c) => ({
        id: c.id,
        type: c.type,
        color: c.color,
        content: c.content,
        meta: {
          language: c.meta?.language || 'javascript',
          url: c.meta?.url || '',
          label: c.meta?.label || '',
          title: c.meta?.title || '',
          description: c.meta?.description || '',
          caption: c.meta?.caption || ''
        }
      }))
    }));
  }

  function addBlockAt(index, type = 'p', columns = 1, { openSlash = false } = {}) {
    const newBlock = normalizeBlock({
      type,
      columns,
      cells: Array.from({ length: columns }, () =>
        createDefaultCell(type, {
          content: openSlash ? '/' : '',
          meta: {
            editing: type === 'link-url' || type === 'link-bookmark' || type === 'image'
          }
        })
      )
    });
    blocks.splice(index, 0, newBlock);
    pendingFocus = { blockId: newBlock.id, colIndex: 0, cursorAtEnd: true, openSlash };
    render();
    emitChange();
  }

  function removeBlockAt(index) {
    closeActivePopovers();
    if (blocks.length <= 1) {
      blocks[0] = normalizeBlock({ type: 'p', columns: 1, content: '' });
      pendingFocus = { blockId: blocks[0].id, colIndex: 0, cursorAtEnd: true };
    } else {
      const prevIdx = Math.max(0, index - 1);
      blocks.splice(index, 1);
      pendingFocus = { blockId: blocks[prevIdx].id, colIndex: 0, cursorAtEnd: true };
    }
    render();
    emitChange();
  }

  function moveBlock(index, direction) {
    closeActivePopovers();
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[target];
    blocks[target] = temp;
    render();
    emitChange();
  }

  function duplicateBlockAt(index) {
    closeActivePopovers();
    const src = blocks[index];
    const copy = normalizeBlock({
      columns: src.columns,
      cells: src.cells.map((c) => ({
        type: c.type,
        color: c.color,
        content: c.content,
        meta: { ...c.meta }
      }))
    });
    blocks.splice(index + 1, 0, copy);
    pendingFocus = { blockId: copy.id, colIndex: 0, cursorAtEnd: true };
    render();
    emitChange();
  }

  function setBlockColumns(block, colCount) {
    closeActivePopovers();
    const validCols = [1, 2, 3].includes(colCount) ? colCount : 1;
    block.columns = validCols;
    while (block.cells.length < validCols) {
      block.cells.push(createDefaultCell('p'));
    }
    render();
    emitChange();
  }

  function transformCell(cell, block, colIndex, newType) {
    closeActivePopovers();
    cell.type = newType;
    if (newType === 'link-url' || newType === 'link-bookmark' || newType === 'image') {
      cell.meta.editing = true;
    }
    pendingFocus = { blockId: block.id, colIndex, cursorAtEnd: true };
    render();
    emitChange();
  }

  function autoResizeTextarea(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 26)}px`;
  }

  // =========================================================================
  // MENÚ FLOTANTE SLASH `/` (ESTILO NOTION)
  // =========================================================================
  function openSlashMenu({ anchorEl, cell, block, colIndex, query = '', onSelectType }) {
    closeActivePopovers();

    const cleanQuery = query.trim().toLowerCase();
    const columnCommands = [
      {
        id: 'col-1',
        label: '1 Columna (Por defecto)',
        description: 'Bloque de ancho completo (1 columna).',
        category: 'Columnas',
        icon: 'columns',
        badge: '1 Col',
        keywords: ['1', 'columna', 'column', 'col1'],
        action: () => setBlockColumns(block, 1)
      },
      {
        id: 'col-2',
        label: '2 Columnas',
        description: 'Divide este bloque en 2 columnas paralelas.',
        category: 'Columnas',
        icon: 'columns',
        badge: '2 Cols',
        keywords: ['2', 'columnas', 'columns', 'col2'],
        action: () => setBlockColumns(block, 2)
      },
      {
        id: 'col-3',
        label: '3 Columnas',
        description: 'Divide este bloque en 3 columnas paralelas.',
        category: 'Columnas',
        icon: 'columns',
        badge: '3 Cols',
        keywords: ['3', 'columnas', 'columns', 'col3'],
        action: () => setBlockColumns(block, 3)
      }
    ];

    const allOptions = [
      ...BLOCK_TYPES.map((t) => ({
        ...t,
        action: () => onSelectType(t.id)
      })),
      ...columnCommands
    ];

    const filtered = !cleanQuery
      ? allOptions
      : allOptions.filter(
          (item) =>
            item.label.toLowerCase().includes(cleanQuery) ||
            item.description.toLowerCase().includes(cleanQuery) ||
            item.keywords.some((k) => k.includes(cleanQuery))
        );

    if (filtered.length === 0) {
      return null;
    }

    let selectedIdx = 0;

    const menu = document.createElement('div');
    menu.className =
      'absolute left-0 top-full mt-1 w-72 max-h-80 overflow-y-auto custom-scrollbar rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl shadow-black/80 py-1.5 z-50 animate-scale-in';

    const header = document.createElement('div');
    header.className =
      'px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 mb-1';
    header.innerHTML = `<span>Bloques (${
      cleanQuery ? `/${escapeHtml(cleanQuery)}` : 'Escribe para filtrar'
    })</span> <span class="text-slate-500">↑↓ Enter</span>`;
    menu.appendChild(header);

    const itemButtons = [];

    function updateHighlight() {
      itemButtons.forEach((btn, idx) => {
        if (idx === selectedIdx) {
          btn.className =
            'w-full px-3 py-1.5 text-left flex items-center justify-between gap-2.5 bg-indigo-600/25 text-white transition-colors cursor-pointer';
          btn.scrollIntoView({ block: 'nearest' });
        } else {
          btn.className =
            'w-full px-3 py-1.5 text-left flex items-center justify-between gap-2.5 text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer';
        }
      });
    }

    filtered.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-indigo-400 shrink-0">
            ${getIcon(item.icon)}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium leading-tight truncate">${escapeHtml(item.label)}</div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHtml(item.description)}</div>
          </div>
        </div>
        <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700/80 shrink-0">${
          item.badge
        }</span>
      `;
      btn.addEventListener('mouseenter', () => {
        selectedIdx = idx;
        updateHighlight();
      });
      btn.addEventListener('mousedown', (e) => {
        // Evitar perder foco antes de ejecutar la selección
        e.preventDefault();
        item.action();
      });
      itemButtons.push(btn);
      menu.appendChild(btn);
    });

    updateHighlight();
    anchorEl.appendChild(menu);

    const handleOutside = (e) => {
      if (!anchorEl.contains(e.target)) {
        closeActivePopovers();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleOutside), 0);

    activePopoverCleanup = () => {
      document.removeEventListener('mousedown', handleOutside);
      menu.remove();
    };

    return {
      moveSelection(delta) {
        selectedIdx = (selectedIdx + delta + filtered.length) % filtered.length;
        updateHighlight();
      },
      triggerSelected() {
        const chosen = filtered[selectedIdx];
        if (chosen) {
          chosen.action();
          return true;
        }
        return false;
      }
    };
  }

  // =========================================================================
  // POPOVER MINIMALISTA DE AJUSTES DE BLOQUE (`⋮⋮` ESTILO NOTION)
  // =========================================================================
  function openBlockSettingsPopover({ triggerBtn, cell, block, blockIndex, colIndex }) {
    closeActivePopovers();

    const popover = document.createElement('div');
    popover.className =
      'absolute left-0 top-7 w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl shadow-black/90 p-2 z-50 space-y-2 animate-scale-in text-slate-200';

    // 1. Selector de Columnas (1 a 3 columnas)
    const colsSection = document.createElement('div');
    colsSection.className = 'space-y-1 pb-2 border-b border-slate-800/90';
    colsSection.innerHTML = `<div class="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Columnas del bloque</div>`;

    const colsGrid = document.createElement('div');
    colsGrid.className = 'grid grid-cols-3 gap-1';
    [1, 2, 3].forEach((colNum) => {
      const active = block.columns === colNum;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
        active
          ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-300'
          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
      }`;
      b.innerHTML = `${getIcon('columns')} <span>${colNum}</span>`;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        setBlockColumns(block, colNum);
      });
      colsGrid.appendChild(b);
    });
    colsSection.appendChild(colsGrid);
    popover.appendChild(colsSection);

    // 2. Color de Texto (Paleta compacta de puntos de color)
    const colorSection = document.createElement('div');
    colorSection.className = 'space-y-1.5 pb-2 border-b border-slate-800/90';
    colorSection.innerHTML = `<div class="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Color de texto</div>`;

    const colorGrid = document.createElement('div');
    colorGrid.className = 'grid grid-cols-4 gap-1';
    TEXT_COLORS.forEach((c) => {
      const isSelected = cell.color === c.id;
      const cBtn = document.createElement('button');
      cBtn.type = 'button';
      cBtn.title = c.label;
      cBtn.className = `px-1.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 border transition-colors cursor-pointer ${
        isSelected
          ? 'bg-slate-800 border-indigo-500/60 text-white'
          : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`;
      cBtn.innerHTML = `<span class="w-2.5 h-2.5 rounded-full ${c.dotClass} shrink-0"></span><span class="truncate">${c.label}</span>`;
      cBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cell.color = c.id;
        closeActivePopovers();
        render();
        emitChange();
      });
      colorGrid.appendChild(cBtn);
    });
    colorSection.appendChild(colorGrid);
    popover.appendChild(colorSection);

    // 3. Transformar tipo de bloque
    const typeSection = document.createElement('div');
    typeSection.className = 'space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar pb-2 border-b border-slate-800/90';
    typeSection.innerHTML = `<div class="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Transformar bloque</div>`;

    BLOCK_TYPES.forEach((t) => {
      const active = cell.type === t.id;
      const tBtn = document.createElement('button');
      tBtn.type = 'button';
      tBtn.className = `w-full px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
        active
          ? 'bg-indigo-600/20 text-indigo-300 font-medium'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`;
      tBtn.innerHTML = `
        <span class="flex items-center gap-2 truncate">
          <span class="text-slate-400">${getIcon(t.icon)}</span>
          <span class="truncate">${escapeHtml(t.label)}</span>
        </span>
        <span class="text-[10px] font-mono text-slate-500">${t.badge}</span>
      `;
      tBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        transformCell(cell, block, colIndex, t.id);
      });
      typeSection.appendChild(tBtn);
    });
    popover.appendChild(typeSection);

    // 4. Acciones de orden y eliminación
    const actionsRow = document.createElement('div');
    actionsRow.className = 'flex items-center justify-between gap-1 pt-0.5';

    const makeActionBtn = (icon, title, onClick, danger = false, disabled = false) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.disabled = disabled;
      b.title = title;
      b.className = `flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
        danger
          ? 'text-rose-400 hover:bg-rose-500/15'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`;
      b.innerHTML = getIcon(icon);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      return b;
    };

    actionsRow.append(
      makeActionBtn('arrowUp', 'Subir bloque', () => moveBlock(blockIndex, -1), false, blockIndex === 0),
      makeActionBtn(
        'arrowDown',
        'Bajar bloque',
        () => moveBlock(blockIndex, 1),
        false,
        blockIndex === blocks.length - 1
      ),
      makeActionBtn('copy', 'Duplicar bloque', () => duplicateBlockAt(blockIndex)),
      makeActionBtn('trash', 'Eliminar bloque', () => removeBlockAt(blockIndex), true)
    );

    popover.appendChild(actionsRow);

    triggerBtn.parentElement.appendChild(popover);

    const handleOutside = (e) => {
      if (!popover.contains(e.target) && !triggerBtn.contains(e.target)) {
        closeActivePopovers();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleOutside), 0);

    activePopoverCleanup = () => {
      document.removeEventListener('mousedown', handleOutside);
      popover.remove();
    };
  }

  // =========================================================================
  // RENDERIZADO DEL CONTENIDO DE CADA CELDA / BLOQUE
  // =========================================================================
  function renderCellContent(cell, block, blockIndex, colIndex) {
    const colorMeta = getColorMeta(cell.color);
    const body = document.createElement('div');
    body.className = 'relative w-full min-w-0';

    // 1. DIVIDER BLOCK
    if (cell.type === 'divider') {
      const divWrap = document.createElement('div');
      divWrap.className = 'py-2.5 flex items-center';
      const line = document.createElement('hr');
      line.className = `w-full border-t ${
        cell.color === 'default'
          ? 'border-slate-800'
          : colorMeta.textClass.replace('text-', 'border-')
      }`;
      divWrap.appendChild(line);
      body.appendChild(divWrap);
      return body;
    }

    // 2. CODE BLOCK (1 línea | bloque)
    if (cell.type === 'code-line' || cell.type === 'code-block') {
      const isSingleLine = cell.type === 'code-line';
      const codeWrap = document.createElement('div');
      codeWrap.className =
        'group/code relative rounded-xl bg-slate-900/90 border border-slate-800/90 px-3 py-2 flex flex-col gap-1.5';

      // Controles minimalistas flotantes en la esquina superior derecha del código
      const codeTopRight = document.createElement('div');
      codeTopRight.className =
        'flex items-center justify-end gap-1.5 text-[11px] opacity-80 group-hover/code:opacity-100 transition-opacity';

      if (!readOnly) {
        const modePill = document.createElement('button');
        modePill.type = 'button';
        modePill.title = 'Alternar entre código de 1 línea y bloque';
        modePill.className =
          'px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 hover:text-indigo-300 cursor-pointer';
        modePill.textContent = isSingleLine ? '1 Línea ⇄ Bloque' : 'Bloque ⇄ 1 Línea';
        modePill.addEventListener('click', () => {
          cell.type = isSingleLine ? 'code-block' : 'code-line';
          if (cell.type === 'code-line') {
            cell.content = (cell.content || '').replace(/\r?\n/g, ' ');
          }
          pendingFocus = { blockId: block.id, colIndex, cursorAtEnd: true };
          render();
          emitChange();
        });
        codeTopRight.appendChild(modePill);

        if (!isSingleLine) {
          const langSelect = document.createElement('select');
          langSelect.className =
            'bg-slate-950/90 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-400 outline-none focus:border-indigo-500';
          CODE_LANGUAGES.forEach((lang) => {
            const opt = document.createElement('option');
            opt.value = lang;
            opt.textContent = lang;
            if ((cell.meta?.language || 'javascript') === lang) opt.selected = true;
            langSelect.appendChild(opt);
          });
          langSelect.addEventListener('change', (e) => {
            cell.meta.language = e.target.value;
            emitChange();
          });
          codeTopRight.appendChild(langSelect);
        }
      }

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className =
        'px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer';
      copyBtn.innerHTML = `${getIcon('copy')} <span>Copiar</span>`;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(cell.content || '');
        Toast.success('Código copiado');
      });
      codeTopRight.appendChild(copyBtn);

      if (isSingleLine) {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between gap-2';
        const input = document.createElement('input');
        input.type = 'text';
        input.readOnly = readOnly;
        input.value = cell.content || '';
        input.placeholder = 'Escribe código de una línea...';
        input.setAttribute('data-focus-target', `${block.id}:${colIndex}`);
        input.className = `flex-1 min-w-0 bg-transparent font-mono text-xs ${colorMeta.textClass} placeholder-slate-600 outline-none`;
        input.addEventListener('input', (e) => {
          cell.content = e.target.value;
          emitChange();
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlockAt(blockIndex + 1, 'p', 1);
          } else if (e.key === 'Backspace' && !input.value) {
            e.preventDefault();
            transformCell(cell, block, colIndex, 'p');
          }
        });
        row.append(input, codeTopRight);
        codeWrap.appendChild(row);
      } else {
        codeWrap.appendChild(codeTopRight);
        const ta = document.createElement('textarea');
        ta.rows = Math.max(2, (cell.content || '').split('\n').length);
        ta.readOnly = readOnly;
        ta.value = cell.content || '';
        ta.placeholder = '// Escribe tu bloque de código...';
        ta.setAttribute('data-focus-target', `${block.id}:${colIndex}`);
        ta.className = `w-full bg-transparent font-mono text-xs leading-relaxed ${colorMeta.textClass} placeholder-slate-600 outline-none resize-none overflow-hidden`;
        ta.addEventListener('input', (e) => {
          cell.content = e.target.value;
          autoResizeTextarea(ta);
          emitChange();
        });
        ta.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !ta.value) {
            e.preventDefault();
            transformCell(cell, block, colIndex, 'p');
          }
        });
        codeWrap.appendChild(ta);
        setTimeout(() => autoResizeTextarea(ta), 0);
      }

      body.appendChild(codeWrap);
      return body;
    }

    // 3. LINK BLOCK (url | bookmark) — Vista limpia con edición minimalista bajo demanda
    if (cell.type === 'link-url' || cell.type === 'link-bookmark') {
      const isBookmark = cell.type === 'link-bookmark';
      const hasUrl = Boolean((cell.meta.url || '').trim());
      const isEditing = !readOnly && (cell.meta.editing || !hasUrl);

      const linkWrap = document.createElement('div');
      linkWrap.className = 'w-full';

      if (isEditing) {
        const editorCard = document.createElement('div');
        editorCard.className =
          'p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2';

        const topRow = document.createElement('div');
        topRow.className = 'flex items-center justify-between gap-2';

        const modeSwitch = document.createElement('div');
        modeSwitch.className = 'inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800';
        [
          { id: 'link-url', label: 'URL Simple' },
          { id: 'link-bookmark', label: 'Bookmark Card' }
        ].forEach((m) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = m.label;
          b.className = `px-2 py-0.5 text-[11px] rounded-md font-medium cursor-pointer ${
            cell.type === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`;
          b.addEventListener('click', () => {
            cell.type = m.id;
            cell.meta.editing = true;
            render();
            emitChange();
          });
          modeSwitch.appendChild(b);
        });

        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.textContent = 'Listo';
        doneBtn.className =
          'px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium cursor-pointer';
        doneBtn.addEventListener('click', () => {
          cell.meta.editing = false;
          render();
          emitChange();
        });

        topRow.append(modeSwitch, doneBtn);
        editorCard.appendChild(topRow);

        const inputsWrap = document.createElement('div');
        inputsWrap.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5';

        const urlIn = document.createElement('input');
        urlIn.type = 'url';
        urlIn.value = cell.meta.url || '';
        urlIn.placeholder = 'https://ejemplo.com';
        urlIn.setAttribute('data-focus-target', `${block.id}:${colIndex}`);
        urlIn.className =
          'bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
        urlIn.addEventListener('input', (e) => {
          cell.meta.url = e.target.value;
          emitChange();
        });
        urlIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            cell.meta.editing = false;
            render();
            emitChange();
          }
        });

        if (!isBookmark) {
          const labelIn = document.createElement('input');
          labelIn.type = 'text';
          labelIn.value = cell.meta.label || '';
          labelIn.placeholder = 'Texto del link (opcional)';
          labelIn.className =
            'bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
          labelIn.addEventListener('input', (e) => {
            cell.meta.label = e.target.value;
            emitChange();
          });
          inputsWrap.append(urlIn, labelIn);
        } else {
          const titleIn = document.createElement('input');
          titleIn.type = 'text';
          titleIn.value = cell.meta.title || '';
          titleIn.placeholder = 'Título del marcador';
          titleIn.className =
            'bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
          titleIn.addEventListener('input', (e) => {
            cell.meta.title = e.target.value;
            emitChange();
          });

          const descIn = document.createElement('input');
          descIn.type = 'text';
          descIn.value = cell.meta.description || '';
          descIn.placeholder = 'Descripción breve...';
          descIn.className =
            'sm:col-span-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
          descIn.addEventListener('input', (e) => {
            cell.meta.description = e.target.value;
            emitChange();
          });

          inputsWrap.append(urlIn, titleIn, descIn);
        }

        editorCard.appendChild(inputsWrap);
        linkWrap.appendChild(editorCard);
      } else {
        const rawUrl = (cell.meta.url || '').trim();
        const safeHref =
          rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
            ? rawUrl
            : `https://${rawUrl}`;

        const viewContainer = document.createElement('div');
        viewContainer.className = 'group/link relative flex items-center justify-between gap-2';

        if (!isBookmark) {
          const a = document.createElement('a');
          a.href = safeHref;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = `inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:opacity-85 py-0.5 ${
            cell.color === 'default' ? 'text-indigo-400' : colorMeta.textClass
          }`;
          a.innerHTML = `${getIcon('link')} <span>${escapeHtml(
            cell.meta.label || rawUrl
          )}</span> <span class="opacity-60">${getIcon('externalLink')}</span>`;
          viewContainer.appendChild(a);
        } else {
          const card = document.createElement('a');
          card.href = safeHref;
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
          card.className =
            'flex-1 p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start justify-between gap-3';
          card.innerHTML = `
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 text-xs font-semibold ${colorMeta.textClass}">
                <span class="text-indigo-400 shrink-0">${getIcon('bookmark')}</span>
                <span class="truncate">${escapeHtml(cell.meta.title || rawUrl)}</span>
              </div>
              ${
                cell.meta.description
                  ? `<p class="text-[11px] text-slate-400 line-clamp-2 mt-1">${escapeHtml(
                      cell.meta.description
                    )}</p>`
                  : ''
              }
              <span class="text-[10px] text-slate-500 font-mono truncate block mt-1">${escapeHtml(
                rawUrl
              )}</span>
            </div>
            <span class="text-slate-500 shrink-0">${getIcon('externalLink')}</span>
          `;
          viewContainer.appendChild(card);
        }

        if (!readOnly) {
          const editLinkBtn = document.createElement('button');
          editLinkBtn.type = 'button';
          editLinkBtn.title = 'Editar link';
          editLinkBtn.className =
            'opacity-0 group-hover/link:opacity-100 p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-opacity cursor-pointer shrink-0';
          editLinkBtn.innerHTML = getIcon('edit');
          editLinkBtn.addEventListener('click', () => {
            cell.meta.editing = true;
            render();
          });
          viewContainer.appendChild(editLinkBtn);
        }

        linkWrap.appendChild(viewContainer);
      }

      body.appendChild(linkWrap);
      return body;
    }

    // 4. IMAGE BLOCK — Minimalista: si ya hay imagen, solo muestra la imagen + caption limpio
    if (cell.type === 'image') {
      const hasImg = Boolean((cell.meta.url || '').trim());
      const isEditing = !readOnly && (cell.meta.editing || !hasImg);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'w-full space-y-1.5';

      if (isEditing) {
        const pickerBox = document.createElement('div');
        pickerBox.className =
          'p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-2';

        const urlIn = document.createElement('input');
        urlIn.type = 'url';
        urlIn.value = cell.meta.url || '';
        urlIn.placeholder = 'Pega URL de imagen y presiona Enter, o sube un archivo...';
        urlIn.setAttribute('data-focus-target', `${block.id}:${colIndex}`);
        urlIn.className =
          'flex-1 min-w-[180px] bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
        urlIn.addEventListener('input', (e) => {
          cell.meta.url = e.target.value;
          emitChange();
        });
        urlIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && urlIn.value.trim()) {
            e.preventDefault();
            cell.meta.editing = false;
            render();
            emitChange();
          }
        });

        const fileIn = document.createElement('input');
        fileIn.type = 'file';
        fileIn.accept = 'image/*';
        fileIn.className = 'hidden';
        fileIn.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            cell.meta.url = String(reader.result || '');
            cell.meta.editing = false;
            render();
            emitChange();
          };
          reader.readAsDataURL(file);
        });

        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className =
          'px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer';
        uploadBtn.innerHTML = `${getIcon('image')} <span>Subir</span>`;
        uploadBtn.addEventListener('click', () => fileIn.click());

        pickerBox.append(urlIn, fileIn, uploadBtn);
        if (hasImg) {
          const doneBtn = document.createElement('button');
          doneBtn.type = 'button';
          doneBtn.textContent = 'Listo';
          doneBtn.className =
            'px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs cursor-pointer';
          doneBtn.addEventListener('click', () => {
            cell.meta.editing = false;
            render();
          });
          pickerBox.appendChild(doneBtn);
        }
        imgWrap.appendChild(pickerBox);
      }

      if (hasImg) {
        const fig = document.createElement('figure');
        fig.className = 'group/img relative flex flex-col items-center gap-1';

        const img = document.createElement('img');
        img.src = cell.meta.url;
        img.alt = cell.meta.caption || 'Imagen';
        img.className =
          'max-h-80 w-auto rounded-xl border border-slate-800/80 object-contain bg-slate-950/60';
        fig.appendChild(img);

        if (!readOnly) {
          const changeImgBtn = document.createElement('button');
          changeImgBtn.type = 'button';
          changeImgBtn.textContent = 'Cambiar imagen';
          changeImgBtn.className =
            'opacity-0 group-hover/img:opacity-100 absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] text-slate-200 hover:text-white transition-opacity cursor-pointer';
          changeImgBtn.addEventListener('click', () => {
            cell.meta.editing = true;
            render();
          });
          fig.appendChild(changeImgBtn);
        }

        const capIn = document.createElement('input');
        capIn.type = 'text';
        capIn.readOnly = readOnly;
        capIn.value = cell.meta.caption || '';
        capIn.placeholder = 'Escribe un pie de foto (opcional)...';
        capIn.className = `w-full bg-transparent text-center text-xs ${
          cell.color === 'default' ? 'text-slate-400' : colorMeta.textClass
        } placeholder-slate-600 outline-none`;
        capIn.addEventListener('input', (e) => {
          cell.meta.caption = e.target.value;
          emitChange();
        });
        fig.appendChild(capIn);
        imgWrap.appendChild(fig);
      }

      body.appendChild(imgWrap);
      return body;
    }

    // 5. TEXT BLOCKS (p, h1, h2, h3, quote, bullet) — FLUJO MINIMALISTA TIPO NOTION
    const textTypeStyles = {
      p: 'text-sm leading-relaxed font-normal py-0.5',
      h1: 'text-2xl font-bold tracking-tight pt-2 pb-0.5',
      h2: 'text-xl font-semibold tracking-tight pt-1.5 pb-0.5',
      h3: 'text-base font-semibold pt-1 pb-0.5',
      quote: 'text-sm italic border-l-2 border-indigo-400/80 pl-3 py-0.5',
      bullet: 'text-sm leading-relaxed py-0.5'
    };

    const placeholders = {
      p: "Escribe algo o presiona '/' para elegir bloque...",
      h1: 'Encabezado 1',
      h2: 'Encabezado 2',
      h3: 'Encabezado 3',
      quote: 'Cita...',
      bullet: 'Elemento de lista'
    };

    const textRow = document.createElement('div');
    textRow.className = 'flex items-start gap-2 w-full';

    if (cell.type === 'bullet') {
      const dot = document.createElement('span');
      dot.className = `mt-1 text-sm font-bold select-none ${colorMeta.textClass}`;
      dot.textContent = '•';
      textRow.appendChild(dot);
    }

    const ta = document.createElement('textarea');
    ta.rows = 1;
    ta.readOnly = readOnly;
    ta.value = cell.content || '';
    ta.placeholder = placeholders[cell.type] || placeholders.p;
    ta.setAttribute('data-focus-target', `${block.id}:${colIndex}`);
    ta.className = `w-full bg-transparent resize-none overflow-hidden outline-none placeholder-slate-600/80 ${
      textTypeStyles[cell.type] || textTypeStyles.p
    } ${colorMeta.textClass}`;

    let slashController = null;

    function checkSlashTrigger() {
      const val = ta.value;
      // Detectar si el usuario escribió `/` al inicio o después de un espacio (ej. "/h1" o "hola /code")
      const slashMatch = val.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
      if (slashMatch) {
        const query = slashMatch[1] || '';
        slashController = openSlashMenu({
          anchorEl: body,
          cell,
          block,
          colIndex,
          query,
          onSelectType: (chosenType) => {
            // Limpiar el comando `/...` del texto
            cell.content = val.replace(/(?:^|\s)\/[a-zA-Z0-9_-]*$/, '');
            transformCell(cell, block, colIndex, chosenType);
          }
        });
      } else if (slashController) {
        closeActivePopovers();
        slashController = null;
      }
    }

    ta.addEventListener('input', () => {
      cell.content = ta.value;
      autoResizeTextarea(ta);
      emitChange();
      checkSlashTrigger();
    });

    ta.addEventListener('keydown', (e) => {
      if (slashController) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          slashController.moveSelection(1);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          slashController.moveSelection(-1);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          slashController.triggerSelected();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeActivePopovers();
          slashController = null;
          return;
        }
      }

      // Enter sin Shift crea un nuevo bloque debajo (igual que Notion)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nextType = cell.type === 'bullet' ? 'bullet' : 'p';
        addBlockAt(blockIndex + 1, nextType, 1);
        return;
      }

      // Backspace cuando el bloque está vacío
      if (e.key === 'Backspace' && !ta.value) {
        e.preventDefault();
        if (cell.type !== 'p') {
          transformCell(cell, block, colIndex, 'p');
        } else if (block.columns === 1 && blocks.length > 1) {
          removeBlockAt(blockIndex);
        }
      }
    });

    textRow.appendChild(ta);
    body.appendChild(textRow);
    setTimeout(() => {
      autoResizeTextarea(ta);
      if (
        pendingFocus &&
        pendingFocus.blockId === block.id &&
        pendingFocus.colIndex === colIndex &&
        pendingFocus.openSlash
      ) {
        checkSlashTrigger();
      }
    }, 0);

    return body;
  }

  // =========================================================================
  // RENDERIZADO DE CELDA CON GUTTER MINIMALISTA (`+` y `⋮⋮` EN HOVER)
  // =========================================================================
  function renderCell(cell, block, blockIndex, colIndex) {
    const cellWrapper = document.createElement('div');
    cellWrapper.className =
      'group/cell relative flex items-start gap-1.5 py-0.5 px-1 rounded-lg hover:bg-slate-900/35 transition-colors min-w-0';

    if (!readOnly) {
      // Gutter minimalista a la izquierda estilo Notion (visible en hover)
      const handleBar = document.createElement('div');
      handleBar.className =
        'relative flex items-center gap-0.5 pt-1 opacity-0 group-hover/cell:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 select-none';

      // Botón `+` minimalista (inserta bloque debajo y abre menú `/`)
      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.title = 'Click para añadir un bloque debajo';
      plusBtn.className =
        'p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer';
      plusBtn.innerHTML = getIcon('plus');
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addBlockAt(blockIndex + 1, 'p', 1, { openSlash: true });
      });

      // Botón `⋮⋮` minimalista (abre ajustes de bloque: tipo, color, 1-3 columnas, eliminar)
      const gripBtn = document.createElement('button');
      gripBtn.type = 'button';
      gripBtn.title = 'Ajustes del bloque (Tipo, Color, 1-3 Columnas)';
      gripBtn.className =
        'p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer';
      gripBtn.innerHTML = getIcon('gripVertical');
      gripBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBlockSettingsPopover({
          triggerBtn: gripBtn,
          cell,
          block,
          blockIndex,
          colIndex
        });
      });

      handleBar.append(plusBtn, gripBtn);
      cellWrapper.appendChild(handleBar);
    }

    const contentNode = renderCellContent(cell, block, blockIndex, colIndex);
    cellWrapper.appendChild(contentNode);

    return cellWrapper;
  }

  function render() {
    closeActivePopovers();
    blocksContainer.innerHTML = '';

    blocks.forEach((block, blockIndex) => {
      const gridClass =
        block.columns === 3
          ? 'grid-cols-1 md:grid-cols-3 gap-3 border-l border-slate-800/60 pl-1'
          : block.columns === 2
          ? 'grid-cols-1 md:grid-cols-2 gap-3 border-l border-slate-800/60 pl-1'
          : 'grid-cols-1';

      const rowGrid = document.createElement('div');
      rowGrid.className = `grid ${gridClass} items-start`;

      for (let c = 0; c < block.columns; c++) {
        if (!block.cells[c]) {
          block.cells[c] = createDefaultCell('p');
        }
        rowGrid.appendChild(renderCell(block.cells[c], block, blockIndex, c));
      }

      blocksContainer.appendChild(rowGrid);
    });

    // Restaurar foco si hay una acción pendiente (ej. Enter, nuevo bloque o cambio de tipo)
    if (pendingFocus) {
      const targetKey = `${pendingFocus.blockId}:${pendingFocus.colIndex}`;
      const focusSnapshot = { ...pendingFocus };
      pendingFocus = null;
      setTimeout(() => {
        const el = blocksContainer.querySelector(`[data-focus-target="${targetKey}"]`);
        if (el) {
          el.focus();
          if (focusSnapshot.cursorAtEnd && typeof el.value === 'string') {
            const len = el.value.length;
            el.setSelectionRange?.(len, len);
          }
        }
      }, 0);
    }
  }

  root.appendChild(blocksContainer);

  // Área inferior silenciosa estilo Notion: click para añadir o continuar escribiendo al final
  if (!readOnly) {
    const bottomClickZone = document.createElement('div');
    bottomClickZone.className =
      'h-8 w-full cursor-text flex items-center pl-8 text-[11px] text-slate-600 hover:text-slate-400 transition-colors select-none';
    bottomClickZone.textContent = "+ Haz clic para agregar un bloque o escribe '/' en cualquier línea";
    bottomClickZone.addEventListener('click', () => {
      const last = blocks[blocks.length - 1];
      if (last && last.columns === 1 && last.cells[0]?.type === 'p' && !last.cells[0]?.content) {
        pendingFocus = { blockId: last.id, colIndex: 0, cursorAtEnd: true };
        render();
      } else {
        addBlockAt(blocks.length, 'p', 1);
      }
    });
    root.appendChild(bottomClickZone);
  }

  render();

  return {
    element: root,
    getBlocks: () => getCleanBlocks(),
    setBlocks: (newBlocks = []) => {
      blocks =
        Array.isArray(newBlocks) && newBlocks.length > 0
          ? newBlocks.map(normalizeBlock)
          : [normalizeBlock({ type: 'p', columns: 1, content: '' })];
      render();
    },
    addBlock: (type = 'p', columns = 1) => addBlockAt(blocks.length, type, columns)
  };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
