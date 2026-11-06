import { StorageService, STORAGE_KEYS } from '../core/storage.js';
import { events } from '../core/events.js';
import {
  createButton,
  createInput,
  createTextarea,
  createBadge,
  Modal,
  Toast,
  getIcon
} from '../components/ui/index.js';

const DEFAULT_NOTES = [
  {
    id: 'note-welcome',
    title: 'Bienvenido a AG-DevTool',
    content:
      'Este es el Notes Manager persistido en localStorage.\n\n- Puedes crear nuevas notas con título y contenido.\n- Editar cualquier nota existente en tiempo real o con el botón Guardar.\n- Eliminar notas con confirmación.\n- Abrir múltiples paneles (hasta 6) desde la barra superior.',
    updatedAt: new Date().toISOString()
  }
];

function loadNotes() {
  const saved = StorageService.get(STORAGE_KEYS.NOTES, null);
  if (!Array.isArray(saved)) {
    StorageService.set(STORAGE_KEYS.NOTES, DEFAULT_NOTES);
    return [...DEFAULT_NOTES];
  }
  return saved;
}

function saveNotes(notes) {
  StorageService.set(STORAGE_KEYS.NOTES, notes);
  events.emit('notes:updated', notes);
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export const NotesManagerTool = {
  id: 'notes-manager',
  name: 'Notes Manager',
  description:
    'Gestor de notas rápidas para desarrollo con título, contenido, búsqueda instantánea y persistencia en localStorage.',
  category: 'Productividad',
  icon: 'notes',
  defaultInstalled: true,

  mount(container) {
    let notes = loadNotes();
    let selectedNoteId = notes[0]?.id || null;
    let searchQuery = '';

    container.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'h-full w-full flex flex-col bg-slate-950/40 text-slate-200 overflow-hidden';

    // Barra superior de la utilidad
    const toolbar = document.createElement('div');
    toolbar.className =
      'px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0';

    const searchInput = createInput({
      placeholder: 'Buscar notas...',
      icon: 'search',
      className: 'w-44 sm:w-56',
      onInput: (val) => {
        searchQuery = val.toLowerCase();
        renderNotesList();
      }
    });
    searchInput.input.classList.replace('py-2', 'py-1.5');
    searchInput.input.classList.replace('text-sm', 'text-xs');

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'flex items-center gap-2';

    const countBadge = createBadge({
      text: `${notes.length} nota${notes.length === 1 ? '' : 's'}`,
      variant: 'primary'
    });

    const newNoteBtn = createButton({
      label: 'Nueva Nota',
      icon: 'plus',
      variant: 'primary',
      size: 'xs',
      onClick: () => openCreateNoteModal()
    });

    actionsWrap.appendChild(countBadge);
    actionsWrap.appendChild(newNoteBtn);
    toolbar.appendChild(searchInput);
    toolbar.appendChild(actionsWrap);

    // Cuerpo dividido: lista de notas + editor de nota activa
    const body = document.createElement('div');
    body.className = 'flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden';

    const listCol = document.createElement('div');
    listCol.className =
      'w-full md:w-5/12 max-h-48 md:max-h-none border-b md:border-b-0 md:border-r border-slate-800/80 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60 bg-slate-900/30';

    const editorCol = document.createElement('div');
    editorCol.className = 'flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-3.5 bg-slate-950/30';

    body.appendChild(listCol);
    body.appendChild(editorCol);

    root.appendChild(toolbar);
    root.appendChild(body);
    container.appendChild(root);

    function getFilteredNotes() {
      if (!searchQuery.trim()) return notes;
      return notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery) ||
          n.content.toLowerCase().includes(searchQuery)
      );
    }

    function renderNotesList() {
      countBadge.textContent = `${notes.length} nota${notes.length === 1 ? '' : 's'}`;
      const filtered = getFilteredNotes();
      listCol.innerHTML = '';

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'p-6 text-center text-xs text-slate-500';
        empty.innerHTML = `
          <div class="inline-flex p-2.5 rounded-full bg-slate-800/60 text-slate-400 mb-2">${getIcon('notes')}</div>
          <p>${notes.length === 0 ? 'No hay notas creadas aún.' : 'Sin resultados para tu búsqueda.'}</p>
        `;
        listCol.appendChild(empty);
        return;
      }

      filtered.forEach((note) => {
        const isSelected = note.id === selectedNoteId;
        const item = document.createElement('div');
        item.className = `p-3 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
          isSelected
            ? 'bg-indigo-600/15 border-l-2 border-l-indigo-500'
            : 'hover:bg-slate-800/40'
        }`;

        const info = document.createElement('div');
        info.className = 'min-w-0 flex-1';
        info.innerHTML = `
          <h4 class="text-xs font-semibold ${
            isSelected ? 'text-indigo-300' : 'text-slate-200'
          } truncate">${escapeHtml(note.title || 'Sin título')}</h4>
          <p class="text-[11px] text-slate-400 line-clamp-2 mt-0.5 break-words">${escapeHtml(
            note.content || 'Sin contenido...'
          )}</p>
          <span class="text-[10px] text-slate-500 mt-1 block">${formatDate(note.updatedAt)}</span>
        `;

        const delBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'trash',
          title: 'Eliminar nota',
          className: 'text-slate-500 hover:text-rose-400 p-1 shrink-0',
          onClick: (e) => {
            e.stopPropagation();
            confirmDeleteNote(note);
          }
        });

        item.addEventListener('click', () => {
          selectedNoteId = note.id;
          renderNotesList();
          renderEditor();
        });

        item.appendChild(info);
        item.appendChild(delBtn);
        listCol.appendChild(item);
      });
    }

    function renderEditor() {
      editorCol.innerHTML = '';
      const activeNote = notes.find((n) => n.id === selectedNoteId);

      if (!activeNote) {
        const placeholder = document.createElement('div');
        placeholder.className =
          'h-full flex flex-col items-center justify-center text-center p-6 text-slate-500';
        placeholder.innerHTML = `
          <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mb-3">${getIcon('notes')}</div>
          <p class="text-xs font-medium text-slate-300">Selecciona una nota o crea una nueva</p>
          <p class="text-[11px] text-slate-500 mt-1">Todas tus notas se guardan automáticamente en localStorage.</p>
        `;
        const createQuickBtn = createButton({
          label: 'Crear primera nota',
          icon: 'plus',
          variant: 'primary',
          size: 'sm',
          className: 'mt-3',
          onClick: () => openCreateNoteModal()
        });
        placeholder.appendChild(createQuickBtn);
        editorCol.appendChild(placeholder);
        return;
      }

      const headerBar = document.createElement('div');
      headerBar.className = 'flex items-center justify-between gap-2 mb-3';

      const statusSpan = document.createElement('span');
      statusSpan.className = 'text-[11px] text-slate-400';
      statusSpan.textContent = `Actualizado: ${formatDate(activeNote.updatedAt)}`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'flex items-center gap-1.5';

      const saveBtn = createButton({
        label: 'Guardar cambios',
        icon: 'save',
        variant: 'primary',
        size: 'xs',
        onClick: () => {
          const newTitle = titleField.getValue().trim() || 'Nota sin título';
          const newContent = contentField.getValue();
          activeNote.title = newTitle;
          activeNote.content = newContent;
          activeNote.updatedAt = new Date().toISOString();
          saveNotes(notes);
          Toast.success('Nota actualizada en localStorage');
        }
      });

      const deleteBtn = createButton({
        label: 'Eliminar',
        icon: 'trash',
        variant: 'danger',
        size: 'xs',
        onClick: () => confirmDeleteNote(activeNote)
      });

      btnGroup.appendChild(saveBtn);
      btnGroup.appendChild(deleteBtn);
      headerBar.appendChild(statusSpan);
      headerBar.appendChild(btnGroup);

      const titleField = createInput({
        label: 'Título de la nota',
        placeholder: 'Escribe un título descriptivo...',
        value: activeNote.title
      });

      const contentField = createTextarea({
        label: 'Contenido',
        placeholder: 'Escribe tus apuntes, snippets o tareas pendientes...',
        value: activeNote.content,
        rows: 8,
        className: 'mt-3 flex-1'
      });
      contentField.textarea.classList.add('h-full', 'min-h-[140px]');

      editorCol.appendChild(headerBar);
      editorCol.appendChild(titleField);
      editorCol.appendChild(contentField);
    }

    function openCreateNoteModal() {
      const formWrap = document.createElement('div');
      formWrap.className = 'flex flex-col gap-3';

      const titleInput = createInput({
        label: 'Título',
        placeholder: 'Ej. Comandos Git útiles, Idea de API...',
        required: true
      });

      const contentInput = createTextarea({
        label: 'Contenido',
        placeholder: 'Escribe el contenido de la nota...',
        rows: 6
      });

      formWrap.appendChild(titleInput);
      formWrap.appendChild(contentInput);

      let modalRef = null;
      const cancelBtn = createButton({
        label: 'Cancelar',
        variant: 'secondary',
        size: 'sm',
        onClick: () => modalRef?.close()
      });

      const createBtn = createButton({
        label: 'Crear Nota',
        icon: 'plus',
        variant: 'primary',
        size: 'sm',
        onClick: () => {
          const titleVal = titleInput.getValue().trim();
          const contentVal = contentInput.getValue().trim();
          if (!titleVal) {
            Toast.warning('Por favor ingresa un título para la nota');
            titleInput.input.focus();
            return;
          }
          const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: titleVal,
            content: contentVal,
            updatedAt: new Date().toISOString()
          };
          notes.unshift(newNote);
          selectedNoteId = newNote.id;
          saveNotes(notes);
          Toast.success('Nota creada correctamente');
          modalRef?.close();
        }
      });

      modalRef = Modal.open({
        title: 'Nueva Nota',
        subtitle: 'Se guardará automáticamente en el almacenamiento local del navegador.',
        size: 'md',
        content: formWrap,
        footer: [cancelBtn, createBtn]
      });

      setTimeout(() => titleInput.input.focus(), 50);
    }

    function confirmDeleteNote(note) {
      Modal.confirm({
        title: 'Eliminar nota',
        message: `¿Seguro que deseas eliminar la nota "${escapeHtml(note.title)}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Sí, eliminar',
        variant: 'danger',
        onConfirm: () => {
          notes = notes.filter((n) => n.id !== note.id);
          if (selectedNoteId === note.id) {
            selectedNoteId = notes[0]?.id || null;
          }
          saveNotes(notes);
          Toast.info('Nota eliminada');
        }
      });
    }

    const unsubscribe = events.on('notes:updated', (updatedNotes) => {
      notes = updatedNotes;
      if (!notes.some((n) => n.id === selectedNoteId)) {
        selectedNoteId = notes[0]?.id || null;
      }
      renderNotesList();
      renderEditor();
    });

    renderNotesList();
    renderEditor();

    return () => {
      unsubscribe();
    };
  }
};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
