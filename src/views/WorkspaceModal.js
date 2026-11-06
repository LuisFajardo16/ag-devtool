import {
  Modal,
  createButton,
  createBadge,
  createInput,
  Toast,
  getIcon
} from '../components/ui/index.js';
import { WorkspaceManager } from '../core/workspaceManager.js';

/**
 * Abre un popup rápido para crear un nuevo Workspace personalizado
 */
export function openCreateWorkspaceModal({ onCreated = null } = {}) {
  let modalRef = null;

  const form = document.createElement('div');
  form.className = 'space-y-3';

  const nameInput = createInput({
    label: 'Nombre del nuevo Workspace',
    placeholder: 'Ej. Proyecto Alpha, QA Team...',
    icon: 'briefcase',
    helperText: 'Tendrá acceso completo a las herramientas del Marketplace y persistirá en localStorage.',
    onKeyDown: (e) => {
      if (e.key === 'Enter') handleCreate();
    }
  });

  form.appendChild(nameInput);

  function handleCreate() {
    const res = WorkspaceManager.createWorkspace(nameInput.getValue(), {
      switchImmediately: true
    });
    if (!res.ok) {
      Toast.error(res.error);
      return;
    }
    Toast.success(`Workspace "${res.workspace.name}" creado y activado`);
    modalRef?.close();
    if (typeof onCreated === 'function') {
      onCreated(res.workspace);
    }
  }

  modalRef = Modal.open({
    title: 'Nuevo Workspace',
    subtitle: 'Crea un espacio de trabajo independiente con sus propios paneles y herramientas.',
    size: 'sm',
    content: form,
    footer: [
      createButton({
        label: 'Cancelar',
        variant: 'secondary',
        size: 'sm',
        onClick: () => modalRef?.close()
      }),
      createButton({
        label: 'Crear y Activar',
        icon: 'plus',
        variant: 'primary',
        size: 'sm',
        onClick: handleCreate
      })
    ]
  });

  setTimeout(() => nameInput.input?.focus(), 50);
}

/**
 * Abre el gestor completo de Workspaces (cambiar, crear nuevos y eliminar los creados por el usuario)
 */
export function openWorkspaceModal() {
  let modalRef = null;

  const container = document.createElement('div');
  container.className = 'space-y-5';

  // Formulario superior para agregar un nuevo Workspace
  const createBox = document.createElement('div');
  createBox.className =
    'p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5';

  const newNameInput = createInput({
    label: 'Agregar nuevo Workspace personalizado',
    placeholder: 'Escribe el nombre del nuevo workspace...',
    icon: 'briefcase',
    className: 'flex-1',
    onKeyDown: (e) => {
      if (e.key === 'Enter') addWorkspace();
    }
  });

  function addWorkspace() {
    const res = WorkspaceManager.createWorkspace(newNameInput.getValue(), {
      switchImmediately: true
    });
    if (!res.ok) {
      Toast.error(res.error);
      return;
    }
    newNameInput.setValue('');
    Toast.success(`Workspace "${res.workspace.name}" creado y activado`);
    renderList();
  }

  const addBtn = createButton({
    label: 'Crear Workspace',
    icon: 'plus',
    variant: 'primary',
    size: 'md',
    onClick: addWorkspace
  });

  createBox.append(newNameInput, addBtn);

  // Lista de Workspaces
  const listWrap = document.createElement('div');
  listWrap.className = 'space-y-2.5';

  container.append(createBox, listWrap);

  function renderList() {
    listWrap.innerHTML = '';
    const workspaces = WorkspaceManager.getWorkspaces();
    const activeId = WorkspaceManager.getActiveWorkspaceId();

    workspaces.forEach((ws) => {
      const isActive = ws.id === activeId;
      const wsToolsCount = ws.wsTools?.length || 0;

      const card = document.createElement('div');
      card.className = `p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
        isActive
          ? 'bg-indigo-950/25 border-indigo-500/50'
          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
      }`;

      const leftInfo = document.createElement('div');
      leftInfo.className = 'flex items-center gap-3 min-w-0';

      const iconBox = document.createElement('div');
      iconBox.className = `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
        isActive
          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          : 'bg-slate-800 text-slate-400 border-slate-700'
      }`;
      iconBox.innerHTML = getIcon('briefcase');

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0';

      const titleRow = document.createElement('div');
      titleRow.className = 'flex items-center gap-2 flex-wrap';

      const nameEl = document.createElement('h4');
      nameEl.className = 'text-sm font-semibold text-white truncate';
      nameEl.textContent = ws.name;
      titleRow.appendChild(nameEl);

      titleRow.appendChild(
        createBadge({
          text: ws.isSystem ? 'Sistema' : 'Usuario',
          variant: ws.isSystem ? 'info' : 'default'
        })
      );

      if (wsToolsCount > 0) {
        titleRow.appendChild(
          createBadge({
            text: `${wsToolsCount} WS Tool${wsToolsCount > 1 ? 's' : ''}`,
            variant: 'primary'
          })
        );
      }

      if (isActive) {
        titleRow.appendChild(
          createBadge({
            text: 'Activo',
            variant: 'success'
          })
        );
      }

      const descEl = document.createElement('p');
      descEl.className = 'text-[11px] text-slate-400 mt-0.5';
      descEl.textContent = ws.isSystem
        ? wsToolsCount > 0
          ? 'Workspace del sistema con WS Tools exclusivas preinstaladas + acceso al Market.'
          : 'Workspace por defecto del sistema con acceso a todas las herramientas del Market.'
        : 'Workspace creado por el usuario. Persistido en localStorage.';

      textWrap.append(titleRow, descEl);
      leftInfo.append(iconBox, textWrap);

      const rightActions = document.createElement('div');
      rightActions.className = 'flex items-center gap-2 shrink-0';

      if (!isActive) {
        rightActions.appendChild(
          createButton({
            label: 'Cambiar aquí',
            variant: 'secondary',
            size: 'xs',
            onClick: () => {
              WorkspaceManager.setActiveWorkspace(ws.id);
              Toast.info(`Cambiado al workspace "${ws.name}"`);
              renderList();
            }
          })
        );
      }

      if (!ws.isSystem) {
        rightActions.appendChild(
          createButton({
            label: 'Quitar',
            icon: 'trash',
            variant: 'danger',
            size: 'xs',
            title: 'Eliminar este workspace personalizado',
            onClick: () => {
              Modal.confirm({
                title: 'Eliminar Workspace',
                message: `¿Estás seguro de eliminar el workspace "${ws.name}"? Esta acción quitará su configuración de paneles guardada.`,
                confirmLabel: 'Eliminar',
                variant: 'danger',
                onConfirm: () => {
                  const res = WorkspaceManager.deleteWorkspace(ws.id);
                  if (res.ok) {
                    Toast.info(`Workspace "${ws.name}" eliminado`);
                    renderList();
                  } else {
                    Toast.error(res.error);
                  }
                }
              });
            }
          })
        );
      }

      card.append(leftInfo, rightActions);
      listWrap.appendChild(card);
    });
  }

  renderList();

  modalRef = Modal.open({
    title: 'Gestión de Workspaces',
    subtitle:
      'Cambia entre espacios de trabajo, crea nuevos o elimina los agregados por el usuario. Los definidos por el sistema están protegidos.',
    size: 'lg',
    content: container,
    footer: [
      createButton({
        label: 'Cerrar',
        variant: 'secondary',
        size: 'sm',
        onClick: () => modalRef?.close()
      })
    ]
  });
}
