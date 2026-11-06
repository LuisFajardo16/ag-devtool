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

const DEFAULT_FOLDERS = [
  {
    id: 'folder-docs',
    name: 'Documentación',
    parentId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-specs',
    name: 'Especificaciones Técnicas',
    parentId: 'folder-docs',
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-notes',
    name: 'Notas de Reuniones',
    parentId: null,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_FILES = [
  {
    id: 'file-welcome-md',
    folderId: 'folder-docs',
    name: 'Bienvenida-Markdown.md',
    content: `# Bienvenido al Markdown Manager 📝

Este gestor permite organizar tu documentación en una **estructura de carpetas**, editar en tiempo real y generar nuevos documentos a partir de **plantillas dinámicas con variables**.

---

## ✨ Capacidades Principales

1. **Árbol de Carpetas y Archivos**:
   - Crea carpetas y subcarpetas anidadas.
   - Crea, renombra, mueve o elimina archivos \`.md\`.
2. **Plantillas con Variables Dinámicas (\`{{variable}}\`)**:
   - Diseña plantillas reutilizables definiendo marcadores como \`{{proyecto}}\`, \`{{autor}}\` o \`{{fecha}}\`.
   - Al crear un archivo desde una plantilla, el sistema te pedirá completar los valores dinámicos automáticamente.
3. **Exportación Directa**:
   - Descarga en formato **Markdown (\`.md\`)**, **HTML (\`.html\`)** o **PDF** listo para compartir.

---

### Ejemplo de Tabla y Código

| Característica | Estado | Persistencia |
| :--- | :--- | :--- |
| Árbol de Carpetas | Activo | \`localStorage\` |
| Plantillas con Variables | Activo | \`localStorage\` |
| Exportación MD / HTML / PDF | Activo | Instantánea |

\`\`\`javascript
function saludarEquipo(nombreProyecto) {
  return \`Documentación activa para: \${nombreProyecto}\`;
}
\`\`\`

- [x] Crear estructura de carpetas inicial
- [x] Configurar motor de plantillas dinámicas
- [ ] Generar tu primer documento desde una plantilla`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'file-architecture-md',
    folderId: 'folder-specs',
    name: 'Especificacion-API.md',
    content: `# Especificación de Módulo — AG-DevTool

> Documento almacenado dentro de la subcarpeta **Especificaciones Técnicas**.

## 1. Objetivo
Definir el estándar de documentación técnica persistida localmente en el navegador.

## 2. Endpoints / Módulos
- \`StorageService\`: Persistencia reactiva en \`localStorage\`.
- \`MarkdownManagerTool\`: Gestión de árbol de directorios, plantillas y exportación.`,
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-pbi-spec',
    name: 'Especificación de PBI / Feature',
    description: 'Plantilla técnica para documentar un nuevo requerimiento o PBI.',
    content: `# [PBI-{{numero_pbi}}] {{titulo_feature}}

- **Proyecto / App**: {{nombre_proyecto}}
- **Autor / Responsable**: {{autor}}
- **Fecha**: {{fecha}}
- **Prioridad**: {{prioridad}}

---

## 🎯 1. Descripción del Objetivo
{{descripcion_objetivo}}

## 🛠️ 2. Cambios Técnicos Propuestos
- Componente principal: \`{{componente_principal}}\`
- Impacto esperado: {{impacto}}

## ✅ 3. Criterios de Aceptación
- [ ] Validación funcional completada en entorno de desarrollo
- [ ] Revisión de estilos y estándares de arquitectura
- [ ] Documentación actualizada`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-meeting-minutes',
    name: 'Acta de Reunión Técnica',
    description: 'Resumen ejecutivo de acuerdos, participantes y tareas de una sesión.',
    content: `# Acta de Reunión: {{tema_reunion}}

- **Fecha**: {{fecha}}
- **Moderador**: {{moderador}}
- **Participantes**: {{participantes}}

---

## 📌 Puntos Tratados
{{puntos_tratados}}

## 🚀 Acuerdos y Próximos Pasos
| Responsable | Compromiso / Tarea | Fecha Entrega |
| :--- | :--- | :--- |
| {{responsable_principal}} | {{tarea_principal}} | {{fecha_entrega}} |`,
    updatedAt: new Date().toISOString()
  }
];

function loadMarkdownState() {
  const saved = StorageService.get(STORAGE_KEYS.MARKDOWN_MANAGER, null);
  if (!saved || typeof saved !== 'object') {
    const initial = {
      folders: [...DEFAULT_FOLDERS],
      files: [...DEFAULT_FILES],
      templates: [...DEFAULT_TEMPLATES],
      activeFileId: DEFAULT_FILES[0].id,
      expandedFolderIds: DEFAULT_FOLDERS.map((f) => f.id)
    };
    StorageService.set(STORAGE_KEYS.MARKDOWN_MANAGER, initial);
    return JSON.parse(JSON.stringify(initial));
  }

  return {
    folders: Array.isArray(saved.folders) ? saved.folders : [...DEFAULT_FOLDERS],
    files: Array.isArray(saved.files) ? saved.files : [...DEFAULT_FILES],
    templates: Array.isArray(saved.templates) ? saved.templates : [...DEFAULT_TEMPLATES],
    activeFileId: saved.activeFileId ?? (saved.files?.[0]?.id || null),
    expandedFolderIds: Array.isArray(saved.expandedFolderIds)
      ? saved.expandedFolderIds
      : DEFAULT_FOLDERS.map((f) => f.id)
  };
}

function saveMarkdownState(state) {
  StorageService.set(STORAGE_KEYS.MARKDOWN_MANAGER, state);
  events.emit('markdown:updated', state);
}

function escapeHtml(str = '') {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extrae la lista única de variables con formato {{variable}} de una plantilla
 */
export function extractTemplateVariables(templateContent = '') {
  const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  const vars = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(String(templateContent || ''))) !== null) {
    const name = match[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      vars.push(name);
    }
  }
  return vars;
}

/**
 * Reemplaza todas las ocurrencias de {{variable}} con los valores provistos por el usuario
 */
export function interpolateTemplate(templateContent = '', valuesMap = {}) {
  return String(templateContent || '').replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (_, varName) => {
      const key = varName.trim();
      return Object.prototype.hasOwnProperty.call(valuesMap, key)
        ? String(valuesMap[key])
        : `{{${key}}}`;
    }
  );
}

/**
 * Formatea elementos inline de Markdown (código, negrita, cursiva, tachado, enlaces)
 */
function parseInlineMarkdown(text = '') {
  let html = escapeHtml(text);

  // Código inline `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono text-[12px] border border-slate-700/70">$1</code>'
  );

  // Enlaces [texto](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">$1</a>'
  );

  // Negrita **texto**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Cursiva *texto*
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>');

  // Tachado ~~texto~~
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-slate-500">$1</del>');

  // Resaltar variables {{variable}} aún sin interpolar
  html = html.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px]">{{$1}}</span>'
  );

  return html;
}

