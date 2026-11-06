import {
  Modal,
  createButton,
  createBadge,
  createInput,
  Toast,
  getIcon
} from '../components/ui/index.js';
import { ToolRegistry } from '../core/toolRegistry.js';

/**
 * Abre el Marketplace de Utilidades para agregar o quitar herramientas del entorno
 * @param {Object} [options]
 * @param {(toolId: string) => void} [options.onOpenTool]
 */
export function openMarketplaceModal({ onOpenTool = null } = {}) {
  let modalRef = null;
  let searchQuery = '';
  let filterMode = 'all'; // 'all' | 'installed' | 'available'

  const container = document.createElement('div');
  container.className = 'space-y-4';

  // Barra de filtros y búsqueda
  const controlsBar = document.createElement('div');
  controlsBar.className = 'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3';

  const searchInput = createInput({
    placeholder: 'Buscar utilidad por nombre, categoría o descripción...',
    icon: 'search',
    className: 'flex-1',
    onInput: (val) => {
      searchQuery = val.toLowerCase();
      renderCards();
    }
  });

  const filterTabs = document.createElement('div');
  filterTabs.className = 'inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1 shrink-0';

  const tabsConfig = [
    { id: 'all', label: 'Todas' },
    { id: 'installed', label: 'Instaladas' },
    { id: 'available', label: 'Disponibles' }
  ];

  function renderFilterTabs() {
    filterTabs.innerHTML = '';
    tabsConfig.forEach((tab) => {
      const active = filterMode === tab.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        filterMode = tab.id;
        renderFilterTabs();
        renderCards();
      });
      filterTabs.appendChild(btn);
    });
  }

  controlsBar.append(searchInput, filterTabs);

  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3.5';

  container.append(controlsBar, cardsGrid);

  function renderCards() {
    cardsGrid.innerHTML = '';
    const allTools = ToolRegistry.getAllMarketplaceTools();

    const filtered = allTools.filter((tool) => {
      const installed = ToolRegistry.isInstalled(tool.id);
      if (filterMode === 'installed' && !installed) return false;
      if (filterMode === 'available' && installed) return false;
      if (!searchQuery.trim()) return true;
      return (
        tool.name.toLowerCase().includes(searchQuery) ||
        tool.description.toLowerCase().includes(searchQuery) ||
        tool.category.toLowerCase().includes(searchQuery)
      );
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className =
        'col-span-full py-10 text-center text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80';
      empty.textContent = 'No se encontraron utilidades con los filtros seleccionados.';
      cardsGrid.appendChild(empty);
      return;
    }

    filtered.forEach((tool) => {
      const installed = ToolRegistry.isInstalled(tool.id);

      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
        installed
          ? 'bg-slate-900/90 border-indigo-500/40'
          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
      }`;

      const topSection = document.createElement('div');
      topSection.className = 'flex items-start justify-between gap-3';

      const iconAndTitle = document.createElement('div');
      iconAndTitle.className = 'flex items-start gap-3';
      iconAndTitle.innerHTML = `
        <div class="p-2.5 rounded-xl ${
          installed
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        } shrink-0">
          ${getIcon(tool.icon)}
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm font-semibold text-white">${tool.name}</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">${tool.description}</p>
        </div>
      `;

      const catBadge = createBadge({
        text: tool.category,
        variant: installed ? 'primary' : 'default'
      });

      topSection.append(iconAndTitle, catBadge);

      const bottomSection = document.createElement('div');
      bottomSection.className = 'flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80';

      const statusInfo = createBadge({
        text: installed ? 'Instalada en Sidebar' : 'No instalada',
        variant: installed ? 'success' : 'default'
      });

      const btnWrap = document.createElement('div');
      btnWrap.className = 'flex items-center gap-2';

      if (installed && typeof onOpenTool === 'function') {
        btnWrap.appendChild(
          createButton({
            label: 'Abrir',
            variant: 'ghost',
            size: 'xs',
            onClick: () => {
              onOpenTool(tool.id);
              modalRef?.close();
            }
          })
        );
      }

      if (installed) {
        btnWrap.appendChild(
          createButton({
            label: 'Quitar',
            icon: 'trash',
            variant: 'danger',
            size: 'xs',
            onClick: () => {
              ToolRegistry.uninstallTool(tool.id);
              Toast.info(`"${tool.name}" se quitó de tus utilidades activas`);
              renderCards();
            }
          })
        );
      } else {
        btnWrap.appendChild(
          createButton({
            label: 'Agregar utilidad',
            icon: 'plus',
            variant: 'primary',
            size: 'xs',
            onClick: () => {
              ToolRegistry.installTool(tool.id);
              Toast.success(`"${tool.name}" agregada al Sidebar`);
              renderCards();
            }
          })
        );
      }

      bottomSection.append(statusInfo, btnWrap);
      card.append(topSection, bottomSection);
      cardsGrid.appendChild(card);
    });
  }

  renderFilterTabs();
  renderCards();

  modalRef = Modal.open({
    title: 'Marketplace de Utilidades',
    subtitle: 'Agrega o quita herramientas según las necesites en tu entorno de trabajo.',
    size: 'xl',
    content: container,
    footer: [
      createButton({
        label: 'Cerrar Market',
        variant: 'secondary',
        size: 'sm',
        onClick: () => modalRef?.close()
      })
    ]
  });
}
