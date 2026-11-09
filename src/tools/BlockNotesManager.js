import { StorageService, STORAGE_KEYS } from '../core/storage.js';
import { events } from '../core/events.js';
import {
  createButton,
  createInput,
  createBadge,
  createDropdown,
  createBlockEditor,
  Modal,
  Toast,
  getIcon
} from '../components/ui/index.js';

const PROPERTY_TYPES = [
  { id: 'texto', label: 'Texto', icon: 'type' },
  { id: 'fecha', label: 'Fecha', icon: 'calendar' },
  { id: 'tags', label: 'Tags', icon: 'tag' }
];

const TAG_VARIANTS = [
  { id: 'primary', label: 'Índigo' },
  { id: 'success', label: 'Esmeralda' },
  { id: 'warning', label: 'Ámbar' },
  { id: 'danger', label: 'Rosa' },
  { id: 'info', label: 'Cielo' },
  { id: 'default', label: 'Gris' }
];

const DEFAULT_STATE = {
  tags: [
    { id: 'tag-arch', name: 'Arquitectura', variant: 'primary' },
    { id: 'tag-ui', name: 'UI System', variant: 'info' },
    { id: 'tag-ready', name: 'Completado', variant: 'success' },
    { id: 'tag-urgent', name: 'Prioridad Alta', variant: 'warning' }
  ],
  directories: [
    { id: 'dir-general', name: 'General', parentId: null },
    { id: 'dir-projects', name: 'Proyectos & Diseño', parentId: null },
    { id: 'dir-snippets', name: 'Snippets Técnicos', parentId: 'dir-projects' }
  ],
  notes: [
    {
      id: 'bnote-welcome',
      directoryId: 'dir-general',
      title: 'Guía del Editor de Notas por Bloques',
      description:
        'Nota estructurada con bloques tipo Notion, propiedades tipadas (texto, fecha, tags) y soporte multicolumna.',
      properties: [
        { id: 'prop-1', name: 'Autor', type: 'texto', value: 'Equipo AG-DevTool' },
        { id: 'prop-2', name: 'Fecha de entrega', type: 'fecha', value: '2026-11-09' },
        { id: 'prop-3', name: 'Categorías', type: 'tags', value: ['tag-arch', 'tag-ui'] }
      ],
      blocks: [
        {
          id: 'blk-intro-h1',
          columns: 1,
          type: 'h1',
          color: 'indigo',
          content: 'Bienvenido al Gestor de Notas por Bloques'
        },
        {
          id: 'blk-intro-p',
          columns: 1,
          type: 'p',
          color: 'default',
          content:
            'Este editor reutilizable (BlockEditor.js) permite construir notas modulares combinando texto, encabezados, código (una línea o bloque), links (URL o Bookmark), imágenes y separadores en 1, 2 o 3 columnas.'
        },
        {
          id: 'blk-2cols',
          columns: 2,
          cells: [
            {
              id: 'cell-c1',
              type: 'quote',
              color: 'emerald',
              content:
                'Columna 1: Puedes dividir cualquier bloque de 1 a 3 columnas desde su barra superior.',
              meta: {}
            },
            {
              id: 'cell-c2',
              type: 'code-line',
              color: 'amber',
              content: 'createBlockEditor({ initialBlocks, onChange })',
              meta: { language: 'javascript' }
            }
          ]
        },
        {
          id: 'blk-divider',
          columns: 1,
          type: 'divider',
          color: 'default',
          content: ''
        },
        {
          id: 'blk-code-sample',
          columns: 1,
          type: 'code-block',
          color: 'default',
          content:
            '// Ejemplo de bloque de código multilínea\nexport function initFeature() {\n  console.log("Block Editor listo para todos los tools");\n}',
          meta: { language: 'javascript' }
        },
        {
          id: 'blk-bookmark',
          columns: 1,
          type: 'link-bookmark',
          color: 'sky',
          content: '',
          meta: {
            url: 'https://developer.mozilla.org/es/',
            title: 'MDN Web Docs — Documentación Web',
            description: 'Recursos para desarrolladores sobre JavaScript ES Modules, HTML5 y CSS.'
          }
        }
      ],
      updatedAt: new Date().toISOString()
    }
  ]
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadState() {
  const saved = StorageService.get(STORAGE_KEYS.BLOCK_NOTES_MANAGER, null);
  if (!saved || typeof saved !== 'object') {
    const copy = JSON.parse(JSON.stringify(DEFAULT_STATE));
    StorageService.set(STORAGE_KEYS.BLOCK_NOTES_MANAGER, copy);
    return copy;
  }
  return {
    tags: Array.isArray(saved.tags) ? saved.tags : [...DEFAULT_STATE.tags],
    directories: Array.isArray(saved.directories)
      ? saved.directories
      : [...DEFAULT_STATE.directories],
    notes: Array.isArray(saved.notes) ? saved.notes : [...DEFAULT_STATE.notes]
  };
}

function saveState(state) {
  StorageService.set(STORAGE_KEYS.BLOCK_NOTES_MANAGER, state);
  events.emit('block-notes:updated', state);
}

export const BlockNotesManagerTool = {
  id: 'block-notes-manager',
  name: 'Block Notes & Directories',
  description:
    'Gestor de notas y directorios basado en bloques estilo Notion (texto, código, links, imagen, divider, 1-3 columnas) con propiedades (texto, fecha, tags) y gestor de tags.',
  category: 'Productividad',
  icon: 'blocks',
  defaultInstalled: true,

  mount(container) {
    let state = loadState();
    let selectedDirectoryId = 'all';
    let selectedNoteId = state.notes[0]?.id || null;
    let searchQuery = '';

    container.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'h-full w-full flex flex-col bg-slate-950/40 text-slate-200 overflow-hidden';

    // Barra superior del tool
    const topToolbar = document.createElement('div');
    topToolbar.className =
      'px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0';

    const searchInput = createInput({
      placeholder: 'Buscar nota por título o descripción...',
      icon: 'search',
      className: 'w-48 sm:w-64',
      onInput: (val) => {
        searchQuery = val.toLowerCase();
        renderSidebar();
      }
    });
    searchInput.input.classList.replace('py-2', 'py-1.5');
    searchInput.input.classList.replace('text-sm', 'text-xs');

    const toolbarActions = document.createElement('div');
    toolbarActions.className = 'flex items-center gap-1.5 flex-wrap';

    const newDirBtn = createButton({
      label: 'Directorio',
      icon: 'folderPlus',
      variant: 'secondary',
      size: 'xs',
      onClick: () => openCreateDirectoryModal()
    });

    const newNoteBtn = createButton({
      label: 'Nueva Nota',
      icon: 'plus',
      variant: 'primary',
      size: 'xs',
      onClick: () => createNewNote(selectedDirectoryId === 'all' ? state.directories[0]?.id : selectedDirectoryId)
    });

    toolbarActions.append(newDirBtn, newNoteBtn);
    topToolbar.append(searchInput, toolbarActions);

    // Layout principal: Sidebar (Directorios + Notas + Apartado de Tags) + Área Principal (Header + BlockEditor)
    const mainBody = document.createElement('div');
    mainBody.className = 'flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden';

    const sidebarCol = document.createElement('div');
    sidebarCol.className =
      'w-full md:w-72 lg:w-80 max-h-64 md:max-h-none border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-900/35 flex flex-col min-h-0 overflow-y-auto custom-scrollbar shrink-0';

    const contentCol = document.createElement('div');
    contentCol.className =
      'flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-slate-950/30';

    mainBody.append(sidebarCol, contentCol);
    root.append(topToolbar, mainBody);
    container.appendChild(root);

    function getDirectoryPath(dirId) {
      if (!dirId) return 'Sin directorio';
      const parts = [];
      let current = state.directories.find((d) => d.id === dirId);
      let guard = 0;
      while (current && guard < 10) {
        parts.unshift(current.name);
        current = state.directories.find((d) => d.id === current.parentId);
        guard++;
      }
      return parts.join(' / ') || 'Sin directorio';
    }

    function getFilteredNotes() {
      return state.notes.filter((note) => {
        const matchesDir =
          selectedDirectoryId === 'all' || note.directoryId === selectedDirectoryId;
        if (!matchesDir) return false;
        if (!searchQuery.trim()) return true;
        return (
          (note.title || '').toLowerCase().includes(searchQuery) ||
          (note.description || '').toLowerCase().includes(searchQuery)
        );
      });
    }

    // Renderiza la columna izquierda: 1) Directorios, 2) Notas del directorio, 3) Apartado de Tags
    function renderSidebar() {
      sidebarCol.innerHTML = '';

      // SECCIÓN 1: DIRECTORIOS
      const dirsSection = document.createElement('div');
      dirsSection.className = 'p-3 border-b border-slate-800/80 space-y-1.5';

      const dirsHeader = document.createElement('div');
      dirsHeader.className = 'flex items-center justify-between mb-1';
      dirsHeader.innerHTML = `
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          ${getIcon('folderTree')} Directorios
        </span>
      `;
      const addDirIconBtn = createButton({
        icon: 'folderPlus',
        variant: 'ghost',
        size: 'xs',
        title: 'Nuevo directorio',
        onClick: () => openCreateDirectoryModal()
      });
      dirsHeader.appendChild(addDirIconBtn);
      dirsSection.appendChild(dirsHeader);

      // Opción "Todas las notas"
      const allRow = document.createElement('button');
      allRow.type = 'button';
      allRow.className = `w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
        selectedDirectoryId === 'all'
          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
          : 'text-slate-300 hover:bg-slate-800/60'
      }`;
      allRow.innerHTML = `
        <span class="flex items-center gap-2 truncate">${getIcon('layers')} <span>Todas las notas</span></span>
        <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">${state.notes.length}</span>
      `;
      allRow.addEventListener('click', () => {
        selectedDirectoryId = 'all';
        renderSidebar();
      });
      dirsSection.appendChild(allRow);

      // Renderizar árbol jerárquico de directorios
      const renderDirTree = (parentId = null, depth = 0) => {
        const children = state.directories.filter((d) => (d.parentId || null) === parentId);
        children.forEach((dir) => {
          const isSelected = selectedDirectoryId === dir.id;
          const dirNotesCount = state.notes.filter((n) => n.directoryId === dir.id).length;
          const row = document.createElement('div');
          row.style.paddingLeft = `${Math.min(depth * 12, 36) + 8}px`;
          row.className = `group pr-1.5 py-1 rounded-lg text-xs flex items-center justify-between gap-1 transition-colors cursor-pointer ${
            isSelected
              ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`;

          const labelSpan = document.createElement('span');
          labelSpan.className = 'flex items-center gap-1.5 truncate flex-1';
          labelSpan.innerHTML = `<span class="text-amber-400/90 shrink-0">${getIcon(
            'folder'
          )}</span> <span class="truncate">${escapeHtml(dir.name)}</span>`;

          const rightBox = document.createElement('div');
          rightBox.className = 'flex items-center gap-1 shrink-0';

          const countSpan = document.createElement('span');
          countSpan.className = 'text-[10px] px-1.5 rounded bg-slate-800/90 text-slate-400';
          countSpan.textContent = String(dirNotesCount);
          rightBox.appendChild(countSpan);

          if (state.directories.length > 1) {
            const delDirBtn = createButton({
              icon: 'trash',
              variant: 'ghost',
              size: 'xs',
              title: 'Eliminar directorio',
              className: 'opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400',
              onClick: (e) => {
                e.stopPropagation();
                confirmDeleteDirectory(dir);
              }
            });
            rightBox.appendChild(delDirBtn);
          }

          row.addEventListener('click', () => {
            selectedDirectoryId = dir.id;
            renderSidebar();
          });

          row.append(labelSpan, rightBox);
          dirsSection.appendChild(row);
          renderDirTree(dir.id, depth + 1);
        });
      };

      renderDirTree(null, 0);
      sidebarCol.appendChild(dirsSection);

      // SECCIÓN 2: LISTA DE NOTAS
      const notesSection = document.createElement('div');
      notesSection.className = 'p-3 border-b border-slate-800/80 flex-1 space-y-2';

      const notesHeader = document.createElement('div');
      notesHeader.className = 'flex items-center justify-between';
      const filteredNotes = getFilteredNotes();
      notesHeader.innerHTML = `
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          ${getIcon('fileText')} Notas (${filteredNotes.length})
        </span>
      `;
      notesSection.appendChild(notesHeader);

      if (filteredNotes.length === 0) {
        const emptyNotes = document.createElement('div');
        emptyNotes.className =
          'p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500';
        emptyNotes.textContent = 'No hay notas en este directorio.';
        notesSection.appendChild(emptyNotes);
      } else {
        const listWrap = document.createElement('div');
        listWrap.className = 'space-y-1.5';

        filteredNotes.forEach((note) => {
          const active = note.id === selectedNoteId;
          const card = document.createElement('div');
          card.className = `p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
            active
              ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700'
          }`;

          const info = document.createElement('div');
          info.className = 'min-w-0 flex-1';
          const dirName = getDirectoryPath(note.directoryId);
          info.innerHTML = `
            <div class="text-xs font-semibold ${
              active ? 'text-indigo-300' : 'text-slate-200'
            } truncate">${escapeHtml(note.title || 'Nota sin título')}</div>
            <div class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(
              note.description || 'Sin descripción'
            )}</div>
            <div class="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
              <span class="truncate">${escapeHtml(dirName)}</span>
              <span>•</span>
              <span>${(note.blocks || []).length} bloques</span>
            </div>
          `;

          const delBtn = createButton({
            icon: 'trash',
            variant: 'ghost',
            size: 'xs',
            title: 'Eliminar nota',
            className: 'text-slate-500 hover:text-rose-400 p-1 shrink-0',
            onClick: (e) => {
              e.stopPropagation();
              confirmDeleteNote(note);
            }
          });

          card.addEventListener('click', () => {
            selectedNoteId = note.id;
            renderSidebar();
            renderActiveNote();
          });

          card.append(info, delBtn);
          listWrap.appendChild(card);
        });

        notesSection.appendChild(listWrap);
      }
      sidebarCol.appendChild(notesSection);

      // SECCIÓN 3: APARTADO PARA AGREGAR Y GESTIONAR TAGS DE LAS PROPIEDADES
      const tagsSection = document.createElement('div');
      tagsSection.className = 'p-3 bg-slate-950/60 space-y-2.5';

      const tagsHeader = document.createElement('div');
      tagsHeader.className = 'flex items-center justify-between';
      tagsHeader.innerHTML = `
        <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
          ${getIcon('tag')} Tags para Properties
        </span>
        <span class="text-[10px] text-slate-500">${state.tags.length} disponibles</span>
      `;
      tagsSection.appendChild(tagsHeader);

      // Lista de tags actuales con opción de borrar
      const tagsList = document.createElement('div');
      tagsList.className = 'flex flex-wrap items-center gap-1.5';

      if (state.tags.length === 0) {
        const noTags = document.createElement('span');
        noTags.className = 'text-[11px] text-slate-500 italic';
        noTags.textContent = 'Agrega tags abajo para usarlos en las propiedades de tus notas.';
        tagsList.appendChild(noTags);
      } else {
        state.tags.forEach((tag) => {
          const pill = document.createElement('div');
          pill.className = 'inline-flex items-center gap-1';
          const badge = createBadge({
            text: tag.name,
            variant: tag.variant || 'primary'
          });
          const removeTagBtn = document.createElement('button');
          removeTagBtn.type = 'button';
          removeTagBtn.title = `Eliminar tag "${tag.name}"`;
          removeTagBtn.className =
            'text-slate-500 hover:text-rose-400 text-[10px] px-1 rounded cursor-pointer';
          removeTagBtn.textContent = '×';
          removeTagBtn.addEventListener('click', () => {
            state.tags = state.tags.filter((t) => t.id !== tag.id);
            // Limpiar el tag eliminado de las propiedades tipo tags en las notas
            state.notes.forEach((n) => {
              (n.properties || []).forEach((p) => {
                if (p.type === 'tags' && Array.isArray(p.value)) {
                  p.value = p.value.filter((id) => id !== tag.id);
                }
              });
            });
            saveState(state);
            renderSidebar();
            renderActiveNote();
            Toast.info(`Tag "${tag.name}" eliminado`);
          });
          pill.append(badge, removeTagBtn);
          tagsList.appendChild(pill);
        });
      }
      tagsSection.appendChild(tagsList);

      // Formulario rápido para crear un nuevo Tag
      const newTagForm = document.createElement('div');
      newTagForm.className = 'flex flex-col gap-1.5 pt-1 border-t border-slate-800/80';

      const newTagRow = document.createElement('div');
      newTagRow.className = 'flex items-center gap-1.5';

      const tagNameInput = document.createElement('input');
      tagNameInput.type = 'text';
      tagNameInput.placeholder = 'Nuevo tag (ej. Backend)...';
      tagNameInput.className =
        'flex-1 min-w-0 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';

      const tagColorSelect = document.createElement('select');
      tagColorSelect.className =
        'bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500';
      TAG_VARIANTS.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.label;
        tagColorSelect.appendChild(opt);
      });

      const addTagBtn = createButton({
        icon: 'plus',
        label: 'Crear',
        variant: 'primary',
        size: 'xs',
        onClick: () => {
          const clean = tagNameInput.value.trim();
          if (!clean) {
            Toast.warning('Ingresa un nombre para el tag');
            tagNameInput.focus();
            return;
          }
          if (state.tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
            Toast.warning('Ya existe un tag con ese nombre');
            return;
          }
          state.tags.push({
            id: uid('tag'),
            name: clean,
            variant: tagColorSelect.value || 'primary'
          });
          tagNameInput.value = '';
          saveState(state);
          renderSidebar();
          renderActiveNote();
          Toast.success(`Tag "${clean}" agregado`);
        }
      });

      tagNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTagBtn.click();
        }
      });

      newTagRow.append(tagNameInput, tagColorSelect, addTagBtn);
      newTagForm.appendChild(newTagRow);
      tagsSection.appendChild(newTagForm);

      sidebarCol.appendChild(tagsSection);
    }

    // Renderiza la nota seleccionada: Header (Title, Description, Properties de 3 tipos) + BlockEditor
    function renderActiveNote() {
      contentCol.innerHTML = '';
      const activeNote = state.notes.find((n) => n.id === selectedNoteId);

      if (!activeNote) {
        const empty = document.createElement('div');
        empty.className =
          'h-full flex flex-col items-center justify-center text-center p-8 text-slate-500';
        empty.innerHTML = `
          <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 mb-3">${getIcon(
            'blocks'
          )}</div>
          <p class="text-sm font-semibold text-slate-300">Selecciona una nota o crea una nueva</p>
          <p class="text-xs text-slate-500 mt-1">Usa bloques tipo Notion, directorios y propiedades personalizadas.</p>
        `;
        const btn = createButton({
          label: 'Crear nota ahora',
          icon: 'plus',
          variant: 'primary',
          size: 'sm',
          className: 'mt-3',
          onClick: () => createNewNote(state.directories[0]?.id)
        });
        empty.appendChild(btn);
        contentCol.appendChild(empty);
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5';

      // ==========================================
      // HEADER DE LA NOTA: Directorio + Title + Description + Properties (texto | fecha | tags)
      // ==========================================
      const headerCard = document.createElement('div');
      headerCard.className =
        'p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-4';

      // Fila superior del header: Selector de Directorio + Estado guardado
      const metaTopBar = document.createElement('div');
      metaTopBar.className = 'flex flex-wrap items-center justify-between gap-2';

      const dirPickerWrap = document.createElement('div');
      dirPickerWrap.className = 'flex items-center gap-2 text-xs text-slate-400';
      dirPickerWrap.innerHTML = `${getIcon('folder')} <span>Directorio:</span>`;

      const dirSelect = document.createElement('select');
      dirSelect.className =
        'bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500';
      state.directories.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = getDirectoryPath(d.id);
        if (activeNote.directoryId === d.id) opt.selected = true;
        dirSelect.appendChild(opt);
      });
      dirSelect.addEventListener('change', (e) => {
        activeNote.directoryId = e.target.value;
        activeNote.updatedAt = new Date().toISOString();
        saveState(state);
        renderSidebar();
        Toast.info('Nota movida de directorio');
      });
      dirPickerWrap.appendChild(dirSelect);

      const statusBadge = createBadge({
        text: 'Guardado automático en localStorage',
        variant: 'default'
      });

      metaTopBar.append(dirPickerWrap, statusBadge);
      headerCard.appendChild(metaTopBar);

      // TITLE & DESCRIPTION
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = activeNote.title || '';
      titleInput.placeholder = 'Título de la nota...';
      titleInput.className =
        'w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-slate-600 outline-none border-b border-transparent focus:border-indigo-500/50 pb-1 transition-colors';
      titleInput.addEventListener('input', (e) => {
        activeNote.title = e.target.value;
        activeNote.updatedAt = new Date().toISOString();
        saveState(state);
        renderSidebar();
      });

      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.value = activeNote.description || '';
      descInput.placeholder = 'Agrega una descripción breve para esta nota...';
      descInput.className =
        'w-full bg-transparent text-xs sm:text-sm text-slate-300 placeholder-slate-500 outline-none border-b border-slate-800/80 focus:border-indigo-500/50 pb-2 transition-colors';
      descInput.addEventListener('input', (e) => {
        activeNote.description = e.target.value;
        activeNote.updatedAt = new Date().toISOString();
        saveState(state);
        renderSidebar();
      });

      headerCard.append(titleInput, descInput);

      // PROPIEDADES (Únicamente: texto, fecha, tags)
      const propsContainer = document.createElement('div');
      propsContainer.className = 'pt-1 space-y-2.5';

      const propsTitleRow = document.createElement('div');
      propsTitleRow.className = 'flex flex-wrap items-center justify-between gap-2';
      propsTitleRow.innerHTML = `
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Propiedades (Texto · Fecha · Tags)
        </span>
      `;

      // Dropdown / Modal para agregar propiedad de uno de los 3 tipos permitidos
      const addPropDropdown = createDropdown({
        label: '+ Agregar propiedad',
        icon: 'plus',
        variant: 'secondary',
        size: 'xs',
        items: [
          { header: 'Selecciona el tipo de propiedad' },
          ...PROPERTY_TYPES.map((pt) => ({
            label: `Propiedad de ${pt.label}`,
            icon: pt.icon,
            badge: pt.id,
            onClick: () => openAddPropertyModal(activeNote, pt.id)
          }))
        ]
      });

      propsTitleRow.appendChild(addPropDropdown);
      propsContainer.appendChild(propsTitleRow);

      const propsList = document.createElement('div');
      propsList.className = 'divide-y divide-slate-800/60 rounded-xl bg-slate-950/60 border border-slate-800/80';

      if (!Array.isArray(activeNote.properties)) {
        activeNote.properties = [];
      }

      if (activeNote.properties.length === 0) {
        const emptyProps = document.createElement('div');
        emptyProps.className = 'p-3 text-xs text-slate-500 italic';
        emptyProps.textContent =
          'Sin propiedades aún. Usa "+ Agregar propiedad" para añadir campos de texto, fecha o tags.';
        propsList.appendChild(emptyProps);
      } else {
        activeNote.properties.forEach((prop, propIdx) => {
          const propRow = document.createElement('div');
          propRow.className =
            'px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

          // Nombre y tipo de la propiedad
          const propLabelBox = document.createElement('div');
          propLabelBox.className = 'flex items-center gap-2 sm:w-48 shrink-0';

          const typeIconMap = {
            texto: 'type',
            fecha: 'calendar',
            tags: 'tag'
          };
          const iconSpan = document.createElement('span');
          iconSpan.className = 'text-indigo-400 shrink-0';
          iconSpan.innerHTML = getIcon(typeIconMap[prop.type] || 'type');

          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.value = prop.name || '';
          nameInput.placeholder = 'Nombre propiedad...';
          nameInput.className =
            'bg-transparent text-xs font-medium text-slate-300 focus:text-white outline-none border-b border-transparent focus:border-indigo-500/60 w-full truncate';
          nameInput.addEventListener('input', (e) => {
            prop.name = e.target.value;
            saveState(state);
          });

          const typeBadge = createBadge({
            text: prop.type,
            variant: 'default',
            className: 'text-[9px] uppercase px-1.5 py-0'
          });

          propLabelBox.append(iconSpan, nameInput, typeBadge);

          // Valor según el tipo (únicamente texto | fecha | tags)
          const propValueBox = document.createElement('div');
          propValueBox.className = 'flex-1 flex items-center justify-between gap-2 min-w-0';

          if (prop.type === 'texto') {
            const valInput = document.createElement('input');
            valInput.type = 'text';
            valInput.value = prop.value || '';
            valInput.placeholder = 'Escribe un valor de texto...';
            valInput.className =
              'w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none';
            valInput.addEventListener('input', (e) => {
              prop.value = e.target.value;
              activeNote.updatedAt = new Date().toISOString();
              saveState(state);
            });
            propValueBox.appendChild(valInput);
          } else if (prop.type === 'fecha') {
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = prop.value || '';
            dateInput.className =
              'bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none';
            dateInput.addEventListener('input', (e) => {
              prop.value = e.target.value;
              activeNote.updatedAt = new Date().toISOString();
              saveState(state);
            });
            propValueBox.appendChild(dateInput);
          } else if (prop.type === 'tags') {
            const selectedTagIds = Array.isArray(prop.value) ? prop.value : [];
            const tagsWrap = document.createElement('div');
            tagsWrap.className = 'flex flex-wrap items-center gap-1.5 flex-1';

            selectedTagIds.forEach((tagId) => {
              const tagObj = state.tags.find((t) => t.id === tagId);
              if (!tagObj) return;
              const chip = document.createElement('span');
              chip.className = 'inline-flex items-center gap-1';
              const b = createBadge({
                text: tagObj.name,
                variant: tagObj.variant || 'primary'
              });
              const unassignBtn = document.createElement('button');
              unassignBtn.type = 'button';
              unassignBtn.textContent = '×';
              unassignBtn.title = 'Quitar tag de esta propiedad';
              unassignBtn.className =
                'text-slate-500 hover:text-rose-400 text-xs px-0.5 cursor-pointer';
              unassignBtn.addEventListener('click', () => {
                prop.value = selectedTagIds.filter((id) => id !== tagId);
                activeNote.updatedAt = new Date().toISOString();
                saveState(state);
                renderActiveNote();
              });
              chip.append(b, unassignBtn);
              tagsWrap.appendChild(chip);
            });

            // Dropdown para asignar/desasignar tags creados en el apartado de Tags
            const tagSelector = createDropdown({
              label: '+ Asignar Tag',
              icon: 'tag',
              variant: 'ghost',
              size: 'xs',
              items:
                state.tags.length === 0
                  ? [
                      {
                        label: 'Crea tags en el panel izquierdo primero',
                        onClick: () => Toast.info('Usa el apartado "Tags para Properties" a la izquierda')
                      }
                    ]
                  : [
                      { header: 'Tags Disponibles' },
                      ...state.tags.map((t) => {
                        const isAssigned = selectedTagIds.includes(t.id);
                        return {
                          label: t.name,
                          icon: 'tag',
                          active: isAssigned,
                          onClick: () => {
                            if (isAssigned) {
                              prop.value = selectedTagIds.filter((id) => id !== t.id);
                            } else {
                              prop.value = [...selectedTagIds, t.id];
                            }
                            activeNote.updatedAt = new Date().toISOString();
                            saveState(state);
                            renderActiveNote();
                          }
                        };
                      })
                    ]
            });

            tagsWrap.appendChild(tagSelector);
            propValueBox.appendChild(tagsWrap);
          }

          const delPropBtn = createButton({
            icon: 'trash',
            variant: 'ghost',
            size: 'xs',
            title: 'Eliminar propiedad',
            className: 'text-slate-500 hover:text-rose-400 shrink-0',
            onClick: () => {
              activeNote.properties.splice(propIdx, 1);
              activeNote.updatedAt = new Date().toISOString();
              saveState(state);
              renderActiveNote();
            }
          });

          propValueBox.appendChild(delPropBtn);
          propRow.append(propLabelBox, propValueBox);
          propsList.appendChild(propRow);
        });
      }

      propsContainer.appendChild(propsList);
      headerCard.appendChild(propsContainer);
      wrapper.appendChild(headerCard);

      // ==========================================
      // CONTENIDO DE LA NOTA: Componente de Sistema BlockEditor
      // ==========================================
      const editorSection = document.createElement('div');
      editorSection.className = 'space-y-2';

      const editorInstance = createBlockEditor({
        initialBlocks: activeNote.blocks || [],
        onChange: (updatedBlocks) => {
          activeNote.blocks = updatedBlocks;
          activeNote.updatedAt = new Date().toISOString();
          saveState(state);
        }
      });

      editorSection.appendChild(editorInstance.element);
      wrapper.appendChild(editorSection);
      contentCol.appendChild(wrapper);
    }

    function openAddPropertyModal(note, defaultType = 'texto') {
      const form = document.createElement('div');
      form.className = 'space-y-3';

      const nameField = createInput({
        label: 'Nombre de la propiedad',
        placeholder: 'Ej. Estado, Fecha límite, Etiquetas...',
        required: true
      });

      const typeWrap = document.createElement('div');
      typeWrap.className = 'flex flex-col gap-1.5';
      typeWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Tipo de propiedad (Solo 3 tipos permitidos)</label>`;

      const typeSelect = document.createElement('select');
      typeSelect.className =
        'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500';
      PROPERTY_TYPES.forEach((pt) => {
        const opt = document.createElement('option');
        opt.value = pt.id;
        opt.textContent = `${pt.label} (${pt.id})`;
        if (pt.id === defaultType) opt.selected = true;
        typeSelect.appendChild(opt);
      });
      typeWrap.appendChild(typeSelect);

      form.append(nameField, typeWrap);

      let modalRef = null;
      modalRef = Modal.open({
        title: 'Agregar Propiedad a la Nota',
        subtitle: 'Las propiedades soportan únicamente los tipos: texto, fecha y tags.',
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
            label: 'Agregar Propiedad',
            icon: 'plus',
            variant: 'primary',
            size: 'sm',
            onClick: () => {
              const propName = nameField.getValue().trim();
              const propType = typeSelect.value;
              if (!propName) {
                Toast.warning('Ingresa un nombre para la propiedad');
                nameField.input.focus();
                return;
              }
              if (!PROPERTY_TYPES.some((t) => t.id === propType)) {
                Toast.error('Tipo de propiedad no válido');
                return;
              }
              note.properties = Array.isArray(note.properties) ? note.properties : [];
              note.properties.push({
                id: uid('prop'),
                name: propName,
                type: propType,
                value: propType === 'tags' ? [] : ''
              });
              note.updatedAt = new Date().toISOString();
              saveState(state);
              renderActiveNote();
              modalRef?.close();
              Toast.success(`Propiedad "${propName}" (${propType}) agregada`);
            }
          })
        ]
      });

      setTimeout(() => nameField.input.focus(), 50);
    }

    function openCreateDirectoryModal() {
      const form = document.createElement('div');
      form.className = 'space-y-3';

      const nameIn = createInput({
        label: 'Nombre del directorio',
        placeholder: 'Ej. Documentación de API, Sprint 14...',
        required: true
      });

      const parentWrap = document.createElement('div');
      parentWrap.className = 'flex flex-col gap-1.5';
      parentWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Directorio padre (opcional)</label>`;

      const parentSelect = document.createElement('select');
      parentSelect.className =
        'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500';
      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '— Raíz (Sin directorio padre) —';
      parentSelect.appendChild(rootOpt);

      state.directories.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = getDirectoryPath(d.id);
        if (selectedDirectoryId !== 'all' && selectedDirectoryId === d.id) {
          opt.selected = true;
        }
        parentSelect.appendChild(opt);
      });
      parentWrap.appendChild(parentSelect);

      form.append(nameIn, parentWrap);

      let modalRef = null;
      modalRef = Modal.open({
        title: 'Nuevo Directorio',
        subtitle: 'Organiza tus notas por carpetas y subcarpetas.',
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
            label: 'Crear Directorio',
            icon: 'folderPlus',
            variant: 'primary',
            size: 'sm',
            onClick: () => {
              const name = nameIn.getValue().trim();
              if (!name) {
                Toast.warning('Ingresa un nombre para el directorio');
                nameIn.input.focus();
                return;
              }
              const newDir = {
                id: uid('dir'),
                name,
                parentId: parentSelect.value || null
              };
              state.directories.push(newDir);
              selectedDirectoryId = newDir.id;
              saveState(state);
              renderSidebar();
              modalRef?.close();
              Toast.success(`Directorio "${name}" creado`);
            }
          })
        ]
      });

      setTimeout(() => nameIn.input.focus(), 50);
    }

    function createNewNote(targetDirId) {
      const dirId = targetDirId || state.directories[0]?.id || null;
      const newNote = {
        id: uid('bnote'),
        directoryId: dirId,
        title: 'Nueva nota con bloques',
        description: 'Descripción breve de la nota...',
        properties: [
          { id: uid('prop'), name: 'Estado', type: 'texto', value: 'En borrador' },
          {
            id: uid('prop'),
            name: 'Fecha',
            type: 'fecha',
            value: new Date().toISOString().slice(0, 10)
          },
          { id: uid('prop'), name: 'Tags', type: 'tags', value: [] }
        ],
        blocks: [
          {
            id: uid('blk'),
            columns: 1,
            type: 'h2',
            color: 'default',
            content: 'Sección Principal'
          },
          {
            id: uid('blk'),
            columns: 1,
            type: 'p',
            color: 'default',
            content: ''
          }
        ],
        updatedAt: new Date().toISOString()
      };

      state.notes.unshift(newNote);
      selectedNoteId = newNote.id;
      saveState(state);
      renderSidebar();
      renderActiveNote();
      Toast.success('Nueva nota creada');
    }

    function confirmDeleteDirectory(dir) {
      Modal.confirm({
        title: 'Eliminar directorio',
        message: `¿Deseas eliminar el directorio "${escapeHtml(
          dir.name
        )}"? Las notas dentro se moverán al directorio principal.`,
        confirmLabel: 'Eliminar directorio',
        variant: 'danger',
        onConfirm: () => {
          const fallbackDir = state.directories.find((d) => d.id !== dir.id)?.id || null;
          state.directories = state.directories.filter((d) => d.id !== dir.id);
          state.directories.forEach((d) => {
            if (d.parentId === dir.id) d.parentId = null;
          });
          state.notes.forEach((n) => {
            if (n.directoryId === dir.id) n.directoryId = fallbackDir;
          });
          if (selectedDirectoryId === dir.id) {
            selectedDirectoryId = 'all';
          }
          saveState(state);
          renderSidebar();
          renderActiveNote();
          Toast.info('Directorio eliminado');
        }
      });
    }

    function confirmDeleteNote(note) {
      Modal.confirm({
        title: 'Eliminar nota',
        message: `¿Seguro que deseas eliminar la nota "${escapeHtml(note.title)}"?`,
        confirmLabel: 'Sí, eliminar',
        variant: 'danger',
        onConfirm: () => {
          state.notes = state.notes.filter((n) => n.id !== note.id);
          if (selectedNoteId === note.id) {
            selectedNoteId = state.notes[0]?.id || null;
          }
          saveState(state);
          renderSidebar();
          renderActiveNote();
          Toast.info('Nota eliminada');
        }
      });
    }

    renderSidebar();
    renderActiveNote();
  }
};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
