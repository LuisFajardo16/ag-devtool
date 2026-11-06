import { StorageService, STORAGE_KEYS } from '../../core/storage.js';
import { events } from '../../core/events.js';
import { ToolRegistry } from '../../core/toolRegistry.js';
import { AuthService } from '../../core/auth.js';
import { WorkspaceManager } from '../../core/workspaceManager.js';
import {
  createButton,
  createBadge,
  getIcon
} from '../ui/index.js';
import { openMarketplaceModal } from '../../views/MarketplaceModal.js';
import { openAdminComponentsModal } from '../../views/AdminComponentsView.js';
import { openWorkspaceModal } from '../../views/WorkspaceModal.js';

export class Sidebar {
  constructor(container, panelManager) {
    this.container = container;
    this.panelManager = panelManager;
    this.collapsed = Boolean(
      StorageService.get(STORAGE_KEYS.SIDEBAR, { collapsed: false })?.collapsed
    );

    events.on('tools:changed', () => this.render());
    events.on('auth:changed', () => this.render());
    events.on('layout:changed', () => this.render());
    events.on('workspace:changed', () => this.render());
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    StorageService.set(STORAGE_KEYS.SIDEBAR, { collapsed: this.collapsed });
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const activeWorkspace = WorkspaceManager.getActiveWorkspace();

    const aside = document.createElement('aside');
    aside.className = `${
      this.collapsed ? 'w-16' : 'w-64'
    } h-full bg-slate-900/95 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-200 shrink-0 select-none`;

    // Encabezado del Sidebar + botón colapsar
    const topSection = document.createElement('div');
    topSection.className = 'flex flex-col flex-1 min-h-0 overflow-hidden';

    const headerRow = document.createElement('div');
    headerRow.className = `px-3 py-3 border-b border-slate-800/80 flex items-center ${
      this.collapsed ? 'justify-center' : 'justify-between'
    }`;

    if (!this.collapsed) {
      const labelWrap = document.createElement('div');
      labelWrap.className = 'flex items-center gap-2 min-w-0';
      labelWrap.innerHTML = `
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Utilidades · ${activeWorkspace.name}</span>
      `;
      headerRow.appendChild(labelWrap);
    }

    const collapseBtn = createButton({
      variant: 'ghost',
      size: 'icon',
      icon: this.collapsed ? 'chevronRight' : 'chevronLeft',
      title: this.collapsed ? 'Expandir Sidebar' : 'Colapsar Sidebar',
      className: 'text-slate-400 hover:text-white p-1.5',
      onClick: () => this.toggleCollapse()
    });
    headerRow.appendChild(collapseBtn);
    topSection.appendChild(headerRow);

    // Lista de utilidades instaladas
    const listWrap = document.createElement('div');
    listWrap.className = 'flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1';

    const installedTools = ToolRegistry.getInstalledTools().filter((t) => !t.adminOnly);
    const activePanelIdx = this.panelManager.state.activePanelIndex || 0;
    const currentToolInActivePanel = this.panelManager.state.panelTools[activePanelIdx];

    if (installedTools.length === 0 && !this.collapsed) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'p-3 text-center text-xs text-slate-500';
      emptyMsg.textContent = 'Sin utilidades activas. Agrega una desde el Market.';
      listWrap.appendChild(emptyMsg);
    }