/**
 * Convierte texto Markdown en HTML rico estilizado para vista previa y exportación
 */
export function renderMarkdownToHtml(markdown = '') {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Bloque de código ```lang
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // saltar cierre ```
      out.push(`
        <div class="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90">
          <div class="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>${escapeHtml(lang)}</span>
          </div>
          <pre class="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed"><code>${escapeHtml(
            codeLines.join('\n')
          )}</code></pre>
        </div>
      `);
      continue;
    }

    // Línea horizontal
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push('<hr class="my-4 border-slate-800" />');
      i++;
      continue;
    }

    // Encabezados # a ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseInlineMarkdown(headingMatch[2].trim());
      const sizeMap = {
        1: 'text-xl font-bold text-white border-b border-slate-800 pb-2 mt-4 mb-3',
        2: 'text-lg font-bold text-slate-100 mt-4 mb-2',
        3: 'text-base font-semibold text-indigo-300 mt-3 mb-1.5',
        4: 'text-sm font-semibold text-slate-200 mt-2.5 mb-1',
        5: 'text-xs font-bold uppercase tracking-wider text-slate-300 mt-2 mb-1',
        6: 'text-xs font-semibold text-slate-400 mt-2 mb-1'
      };
      out.push(`<h${level} class="${sizeMap[level]}">${content}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote >
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`
        <blockquote class="my-3 pl-3.5 py-2 border-l-4 border-indigo-500 bg-indigo-500/10 rounded-r-lg text-xs text-slate-200 italic space-y-1">
          ${quoteLines.map((q) => `<p>${parseInlineMarkdown(q)}</p>`).join('')}
        </blockquote>
      `);
      continue;
    }

    // Tablas Markdown | col1 | col2 |
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
    ) {
      const parseRow = (r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => parseInlineMarkdown(c.trim()));

      const headers = parseRow(lines[i]);
      i += 2; // saltar cabecera y fila separadora
      const bodyRows = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }

      out.push(`
        <div class="my-3 overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 border-b border-slate-800 text-slate-200">
                ${headers
                  .map((h) => `<th class="px-3 py-2 font-semibold">${h}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/50">
              ${bodyRows
                .map(
                  (row) => `
                  <tr class="hover:bg-slate-900/40">
                    ${row.map((cell) => `<td class="px-3 py-2 text-slate-300">${cell}</td>`).join('')}
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    // Listas desordenadas y Checklists (- item, * item, - [x] item)
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const rawItem = lines[i].replace(/^\s*[-*+]\s+/, '');
        const checkMatch = rawItem.match(/^\[([ xX])\]\s+(.+)$/);
        if (checkMatch) {
          const checked = checkMatch[1].toLowerCase() === 'x';
          items.push(`
            <li class="flex items-start gap-2 my-1 list-none">
              <span class="mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                checked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }">${checked ? '✓' : ''}</span>
              <span class="${checked ? 'line-through text-slate-400' : 'text-slate-200'}">${parseInlineMarkdown(
            checkMatch[2]
          )}</span>
            </li>
          `);
        } else {
          items.push(
            `<li class="ml-4 list-disc text-slate-200 my-1">${parseInlineMarkdown(rawItem)}</li>`
          );
        }
        i++;
      }
      out.push(`<ul class="my-2.5 space-y-1 text-sm">${items.join('')}</ul>`);
      continue;
    }

    // Listas ordenadas (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const rawItem = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push(
          `<li class="ml-5 list-decimal text-slate-200 my-1">${parseInlineMarkdown(rawItem)}</li>`
        );
        i++;
      }
      out.push(`<ol class="my-2.5 space-y-1 text-sm">${items.join('')}</ol>`);
      continue;
    }

    // Párrafo normal
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(parseInlineMarkdown(lines[i].trim()));
      i++;
    }
    if (paraLines.length > 0) {
      out.push(
        `<p class="my-2 text-sm text-slate-300 leading-relaxed">${paraLines.join('<br/>')}</p>`
      );
    } else {
      i++;
    }
  }

  return out.join('\n');
}

/**
 * Construye un documento HTML autónomo para exportar a .html o imprimir a PDF
 */
