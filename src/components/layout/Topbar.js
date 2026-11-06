import { events } from '../../core/events.js';
import { AuthService } from '../../core/auth.js';
import { WorkspaceManager } from '../../core/workspaceManager.js';
import {
  createButton,
  createDropdown,
  createBadge,
  Toast,
  getIcon
} from '../ui/index.js';
import { openMarketplaceModal } from '../../views/MarketplaceModal.js';
import { openAdminLoginModal } from '../../views/AdminLoginModal.js';
import { openAdminComponentsModal } from '../../views/AdminComponentsView.js';
import {
  openWorkspaceModal,
  openCreateWorkspaceModal
} from '../../views/WorkspaceModal.js';

export class Topbar {
  constructor(container, panelManager) {
    this.container = container;
    this.panelManager = panelManager;

    events.on('auth:changed', () => this.render());
    events.on('layout:changed', () => this.render());
    events.on('workspace:changed', () => this.render());
  }

  render() {
    this.container.innerHTML = '';

    const nav = document.createElement('header');
    nav.className =
      'h-14 px-4 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between gap-3 shrink-0 select-none';

    const activeWorkspace = WorkspaceManager.getActiveWorkspace();
    const allWorkspaces = WorkspaceManager.getWorkspaces();

    // Marca / Título + Selector de Workspace
    const brand = document.createElement('div');
    brand.className = 'flex items-center gap-3 min-w-0';
    brand.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
        ${getIcon('terminal')}
      </div>
      <div class="truncate hidden lg:block">
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold tracking-tight text-white">AG-DevTool</h1>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">v1.1</span>
        </div>
        <p class="text-[11px] text-slate-400 truncate">Workbench modular de utilidades en Vanilla JS</p>
      </div>
    `;

    // Selector rápido de Workspace en la pantalla principal
    const workspaceDropdown = createDropdown({
      label: `WS: ${activeWorkspace.name}`,
      icon: 'briefcase',
      variant: 'secondary',
      size: 'sm',
      items: [
        { header: 'Workspaces Disponibles' },
        ...allWorkspaces.map((ws) => ({
          label: ws.name,
          icon: 'briefcase',
          badge: ws.isSystem
            ? ws.wsTools?.length
              ? 'WS + Market'
              : 'Sistema'
            : 'Usuario',
          active: ws.id === activeWorkspace.id,
          onClick: () => {
            WorkspaceManager.setActiveWorkspace(ws.id);
            Toast.info(`Workspace activo: "${ws.name}"`);
          }
        })),
        { divider: true },
        {
          label: 'Nuevo Workspace...',
          icon: 'plus',
          onClick: () => openCreateWorkspaceModal()
        },
        {
          label: 'Gestionar Workspaces...',
          icon: 'layers',
          onClick: () => openWorkspaceModal()
        }
      ]
    });

    brand.appendChild(workspaceDropdown);

    // Selector rápido de Paneles (1 a 6 paneles)
    const centerControls = document.createElement('div');
    centerControls.className = 'flex items-center gap-2';

    const currentCount = this.panelManager.getPanelCount();

    const panelPillsWrap = document.createElement('div');
    panelPillsWrap.className =
      'hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'text-[11px] text-slate-400 px-2 flex items-center gap-1.5';
    labelSpan.innerHTML = `${getIcon('grid')} <span>Paneles:</span>`;
    panelPillsWrap.appendChild(labelSpan);

    for (let n = 1; n <= 6; n++) {
      const active = n === currentCount;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = `Usar ${n} panel${n > 1 ? 'es' : ''} redimensionable${n > 1 ? 's' : ''}`;
      btn.className = `w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`;
      btn.textContent = String(n);
      btn.addEventListener('click', () => {
        this.panelManager.setPanelCount(n);
      });
      panelPillsWrap.appendChild(btn);
    }

    // Dropdown de layout también disponible en móvil o para resetear tamaños
    const layoutDropdown = createDropdown({
      label: `${currentCount} Panel${currentCount > 1 ? 'es' : ''}`,
      icon: 'grid',
      variant: 'outline',
      size: 'sm',
      align: 'right',
      items: [
        { header: 'Cantidad de Paneles (1-6)' },
        ...[1, 2, 3, 4, 5, 6].map((n) => ({
          label: `${n} Panel${n > 1 ? 'es' : ''}`,
          badge: n <= 3 ? `1×${n}` : n === 4 ? '2×2' : n === 5 ? '3+2' : '2×3',
          active: n === currentCount,
          onClick: () => this.panelManager.setPanelCount(n)
        })),
        { divider: true },
        {
          label: 'Restablecer proporciones',
          icon: 'maximize',
          onClick: () => {
            this.panelManager.resetSizes();
            Toast.info('Proporciones de paneles restablecidas');
          }
        }
      ]
    });

    centerControls.append(panelPillsWrap, layoutDropdown);

    // Acciones derechas: Market + Login/Sesión Admin
    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center gap-2';

    const marketBtn = createButton({
      label: 'Market',
      icon: 'store',
      variant: 'secondary',
      size: 'sm',
      title: 'Abrir Marketplace de utilidades',
      onClick: () =>
        openMarketplaceModal({
          onOpenTool: (toolId) => this.panelManager.openToolInActivePanel(toolId)
        })
    });
    rightActions.appendChild(marketBtn);

    if (AuthService.isAdmin()) {
      const adminMenu = createDropdown({
        label: 'Admin Activo',
        icon: 'shield',
        variant: 'primary',
        size: 'sm',
        align: 'right',
        items: [
          { header: 'Herramientas de Administrador' },
          {
            label: 'Ver Componentes UI (Popup)',
            icon: 'layers',
            onClick: () => openAdminComponentsModal()
          },
          {
            label: 'Abrir UI Kit en Panel Activo',
            icon: 'grid',
            onClick: () => this.panelManager.openToolInActivePanel('admin-ui-kit')
          },
          { divider: true },
          {
            label: 'Cerrar Sesión Admin',
            icon: 'logout',
            danger: true,
            onClick: () => {
              AuthService.logout();
              Toast.info('Sesión de administrador cerrada');
            }
          }
        ]
      });
      rightActions.appendChild(adminMenu);
    } else {
      const loginBtn = createButton({
        label: 'Admin Login',
        icon: 'lock',
        variant: 'outline',
        size: 'sm',
        title: 'Iniciar sesión como administrador',
        onClick: () => openAdminLoginModal()
      });
      rightActions.appendChild(loginBtn);
    }

    nav.append(brand, centerControls, rightActions);
    this.container.appendChild(nav);
  }
}