    installedTools.forEach((tool) => {
      const isActive = currentToolInActivePanel === tool.id;
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.title = `${tool.name}${tool.isWsTool ? ' (WS Tool)' : ''} — Abrir en Panel P${activePanelIdx + 1}`;
      itemBtn.className = `w-full flex items-center ${
        this.collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
      } rounded-xl text-xs font-medium transition-all cursor-pointer group ${
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
      }`;

      if (this.collapsed) {
        itemBtn.innerHTML = `<span class="shrink-0">${getIcon(tool.icon)}</span>`;
      } else {
        itemBtn.innerHTML = `
          <span class="flex items-center gap-2.5 truncate min-w-0">
            <span class="shrink-0 ${
              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
            }">${getIcon(tool.icon)}</span>
            <span class="truncate">${tool.name}</span>
          </span>
          <span class="flex items-center gap-1 shrink-0 ml-1">
            ${
              tool.isWsTool
                ? `<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">WS</span>`
                : ''
            }
            ${
              isActive
                ? `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">P${
                    activePanelIdx + 1
                  }</span>`
                : ''
            }
          </span>
        `;
      }

      itemBtn.addEventListener('click', () => {
        this.panelManager.openToolInActivePanel(tool.id);
      });

      listWrap.appendChild(itemBtn);
    });

    // Sección Exclusiva de Administrador (Solo visible cuando admin está logueado)
    if (AuthService.isAdmin()) {
      const adminDivider = document.createElement('div');
      adminDivider.className = 'pt-3 mt-2 border-t border-slate-800/90 space-y-1';

      if (!this.collapsed) {
        const adminHdr = document.createElement('div');
        adminHdr.className = 'px-2 pb-1 flex items-center justify-between';
        adminHdr.innerHTML = `<span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Zona Admin</span>`;
        adminHdr.appendChild(createBadge({ text: 'ADMIN', variant: 'warning' }));
        adminDivider.appendChild(adminHdr);
      }

      const isKitInPanel = currentToolInActivePanel === 'admin-ui-kit';
      const openInPanelBtn = document.createElement('button');
      openInPanelBtn.type = 'button';
      openInPanelBtn.title = 'Ver Componentes UI en el Panel Activo';
      openInPanelBtn.className = `w-full flex items-center ${
        this.collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
      } rounded-xl text-xs font-medium transition-all cursor-pointer ${
        isKitInPanel
          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
          : 'text-amber-300/90 hover:bg-amber-500/10 border border-transparent'
      }`;
      openInPanelBtn.innerHTML = this.collapsed
        ? `<span class="text-amber-400">${getIcon('shield')}</span>`
        : `
          <span class="flex items-center gap-2.5 truncate">
            <span class="text-amber-400 shrink-0">${getIcon('shield')}</span>
            <span class="truncate">Componentes UI (Panel)</span>
          </span>
        `;
      openInPanelBtn.addEventListener('click', () => {
        this.panelManager.openToolInActivePanel('admin-ui-kit');
      });

      const openModalKitBtn = document.createElement('button');
      openModalKitBtn.type = 'button';
      openModalKitBtn.title = 'Abrir Catálogo Completo de Componentes Visuales en Popup';
      openModalKitBtn.className = `w-full flex items-center ${
        this.collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
      } rounded-xl text-xs font-medium text-amber-300/90 hover:bg-amber-500/10 transition-all cursor-pointer`;
      openModalKitBtn.innerHTML = this.collapsed
        ? `<span class="text-amber-400">${getIcon('layers')}</span>`
        : `
          <span class="flex items-center gap-2.5 truncate">
            <span class="text-amber-400 shrink-0">${getIcon('layers')}</span>
            <span class="truncate">Catálogo UI (Popup)</span>
          </span>
        `;
      openModalKitBtn.addEventListener('click', () => {
        openAdminComponentsModal();
      });

      adminDivider.append(openInPanelBtn, openModalKitBtn);
      listWrap.appendChild(adminDivider);
    }

    topSection.appendChild(listWrap);

    // Pie del Sidebar: Botones para Workspaces y Marketplace
    const bottomSection = document.createElement('div');
    bottomSection.className = 'p-2.5 border-t border-slate-800/90 bg-slate-950/40 space-y-2';

    const workspacesBtn = createButton({
      label: this.collapsed ? '' : `WS: ${activeWorkspace.name}`,
      icon: 'briefcase',
      variant: 'secondary',
      size: this.collapsed ? 'icon' : 'sm',
      fullWidth: true,
      title: 'Cambiar o gestionar Workspaces',
      onClick: () => openWorkspaceModal()
    });

    const marketBtn = createButton({
      label: this.collapsed ? '' : 'Market de Utilidades',
      icon: 'store',
      variant: 'primary',
      size: this.collapsed ? 'icon' : 'sm',
      fullWidth: true,
      title: 'Agregar o quitar utilidades del sistema',
      onClick: () =>
        openMarketplaceModal({
          onOpenTool: (toolId) => this.panelManager.openToolInActivePanel(toolId)
        })
    });

    bottomSection.append(workspacesBtn, marketBtn);

    aside.append(topSection, bottomSection);
    this.container.appendChild(aside);
  }
}