function buildStandaloneHtmlDocument(title, markdownContent) {
  const renderedBody = renderMarkdownToHtml(markdownContent);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.65;
      color: #0f172a;
      background: #ffffff;
      max-width: 840px;
      margin: 0 auto;
      padding: 40px 28px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }
    h1 { font-size: 1.85rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.4rem; }
    h2 { font-size: 1.4rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
    h3 { font-size: 1.15rem; color: #3730a3; }
    p, li { font-size: 0.96rem; color: #1e293b; }
    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      background: #f1f5f9;
      color: #4338ca;
      padding: 2px 6px;
      border-radius: 5px;
      font-size: 0.86em;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 16px;
      border-radius: 10px;
      overflow-x: auto;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    blockquote {
      margin: 16px 0;
      padding: 10px 16px;
      border-left: 4px solid #4f46e5;
      background: #eef2ff;
      color: #1e1b4b;
      border-radius: 0 8px 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    @media print {
      body { padding: 12px; max-width: 100%; }
    }
  </style>
</head>
<body>
  ${renderedBody}
</body>
</html>`;
}

function triggerFileDownload(filename, content, mimeType = 'text/plain;charset=utf-8') {
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

/**
 * Herramienta del Marketplace: Markdown Manager
 */
export const MarkdownManagerTool = {
  id: 'markdown-manager',
  name: 'Markdown Manager',
  description:
    'Editor y gestor de archivos Markdown con estructura de carpetas, plantillas con variables dinámicas, vista previa en tiempo real y exportación a MD, HTML o PDF.',
  category: 'Productividad',
  icon: 'fileText',
  defaultInstalled: false,

  mount(container) {
    let state = loadMarkdownState();
    let viewMode = 'split'; // 'split' | 'editor' | 'preview'
    let explorerCollapsed = false;
    let searchQuery = '';

    container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'h-full w-full flex flex-col bg-slate-950/50 text-slate-200 overflow-hidden';

    // 1. Barra Superior de Acciones
    const topToolbar = document.createElement('div');
    topToolbar.className =
      'px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0';

    const leftBar = document.createElement('div');
    leftBar.className = 'flex flex-wrap items-center gap-1.5';

    const toggleExplorerBtn = createButton({
      label: 'Carpetas',
      icon: 'folder',
      variant: 'secondary',
      size: 'xs',
      title: 'Mostrar / ocultar árbol de carpetas',
      onClick: () => {
        explorerCollapsed = !explorerCollapsed;
        explorerSidebar.classList.toggle('hidden', explorerCollapsed);
      }
    });

    const newFolderBtn = createButton({
      label: 'Nueva Carpeta',
      icon: 'folderPlus',
      variant: 'outline',
      size: 'xs',
      onClick: () => openFolderModal()
    });

    const newFileBtn = createButton({
      label: 'Nuevo .md',
      icon: 'filePlus',
      variant: 'primary',
      size: 'xs',
      onClick: () => openCreateFileModal()
    });

    const fromTemplateBtn = createButton({
      label: 'Usar Plantilla',
      icon: 'sparkles',
      variant: 'success',
      size: 'xs',
      title: 'Crear archivo Markdown completando las variables de una plantilla',
      onClick: () => openUseTemplateModal()
    });

    const manageTemplatesBtn = createButton({
      label: 'Plantillas',
      icon: 'template',
      variant: 'secondary',
      size: 'xs',
      title: 'Crear o editar plantillas con variables dinámicas {{variable}}',
      onClick: () => openTemplatesManagerModal()
    });

    leftBar.append(
      toggleExplorerBtn,
      newFolderBtn,
      newFileBtn,
      fromTemplateBtn,
      manageTemplatesBtn
    );

    const rightBar = document.createElement('div');
    rightBar.className = 'flex flex-wrap items-center gap-1.5';

    // Selector de Modo de Vista: Editor + Preview | Solo Editor | Solo Preview
    const viewSwitch = document.createElement('div');
    viewSwitch.className =
      'inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]';

    function renderViewSwitch() {
      viewSwitch.innerHTML = '';
      [
        { id: 'split', label: 'Dividido' },
        { id: 'editor', label: 'Editor' },
        { id: 'preview', label: 'Vista Previa' }
      ].forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = m.label;
        btn.className = `px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
          viewMode === m.id
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`;
        btn.addEventListener('click', () => {
          viewMode = m.id;
          renderViewSwitch();
          renderWorkspaceEditor();
        });
        viewSwitch.appendChild(btn);
      });
    }
    renderViewSwitch();

    const exportMdBtn = createButton({
      label: '.MD',
      icon: 'download',
      variant: 'outline',
      size: 'xs',
      title: 'Descargar archivo Markdown (.md)',
      onClick: () => {
        const activeFile = getActiveFile();
        if (!activeFile) {
          Toast.warning('Selecciona un archivo para exportar');
          return;
        }
        const cleanName = activeFile.name.endsWith('.md')
          ? activeFile.name
          : `${activeFile.name}.md`;
        triggerFileDownload(cleanName, activeFile.content, 'text/markdown;charset=utf-8');
        Toast.success(`Exportado: ${cleanName}`);
      }
    });

    const exportHtmlBtn = createButton({
      label: '.HTML',
      icon: 'code',
      variant: 'outline',
      size: 'xs',
      title: 'Exportar documento como HTML estilizado (.html)',
      onClick: () => {
        const activeFile = getActiveFile();
        if (!activeFile) {
          Toast.warning('Selecciona un archivo para exportar');
          return;
        }
        const baseName = activeFile.name.replace(/\.md$/i, '');
        const htmlDoc = buildStandaloneHtmlDocument(baseName, activeFile.content);
        triggerFileDownload(`${baseName}.html`, htmlDoc, 'text/html;charset=utf-8');
        Toast.success(`Exportado: ${baseName}.html`);
      }
    });

    const exportPdfBtn = createButton({
      label: 'PDF',
      icon: 'download',
      variant: 'secondary',
      size: 'xs',
      title: 'Exportar a PDF mediante vista de impresión estilizada',
      onClick: () => {
        const activeFile = getActiveFile();
        if (!activeFile) {
          Toast.warning('Selecciona un archivo para exportar a PDF');
          return;
        }
        const baseName = activeFile.name.replace(/\.md$/i, '');
        const htmlDoc = buildStandaloneHtmlDocument(baseName, activeFile.content);
        const printWin = window.open('', '_blank', 'width=900,height=700');
        if (!printWin) {
          // Si el navegador bloquea popups, descargamos HTML como fallback limpio
          triggerFileDownload(`${baseName}.html`, htmlDoc, 'text/html;charset=utf-8');
          Toast.info('Ventana emergente bloqueada; se descargó el HTML listo para imprimir.');
          return;
        }
        printWin.document.open();
        printWin.document.write(htmlDoc);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 250);
      }
    });

    rightBar.append(viewSwitch, exportMdBtn, exportHtmlBtn, exportPdfBtn);
    topToolbar.append(leftBar, rightBar);

    // 2. Cuerpo Principal: Árbol de Carpetas (Izquierda) + Editor/Preview (Derecha)
    const mainBody = document.createElement('div');
    mainBody.className = 'flex-1 flex min-h-0 overflow-hidden';

    const explorerSidebar = document.createElement('aside');
    explorerSidebar.className =
      'w-64 sm:w-72 border-r border-slate-800/90 bg-slate-900/50 flex flex-col min-h-0 shrink-0 select-none';

    const explorerSearchWrap = document.createElement('div');
    explorerSearchWrap.className = 'p-2.5 border-b border-slate-800/80';

    const searchInput = createInput({
      placeholder: 'Buscar carpeta o archivo .md...',
      icon: 'search',
      onInput: (val) => {
        searchQuery = val.trim().toLowerCase();
        renderExplorerTree();
      }
    });
    searchInput.input.classList.replace('py-2', 'py-1.5');
    searchInput.input.classList.replace('text-sm', 'text-xs');
    explorerSearchWrap.appendChild(searchInput);

    const treeContainer = document.createElement('div');
    treeContainer.className = 'flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1';

    explorerSidebar.append(explorerSearchWrap, treeContainer);

    const workspaceRight = document.createElement('div');
    workspaceRight.className = 'flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950/30';

    mainBody.append(explorerSidebar, workspaceRight);
    root.append(topToolbar, mainBody);
    container.appendChild(root);

    function getActiveFile() {
      return state.files.find((f) => f.id === state.activeFileId) || null;
    }

    function getFolderPathString(folderId) {
      if (!folderId) return '/ (Raíz)';
      const parts = [];
      let curr = state.folders.find((f) => f.id === folderId);
      let guard = 0;
      while (curr && guard < 20) {
        parts.unshift(curr.name);
        curr = state.folders.find((f) => f.id === curr.parentId);
        guard++;
      }
      return '/' + parts.join('/');
    }

    /**
     * Renderiza el árbol jerárquico de carpetas y archivos .md
     */
    function renderExplorerTree() {
      treeContainer.innerHTML = '';

      const expandedSet = new Set(state.expandedFolderIds || []);

      function renderFolderNode(folder, depth = 0) {
        const childFolders = state.folders.filter((f) => f.parentId === folder.id);
        const childFiles = state.files.filter((f) => f.folderId === folder.id);

        if (searchQuery) {
          const folderMatches = folder.name.toLowerCase().includes(searchQuery);
          const anyFileMatches = childFiles.some(
            (file) =>
              file.name.toLowerCase().includes(searchQuery) ||
              file.content.toLowerCase().includes(searchQuery)
          );
          if (!folderMatches && !anyFileMatches && childFolders.length === 0) {
            return null;
          }
        }

        const isExpanded = searchQuery ? true : expandedSet.has(folder.id);

        const wrap = document.createElement('div');
        wrap.className = 'space-y-0.5';

        const folderRow = document.createElement('div');
        folderRow.style.paddingLeft = `${depth * 12 + 6}px`;
        folderRow.className =
          'group flex items-center justify-between gap-1 pr-1.5 py-1.5 rounded-lg hover:bg-slate-800/70 text-xs text-slate-200 cursor-pointer transition-colors';

        const left = document.createElement('div');
        left.className = 'flex items-center gap-1.5 min-w-0 flex-1';
        left.innerHTML = `
          <span class="text-slate-400 shrink-0">${getIcon(
            isExpanded ? 'chevronDown' : 'chevronRight'
          )}</span>
          <span class="text-amber-400 shrink-0">${getIcon('folder')}</span>
          <span class="font-medium truncate">${escapeHtml(folder.name)}</span>
          <span class="text-[10px] text-slate-500 font-mono">(${childFiles.length})</span>
        `;

        const actions = document.createElement('div');
        actions.className =
          'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0';

        const addFileHereBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'filePlus',
          title: 'Nuevo archivo en esta carpeta',
          className: 'p-1 text-slate-400 hover:text-indigo-300',
          onClick: (e) => {
            e.stopPropagation();
            openCreateFileModal(folder.id);
          }
        });

        const addSubfolderBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'folderPlus',
          title: 'Nueva subcarpeta',
          className: 'p-1 text-slate-400 hover:text-amber-300',
          onClick: (e) => {
            e.stopPropagation();
            openFolderModal({ parentId: folder.id });
          }
        });

        const renameFolderBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'edit',
          title: 'Renombrar carpeta',
          className: 'p-1 text-slate-400 hover:text-white',
          onClick: (e) => {
            e.stopPropagation();
            openFolderModal({ folder });
          }
        });

        const deleteFolderBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'trash',
          title: 'Eliminar carpeta',
          className: 'p-1 text-slate-400 hover:text-rose-400',
          onClick: (e) => {
            e.stopPropagation();
            confirmDeleteFolder(folder);
          }
        });

        actions.append(addFileHereBtn, addSubfolderBtn, renameFolderBtn, deleteFolderBtn);
        folderRow.append(left, actions);

        folderRow.addEventListener('click', () => {
          if (expandedSet.has(folder.id)) {
            expandedSet.delete(folder.id);
          } else {
            expandedSet.add(folder.id);
          }
          state.expandedFolderIds = Array.from(expandedSet);
          saveMarkdownState(state);
          renderExplorerTree();
        });

        wrap.appendChild(folderRow);

        if (isExpanded) {
          const childrenBox = document.createElement('div');
          childrenBox.className = 'space-y-0.5';

          childFolders.forEach((sub) => {
            const subEl = renderFolderNode(sub, depth + 1);
            if (subEl) childrenBox.appendChild(subEl);
          });

          childFiles.forEach((file) => {
            if (
              searchQuery &&
              !file.name.toLowerCase().includes(searchQuery) &&
              !file.content.toLowerCase().includes(searchQuery)
            ) {
              return;
            }
            childrenBox.appendChild(renderFileRow(file, depth + 1));
          });

          wrap.appendChild(childrenBox);
        }

        return wrap;
      }

      function renderFileRow(file, depth = 0) {
        const isSelected = file.id === state.activeFileId;
        const row = document.createElement('div');
        row.style.paddingLeft = `${depth * 12 + 20}px`;
        row.className = `group flex items-center justify-between gap-1 pr-1.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-semibold'
            : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
        }`;

        const left = document.createElement('div');
        left.className = 'flex items-center gap-1.5 min-w-0 flex-1';
        left.innerHTML = `
          <span class="${isSelected ? 'text-indigo-400' : 'text-slate-400'} shrink-0">${getIcon(
          'fileText'
        )}</span>
          <span class="truncate font-mono text-[11px]">${escapeHtml(file.name)}</span>
        `;

        const actions = document.createElement('div');
        actions.className =
          'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0';

        const renameBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'edit',
          title: 'Renombrar o mover archivo',
          className: 'p-1 text-slate-400 hover:text-white',
          onClick: (e) => {
            e.stopPropagation();
            openRenameFileModal(file);
          }
        });

        const delBtn = createButton({
          variant: 'ghost',
          size: 'icon',
          icon: 'trash',
          title: 'Eliminar archivo',
          className: 'p-1 text-slate-400 hover:text-rose-400',
          onClick: (e) => {
            e.stopPropagation();
            confirmDeleteFile(file);
          }
        });

        actions.append(renameBtn, delBtn);
        row.append(left, actions);

        row.addEventListener('click', () => {
          state.activeFileId = file.id;
          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
        });

        return row;
      }

      // Renderizar carpetas raíz
      const rootFolders = state.folders.filter((f) => !f.parentId);
      rootFolders.forEach((folder) => {
        const el = renderFolderNode(folder, 0);
        if (el) treeContainer.appendChild(el);
      });

      // Archivos en la raíz (sin carpeta asignada)
      const rootFiles = state.files.filter((f) => !f.folderId);
      rootFiles.forEach((file) => {
        if (
          searchQuery &&
          !file.name.toLowerCase().includes(searchQuery) &&
          !file.content.toLowerCase().includes(searchQuery)
        ) {
          return;
        }
        treeContainer.appendChild(renderFileRow(file, 0));
      });
    }

    /**
     * Renderiza el editor Markdown y la vista previa en tiempo real
     */
    function renderWorkspaceEditor() {
      workspaceRight.innerHTML = '';
      const activeFile = getActiveFile();

      if (!activeFile) {
        const empty = document.createElement('div');
        empty.className =
          'h-full flex flex-col items-center justify-center p-6 text-center text-slate-500';
        empty.innerHTML = `
          <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 mb-3">${getIcon(
            'fileText'
          )}</div>
          <p class="text-xs font-medium text-slate-300">Ningún archivo Markdown seleccionado</p>
          <p class="text-[11px] text-slate-500 mt-1">Crea un archivo nuevo o genera uno desde una plantilla con variables.</p>
        `;
        const actionsRow = document.createElement('div');
        actionsRow.className = 'flex items-center gap-2 mt-3';
        actionsRow.append(
          createButton({
            label: 'Nuevo Archivo .md',
            icon: 'filePlus',
            variant: 'primary',
            size: 'xs',
            onClick: () => openCreateFileModal()
          }),
          createButton({
            label: 'Generar desde Plantilla',
            icon: 'sparkles',
            variant: 'success',
            size: 'xs',
            onClick: () => openUseTemplateModal()
          })
        );
        empty.appendChild(actionsRow);
        workspaceRight.appendChild(empty);
        return;
      }

      // Cabecera del archivo activo + barra rápida de sintaxis Markdown
      const fileHeader = document.createElement('div');
      fileHeader.className =
        'px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0';

      const pathInfo = document.createElement('div');
      pathInfo.className = 'flex items-center gap-2 min-w-0';
      pathInfo.innerHTML = `
        <span class="text-[11px] font-mono text-slate-400 truncate">${escapeHtml(
          getFolderPathString(activeFile.folderId)
        )}</span>
        <span class="text-slate-600">/</span>
        <span class="text-xs font-mono font-bold text-indigo-300 truncate">${escapeHtml(
          activeFile.name
        )}</span>
      `;

      const quickFormatBar = document.createElement('div');
      quickFormatBar.className = 'flex flex-wrap items-center gap-1';

      let textareaEl = null;
      let previewContentEl = null;
      let wordCountBadge = null;

      function insertSnippet(prefix, suffix = '', sample = 'texto') {
        if (!textareaEl) return;
        const start = textareaEl.selectionStart || 0;
        const end = textareaEl.selectionEnd || 0;
        const current = textareaEl.value;
        const selected = current.slice(start, end) || sample;
        const replacement = `${prefix}${selected}${suffix}`;
        textareaEl.value = current.slice(0, start) + replacement + current.slice(end);
        activeFile.content = textareaEl.value;
        activeFile.updatedAt = new Date().toISOString();
        StorageService.set(STORAGE_KEYS.MARKDOWN_MANAGER, state);
        updateLivePreview();
        textareaEl.focus();
      }

      [
        { label: 'H1', fn: () => insertSnippet('# ', '', 'Título') },
        { label: 'H2', fn: () => insertSnippet('## ', '', 'Subtítulo') },
        { label: 'B', fn: () => insertSnippet('**', '**', 'negrita') },
        { label: 'I', fn: () => insertSnippet('*', '*', 'cursiva') },
        { label: 'Code', fn: () => insertSnippet('```javascript\n', '\n```', '// código') },
        { label: 'Check', fn: () => insertSnippet('- [ ] ', '', 'Tarea pendiente') },
        {
          label: 'Tabla',
          fn: () =>
            insertSnippet(
              '\n| Columna 1 | Columna 2 |\n| :--- | :--- |\n| Valor 1 | Valor 2 |\n',
              '',
              ''
            )
        }
      ].forEach((tool) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = tool.label;
        b.className =
          'px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-200 border border-slate-700 cursor-pointer';
        b.addEventListener('click', tool.fn);
        quickFormatBar.appendChild(b);
      });

      wordCountBadge = createBadge({ text: '0 palabras', variant: 'default' });
      quickFormatBar.appendChild(wordCountBadge);

      fileHeader.append(pathInfo, quickFormatBar);

      // Área dividida: Editor y/o Vista Previa en Tiempo Real
      const contentGrid = document.createElement('div');
      contentGrid.className = `flex-1 min-h-0 grid ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
      } divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-hidden`;

      // Panel Editor
      const editorPane = document.createElement('div');
      editorPane.className = `flex flex-col min-h-0 h-full overflow-hidden p-3 ${
        viewMode === 'preview' ? 'hidden' : ''
      }`;

      textareaEl = document.createElement('textarea');
      textareaEl.value = activeFile.content;
      textareaEl.placeholder = 'Escribe tu contenido Markdown aquí...';
      textareaEl.className =
        'w-full flex-1 bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl p-3.5 font-mono text-xs text-slate-100 leading-relaxed outline-none resize-none custom-scrollbar';

      editorPane.appendChild(textareaEl);

      // Panel Vista Previa
      const previewPane = document.createElement('div');
      previewPane.className = `flex flex-col min-h-0 h-full overflow-hidden bg-slate-950/40 ${
        viewMode === 'editor' ? 'hidden' : ''
      }`;

      const previewHeader = document.createElement('div');
      previewHeader.className =
        'px-4 py-1.5 bg-slate-900/50 border-b border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 shrink-0';
      previewHeader.innerHTML = `
        <span class="flex items-center gap-1.5 font-semibold text-slate-300">
          <span class="text-indigo-400">${getIcon('eye')}</span>
          <span>Vista Previa en Tiempo Real</span>
        </span>
        <span class="font-mono text-[10px]">Auto-guardado en localStorage</span>
      `;

      previewContentEl = document.createElement('div');
      previewContentEl.className = 'flex-1 overflow-y-auto custom-scrollbar p-4';

      previewPane.append(previewHeader, previewContentEl);

      function updateLivePreview() {
        const text = textareaEl.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountBadge.textContent = `${words} palabra${words === 1 ? '' : 's'}`;
        previewContentEl.innerHTML = renderMarkdownToHtml(text);
      }

      textareaEl.addEventListener('input', () => {
        activeFile.content = textareaEl.value;
        activeFile.updatedAt = new Date().toISOString();
        StorageService.set(STORAGE_KEYS.MARKDOWN_MANAGER, state);
        updateLivePreview();
      });

      updateLivePreview();
      contentGrid.append(editorPane, previewPane);
      workspaceRight.append(fileHeader, contentGrid);
    }

    /**
     * Modal para Crear o Renombrar una Carpeta
     */
    function openFolderModal({ folder = null, parentId = null } = {}) {
      const isEdit = Boolean(folder);
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3';

      const nameInput = createInput({
        label: 'Nombre de la carpeta',
        placeholder: 'Ej. Arquitectura, Guías de Despliegue...',
        value: folder ? folder.name : '',
        required: true
      });

      const parentSelectWrap = document.createElement('div');
      parentSelectWrap.className = 'flex flex-col gap-1.5';
      parentSelectWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Carpeta contenedora</label>`;

      const selectEl = document.createElement('select');
      selectEl.className =
        'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500';

      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '/ (Raíz principal)';
      selectEl.appendChild(rootOpt);

      state.folders
        .filter((f) => !folder || f.id !== folder.id)
        .forEach((f) => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = getFolderPathString(f.id);
          if ((isEdit && folder.parentId === f.id) || (!isEdit && parentId === f.id)) {
            opt.selected = true;
          }
          selectEl.appendChild(opt);
        });

      parentSelectWrap.appendChild(selectEl);
      wrap.append(nameInput, parentSelectWrap);

      let modalRef = null;
      const saveBtn = createButton({
        label: isEdit ? 'Guardar cambios' : 'Crear Carpeta',
        icon: isEdit ? 'save' : 'folderPlus',
        variant: 'primary',
        size: 'sm',
        onClick: () => {
          const cleanName = nameInput.getValue().trim();
          if (!cleanName) {
            Toast.warning('Ingresa un nombre para la carpeta');
            return;
          }

          if (isEdit) {
            folder.name = cleanName;
            folder.parentId = selectEl.value || null;
            Toast.success('Carpeta actualizada');
          } else {
            const newFolder = {
              id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: cleanName,
              parentId: selectEl.value || null,
              createdAt: new Date().toISOString()
            };
            state.folders.push(newFolder);
            if (!state.expandedFolderIds.includes(newFolder.id)) {
              state.expandedFolderIds.push(newFolder.id);
            }
            if (newFolder.parentId && !state.expandedFolderIds.includes(newFolder.parentId)) {
              state.expandedFolderIds.push(newFolder.parentId);
            }
            Toast.success(`Carpeta "${cleanName}" creada`);
          }

          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          modalRef?.close();
        }
      });

      modalRef = Modal.open({
        title: isEdit ? 'Editar Carpeta' : 'Nueva Carpeta',
        subtitle: 'Organiza tus documentos Markdown en directorios jerárquicos.',
        size: 'sm',
        content: wrap,
        footer: [
          createButton({
            label: 'Cancelar',
            variant: 'secondary',
            size: 'sm',
            onClick: () => modalRef?.close()
          }),
          saveBtn
        ]
      });
    }

    /**
     * Confirmación para eliminar una carpeta y su contenido
     */
    function confirmDeleteFolder(folder) {
      Modal.confirm({
        title: 'Eliminar carpeta',
        message: `¿Seguro que deseas eliminar la carpeta "${escapeHtml(
          folder.name
        )}" y todos los archivos/subcarpetas dentro de ella?`,
        confirmLabel: 'Sí, eliminar carpeta',
        variant: 'danger',
        onConfirm: () => {
          const idsToRemove = new Set([folder.id]);
          let added = true;
          while (added) {
            added = false;
            state.folders.forEach((f) => {
              if (f.parentId && idsToRemove.has(f.parentId) && !idsToRemove.has(f.id)) {
                idsToRemove.add(f.id);
                added = true;
              }
            });
          }

          state.folders = state.folders.filter((f) => !idsToRemove.has(f.id));
          state.files = state.files.filter((file) => !idsToRemove.has(file.folderId));
          if (!state.files.some((f) => f.id === state.activeFileId)) {
            state.activeFileId = state.files[0]?.id || null;
          }
          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          Toast.info('Carpeta eliminada');
        }
      });
    }

    /**
     * Modal para Crear un nuevo archivo Markdown en blanco
     */
    function openCreateFileModal(defaultFolderId = null) {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3';

      const nameInput = createInput({
        label: 'Nombre del archivo (.md)',
        placeholder: 'Ej. Notas-Sprint.md',
        required: true
      });

      const folderSelectWrap = document.createElement('div');
      folderSelectWrap.className = 'flex flex-col gap-1.5';
      folderSelectWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Ubicación (Carpeta)</label>`;

      const selectEl = document.createElement('select');
      selectEl.className =
        'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500';

      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '/ (Raíz)';
      selectEl.appendChild(rootOpt);

      const targetFolder = defaultFolderId || getActiveFile()?.folderId || state.folders[0]?.id || '';
      state.folders.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = getFolderPathString(f.id);
        if (f.id === targetFolder) opt.selected = true;
        selectEl.appendChild(opt);
      });

      folderSelectWrap.appendChild(selectEl);
      wrap.append(nameInput, folderSelectWrap);

      let modalRef = null;
      const createBtn = createButton({
        label: 'Crear Archivo',
        icon: 'filePlus',
        variant: 'primary',
        size: 'sm',
        onClick: () => {
          let rawName = nameInput.getValue().trim();
          if (!rawName) {
            Toast.warning('Ingresa un nombre para el archivo');
            return;
          }
          if (!rawName.toLowerCase().endsWith('.md')) {
            rawName += '.md';
          }

          const newFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            folderId: selectEl.value || null,
            name: rawName,
            content: `# ${rawName.replace(/\.md$/i, '')}\n\nEscribe tu documentación aquí...`,
            updatedAt: new Date().toISOString()
          };

          state.files.unshift(newFile);
          state.activeFileId = newFile.id;
          if (newFile.folderId && !state.expandedFolderIds.includes(newFile.folderId)) {
            state.expandedFolderIds.push(newFile.folderId);
          }

          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          Toast.success(`Archivo "${rawName}" creado`);
          modalRef?.close();
        }
      });

      modalRef = Modal.open({
        title: 'Nuevo Archivo Markdown',
        subtitle: 'Se guardará en la carpeta seleccionada dentro de localStorage.',
        size: 'sm',
        content: wrap,
        footer: [
          createButton({
            label: 'Cancelar',
            variant: 'secondary',
            size: 'sm',
            onClick: () => modalRef?.close()
          }),
          createBtn
        ]
      });
    }

    /**
     * Modal para Renombrar o Mover un archivo Markdown existente
     */
    function openRenameFileModal(file) {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3';

      const nameInput = createInput({
        label: 'Nombre del archivo (.md)',
        value: file.name,
        required: true
      });

      const folderSelectWrap = document.createElement('div');
      folderSelectWrap.className = 'flex flex-col gap-1.5';
      folderSelectWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Carpeta</label>`;

      const selectEl = document.createElement('select');
      selectEl.className =
        'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500';

      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '/ (Raíz)';
      selectEl.appendChild(rootOpt);

      state.folders.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = getFolderPathString(f.id);
        if (file.folderId === f.id) opt.selected = true;
        selectEl.appendChild(opt);
      });

      folderSelectWrap.appendChild(selectEl);
      wrap.append(nameInput, folderSelectWrap);

      let modalRef = null;
      const saveBtn = createButton({
        label: 'Guardar',
        icon: 'save',
        variant: 'primary',
        size: 'sm',
        onClick: () => {
          let cleanName = nameInput.getValue().trim();
          if (!cleanName) {
            Toast.warning('El nombre no puede estar vacío');
            return;
          }
          if (!cleanName.toLowerCase().endsWith('.md')) {
            cleanName += '.md';
          }
          file.name = cleanName;
          file.folderId = selectEl.value || null;
          file.updatedAt = new Date().toISOString();
          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          Toast.success('Archivo actualizado');
          modalRef?.close();
        }
      });

      modalRef = Modal.open({
        title: 'Renombrar / Mover Archivo',
        size: 'sm',
        content: wrap,
        footer: [
          createButton({
            label: 'Cancelar',
            variant: 'secondary',
            size: 'sm',
            onClick: () => modalRef?.close()
          }),
          saveBtn
        ]
      });
    }

    function confirmDeleteFile(file) {
      Modal.confirm({
        title: 'Eliminar archivo Markdown',
        message: `¿Seguro que deseas eliminar "${escapeHtml(file.name)}"?`,
        confirmLabel: 'Eliminar',
        variant: 'danger',
        onConfirm: () => {
          state.files = state.files.filter((f) => f.id !== file.id);
          if (state.activeFileId === file.id) {
            state.activeFileId = state.files[0]?.id || null;
          }
          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          Toast.info('Archivo eliminado');
        }
      });
    }

    /**
     * Modal para Generar un Nuevo Archivo a partir de una Plantilla con Variables Dinámicas {{variable}}
     */
    function openUseTemplateModal(preselectedTemplateId = null) {
      if (state.templates.length === 0) {
        Toast.info('Primero crea una plantilla en el gestor de plantillas');
        openTemplatesManagerModal();
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'space-y-4';

      const topFields = document.createElement('div');
      topFields.className = 'grid grid-cols-1 sm:grid-cols-3 gap-3';

      // Selector de plantilla
      const tplSelectWrap = document.createElement('div');
      tplSelectWrap.className = 'flex flex-col gap-1.5';
      tplSelectWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Plantilla</label>`;

      const tplSelect = document.createElement('select');
      tplSelect.className =
        'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500';

      state.templates.forEach((tpl) => {
        const opt = document.createElement('option');
        opt.value = tpl.id;
        opt.textContent = tpl.name;
        if (preselectedTemplateId && tpl.id === preselectedTemplateId) {
          opt.selected = true;
        }
        tplSelect.appendChild(opt);
      });
      tplSelectWrap.appendChild(tplSelect);

      // Nombre del archivo destino
      const fileNameInput = createInput({
        label: 'Nombre del nuevo archivo (.md)',
        placeholder: 'Ej. Especificacion-PBI-104.md',
        value: `Documento-${new Date().toISOString().slice(0, 10)}.md`
      });

      // Carpeta destino
      const folderSelectWrap = document.createElement('div');
      folderSelectWrap.className = 'flex flex-col gap-1.5';
      folderSelectWrap.innerHTML = `<label class="text-xs font-medium text-slate-300">Guardar en carpeta</label>`;

      const folderSelect = document.createElement('select');
      folderSelect.className =
        'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500';

      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '/ (Raíz)';
      folderSelect.appendChild(rootOpt);

      const currentFolderId = getActiveFile()?.folderId || state.folders[0]?.id || '';
      state.folders.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = getFolderPathString(f.id);
        if (f.id === currentFolderId) opt.selected = true;
        folderSelect.appendChild(opt);
      });
      folderSelectWrap.appendChild(folderSelect);

      topFields.append(tplSelectWrap, fileNameInput, folderSelectWrap);

      // Formulario dinámico de variables {{variable}}
      const varsSection = document.createElement('div');
      varsSection.className =
        'p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3';

      const previewBox = document.createElement('div');
      previewBox.className =
        'p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 max-h-48 overflow-y-auto custom-scrollbar text-xs font-mono text-slate-300 whitespace-pre-wrap';

      let variableInputsMap = {};

      function renderDynamicVariableInputs() {
        varsSection.innerHTML = '';
        variableInputsMap = {};

        const selectedTpl =
          state.templates.find((t) => t.id === tplSelect.value) || state.templates[0];
        if (!selectedTpl) return;

        const detectedVars = extractTemplateVariables(selectedTpl.content);

        const head = document.createElement('div');
        head.className = 'flex items-center justify-between gap-2';
        head.innerHTML = `
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Valores Dinámicos de la Plantilla (${detectedVars.length})
          </span>
        `;
        varsSection.appendChild(head);

        if (detectedVars.length === 0) {
          const noVars = document.createElement('p');
          noVars.className = 'text-xs text-slate-400';
          noVars.textContent =
            'Esta plantilla no contiene variables {{...}}. Se creará el archivo con su contenido fijo.';
          varsSection.appendChild(noVars);
        } else {
          const grid = document.createElement('div');
          grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';

          detectedVars.forEach((varName) => {
            const defaultVal =
              varName.toLowerCase().includes('fecha')
                ? new Date().toISOString().slice(0, 10)
                : '';

            const inp = createInput({
              label: `{{${varName}}}`,
              placeholder: `Ingresa valor para ${varName}...`,
              value: defaultVal,
              onInput: () => updateInterpolatedPreview()
            });
            variableInputsMap[varName] = inp;
            grid.appendChild(inp);
          });

          varsSection.appendChild(grid);
        }

        updateInterpolatedPreview();
      }

      function updateInterpolatedPreview() {
        const selectedTpl =
          state.templates.find((t) => t.id === tplSelect.value) || state.templates[0];
        if (!selectedTpl) return;

        const currentValues = {};
        Object.entries(variableInputsMap).forEach(([k, inputComp]) => {
          currentValues[k] = inputComp.getValue();
        });

        previewBox.textContent = interpolateTemplate(selectedTpl.content, currentValues);
      }

      tplSelect.addEventListener('change', () => renderDynamicVariableInputs());
      renderDynamicVariableInputs();

      const previewLabel = document.createElement('div');
      previewLabel.className = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';
      previewLabel.textContent = 'Previsualización del Markdown Generado';

      wrap.append(topFields, varsSection, previewLabel, previewBox);

      let modalRef = null;
      const generateBtn = createButton({
        label: 'Generar Archivo Markdown',
        icon: 'sparkles',
        variant: 'primary',
        size: 'sm',
        onClick: () => {
          const selectedTpl =
            state.templates.find((t) => t.id === tplSelect.value) || state.templates[0];
          if (!selectedTpl) return;

          let finalName = fileNameInput.getValue().trim() || `${selectedTpl.name}.md`;
          if (!finalName.toLowerCase().endsWith('.md')) {
            finalName += '.md';
          }

          const values = {};
          Object.entries(variableInputsMap).forEach(([k, inputComp]) => {
            values[k] = inputComp.getValue();
          });

          const finalContent = interpolateTemplate(selectedTpl.content, values);

          const newFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            folderId: folderSelect.value || null,
            name: finalName,
            content: finalContent,
            updatedAt: new Date().toISOString()
          };

          state.files.unshift(newFile);
          state.activeFileId = newFile.id;
          if (newFile.folderId && !state.expandedFolderIds.includes(newFile.folderId)) {
            state.expandedFolderIds.push(newFile.folderId);
          }

          saveMarkdownState(state);
          renderExplorerTree();
          renderWorkspaceEditor();
          Toast.success(`Archivo "${finalName}" generado desde plantilla`);
          modalRef?.close();
        }
      });

      modalRef = Modal.open({
        title: 'Generar Archivo desde Plantilla Dinámica',
        subtitle:
          'Completa las variables {{...}} para inyectar los valores dinámicos en el nuevo documento.',
        size: 'lg',
        content: wrap,
        footer: [
          createButton({
            label: 'Cancelar',
            variant: 'secondary',
            size: 'sm',
            onClick: () => modalRef?.close()
          }),
          generateBtn
        ]
      });
    }

    /**
     * Modal Gestor de Plantillas (Crear, Editar y Eliminar plantillas con variables {{variable}})
     */
    function openTemplatesManagerModal() {
      let selectedTplId = state.templates[0]?.id || null;
      let modalRef = null;

      const wrap = document.createElement('div');
      wrap.className = 'grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[380px]';

      const listCol = document.createElement('div');
      listCol.className =
        'md:col-span-4 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-slate-800 pr-0 md:pr-3 pb-3 md:pb-0';

      const editorCol = document.createElement('div');
      editorCol.className = 'md:col-span-8 flex flex-col gap-3';

      wrap.append(listCol, editorCol);

      function renderTemplatesList() {
        listCol.innerHTML = '';

        const addTplBtn = createButton({
          label: 'Nueva Plantilla',
          icon: 'plus',
          variant: 'primary',
          size: 'xs',
          fullWidth: true,
          onClick: () => {
            const newTpl = {
              id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              name: 'Nueva Plantilla Dinámica',
              description: 'Plantilla personalizada con variables',
              content:
                '# {{titulo_documento}}\n\n- **Autor**: {{autor}}\n- **Fecha**: {{fecha}}\n\n## Contenido\n{{descripcion}}',
              updatedAt: new Date().toISOString()
            };
            state.templates.unshift(newTpl);
            selectedTplId = newTpl.id;
            saveMarkdownState(state);
            renderTemplatesList();
            renderTemplateEditor();
          }
        });
        listCol.appendChild(addTplBtn);

        const itemsBox = document.createElement('div');
        itemsBox.className = 'space-y-1.5 overflow-y-auto max-h-80 custom-scrollbar';

        state.templates.forEach((tpl) => {
          const active = tpl.id === selectedTplId;
          const vars = extractTemplateVariables(tpl.content);

          const card = document.createElement('div');
          card.className = `p-2.5 rounded-xl border cursor-pointer transition-colors ${
            active
              ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
          }`;
          card.innerHTML = `
            <div class="text-xs font-semibold truncate">${escapeHtml(tpl.name)}</div>
            <div class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(
              tpl.description || 'Sin descripción'
            )}</div>
            <div class="text-[10px] font-mono text-amber-300 mt-1">${vars.length} variable(s)</div>
          `;
          card.addEventListener('click', () => {
            selectedTplId = tpl.id;
            renderTemplatesList();
            renderTemplateEditor();
          });
          itemsBox.appendChild(card);
        });

        listCol.appendChild(itemsBox);
      }

      function renderTemplateEditor() {
        editorCol.innerHTML = '';
        const tpl = state.templates.find((t) => t.id === selectedTplId);

        if (!tpl) {
          editorCol.innerHTML = `<div class="p-6 text-center text-xs text-slate-500">Selecciona o crea una plantilla.</div>`;
          return;
        }

        const nameInput = createInput({
          label: 'Nombre de la plantilla',
          value: tpl.name
        });

        const descInput = createInput({
          label: 'Descripción breve',
          value: tpl.description || ''
        });

        const varsDetectedWrap = document.createElement('div');
        varsDetectedWrap.className = 'flex flex-wrap items-center gap-1.5';

        const contentArea = createTextarea({
          label: 'Contenido Markdown (Usa {{nombre_variable}} para definir variables dinámicas)',
          value: tpl.content,
          rows: 9,
          mono: true,
          onInput: (val) => {
            updateDetectedBadges(val);
          }
        });

        function updateDetectedBadges(rawText) {
          varsDetectedWrap.innerHTML = `<span class="text-[11px] text-slate-400 mr-1">Variables detectadas:</span>`;
          const vars = extractTemplateVariables(rawText);
          if (vars.length === 0) {
            varsDetectedWrap.appendChild(
              createBadge({ text: 'Ninguna (ej. {{cliente}})', variant: 'default' })
            );
          } else {
            vars.forEach((v) => {
              varsDetectedWrap.appendChild(
                createBadge({ text: `{{${v}}}`, variant: 'warning', className: 'font-mono' })
              );
            });
          }
        }

        updateDetectedBadges(tpl.content);

        const actionsRow = document.createElement('div');
        actionsRow.className = 'flex flex-wrap items-center justify-between gap-2 pt-2';

        const deleteBtn = createButton({
          label: 'Eliminar Plantilla',
          icon: 'trash',
          variant: 'danger',
          size: 'xs',
          onClick: () => {
            state.templates = state.templates.filter((t) => t.id !== tpl.id);
            selectedTplId = state.templates[0]?.id || null;
            saveMarkdownState(state);
            renderTemplatesList();
            renderTemplateEditor();
            Toast.info('Plantilla eliminada');
          }
        });

        const rightBtns = document.createElement('div');
        rightBtns.className = 'flex items-center gap-2';

        const useNowBtn = createButton({
          label: 'Generar Archivo con esta Plantilla',
          icon: 'sparkles',
          variant: 'success',
          size: 'xs',
          onClick: () => {
            tpl.name = nameInput.getValue().trim() || 'Plantilla';
            tpl.description = descInput.getValue().trim();
            tpl.content = contentArea.getValue();
            saveMarkdownState(state);
            modalRef?.close();
            openUseTemplateModal(tpl.id);
          }
        });

        const saveTplBtn = createButton({
          label: 'Guardar Plantilla',
          icon: 'save',
          variant: 'primary',
          size: 'xs',
          onClick: () => {
            tpl.name = nameInput.getValue().trim() || 'Plantilla sin nombre';
            tpl.description = descInput.getValue().trim();
            tpl.content = contentArea.getValue();
            tpl.updatedAt = new Date().toISOString();
            saveMarkdownState(state);
            renderTemplatesList();
            Toast.success('Plantilla guardada en localStorage');
          }
        });

        rightBtns.append(useNowBtn, saveTplBtn);
        actionsRow.append(deleteBtn, rightBtns);

        editorCol.append(nameInput, descInput, varsDetectedWrap, contentArea, actionsRow);
      }

      renderTemplatesList();
      renderTemplateEditor();

      modalRef = Modal.open({
        title: 'Gestor de Plantillas Markdown con Variables',
        subtitle:
          'Escribe variables entre dobles llaves como {{proyecto}} o {{responsable}}. Al generar un archivo, se solicitarán sus valores.',
        size: 'xl',
        content: wrap,
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

    renderExplorerTree();
    renderWorkspaceEditor();
  }
};
