import { StorageService, STORAGE_KEYS } from '../../core/storage.js';
import { events } from '../../core/events.js';
import { ToolRegistry } from '../../core/toolRegistry.js';
import {
  createButton,
  createDropdown,
  createBadge,
  getIcon
} from '../ui/index.js';
import { openMarketplaceModal } from '../../views/MarketplaceModal.js';

const DEFAULT_LAYOUT = {
  panelCount: 1,
  activePanelIndex: 0,
  panelTools: [
    'notes-manager',
    'json-formatter',
    'notes-manager',
    'json-formatter',
    'notes-manager',
    'json-formatter'
  ],
  rowSplit: 50, // % de altura de la primera fila cuando hay 2 filas (4, 5 o 6 paneles)
  colSplits: {
    1: { top: [100], bottom: [] },
    2: { top: [50, 50], bottom: [] },
    3: { top: [33.33, 33.33, 33.34], bottom: [] },
    4: { top: [50, 50], bottom: [50, 50] },
    5: { top: [33.33, 33.33, 33.34], bottom: [50, 50] },
    6: { top: [33.33, 33.33, 33.34], bottom: [33.33, 33.33, 33.34] }
  }
};

export class PanelManager {
  constructor(container) {
    this.container = container;
    this.state = this.loadState();
    this.maximizedPanelIndex = null;
    this.cleanups = [];

    events.on('tools:changed', () => this.render());
    events.on('auth:changed', () => this.render());
  }

