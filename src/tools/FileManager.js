import { StorageService, STORAGE_KEYS } from '../core/storage.js';
import { FileHandleStore } from '../core/fileHandleStore.js';
import { renderMarkdownToHtml } from '../core/markdownRenderer.js';
import { detectLanguageFromFilename, escapeHtml } from '../core/syntaxHighlighter.js';
import {
  createButton,
  createInput,
  createBadge,
  createDropdown,
  createCodeEditor,
  Modal,
  Toast,
  getIcon
} from '../components/ui/index.js';

const MARKDOWN_EXTS = new Set(['md', 'markdown']);
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp']);
const HIGHLIGHTED_CODE_EXTS = new Set([
  'json',
  'ts',
  'tsx',
  'mts',
  'cts',
  'js',
  'jsx',
  'mjs',
  'cjs'
]);
const BASIC_TEXT_EXTS = new Set(['txt', 'html', 'htm', 'css', 'yml', 'yaml']);

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.cache',
  '.venv',
  '__pycache__',
  'coverage',
  '.idea',
  '.vscode'
]);

const MAX_SCAN_DEPTH = 10;
const MAX_FILES_LIMIT = 2000;

// Caché en memoria por sesión para conservar el árbol y los handles al cambiar de panel
const sessionRuntimeCache = new Map();

function uid(prefix = 'fmws') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getExtension(filename = '') {
  const clean = String(filename || '').trim().toLowerCase();
  const dot = clean.lastIndexOf('.');
  return dot === -1 ? '' : clean.slice(dot + 1);
}

function classifyBasicFile(filename = '') {
  const ext = getExtension(filename);
  if (!ext) return null;
  if (MARKDOWN_EXTS.has(ext)) return { kind: 'markdown', ext, language: 'markdown' };
  if (IMAGE_EXTS.has(ext)) return { kind: 'image', ext, language: null };
  if (HIGHLIGHTED_CODE_EXTS.has(ext) || BASIC_TEXT_EXTS.has(ext)) {
    return { kind: 'code', ext, language: detectLanguageFromFilename(filename) };
  }
  return null;
}

