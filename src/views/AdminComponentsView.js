import {
  createButton,
  createBadge,
  createCard,
  createDropdown,
  createInput,
  createTextarea,
  Modal,
  Toast
} from '../components/ui/index.js';
import { AuthService } from '../core/auth.js';
import { StorageService } from '../core/storage.js';

/**
 * Renderiza el Catálogo Interactivo de Componentes Visuales (UI Kit) exclusivo para el Admin
 */
export function renderAdminComponentsCatalog(container) {
  container.innerHTML = '';

  if (!AuthService.isAdmin()) {
    const denied = document.createElement('div');
    denied.className = 'h-full flex flex-col items-center justify-center p-8 text-center';
    denied.innerHTML = `
      <p class="text-sm font-semibold text-rose-400">Acceso restringido exclusivamente al Administrador</p>
      <p class="text-xs text-slate-400 mt-1">Inicia sesión con tu cuenta de administrador para inspeccionar el UI Kit.</p>
    `;
    container.appendChild(denied);
    return;
  }

  const root = document.createElement('div');
  root.className = 'h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 bg-slate-950/40 text-slate-200';

  // Encabezado de la sección Admin
  const banner = document.createElement('div');
  banner.className =
    'p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4';
  banner.innerHTML = `
    <div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Zona Exclusiva Admin</span>
        <span class="text-xs text-slate-400">Autenticado vía SHA-256 (Web Crypto API)</span>
      </div>
      <h2 class="text-lg font-bold text-white mt-1">Catálogo de Componentes Visuales (UI Kit)</h2>
      <p class="text-xs text-slate-400">Inspecciona y prueba en vivo los componentes reutilizables de AG-DevTool: Botones, Popups, Dropdowns, Inputs, Badges y Toasts.</p>
    </div>
  `;
  root.appendChild(banner);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-5';

  // 1. SECCIÓN: BOTONES (Variantes y Tamaños)
  const buttonsBody = document.createElement('div');
  buttonsBody.className = 'space-y-4';

  const variantRow = document.createElement('div');
  variantRow.className = 'flex flex-wrap items-center gap-2';
  [
    { label: 'Primary', variant: 'primary', icon: 'sparkles' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Outline', variant: 'outline' },
    { label: 'Ghost', variant: 'ghost' },
    { label: 'Success', variant: 'success', icon: 'check' },
    { label: 'Warning', variant: 'warning', icon: 'warning' },
    { label: 'Danger', variant: 'danger', icon: 'trash' }
  ].forEach((cfg) => {
    variantRow.appendChild(
      createButton({
        label: cfg.label,
        variant: cfg.variant,
        icon: cfg.icon || null,
        size: 'sm',
        onClick: () => Toast.info(`Click en botón variante "${cfg.variant}"`)
      })
    );
  });

  const sizesRow = document.createElement('div');
  sizesRow.className = 'flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80';
  ['xs', 'sm', 'md', 'lg'].forEach((sz) => {
    sizesRow.appendChild(
      createButton({
        label: `Tamaño ${sz.toUpperCase()}`,
        variant: 'secondary',
        size: sz,
        onClick: () => Toast.info(`Botón tamaño ${sz}`)
      })
    );
  });

  buttonsBody.append(variantRow, sizesRow);
  grid.appendChild(
    createCard({
      header: '1. Botones Reutilizables (Button.js)',
      body: buttonsBody
    })
  );

  // 2. SECCIÓN: POPUPS / MODALES
  const modalsBody = document.createElement('div');
  modalsBody.className = 'space-y-3';
  modalsBody.innerHTML = `<p class="text-xs text-slate-400">Dispara diferentes tipos de Popups / Modales construidos con <code>Modal.js</code>:</p>`;

  const modalBtnGroup = document.createElement('div');
  modalBtnGroup.className = 'flex flex-wrap items-center gap-2';

  modalBtnGroup.append(
    createButton({
      label: 'Abrir Popup Informativo',
      icon: 'layers',
      variant: 'primary',
      size: 'sm',
      onClick: () => {
        let m = null;
        m = Modal.open({
          title: 'Popup de Demostración (Modal.open)',
          subtitle: 'Componente reutilizable con soporte para Escape y Backdrop click',
          size: 'md',
          content: `
            <div class="space-y-2 text-xs text-slate-300">
              <p>Este popup es renderizado dinámicamente usando <code>Modal.open()</code>.</p>
              <p>Se reutiliza en el Login de Admin, en el Marketplace de Utilidades y en la creación de notas.</p>
            </div>
          `,
          footer: [
            createButton({
              label: 'Entendido',
              variant: 'primary',
              size: 'sm',
              onClick: () => m?.close()
            })
          ]
        });
      }
    }),
    createButton({
      label: 'Abrir Popup Confirmación (Danger)',
      icon: 'warning',
      variant: 'danger',
      size: 'sm',
      onClick: () => {
        Modal.confirm({
          title: 'Confirmación de Prueba',
          message: 'Este es el popup reutilizable Modal.confirm() usado antes de acciones destructivas como eliminar notas.',
          confirmLabel: 'Confirmar prueba',
          variant: 'danger',
          onConfirm: () => Toast.success('Acción confirmada desde el Popup')
        });
      }
    }),
    createButton({
      label: 'Popup con Formulario',
      icon: 'edit',
      variant: 'outline',
      size: 'sm',
      onClick: () => {
        const form = document.createElement('div');
        form.className = 'space-y-3';
        const sampleIn = createInput({
          label: 'Nombre del recurso',
          placeholder: 'Ej. Nuevo servicio...'
        });
        form.appendChild(sampleIn);
        let ref = null;
        ref = Modal.open({
          title: 'Popup con Controles de Formulario',
          size: 'sm',
          content: form,
          footer: [
            createButton({ label: 'Cancelar', variant: 'secondary', size: 'sm', onClick: () => ref?.close() }),
            createButton({
              label: 'Enviar',
              variant: 'primary',
              size: 'sm',
              onClick: () => {
                Toast.success(`Valor enviado: ${sampleIn.getValue() || '(vacío)'}`);
                ref?.close();
              }
            })
          ]
        });
      }
    })
  );

  modalsBody.appendChild(modalBtnGroup);
  grid.appendChild(
    createCard({
      header: '2. Popups y Modales (Modal.js)',
      body: modalsBody
    })
  );

  // 3. SECCIÓN: DROPDOWNS
  const dropdownsBody = document.createElement('div');
  dropdownsBody.className = 'space-y-3';
  dropdownsBody.innerHTML = `<p class="text-xs text-slate-400">Menús desplegables con iconos, separadores, badges y cierre automático al hacer clic fuera:</p>`;

  const ddRow = document.createElement('div');
  ddRow.className = 'flex flex-wrap items-center gap-3';

  ddRow.append(
    createDropdown({
      label: 'Dropdown de Acciones',
      icon: 'sparkles',
      variant: 'primary',
      size: 'sm',
      items: [
        { header: 'Acciones de Prueba' },
        {
          label: 'Ejecutar diagnóstico',
          icon: 'terminal',
          badge: 'Ctrl+D',
          onClick: () => Toast.info('Diagnóstico ejecutado desde Dropdown')
        },
        {
          label: 'Sincronizar localStorage',
          icon: 'database',
          active: true,
          onClick: () => Toast.success('Sincronizado')
        },
        { divider: true },
        {
          label: 'Purgar caché temporal',
          icon: 'trash',
          danger: true,
          onClick: () => Toast.warning('Acción destructiva de prueba')
        }
      ]
    }),
    createDropdown({
      label: 'Selector de Entorno',
      icon: 'code',
      variant: 'outline',
      size: 'sm',
      items: [
        { label: 'Production (GitHub Pages)', active: true, badge: 'main', onClick: () => Toast.info('Entorno: Production') },
        { label: 'Staging Preview', badge: 'dev', onClick: () => Toast.info('Entorno: Staging') },
        { label: 'Localhost Development', badge: 'local', onClick: () => Toast.info('Entorno: Localhost') }
      ]
    })
  );

  dropdownsBody.appendChild(ddRow);
  grid.appendChild(
    createCard({
      header: '3. Menús Desplegables (Dropdown.js)',
      body: dropdownsBody
    })
  );

  // 4. SECCIÓN: TOASTS Y BADGES
  const feedbackBody = document.createElement('div');
  feedbackBody.className = 'space-y-4';

  const badgesWrap = document.createElement('div');
  badgesWrap.className = 'flex flex-wrap items-center gap-2';
  ['default', 'primary', 'success', 'warning', 'danger', 'info'].forEach((v) => {
    badgesWrap.appendChild(createBadge({ text: `Badge: ${v}`, variant: v }));
  });

  const toastsWrap = document.createElement('div');
  toastsWrap.className = 'flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80';
  toastsWrap.append(
    createButton({ label: 'Toast Success', variant: 'success', size: 'xs', onClick: () => Toast.success('Operación completada con éxito') }),
    createButton({ label: 'Toast Info', variant: 'primary', size: 'xs', onClick: () => Toast.info('Información del sistema') }),
    createButton({ label: 'Toast Warning', variant: 'warning', size: 'xs', onClick: () => Toast.warning('Advertencia de configuración') }),
    createButton({ label: 'Toast Error', variant: 'danger', size: 'xs', onClick: () => Toast.error('Error simulado de prueba') })
  );

  feedbackBody.append(badgesWrap, toastsWrap);
  grid.appendChild(
    createCard({
      header: '4. Badges y Notificaciones (Badge.js & Toast.js)',
      body: feedbackBody
    })
  );

  // 5. SECCIÓN: INPUTS Y FORMULARIOS
  const inputsBody = document.createElement('div');
  inputsBody.className = 'space-y-3';
  inputsBody.append(
    createInput({
      label: 'Input con Icono y Helper Text',
      placeholder: 'Buscar componente o utilidad...',
      icon: 'search',
      helperText: 'Soporta eventos onInput, onKeyDown y métodos getValue()/setValue().'
    }),
    createTextarea({
      label: 'Textarea Monoespaciado',
      value: '// Componente createTextarea({ mono: true })\nconst status = "ready";',
      rows: 3,
      mono: true
    })
  );
  grid.appendChild(
    createCard({
      header: '5. Controles de Entrada (Input.js)',
      body: inputsBody
    })
  );

  // 6. SECCIÓN: INSPECTOR DE LOCALSTORAGE (ADMIN)
  const storageBody = document.createElement('div');
  storageBody.className = 'space-y-2';
  const pre = document.createElement('pre');
  pre.className =
    'p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 custom-scrollbar';
  const refreshStorageView = () => {
    pre.textContent = JSON.stringify(StorageService.getAllAppData(), null, 2);
  };
  refreshStorageView();

  const refreshBtn = createButton({
    label: 'Refrescar Snapshot de localStorage',
    icon: 'database',
    variant: 'secondary',
    size: 'xs',
    onClick: () => {
      refreshStorageView();
      Toast.info('Snapshot actualizado');
    }
  });

  storageBody.append(refreshBtn, pre);
  grid.appendChild(
    createCard({
      header: '6. Inspector de Persistencia (localStorage)',
      body: storageBody
    })
  );

  root.appendChild(grid);
  container.appendChild(root);
}

/**
 * Abre el Catálogo de Componentes Visuales en un Modal amplio
 */
export function openAdminComponentsModal() {
  const container = document.createElement('div');
  renderAdminComponentsCatalog(container);

  let modalRef = null;
  modalRef = Modal.open({
    title: 'Panel de Administrador — Catálogo de Componentes Visuales',
    subtitle: 'Vista exclusiva para el rol Admin (admin)',
    size: 'full',
    content: container,
    footer: [
      createButton({
        label: 'Cerrar Catálogo',
        variant: 'secondary',
        size: 'sm',
        onClick: () => modalRef?.close()
      })
    ]
  });
}

/**
 * Definición como herramienta de panel para que el Admin también pueda abrirla en uno de los 6 paneles
 */
export const AdminComponentsTool = {
  id: 'admin-ui-kit',
  name: 'Admin: UI Components',
  description: 'Catálogo interactivo de Popups, Dropdowns, Botones, Inputs y estado de localStorage (Solo Admin).',
  category: 'Administración',
  icon: 'shield',
  adminOnly: true,
  defaultInstalled: true,

  mount(container) {
    renderAdminComponentsCatalog(container);
  }
};