  loadState() {
    const saved = StorageService.get(STORAGE_KEYS.LAYOUT, null);
    if (!saved || typeof saved !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    }
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_LAYOUT)),
      ...saved,
      colSplits: {
        ...JSON.parse(JSON.stringify(DEFAULT_LAYOUT.colSplits)),
        ...(saved.colSplits || {})
      }
    };
  }

  saveState() {
    StorageService.set(STORAGE_KEYS.LAYOUT, this.state);
    events.emit('layout:changed', this.state);
  }

  getPanelCount() {
    return this.state.panelCount;
  }

  setPanelCount(count) {
    const clamped = Math.max(1, Math.min(6, Number(count) || 1));
    this.state.panelCount = clamped;
    if (this.state.activePanelIndex >= clamped) {
      this.state.activePanelIndex = clamped - 1;
    }
    this.maximizedPanelIndex = null;
    this.saveState();
    this.render();
  }

  resetSizes() {
    this.state.rowSplit = 50;
    this.state.colSplits = JSON.parse(JSON.stringify(DEFAULT_LAYOUT.colSplits));
    this.maximizedPanelIndex = null;
    this.saveState();
    this.render();
  }

  openToolInActivePanel(toolId) {
    const idx = this.state.activePanelIndex || 0;
    this.state.panelTools[idx] = toolId;
    this.saveState();
    this.render();
  }

  openToolInPanel(panelIndex, toolId) {
    this.state.panelTools[panelIndex] = toolId;
    this.state.activePanelIndex = panelIndex;
    this.saveState();
    this.render();
  }

  cleanupMountedTools() {
    this.cleanups.forEach((fn) => {
      if (typeof fn === 'function') {
        try {
          fn();
        } catch (e) {
          console.warn(e);
        }
      }
    });
    this.cleanups = [];
  }

  render() {
    this.cleanupMountedTools();
    this.container.innerHTML = '';

    const count = this.state.panelCount;

    // Si hay un panel maximizado temporalmente, mostrar solo ese al 100%
    if (this.maximizedPanelIndex !== null && this.maximizedPanelIndex < count) {
      const singleWrap = document.createElement('div');
      singleWrap.className = 'w-full h-full flex overflow-hidden p-1.5';
      singleWrap.appendChild(this.createPanelElement(this.maximizedPanelIndex, 100));
      this.container.appendChild(singleWrap);
      return;
    }

    const splitsForCount =
      this.state.colSplits[count] || DEFAULT_LAYOUT.colSplits[count];

    const workspaceEl = document.createElement('div');
    workspaceEl.className = 'w-full h-full flex flex-col overflow-hidden p-1.5 select-none';

    if (count <= 3) {
      // Una sola fila con 1, 2 o 3 columnas redimensionables
      const topRow = this.createRowElement(
        Array.from({ length: count }, (_, i) => i),
        splitsForCount.top,
        (newPercentages) => {
          this.state.colSplits[count].top = newPercentages;
          this.saveState();
        }
      );
      topRow.style.height = '100%';
      workspaceEl.appendChild(topRow);
    } else {
      // Dos filas redimensionables (4 = 2x2, 5 = 3 arriba + 2 abajo, 6 = 3x3)
      const topCount = count === 4 ? 2 : 3;
      const topIndices = Array.from({ length: topCount }, (_, i) => i);
      const bottomIndices = Array.from(
        { length: count - topCount },
        (_, i) => i + topCount
      );

      const topRow = this.createRowElement(
        topIndices,
        splitsForCount.top,
        (newPercentages) => {
          this.state.colSplits[count].top = newPercentages;
          this.saveState();
        }
      );

      const bottomRow = this.createRowElement(
        bottomIndices,
        splitsForCount.bottom,
        (newPercentages) => {
          this.state.colSplits[count].bottom = newPercentages;
          this.saveState();
        }
      );

      const topPct = Math.max(20, Math.min(80, this.state.rowSplit || 50));
      topRow.style.height = `calc(${topPct}% - 4px)`;
      bottomRow.style.height = `calc(${100 - topPct}% - 4px)`;

      const rowSplitter = this.createHorizontalSplitter(
        workspaceEl,
        topRow,
        bottomRow,
        (newTopPct) => {
          this.state.rowSplit = newTopPct;
          this.saveState();
        }
      );

      workspaceEl.append(topRow, rowSplitter, bottomRow);
    }

    this.container.appendChild(workspaceEl);
  }

  /**
   * Crea una fila de paneles con divisores verticales arrastrables
   */
  createRowElement(panelIndices, percentages, onResizeDone) {
    const rowEl = document.createElement('div');
    rowEl.className = 'w-full flex items-stretch overflow-hidden min-h-0';

    const panelEls = [];
    const currentPcts =
      Array.isArray(percentages) && percentages.length === panelIndices.length
        ? [...percentages]
        : panelIndices.map(() => 100 / panelIndices.length);

    panelIndices.forEach((panelIdx, i) => {
      const panelEl = this.createPanelElement(panelIdx, currentPcts[i]);
      panelEls.push(panelEl);
      rowEl.appendChild(panelEl);

      if (i < panelIndices.length - 1) {
        const vSplitter = this.createVerticalSplitter(
          rowEl,
          panelEls,
          i,
          currentPcts,
          onResizeDone
        );
        rowEl.appendChild(vSplitter);
      }
    });

    return rowEl;
  }

  /**
   * Crea un divisor vertical arrastrable entre dos columnas adyacentes
   */
  createVerticalSplitter(rowEl, panelEls, leftIdx, currentPcts, onResizeDone) {
    const splitter = document.createElement('div');
    splitter.className =
      'panel-splitter-v w-2 shrink-0 cursor-col-resize flex items-center justify-center group mx-0.5 rounded transition-colors hover:bg-indigo-500/30';
    splitter.title = 'Arrastra para redimensionar paneles';
    splitter.innerHTML = `<div class="w-0.5 h-8 bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>`;

    splitter.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const rowWidth = rowEl.getBoundingClientRect().width || 1;
      const startLeftPct = currentPcts[leftIdx];
      const startRightPct = currentPcts[leftIdx + 1];
      const totalPairPct = startLeftPct + startRightPct;

      document.body.style.cursor = 'col-resize';
      splitter.classList.add('bg-indigo-500/40');

      const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaPct = (deltaX / rowWidth) * 100;
        const minPct = 15;
        let newLeft = Math.max(
          minPct,
          Math.min(totalPairPct - minPct, startLeftPct + deltaPct)
        );
        let newRight = totalPairPct - newLeft;

        currentPcts[leftIdx] = Number(newLeft.toFixed(2));
        currentPcts[leftIdx + 1] = Number(newRight.toFixed(2));

        panelEls[leftIdx].style.width = `${currentPcts[leftIdx]}%`;
        panelEls[leftIdx + 1].style.width = `${currentPcts[leftIdx + 1]}%`;
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        splitter.classList.remove('bg-indigo-500/40');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (typeof onResizeDone === 'function') {
          onResizeDone([...currentPcts]);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    return splitter;
  }

  /**
   * Crea un divisor horizontal arrastrable entre dos filas de paneles
   */
  createHorizontalSplitter(workspaceEl, topRow, bottomRow, onResizeDone) {
    const splitter = document.createElement('div');
    splitter.className =
      'panel-splitter-h h-2 w-full shrink-0 cursor-row-resize flex items-center justify-center group my-0.5 rounded transition-colors hover:bg-indigo-500/30';
    splitter.title = 'Arrastra para redimensionar la altura de las filas';
    splitter.innerHTML = `<div class="h-0.5 w-10 bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>`;

    splitter.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const totalHeight = workspaceEl.getBoundingClientRect().height || 1;
      const startTopPct = this.state.rowSplit || 50;
      let latestTopPct = startTopPct;

      document.body.style.cursor = 'row-resize';
      splitter.classList.add('bg-indigo-500/40');

      const onMouseMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const deltaPct = (deltaY / totalHeight) * 100;
        latestTopPct = Math.max(20, Math.min(80, Number((startTopPct + deltaPct).toFixed(2))));
        topRow.style.height = `calc(${latestTopPct}% - 4px)`;
        bottomRow.style.height = `calc(${100 - latestTopPct}% - 4px)`;
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        splitter.classList.remove('bg-indigo-500/40');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (typeof onResizeDone === 'function') {
          onResizeDone(latestTopPct);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    return splitter;
  }

  /**
   * Crea un contenedor de panel individual con cabecera, selector Dropdown de utilidad y cuerpo
   */
  createPanelElement(panelIndex, widthPct) {
    const isFocused = this.state.activePanelIndex === panelIndex;
    const installedTools = ToolRegistry.getInstalledTools();
    const assignedToolId = this.state.panelTools[panelIndex];
    let activeTool = ToolRegistry.getToolById(assignedToolId);

    // Si la utilidad asignada fue desinstalada, usar la primera instalada disponible
    if (!activeTool || !ToolRegistry.isInstalled(activeTool.id)) {
      activeTool = installedTools[0] || null;
      if (activeTool) {
        this.state.panelTools[panelIndex] = activeTool.id;
      }
    }

    const panel = document.createElement('section');
    panel.style.width = `${widthPct}%`;
    panel.className = `h-full flex flex-col rounded-xl bg-slate-900/90 border transition-colors overflow-hidden min-w-0 select-text ${
      isFocused ? 'border-indigo-500/60 shadow-lg shadow-indigo-950/20' : 'border-slate-800/90'
    }`;

    panel.addEventListener('mousedown', () => {
      if (this.state.activePanelIndex !== panelIndex) {
        this.state.activePanelIndex = panelIndex;
        this.saveState();
        this.updateFocusBorders();
      }
    });
    panel.dataset.panelIndex = String(panelIndex);

    // Cabecera del panel
    const header = document.createElement('header');
    header.className =
      'px-3 py-1.5 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0';

    const leftHeader = document.createElement('div');
    leftHeader.className = 'flex items-center gap-2 min-w-0';

    const panelNumberBadge = createBadge({
      text: `P${panelIndex + 1}`,
      variant: isFocused ? 'primary' : 'default',
      className: 'shrink-0 font-mono'
    });
    panelNumberBadge.dataset.panelBadge = String(panelIndex);

    const dropdownItems = installedTools.map((t) => ({
      id: t.id,
      label: t.name,
      icon: t.icon,
      badge: t.category,
      active: activeTool?.id === t.id,
      onClick: () => this.openToolInPanel(panelIndex, t.id)
    }));

    dropdownItems.push(
      { divider: true },
      {
        label: 'Agregar más utilidades...',
        icon: 'store',
        onClick: () =>
          openMarketplaceModal({
            onOpenTool: (toolId) => this.openToolInPanel(panelIndex, toolId)
          })
      }
    );

    const toolSelector = createDropdown({
      label: activeTool ? activeTool.name : 'Seleccionar utilidad',
      icon: activeTool ? activeTool.icon : 'grid',
      variant: 'ghost',
      size: 'xs',
      items: dropdownItems
    });

    leftHeader.append(panelNumberBadge, toolSelector);

    const rightHeader = document.createElement('div');
    rightHeader.className = 'flex items-center gap-1 shrink-0';

    if (this.state.panelCount > 1) {
      const isMax = this.maximizedPanelIndex === panelIndex;
      const maxBtn = createButton({
        variant: 'ghost',
        size: 'icon',
        icon: isMax ? 'minimize' : 'maximize',
        title: isMax ? 'Restaurar vista multipanel' : 'Maximizar este panel',
        className: 'p-1 text-slate-400 hover:text-white',
        onClick: (e) => {
          e.stopPropagation();
          this.maximizedPanelIndex = isMax ? null : panelIndex;
          this.render();
        }
      });
      rightHeader.appendChild(maxBtn);

      const closePanelBtn = createButton({
        variant: 'ghost',
        size: 'icon',
        icon: 'close',
        title: 'Cerrar panel',
        className: 'p-1 text-slate-400 hover:text-rose-400',
        onClick: (e) => {
          e.stopPropagation();
          this.state.panelTools.splice(panelIndex, 1);
          this.state.panelTools.push('notes-manager');
          this.setPanelCount(this.state.panelCount - 1);
        }
      });
      rightHeader.appendChild(closePanelBtn);
    }

    header.append(leftHeader, rightHeader);

    // Cuerpo del panel donde se monta la utilidad
    const body = document.createElement('div');
    body.className = 'flex-1 min-h-0 overflow-hidden relative';

    if (activeTool && typeof activeTool.mount === 'function') {
      const cleanup = activeTool.mount(body, { panelIndex });
      if (typeof cleanup === 'function') {
        this.cleanups.push(cleanup);
      }
    } else {
      const empty = document.createElement('div');
      empty.className = 'h-full flex flex-col items-center justify-center p-6 text-center text-slate-400';
      empty.innerHTML = `
        <div class="p-3 rounded-2xl bg-slate-800/60 text-indigo-400 mb-3">${getIcon('store')}</div>
        <p class="text-xs font-medium text-slate-200">No hay utilidades instaladas</p>
        <p class="text-[11px] text-slate-500 mt-1">Abre el Marketplace para instalar utilidades en tu entorno.</p>
      `;
      const openMktBtn = createButton({
        label: 'Abrir Marketplace',
        icon: 'store',
        variant: 'primary',
        size: 'xs',
        className: 'mt-3',
        onClick: () =>
          openMarketplaceModal({
            onOpenTool: (toolId) => this.openToolInPanel(panelIndex, toolId)
          })
      });
      empty.appendChild(openMktBtn);
      body.appendChild(empty);
    }

    panel.append(header, body);
    return panel;
  }

  updateFocusBorders() {
    const panels = this.container.querySelectorAll('section[data-panel-index]');
    panels.forEach((p) => {
      const idx = Number(p.dataset.panelIndex);
      const focused = idx === this.state.activePanelIndex;
      p.classList.toggle('border-indigo-500/60', focused);
      p.classList.toggle('shadow-lg', focused);
      p.classList.toggle('border-slate-800/90', !focused);

      const badge = p.querySelector('[data-panel-badge]');
      if (badge) {
        badge.className = `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 font-mono ${
          focused
            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`;
      }
    });
  }
}