function getFileVisualMeta(fileNode) {
  const ext = fileNode.ext || getExtension(fileNode.name);
  if (MARKDOWN_EXTS.has(ext)) {
    return { icon: 'fileText', color: 'text-sky-400', tag: 'MD' };
  }
  if (IMAGE_EXTS.has(ext)) {
    return { icon: 'image', color: 'text-emerald-400', tag: ext.toUpperCase() };
  }
  if (ext === 'json') {
    return { icon: 'fileJson', color: 'text-amber-400', tag: 'JSON' };
  }
  if (ext === 'ts' || ext === 'tsx' || ext === 'mts' || ext === 'cts') {
    return { icon: 'fileCode', color: 'text-blue-400', tag: ext.toUpperCase() };
  }
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') {
    return { icon: 'fileCode', color: 'text-yellow-400', tag: ext.toUpperCase() };
  }
  return { icon: 'fileText', color: 'text-slate-400', tag: ext.toUpperCase() || 'TXT' };
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function triggerDownload(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadState() {
  const saved = StorageService.get(STORAGE_KEYS.FILE_MANAGER, null);
  if (!saved || typeof saved !== 'object' || !Array.isArray(saved.workspaces)) {
    const initial = {
      workspaces: [
        {
          id: 'fmws-default',
          name: 'Workspace Principal',
          folderName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      activeWorkspaceId: 'fmws-default',
      expandedPathsByWs: {}
    };
    StorageService.set(STORAGE_KEYS.FILE_MANAGER, initial);
    return initial;
  }

  const workspaces = saved.workspaces.filter((w) => w && typeof w.id === 'string');
  const activeWorkspaceId = workspaces.some((w) => w.id === saved.activeWorkspaceId)
    ? saved.activeWorkspaceId
    : workspaces[0]?.id || null;

  return {
    workspaces,
    activeWorkspaceId,
    expandedPathsByWs:
      saved.expandedPathsByWs && typeof saved.expandedPathsByWs === 'object'
        ? saved.expandedPathsByWs
        : {}
  };
}

function saveState(state) {
  StorageService.set(STORAGE_KEYS.FILE_MANAGER, state);
}

/**
 * Escanea recursivamente un FileSystemDirectoryHandle filtrando a tipos de archivo básicos.
 */
async function scanDirectoryHandle(dirHandle) {
  const counter = { files: 0, skippedUnsupported: 0, truncated: false };

  async function walk(handle, parentPath, depth) {
    if (depth > MAX_SCAN_DEPTH) return [];
    const dirs = [];
    const files = [];

    for await (const [name, entry] of handle.entries()) {
      const relPath = parentPath ? `${parentPath}/${name}` : name;

      if (entry.kind === 'directory') {
        if (IGNORED_DIRS.has(name) || name.startsWith('.')) {
          continue;
        }
        const children = await walk(entry, relPath, depth + 1);
        if (children.length > 0) {
          dirs.push({
            type: 'dir',
            name,
            path: relPath,
            children
          });
        }
      } else if (entry.kind === 'file') {
        const meta = classifyBasicFile(name);
        if (!meta) {
          counter.skippedUnsupported++;
          continue;
        }
        if (counter.files >= MAX_FILES_LIMIT) {
          counter.truncated = true;
          break;
        }
        counter.files++;
        files.push({
          type: 'file',
          name,
          path: relPath,
          kind: meta.kind,
          ext: meta.ext,
          language: meta.language,
          handle: entry,
          fileObj: null
        });
      }
    }

    dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return [...dirs, ...files];
  }

  const nodes = await walk(dirHandle, '', 0);
  return {
    nodes,
    totalFiles: counter.files,
    skippedUnsupported: counter.skippedUnsupported,
    truncated: counter.truncated
  };
}

/**
 * Construye el árbol de archivos desde un FileList (<input webkitdirectory>) como fallback.
 */
function buildTreeFromFileList(fileList) {
  const rootMap = new Map();
  let folderName = 'Directorio seleccionado';
  let totalFiles = 0;
  let skippedUnsupported = 0;

  function ensureDir(dirMap, name, path) {
    if (!dirMap.has(name)) {
      dirMap.set(name, {
        type: 'dir',
        name,
        path,
        childrenMap: new Map(),
        files: []
      });
    }
    return dirMap.get(name);
  }

  Array.from(fileList || []).forEach((file) => {
    const rawRel = file.webkitRelativePath || file.name;
    const segments = rawRel.split(/[\\/]/).filter(Boolean);
    if (segments.length > 1) {
      folderName = segments[0];
    }
    const relSegments = segments.length > 1 ? segments.slice(1) : segments;
    if (relSegments.some((seg) => IGNORED_DIRS.has(seg))) {
      return;
    }

    const fileName = relSegments[relSegments.length - 1];
    const meta = classifyBasicFile(fileName);
    if (!meta) {
      skippedUnsupported++;
      return;
    }

    totalFiles++;
    const relPath = relSegments.join('/');
    let currentMap = rootMap;
    let currentParent = null;
    let accPath = '';

    for (let i = 0; i < relSegments.length - 1; i++) {
      const seg = relSegments[i];
      accPath = accPath ? `${accPath}/${seg}` : seg;
      const dirNode = ensureDir(currentMap, seg, accPath);
      currentParent = dirNode;
      currentMap = dirNode.childrenMap;
    }

    const fileEntry = {
      type: 'file',
      name: fileName,
      path: relPath,
      kind: meta.kind,
      ext: meta.ext,
      language: meta.language,
      handle: null,
      fileObj: file
    };

    if (currentParent) {
      currentParent.files.push(fileEntry);
    } else {
      rootMap.set(`__file__:${relPath}`, fileEntry);
    }
  });

  function flattenMap(map) {
    const dirs = [];
    const files = [];
    for (const value of map.values()) {
      if (value.type === 'dir') {
        const children = [...flattenMap(value.childrenMap), ...value.files];
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
        if (children.length > 0) {
          dirs.push({
            type: 'dir',
            name: value.name,
            path: value.path,
            children
          });
        }
      } else {
        files.push(value);
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return [...dirs, ...files];
  }

  return {
    folderName,
    nodes: flattenMap(rootMap),
    totalFiles,
    skippedUnsupported,
    truncated: false
  };
}

function collectStats(nodes = []) {
  const stats = { markdown: 0, image: 0, code: 0, total: 0 };
  function walk(list) {
    for (const item of list) {
      if (item.type === 'dir') {
        walk(item.children || []);
      } else {
        stats.total++;
        if (item.kind in stats) stats[item.kind]++;
      }
    }
  }
  walk(nodes);
  return stats;
}

function findFileByPath(nodes = [], targetPath) {
  for (const item of nodes) {
    if (item.type === 'file' && item.path === targetPath) return item;
    if (item.type === 'dir') {
      const found = findFileByPath(item.children || [], targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Herramienta del Marketplace: File Manager con Workspaces
 */
export const FileManagerTool = {
  id: 'file-manager',
  name: 'File Manager',
  description:
    'Gestor de archivos por workspaces con selección de directorios locales, árbol lateral de tipos básicos, edición/preview de Markdown, preview de imágenes y resaltado para JSON, TS y JS.',
  category: 'Productividad',
  icon: 'folderTree',
  defaultInstalled: true,

  mount(container) {
    let state = loadState();
    let sidebarCollapsed = false;
    let searchQuery = '';
    let activeFilePath = null;
    let activeFileContent = '';
    let savedFileContent = '';
    let isDirty = false;
    let mdViewMode = 'preview'; // 'preview' | 'editor' | 'split'
    let imageZoom = 100;
    let activeImageUrl = null;
    let isScanning = false;
    let destroyed = false;

    container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'h-full w-full flex flex-col bg-slate-950/50 text-slate-200 overflow-hidden';

    // Input oculto para fallback webkitdirectory (navegadores sin File System Access API)
    const fallbackDirInput = document.createElement('input');
    fallbackDirInput.type = 'file';
    fallbackDirInput.multiple = true;
    fallbackDirInput.setAttribute('webkitdirectory', '');
    fallbackDirInput.setAttribute('directory', '');
    fallbackDirInput.className = 'hidden';

    // =========================================================================
    // 1. BARRA SUPERIOR (Workspaces + Selección de Directorio + Acciones)
    // =========================================================================
    const topBar = document.createElement('div');
    topBar.className =
      'px-3 py-2 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0';

    const leftControls = document.createElement('div');
    leftControls.className = 'flex flex-wrap items-center gap-1.5';

    const wsDropdownSlot = document.createElement('div');
    wsDropdownSlot.className = 'inline-flex items-center';

    const rightControls = document.createElement('div');
    rightControls.className = 'flex flex-wrap items-center gap-1.5';

    const toggleSidebarBtn = createButton({
      label: 'Archivos',
      icon: 'sidebarLeft',
      variant: 'secondary',
      size: 'xs',
      title: 'Mostrar / ocultar sidebar de archivos',
      onClick: () => {
        sidebarCollapsed = !sidebarCollapsed;
        sidebar.classList.toggle('hidden', sidebarCollapsed);
      }
    });

    const newWsBtn = createButton({
      label: 'Workspace',
      icon: 'plus',
      variant: 'primary',
      size: 'xs',
      title: 'Crear nuevo workspace de archivos',
      onClick: () => openCreateWorkspaceModal()
    });

    const manageWsBtn = createButton({
      label: 'Gestionar',
      icon: 'briefcase',
      variant: 'ghost',
      size: 'xs',
      title: 'Renombrar o eliminar workspaces',
      onClick: () => openManageWorkspacesModal()
    });

    const pickDirBtn = createButton({
      label: 'Elegir Directorio',
      icon: 'folderOpen',
      variant: 'outline',
      size: 'xs',
      title: 'Seleccionar directorio local para el workspace activo',
      onClick: () => pickDirectoryForActiveWorkspace()
    });

    const refreshBtn = createButton({
      icon: 'refresh',
      variant: 'ghost',
      size: 'xs',
      title: 'Refrescar archivos del directorio',
      onClick: () => refreshActiveWorkspaceDirectory()
    });

    leftControls.append(toggleSidebarBtn, wsDropdownSlot, newWsBtn, manageWsBtn);
    rightControls.append(pickDirBtn, refreshBtn);
    topBar.append(leftControls, rightControls);

    // =========================================================================
    // 2. CUERPO PRINCIPAL: SIDEBAR DE ARCHIVOS + VISOR / EDITOR
    // =========================================================================
    const mainBody = document.createElement('div');
    mainBody.className = 'flex-1 flex min-h-0 overflow-hidden';

    const sidebar = document.createElement('aside');
    sidebar.className =
      'w-64 sm:w-72 border-r border-slate-800/90 bg-slate-900/45 flex flex-col min-h-0 shrink-0 select-none';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'p-2.5 border-b border-slate-800/80 space-y-2';

    const folderInfoRow = document.createElement('div');
    folderInfoRow.className = 'flex items-center justify-between gap-2 text-xs';

    const searchInput = createInput({
      placeholder: 'Filtrar archivos...',
      icon: 'search',
      onInput: (val) => {
        searchQuery = val.trim().toLowerCase();
        renderSidebarTree();
      }
    });
    searchInput.input.classList.replace('py-2', 'py-1.5');
    searchInput.input.classList.replace('text-sm', 'text-xs');

    sidebarHeader.append(folderInfoRow, searchInput);

    const treeContainer = document.createElement('div');
    treeContainer.className = 'flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5';

    const sidebarFooter = document.createElement('div');
    sidebarFooter.className =
      'px-2.5 py-1.5 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between gap-1';

    sidebar.append(sidebarHeader, treeContainer, sidebarFooter);

    const viewerArea = document.createElement('div');
    viewerArea.className = 'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-950/30';

    mainBody.append(sidebar, viewerArea);
    root.append(fallbackDirInput, topBar, mainBody);
    container.appendChild(root);

    // =========================================================================
    // HELPERS DE ESTADO Y RUNTIME
    // =========================================================================
    function getActiveWorkspace() {
      return state.workspaces.find((w) => w.id === state.activeWorkspaceId) || null;
    }

    function getRuntime(wsId) {
      if (!wsId) return null;
      if (!sessionRuntimeCache.has(wsId)) {
        sessionRuntimeCache.set(wsId, {
          dirHandle: null,
          mode: null, // 'fs-api' | 'fallback'
          needsPermission: false,
          nodes: [],
          totalFiles: 0,
          skippedUnsupported: 0,
          truncated: false
        });
      }
      return sessionRuntimeCache.get(wsId);
    }

    function getExpandedSet(wsId) {
      const list = state.expandedPathsByWs[wsId];
      return new Set(Array.isArray(list) ? list : []);
    }

    function setExpandedSet(wsId, set) {
      state.expandedPathsByWs[wsId] = Array.from(set);
      saveState(state);
    }

    function revokeActiveImageUrl() {
      if (activeImageUrl) {
        URL.revokeObjectURL(activeImageUrl);
        activeImageUrl = null;
      }
    }

    function resetOpenFile() {
      revokeActiveImageUrl();
      activeFilePath = null;
      activeFileContent = '';
      savedFileContent = '';
      isDirty = false;
      imageZoom = 100;
    }

    function confirmDiscardIfDirty(onProceed) {
      if (!isDirty) {
        onProceed();
        return;
      }
      Modal.confirm({
        title: 'Cambios sin guardar',
        message: `Tienes cambios sin guardar en "${activeFilePath}". ¿Deseas descartarlos y continuar?`,
        confirmLabel: 'Descartar cambios',
        variant: 'warning',
        onConfirm: () => {
          isDirty = false;
          onProceed();
        }
      });
    }

    // =========================================================================
    // SELECCIÓN Y CARGA DE DIRECTORIO
    // =========================================================================
    let fallbackTargetWsId = null;

    fallbackDirInput.addEventListener('change', () => {
      const files = fallbackDirInput.files;
      if (!files || files.length === 0) return;
      const ws =
        state.workspaces.find((w) => w.id === fallbackTargetWsId) || getActiveWorkspace();
      fallbackDirInput.value = '';
      if (!ws) return;

      const parsed = buildTreeFromFileList(files);
      const rt = getRuntime(ws.id);
      rt.dirHandle = null;
      rt.mode = 'fallback';
      rt.needsPermission = false;
      rt.nodes = parsed.nodes;
      rt.totalFiles = parsed.totalFiles;
      rt.skippedUnsupported = parsed.skippedUnsupported;
      rt.truncated = parsed.truncated;

      ws.folderName = parsed.folderName;
      ws.updatedAt = new Date().toISOString();
      saveState(state);

      resetOpenFile();
      renderAll();
      Toast.success(`Directorio "${parsed.folderName}" cargado (${parsed.totalFiles} archivos básicos)`);
    });

    async function pickDirectoryForWorkspace(ws) {
      if (!ws) {
        openCreateWorkspaceModal();
        return;
      }

      if (typeof window.showDirectoryPicker === 'function') {
        try {
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
          await attachDirectoryHandle(ws, dirHandle);
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
          // Si falla por seguridad/permiso o contexto sin readwrite, intentar modo read o fallback
          try {
            const readHandle = await window.showDirectoryPicker({ mode: 'read' });
            await attachDirectoryHandle(ws, readHandle);
            return;
          } catch (readErr) {
            if (readErr?.name === 'AbortError') return;
            console.warn('[FileManager] Fallback a webkitdirectory:', readErr);
          }
        }
      }

      fallbackTargetWsId = ws.id;
      fallbackDirInput.click();
    }

    async function pickDirectoryForActiveWorkspace() {
      const ws = getActiveWorkspace();
      if (!ws) {
        openCreateWorkspaceModal();
        return;
      }
      confirmDiscardIfDirty(() => {
        pickDirectoryForWorkspace(ws);
      });
    }

    async function attachDirectoryHandle(ws, dirHandle) {
      isScanning = true;
      renderSidebarTree();

      try {
        const scanned = await scanDirectoryHandle(dirHandle);
        const rt = getRuntime(ws.id);
        rt.dirHandle = dirHandle;
        rt.mode = 'fs-api';
        rt.needsPermission = false;
        rt.nodes = scanned.nodes;
        rt.totalFiles = scanned.totalFiles;
        rt.skippedUnsupported = scanned.skippedUnsupported;
        rt.truncated = scanned.truncated;

        ws.folderName = dirHandle.name;
        ws.updatedAt = new Date().toISOString();
        saveState(state);
        await FileHandleStore.save(ws.id, dirHandle);

        resetOpenFile();
        Toast.success(`Directorio "${dirHandle.name}" vinculado (${scanned.totalFiles} archivos)`);
      } catch (err) {
        console.error('[FileManager] Error escaneando directorio:', err);
        Toast.error('No se pudo leer el directorio seleccionado');
      } finally {
        isScanning = false;
        if (!destroyed) renderAll();
      }
    }

    async function hydrateWorkspaceFromIndexedDb(ws) {
      if (!ws) return;
      const rt = getRuntime(ws.id);
      if (rt.nodes.length > 0 || rt.mode === 'fallback') return;

      const storedHandle = rt.dirHandle || (await FileHandleStore.get(ws.id));
      if (!storedHandle) return;

      rt.dirHandle = storedHandle;
      try {
        const perm =
          typeof storedHandle.queryPermission === 'function'
            ? await storedHandle.queryPermission({ mode: 'read' })
            : 'granted';

        if (perm === 'granted') {
          isScanning = true;
          renderSidebarTree();
          const scanned = await scanDirectoryHandle(storedHandle);
          rt.mode = 'fs-api';
          rt.needsPermission = false;
          rt.nodes = scanned.nodes;
          rt.totalFiles = scanned.totalFiles;
          rt.skippedUnsupported = scanned.skippedUnsupported;
          rt.truncated = scanned.truncated;
          isScanning = false;
        } else {
          rt.mode = 'fs-api';
          rt.needsPermission = true;
        }
      } catch (err) {
        console.warn('[FileManager] No se pudo verificar permiso del handle:', err);
        rt.needsPermission = true;
      }

      if (!destroyed) renderAll();
    }

    async function requestStoredHandlePermission(ws) {
      const rt = getRuntime(ws?.id);
      if (!ws || !rt?.dirHandle) {
        await pickDirectoryForWorkspace(ws);
        return;
      }

      try {
        let perm = 'prompt';
        if (typeof rt.dirHandle.requestPermission === 'function') {
          perm = await rt.dirHandle.requestPermission({ mode: 'readwrite' });
          if (perm !== 'granted') {
            perm = await rt.dirHandle.requestPermission({ mode: 'read' });
          }
        } else {
          perm = 'granted';
        }

        if (perm === 'granted') {
          await attachDirectoryHandle(ws, rt.dirHandle);
        } else {
          Toast.warning('Permiso denegado. Puedes elegir otro directorio.');
        }
      } catch (err) {
        console.warn('[FileManager] Error solicitando permiso:', err);
        await pickDirectoryForWorkspace(ws);
      }
    }

    async function refreshActiveWorkspaceDirectory() {
      const ws = getActiveWorkspace();
      if (!ws) return;
      const rt = getRuntime(ws.id);
      if (!rt?.dirHandle) {
        if (rt?.mode === 'fallback') {
          Toast.info('En modo compatibilidad vuelve a elegir la carpeta para refrescar.');
        } else {
          Toast.info('Primero selecciona un directorio para este workspace.');
        }
        return;
      }

      isScanning = true;
      renderSidebarTree();
      try {
        const scanned = await scanDirectoryHandle(rt.dirHandle);
        rt.nodes = scanned.nodes;
        rt.totalFiles = scanned.totalFiles;
        rt.skippedUnsupported = scanned.skippedUnsupported;
        rt.truncated = scanned.truncated;
        rt.needsPermission = false;

        if (activeFilePath && !findFileByPath(rt.nodes, activeFilePath)) {
          resetOpenFile();
        }
        Toast.success(`Árbol actualizado (${scanned.totalFiles} archivos básicos)`);
      } catch (err) {
        console.warn('[FileManager] Error al refrescar:', err);
        rt.needsPermission = true;
        Toast.warning('Se requiere reconectar permiso del directorio');
      } finally {
        isScanning = false;
        if (!destroyed) renderAll();
      }
    }

    // =========================================================================
    // LECTURA Y GUARDADO DE ARCHIVOS
    // =========================================================================
    async function openFileNode(fileNode) {
      if (!fileNode) return;
      if (fileNode.path === activeFilePath) return;

      confirmDiscardIfDirty(async () => {
        revokeActiveImageUrl();
        try {
          const fileObj = fileNode.handle ? await fileNode.handle.getFile() : fileNode.fileObj;
          if (!fileObj) {
            Toast.error('No se pudo leer el archivo seleccionado');
            return;
          }

          activeFilePath = fileNode.path;
          fileNode.size = fileObj.size;
          fileNode.lastModified = fileObj.lastModified;
          fileNode.mimeType = fileObj.type;
          isDirty = false;

          if (fileNode.kind === 'image') {
            activeImageUrl = URL.createObjectURL(fileObj);
            activeFileContent = '';
            savedFileContent = '';
            imageZoom = 100;
          } else {
            const text = await fileObj.text();
            activeFileContent = text;
            savedFileContent = text;
            if (fileNode.kind === 'markdown') {
              mdViewMode = 'preview';
            }
          }

          renderSidebarTree();
          renderViewer();
        } catch (err) {
          console.error('[FileManager] Error abriendo archivo:', err);
          Toast.error('Error leyendo el archivo. Verifica permisos del directorio.');
        }
      });
    }

    async function saveActiveFile(fileNode) {
      if (!fileNode || fileNode.kind === 'image') return;

      if (fileNode.handle && typeof fileNode.handle.createWritable === 'function') {
        try {
          if (typeof fileNode.handle.queryPermission === 'function') {
            const current = await fileNode.handle.queryPermission({ mode: 'readwrite' });
            if (current !== 'granted') {
              const req = await fileNode.handle.requestPermission({ mode: 'readwrite' });
              if (req !== 'granted') {
                Toast.warning('Permiso de escritura denegado. Descargando copia local.');
                triggerDownload(fileNode.name, activeFileContent);
                return;
              }
            }
          }

          const writable = await fileNode.handle.createWritable();
          await writable.write(activeFileContent);
          await writable.close();

          savedFileContent = activeFileContent;
          isDirty = false;
          updateDirtyIndicators();
          Toast.success(`Guardado en disco: ${fileNode.name}`);
          return;
        } catch (err) {
          console.error('[FileManager] Error guardando en disco:', err);
          Toast.error('No se pudo escribir en disco. Se descargará una copia.');
        }
      }

      // Fallback: actualizar copia en memoria y descargar
      if (fileNode.fileObj) {
        fileNode.fileObj = new File([activeFileContent], fileNode.name, {
          type: fileNode.mimeType || 'text/plain'
        });
      }
      savedFileContent = activeFileContent;
      isDirty = false;
      updateDirtyIndicators();
      triggerDownload(fileNode.name, activeFileContent);
      Toast.info(`Copia descargada: ${fileNode.name}`);
    }

    // =========================================================================
    // MODALES DE WORKSPACES
    // =========================================================================
    function openCreateWorkspaceModal() {
      const form = document.createElement('div');
      form.className = 'space-y-3';

      const nameInput = createInput({
        label: 'Nombre del Workspace',
        placeholder: 'Ej. Frontend App, Documentación API, Assets...',
        helperText: 'Cada workspace mantiene su propio directorio local y navegación de archivos.'
      });
      form.appendChild(nameInput);

      let modalRef = null;

      const createWs = (pickNow) => {
        const clean = nameInput.getValue().trim();
        if (!clean) {
          Toast.warning('Ingresa un nombre para el workspace');
          nameInput.focus();
          return;
        }
        if (state.workspaces.some((w) => w.name.toLowerCase() === clean.toLowerCase())) {
          Toast.warning(`Ya existe un workspace llamado "${clean}"`);
          nameInput.focus();
          return;
        }

        const newWs = {
          id: uid('fmws'),
          name: clean,
          folderName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.workspaces.push(newWs);
        state.activeWorkspaceId = newWs.id;
        saveState(state);
        resetOpenFile();
        modalRef?.close();
        renderAll();
        Toast.success(`Workspace "${clean}" creado`);

        if (pickNow) {
          pickDirectoryForWorkspace(newWs);
        }
      };

      nameInput.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          createWs(true);
        }
      });

      modalRef = Modal.open({
        title: 'Nuevo Workspace de Archivos',
        subtitle: 'Agrupa un directorio local con sus archivos Markdown, imágenes y código.',
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
            label: 'Solo crear',
            variant: 'outline',
            size: 'sm',
            onClick: () => createWs(false)
          }),
          createButton({
            label: 'Crear y elegir carpeta',
            icon: 'folderOpen',
            variant: 'primary',
            size: 'sm',
            onClick: () => createWs(true)
          })
        ]
      });

      setTimeout(() => nameInput.focus(), 60);
    }

    function openRenameWorkspaceModal(ws, onRenamed = null) {
      const form = document.createElement('div');
      const nameInput = createInput({
        label: 'Nuevo nombre',
        value: ws.name,
        placeholder: 'Nombre del workspace...'
      });
      form.appendChild(nameInput);

      let modalRef = null;
      const submit = () => {
        const clean = nameInput.getValue().trim();
        if (!clean) {
          Toast.warning('El nombre no puede estar vacío');
          return;
        }
        if (
          state.workspaces.some(
            (other) => other.id !== ws.id && other.name.toLowerCase() === clean.toLowerCase()
          )
        ) {
          Toast.warning(`Ya existe un workspace llamado "${clean}"`);
          return;
        }
        ws.name = clean;
        ws.updatedAt = new Date().toISOString();
        saveState(state);
        modalRef?.close();
        renderAll();
        onRenamed?.();
        Toast.success('Workspace renombrado');
      };

      nameInput.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });

      modalRef = Modal.open({
        title: 'Renombrar Workspace',
        size: 'sm',
        content: form,
        footer: [
          createButton({ label: 'Cancelar', variant: 'secondary', size: 'sm', onClick: () => modalRef?.close() }),
          createButton({ label: 'Guardar', variant: 'primary', size: 'sm', onClick: submit })
        ]
      });
      setTimeout(() => nameInput.focus(), 60);
    }

    function openManageWorkspacesModal() {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3';

      let modalRef = null;

      function renderList() {
        wrap.innerHTML = '';
        if (state.workspaces.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl';
          empty.textContent = 'No tienes workspaces creados todavía.';
          wrap.appendChild(empty);
          return;
        }

        const list = document.createElement('div');
        list.className = 'space-y-2';

        state.workspaces.forEach((ws) => {
          const isActive = ws.id === state.activeWorkspaceId;
          const row = document.createElement('div');
          row.className = `p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
            isActive
              ? 'bg-indigo-600/10 border-indigo-500/40'
              : 'bg-slate-950/60 border-slate-800'
          }`;

          const info = document.createElement('div');
          info.className = 'min-w-0 flex-1';
          info.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-white truncate">${escapeHtml(ws.name)}</span>
              ${
                isActive
                  ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Activo</span>'
                  : ''
              }
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
              <span class="text-amber-400/90 shrink-0">${getIcon('folder')}</span>
              <span class="truncate">${escapeHtml(ws.folderName || 'Sin directorio vinculado')}</span>
            </div>
          `;

          const actions = document.createElement('div');
          actions.className = 'flex items-center gap-1.5 shrink-0';

          if (!isActive) {
            actions.appendChild(
              createButton({
                label: 'Abrir',
                variant: 'secondary',
                size: 'xs',
                onClick: () => {
                  switchWorkspace(ws.id);
                  modalRef?.close();
                }
              })
            );
          }

          actions.appendChild(
            createButton({
              icon: 'folderOpen',
              variant: 'outline',
              size: 'xs',
              title: 'Cambiar directorio',
              onClick: () => {
                state.activeWorkspaceId = ws.id;
                saveState(state);
                modalRef?.close();
                pickDirectoryForWorkspace(ws);
              }
            })
          );

          actions.appendChild(
            createButton({
              icon: 'edit',
              variant: 'ghost',
              size: 'xs',
              title: 'Renombrar workspace',
              onClick: () => openRenameWorkspaceModal(ws, renderList)
            })
          );

          actions.appendChild(
            createButton({
              icon: 'trash',
              variant: 'ghost',
              size: 'xs',
              title: 'Eliminar workspace',
              className: 'text-slate-400 hover:text-rose-400',
              onClick: () => {
                Modal.confirm({
                  title: 'Eliminar Workspace',
                  message: `¿Eliminar el workspace "${ws.name}"? Esto no borra ningún archivo de tu disco duro.`,
                  confirmLabel: 'Eliminar',
                  variant: 'danger',
                  onConfirm: async () => {
                    state.workspaces = state.workspaces.filter((w) => w.id !== ws.id);
                    delete state.expandedPathsByWs[ws.id];
                    sessionRuntimeCache.delete(ws.id);
                    await FileHandleStore.remove(ws.id);

                    if (state.activeWorkspaceId === ws.id) {
                      state.activeWorkspaceId = state.workspaces[0]?.id || null;
                      resetOpenFile();
                    }
                    saveState(state);
                    renderAll();
                    renderList();
                    Toast.info(`Workspace "${ws.name}" eliminado`);
                  }
                });
              }
            })
          );

          row.append(info, actions);
          list.appendChild(row);
        });

        wrap.appendChild(list);
      }

      renderList();

      modalRef = Modal.open({
        title: 'Gestionar Workspaces de File Manager',
        subtitle: 'Administra tus espacios locales. Eliminar un workspace solo quita el vínculo.',
        size: 'md',
        content: wrap,
        footer: [
          createButton({
            label: 'Nuevo Workspace',
            icon: 'plus',
            variant: 'primary',
            size: 'sm',
            onClick: () => {
              modalRef?.close();
              openCreateWorkspaceModal();
            }
          }),
          createButton({
            label: 'Cerrar',
            variant: 'secondary',
            size: 'sm',
            onClick: () => modalRef?.close()
          })
        ]
      });
    }

    function switchWorkspace(wsId) {
      if (wsId === state.activeWorkspaceId) return;
      confirmDiscardIfDirty(() => {
        state.activeWorkspaceId = wsId;
        saveState(state);
        resetOpenFile();
        renderAll();
        const ws = getActiveWorkspace();
        if (ws) hydrateWorkspaceFromIndexedDb(ws);
      });
    }

    // =========================================================================
    // RENDERIZADO DE CONTROLES SUPERIORES, SIDEBAR Y VISOR
    // =========================================================================
    function renderWorkspaceDropdown() {
      wsDropdownSlot.innerHTML = '';
      const activeWs = getActiveWorkspace();

      const items = [
        { header: 'Workspaces de Archivos' },
        ...state.workspaces.map((ws) => ({
          label: ws.name,
          icon: 'folder',
          badge: ws.folderName || 'Sin carpeta',
          active: ws.id === state.activeWorkspaceId,
          onClick: () => switchWorkspace(ws.id)
        })),
        { divider: true },
        {
          label: 'Crear nuevo workspace...',
          icon: 'plus',
          onClick: () => openCreateWorkspaceModal()
        },
        {
          label: 'Gestionar workspaces...',
          icon: 'briefcase',
          onClick: () => openManageWorkspacesModal()
        }
      ];

      const dd = createDropdown({
        label: activeWs ? activeWs.name : 'Sin Workspace',
        icon: 'folderTree',
        variant: 'secondary',
        size: 'xs',
        items
      });

      wsDropdownSlot.appendChild(dd);
    }

    function filterTreeNodes(nodes, query) {
      if (!query) return nodes;
      const result = [];
      for (const node of nodes) {
        if (node.type === 'file') {
          if (
            node.name.toLowerCase().includes(query) ||
            node.path.toLowerCase().includes(query)
          ) {
            result.push(node);
          }
        } else if (node.type === 'dir') {
          const filteredChildren = filterTreeNodes(node.children || [], query);
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query)) {
            result.push({
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : node.children
            });
          }
        }
      }
      return result;
    }

    function renderSidebarTree() {
      const ws = getActiveWorkspace();
      const rt = ws ? getRuntime(ws.id) : null;

      folderInfoRow.innerHTML = '';
      treeContainer.innerHTML = '';
      sidebarFooter.innerHTML = '';

      if (!ws) {
        folderInfoRow.innerHTML = `<span class="text-slate-500 text-[11px]">Sin workspace activo</span>`;
        treeContainer.innerHTML = `
          <div class="p-4 text-center text-xs text-slate-500">
            Crea un workspace para vincular un directorio local.
          </div>
        `;
        return;
      }

      folderInfoRow.innerHTML = `
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-amber-400 shrink-0">${getIcon('folderOpen')}</span>
          <span class="font-semibold text-slate-200 truncate" title="${escapeHtml(
            ws.folderName || 'Sin directorio'
          )}">${escapeHtml(ws.folderName || 'Sin directorio')}</span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0">${
          rt?.totalFiles || 0
        }</span>
      `;

      if (isScanning) {
        treeContainer.innerHTML = `
          <div class="p-6 text-center text-xs text-slate-400 animate-pulse">
            Escaneando archivos del directorio...
          </div>
        `;
        return;
      }

      if (rt?.needsPermission) {
        const reconnectBox = document.createElement('div');
        reconnectBox.className =
          'p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-center';
        reconnectBox.innerHTML = `
          <div class="text-xs font-semibold text-amber-300">Permiso pendiente</div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Reconecta el acceso al directorio <strong class="text-slate-200">${escapeHtml(
              ws.folderName || 'guardado'
            )}</strong> para cargar sus archivos.
          </p>
        `;
        const reconnectBtn = createButton({
          label: 'Reconectar carpeta',
          icon: 'folderOpen',
          variant: 'warning',
          size: 'xs',
          className: 'w-full',
          onClick: () => requestStoredHandlePermission(ws)
        });
        reconnectBox.appendChild(reconnectBtn);
        treeContainer.appendChild(reconnectBox);
        return;
      }

      if (!rt || rt.nodes.length === 0) {
        const emptyBox = document.createElement('div');
        emptyBox.className =
          'p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2.5';
        emptyBox.innerHTML = `
          <p class="text-xs text-slate-400">
            ${
              ws.folderName && rt?.mode
                ? 'No se encontraron archivos básicos compatibles (.md, imágenes, .json, .ts, .js) en este directorio.'
                : 'Aún no hay un directorio seleccionado en este workspace.'
            }
          </p>
        `;
        const pickBtn = createButton({
          label: 'Seleccionar directorio',
          icon: 'folderOpen',
          variant: 'primary',
          size: 'xs',
          onClick: () => pickDirectoryForWorkspace(ws)
        });
        emptyBox.appendChild(pickBtn);
        treeContainer.appendChild(emptyBox);
        return;
      }

      const expandedSet = getExpandedSet(ws.id);
      const visibleNodes = filterTreeNodes(rt.nodes, searchQuery);

      if (visibleNodes.length === 0) {
        treeContainer.innerHTML = `
          <div class="p-4 text-center text-xs text-slate-500">
            Sin coincidencias para "${escapeHtml(searchQuery)}".
          </div>
        `;
      } else {
        const renderNodes = (list, depth = 0) => {
          list.forEach((node) => {
            if (node.type === 'dir') {
              const isExpanded = Boolean(searchQuery) || expandedSet.has(node.path);

              const dirRow = document.createElement('button');
              dirRow.type = 'button';
              dirRow.style.paddingLeft = `${Math.min(depth * 12, 48) + 6}px`;
              dirRow.className =
                'w-full pr-2 py-1 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800/70 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer';
              dirRow.innerHTML = `
                <span class="text-slate-500 shrink-0">${getIcon(
                  isExpanded ? 'chevronDown' : 'chevronRight'
                )}</span>
                <span class="text-amber-400/90 shrink-0">${getIcon(
                  isExpanded ? 'folderOpen' : 'folder'
                )}</span>
                <span class="truncate font-medium">${escapeHtml(node.name)}</span>
              `;
              dirRow.addEventListener('click', () => {
                if (expandedSet.has(node.path)) {
                  expandedSet.delete(node.path);
                } else {
                  expandedSet.add(node.path);
                }
                setExpandedSet(ws.id, expandedSet);
                renderSidebarTree();
              });
              treeContainer.appendChild(dirRow);

              if (isExpanded && Array.isArray(node.children)) {
                renderNodes(node.children, depth + 1);
              }
            } else {
              const isSelected = node.path === activeFilePath;
              const vis = getFileVisualMeta(node);

              const fileRow = document.createElement('button');
              fileRow.type = 'button';
              fileRow.title = node.path;
              fileRow.style.paddingLeft = `${Math.min(depth * 12, 48) + 22}px`;
              fileRow.className = `w-full pr-2 py-1 rounded-lg text-left text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 text-indigo-200 font-medium border border-indigo-500/35'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
              }`;
              fileRow.innerHTML = `
                <span class="flex items-center gap-1.5 min-w-0">
                  <span class="${vis.color} shrink-0">${getIcon(vis.icon)}</span>
                  <span class="truncate">${escapeHtml(node.name)}</span>
                </span>
                <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900/90 text-slate-500 border border-slate-800 shrink-0">${
                  vis.tag
                }</span>
              `;
              fileRow.addEventListener('click', () => openFileNode(node));
              treeContainer.appendChild(fileRow);
            }
          });
        };

        renderNodes(visibleNodes, 0);
      }

      const modeLabel = rt.mode === 'fs-api' ? 'Disco directo' : 'Modo lectura/descarga';
      sidebarFooter.innerHTML = `
        <span>Tipos básicos: MD · IMG · JSON · TS · JS</span>
        <span class="text-indigo-400/90 font-medium shrink-0">${modeLabel}</span>
      `;
    }

    let dirtyBadgeEl = null;
    let saveBtnEl = null;

    function updateDirtyIndicators() {
      if (dirtyBadgeEl) {
        dirtyBadgeEl.classList.toggle('hidden', !isDirty);
      }
      if (saveBtnEl) {
        saveBtnEl.disabled = !isDirty;
      }
    }

    function renderViewer() {
      viewerArea.innerHTML = '';
      dirtyBadgeEl = null;
      saveBtnEl = null;

      const ws = getActiveWorkspace();
      const rt = ws ? getRuntime(ws.id) : null;

      if (!ws) {
        const empty = document.createElement('div');
        empty.className =
          'h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-3';
        empty.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">${getIcon(
            'folderTree'
          )}</div>
          <h3 class="text-sm font-semibold text-white">Comienza creando un Workspace</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Crea workspaces independientes y vincula un directorio local en cada uno para explorar Markdown, imágenes, JSON, TypeScript y JavaScript.
          </p>
        `;
        empty.appendChild(
          createButton({
            label: 'Crear Workspace',
            icon: 'plus',
            variant: 'primary',
            size: 'sm',
            onClick: () => openCreateWorkspaceModal()
          })
        );
        viewerArea.appendChild(empty);
        return;
      }

      if (rt?.needsPermission) {
        const box = document.createElement('div');
        box.className =
          'h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-3';
        box.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">${getIcon(
            'folderOpen'
          )}</div>
          <h3 class="text-sm font-semibold text-white">Reconectar directorio de "${escapeHtml(
            ws.name
          )}"</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Por seguridad del navegador, tras recargar la página es necesario confirmar el acceso al directorio <strong class="text-slate-200">${escapeHtml(
              ws.folderName || ''
            )}</strong>.
          </p>
        `;
        const btnRow = document.createElement('div');
        btnRow.className = 'flex items-center gap-2 pt-1';
        btnRow.append(
          createButton({
            label: 'Reconectar carpeta',
            icon: 'folderOpen',
            variant: 'primary',
            size: 'sm',
            onClick: () => requestStoredHandlePermission(ws)
          }),
          createButton({
            label: 'Elegir otro directorio',
            variant: 'outline',
            size: 'sm',
            onClick: () => pickDirectoryForWorkspace(ws)
          })
        );
        box.appendChild(btnRow);
        viewerArea.appendChild(box);
        return;
      }

      if (!rt || rt.nodes.length === 0) {
        const empty = document.createElement('div');
        empty.className =
          'h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-3';
        empty.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">${getIcon(
            'folderOpen'
          )}</div>
          <h3 class="text-sm font-semibold text-white">${escapeHtml(ws.name)}</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Selecciona un directorio local para visualizar y editar archivos básicos:
            <span class="text-sky-300">.md</span> (Edición / Preview),
            <span class="text-emerald-300">imágenes</span> (Preview),
            <span class="text-amber-300">.json</span>,
            <span class="text-blue-300">.ts</span> y
            <span class="text-yellow-300">.js</span> con resaltado de sintaxis.
          </p>
        `;
        empty.appendChild(
          createButton({
            label: 'Seleccionar directorio',
            icon: 'folderOpen',
            variant: 'primary',
            size: 'sm',
            onClick: () => pickDirectoryForWorkspace(ws)
          })
        );
        viewerArea.appendChild(empty);
        return;
      }

      const activeFile = activeFilePath ? findFileByPath(rt.nodes, activeFilePath) : null;

      if (!activeFile) {
        const stats = collectStats(rt.nodes);
        const overview = document.createElement('div');
        overview.className =
          'h-full flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4';
        overview.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">${getIcon(
            'folderOpen'
          )}</div>
          <div>
            <h3 class="text-base font-bold text-white">${escapeHtml(ws.name)}</h3>
            <p class="text-xs text-slate-400 mt-1">
              Directorio vinculado: <code class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">${escapeHtml(
                ws.folderName || ''
              )}</code>
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2.5 w-full">
            <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div class="text-lg font-bold text-sky-400">${stats.markdown}</div>
              <div class="text-[11px] text-slate-400">Markdown (.md)</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div class="text-lg font-bold text-emerald-400">${stats.image}</div>
              <div class="text-[11px] text-slate-400">Imágenes</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div class="text-lg font-bold text-amber-400">${stats.code}</div>
              <div class="text-[11px] text-slate-400">JSON / TS / JS / Texto</div>
            </div>
          </div>
          <p class="text-xs text-slate-500">
            Selecciona cualquier archivo en el sidebar izquierdo para abrirlo.
          </p>
        `;
        viewerArea.appendChild(overview);
        return;
      }

      // =======================================================================
      // CABECERA DEL ARCHIVO SELECCIONADO
      // =======================================================================
      const fileHeader = document.createElement('div');
      fileHeader.className =
        'px-3.5 py-2 bg-slate-900/70 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0';

      const vis = getFileVisualMeta(activeFile);
      const fileTitleBox = document.createElement('div');
      fileTitleBox.className = 'flex items-center gap-2 min-w-0';
      fileTitleBox.innerHTML = `
        <span class="${vis.color} shrink-0">${getIcon(vis.icon)}</span>
        <span class="text-xs font-mono text-slate-200 truncate" title="${escapeHtml(
          activeFile.path
        )}">${escapeHtml(activeFile.path)}</span>
      `;

      fileTitleBox.appendChild(
        createBadge({
          text: vis.tag,
          variant: activeFile.kind === 'markdown' ? 'info' : activeFile.kind === 'image' ? 'success' : 'primary'
        })
      );

      if (activeFile.kind !== 'image') {
        dirtyBadgeEl = createBadge({
          text: 'Sin guardar',
          variant: 'warning',
          className: isDirty ? '' : 'hidden'
        });
        fileTitleBox.appendChild(dirtyBadgeEl);
      }

      const fileActions = document.createElement('div');
      fileActions.className = 'flex flex-wrap items-center gap-1.5';

      fileHeader.append(fileTitleBox, fileActions);
      viewerArea.appendChild(fileHeader);

      // =======================================================================
      // 1) VISOR DE IMÁGENES (Preview inmediato + Zoom + Metadatos)
      // =======================================================================
      if (activeFile.kind === 'image') {
        const metaInfo = document.createElement('span');
        metaInfo.className = 'text-[11px] font-mono text-slate-400 px-2';
        metaInfo.textContent = formatBytes(activeFile.size);

        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'text-[11px] font-mono text-slate-300 min-w-[3rem] text-center';
        zoomLabel.textContent = `${imageZoom}%`;

        let imgEl = null;

        const applyZoom = (nextZoom, fit = false) => {
          if (!imgEl) return;
          if (fit) {
            imageZoom = 100;
            imgEl.style.width = '';
            imgEl.style.maxWidth = '100%';
            imgEl.style.maxHeight = '100%';
            zoomLabel.textContent = 'Ajustar';
          } else {
            imageZoom = Math.max(20, Math.min(400, nextZoom));
            imgEl.style.maxWidth = 'none';
            imgEl.style.maxHeight = 'none';
            if (imgEl.naturalWidth) {
              imgEl.style.width = `${Math.round((imgEl.naturalWidth * imageZoom) / 100)}px`;
            }
            zoomLabel.textContent = `${imageZoom}%`;
          }
        };

        fileActions.append(
          metaInfo,
          createButton({
            icon: 'zoomOut',
            variant: 'ghost',
            size: 'xs',
            title: 'Alejar',
            onClick: () => applyZoom(imageZoom - 25)
          }),
          zoomLabel,
          createButton({
            icon: 'zoomIn',
            variant: 'ghost',
            size: 'xs',
            title: 'Acercar',
            onClick: () => applyZoom(imageZoom + 25)
          }),
          createButton({
            label: 'Ajustar',
            variant: 'secondary',
            size: 'xs',
            onClick: () => applyZoom(100, true)
          })
        );

        const stage = document.createElement('div');
        stage.className =
          'flex-1 overflow-auto custom-scrollbar checkerboard-bg flex items-center justify-center p-6';

        imgEl = document.createElement('img');
        imgEl.src = activeImageUrl || '';
        imgEl.alt = activeFile.name;
        imgEl.className =
          'max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/70 border border-slate-800/80 transition-all';
        imgEl.addEventListener('load', () => {
          if (imgEl.naturalWidth && imgEl.naturalHeight) {
            metaInfo.textContent = `${imgEl.naturalWidth} × ${imgEl.naturalHeight} px · ${formatBytes(
              activeFile.size
            )}`;
          }
        });
        zoomLabel.textContent = 'Ajustar';

        stage.appendChild(imgEl);
        viewerArea.appendChild(stage);
        return;
      }

      // =======================================================================
      // 2) VISOR / EDITOR MARKDOWN (Preview | Edición | Dividido)
      // =======================================================================
      if (activeFile.kind === 'markdown') {
        const modeSwitch = document.createElement('div');
        modeSwitch.className =
          'inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]';

        [
          { id: 'preview', label: 'Preview' },
          { id: 'editor', label: 'Edición' },
          { id: 'split', label: 'Dividido' }
        ].forEach((m) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = m.label;
          btn.className = `px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
            mdViewMode === m.id
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`;
          btn.addEventListener('click', () => {
            mdViewMode = m.id;
            renderViewer();
          });
          modeSwitch.appendChild(btn);
        });

        const copyBtn = createButton({
          label: 'Copiar',
          icon: 'copy',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            navigator.clipboard?.writeText(activeFileContent);
            Toast.success('Contenido Markdown copiado');
          }
        });

        saveBtnEl = createButton({
          label: activeFile.handle ? 'Guardar' : 'Descargar',
          icon: activeFile.handle ? 'save' : 'download',
          variant: 'primary',
          size: 'xs',
          disabled: !isDirty,
          onClick: () => saveActiveFile(activeFile)
        });

        fileActions.append(modeSwitch, copyBtn, saveBtnEl);

        const contentBody = document.createElement('div');
        contentBody.className =
          mdViewMode === 'split'
            ? 'flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80'
            : 'flex-1 flex flex-col min-h-0 overflow-hidden';

        let previewEl = null;

        if (mdViewMode === 'editor' || mdViewMode === 'split') {
          const editorPane = document.createElement('div');
          editorPane.className = 'flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 bg-slate-950/60';

          const mdEditor = createCodeEditor({
            value: activeFileContent,
            language: 'markdown',
            lineNumbers: true,
            autoResize: false,
            placeholder: '# Escribe tu Markdown aquí...',
            onChange: (val) => {
              activeFileContent = val;
              isDirty = activeFileContent !== savedFileContent;
              updateDirtyIndicators();
              if (previewEl) {
                previewEl.innerHTML = renderMarkdownToHtml(activeFileContent);
              }
            },
            onSave: () => saveActiveFile(activeFile)
          });

          editorPane.appendChild(mdEditor.element);
          contentBody.appendChild(editorPane);
        }

        if (mdViewMode === 'preview' || mdViewMode === 'split') {
          const previewWrap = document.createElement('div');
          previewWrap.className = 'flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-slate-950/30';

          previewEl = document.createElement('article');
          previewEl.className = 'max-w-3xl mx-auto';
          previewEl.innerHTML = renderMarkdownToHtml(activeFileContent);

          previewWrap.appendChild(previewEl);
          contentBody.appendChild(previewWrap);
        }

        viewerArea.appendChild(contentBody);
        return;
      }

      // =======================================================================
      // 3) VISOR / EDITOR DE CÓDIGO CON RESALTADO (JSON, TS, JS, HTML, CSS, TXT, YAML)
      // =======================================================================
      const codeEditorWrap = document.createElement('div');
      codeEditorWrap.className = 'flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 bg-slate-950/60';

      const codeEditor = createCodeEditor({
        value: activeFileContent,
        language: activeFile.language || detectLanguageFromFilename(activeFile.name),
        lineNumbers: true,
        autoResize: false,
        placeholder: '// Archivo vacío...',
        onChange: (val) => {
          activeFileContent = val;
          isDirty = activeFileContent !== savedFileContent;
          updateDirtyIndicators();
        },
        onSave: () => saveActiveFile(activeFile)
      });

      if (activeFile.ext === 'json') {
        fileActions.appendChild(
          createButton({
            label: 'Formatear JSON',
            icon: 'sparkles',
            variant: 'outline',
            size: 'xs',
            onClick: () => {
              try {
                const parsed = JSON.parse(activeFileContent);
                const formatted = JSON.stringify(parsed, null, 2);
                activeFileContent = formatted;
                codeEditor.setValue(formatted);
                isDirty = activeFileContent !== savedFileContent;
                updateDirtyIndicators();
                Toast.success('JSON formateado correctamente');
              } catch (err) {
                Toast.error(`JSON inválido: ${err.message}`);
              }
            }
          })
        );
      }

      fileActions.appendChild(
        createButton({
          label: 'Copiar',
          icon: 'copy',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            navigator.clipboard?.writeText(activeFileContent);
            Toast.success('Código copiado al portapapeles');
          }
        })
      );

      saveBtnEl = createButton({
        label: activeFile.handle ? 'Guardar' : 'Descargar',
        icon: activeFile.handle ? 'save' : 'download',
        variant: 'primary',
        size: 'xs',
        disabled: !isDirty,
        onClick: () => saveActiveFile(activeFile)
      });
      fileActions.appendChild(saveBtnEl);

      codeEditorWrap.appendChild(codeEditor.element);
      viewerArea.appendChild(codeEditorWrap);
    }

    function renderAll() {
      renderWorkspaceDropdown();
      renderSidebarTree();
      renderViewer();
    }

    renderAll();

    // Intentar hidratar el directorio del workspace activo desde IndexedDB
    const initialWs = getActiveWorkspace();
    if (initialWs) {
      hydrateWorkspaceFromIndexedDb(initialWs);
    }

    return () => {
      destroyed = true;
      revokeActiveImageUrl();
    };
  }
};
